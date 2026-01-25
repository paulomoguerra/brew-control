import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listLogs = query({
  handler: async (ctx) => {
    return await ctx.db.query("roastLogs").order("desc").take(50);
  },
});

export const logRoast = mutation({
  args: {
    batchId: v.id("greenInventory"),
    productName: v.string(),
    greenWeightIn: v.number(),
    roastedWeightOut: v.number(),
    durationMinutes: v.number(),
    notes: v.optional(v.string()),
    // Financial settings could be pulled from a settings table, passed as args for now
    laborRate: v.number(), 
    gasCostPerBatch: v.number(),
  },
  handler: async (ctx, args) => {
    // 1. Get Green Batch Data
    const batch = await ctx.db.get(args.batchId);
    if (!batch) throw new Error("Batch not found");

    // 2. VALIDATION: Physics and inventory checks
    if (args.greenWeightIn <= 0) throw new Error("Green weight must be positive");
    if (args.roastedWeightOut <= 0) throw new Error("Roasted weight must be positive");
    if (args.roastedWeightOut > args.greenWeightIn) {
      throw new Error("Roasted weight cannot exceed green weight (violates physics)");
    }
    
    // Check inventory availability
    if (batch.quantityLbs < args.greenWeightIn) {
      throw new Error(
        `Insufficient inventory. Available: ${batch.quantityLbs.toFixed(2)} lbs, ` +
        `Required: ${args.greenWeightIn.toFixed(2)} lbs`
      );
    }

    // 3. Calculate Economics

    const greenCost = batch.costPerLb * args.greenWeightIn;
    const overhead = (args.laborRate * (args.durationMinutes / 60)) + args.gasCostPerBatch;
    const totalCost = greenCost + overhead;
    const trueCostPerLb = totalCost / args.roastedWeightOut;
    const shrinkagePercent = ((args.greenWeightIn - args.roastedWeightOut) / args.greenWeightIn) * 100;

    // 3. Log Roast
    const roastId = await ctx.db.insert("roastLogs", {
      batchId: args.batchId,
      productName: args.productName,
      greenWeightIn: args.greenWeightIn,
      roastedWeightOut: args.roastedWeightOut,
      shrinkagePercent,
      trueCostPerLb,
      overheadCost: overhead,
      durationMinutes: args.durationMinutes,
      roastDate: Date.now(),
    });

    // 4. Deduct Green Inventory
    const newQuantity = batch.quantityLbs - args.greenWeightIn;
    if (newQuantity < 0) throw new Error("Insufficient green inventory");

    await ctx.db.patch(args.batchId, {
      quantityLbs: newQuantity,
      status: newQuantity <= 0 ? "archived" : "active"
    });

    // 5. Add to Roasted Inventory
    await ctx.db.insert("roastedInventory", {
      roastLogId: roastId,
      productName: args.productName,
      quantityLbs: args.roastedWeightOut,
      costPerLb: trueCostPerLb,
      wholesalePricePerLb: trueCostPerLb * 1.5, // Default 50% margin
      status: "available",
    });

    return roastId;
  },
});
