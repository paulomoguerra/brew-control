import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Green Inventory
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("greenInventory")
      .withIndex("by_quantity")
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    batchNumber: v.string(),
    origin: v.string(),
    process: v.optional(v.string()),
    quantityLbs: v.number(),
    costPerLb: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("greenInventory", {
      ...args,
      initialQuantityLbs: args.quantityLbs,
      arrivedAt: Date.now(),
      status: "active",
    });
  },
});

export const updateQuantity = mutation({
  args: { id: v.id("greenInventory"), newQuantity: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { quantityLbs: args.newQuantity });
  },
});

export const edit = mutation({
  args: {
    id: v.id("greenInventory"),
    batchNumber: v.optional(v.string()),
    origin: v.optional(v.string()),
    process: v.optional(v.string()),
    quantityLbs: v.optional(v.number()),
    costPerLb: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

// Roasted Inventory (Finished Goods)
export const listRoasted = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roastedInventory")
      .filter((q) => q.neq(q.field("status"), "out_of_stock"))
      .collect();
  },
});
