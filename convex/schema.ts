import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // 1. Green Inventory (The Asset)
  greenInventory: defineTable({
    batchNumber: v.string(),
    origin: v.string(),
    process: v.optional(v.string()), // e.g. "Washed", "Natural"
    variety: v.optional(v.string()),
    quantityLbs: v.number(),      // Current stock
    initialQuantityLbs: v.number(), // For burn-down charts
    costPerLb: v.number(),        // Base cost
    shippingCost: v.optional(v.number()), // Total shipping paid for batch
    taxCost: v.optional(v.number()),      // Total taxes/customs paid for batch
    supplier: v.optional(v.string()),
    arrivedAt: v.number(),        // Date
    status: v.union(v.literal("active"), v.literal("archived")),
  }).index("by_quantity", ["quantityLbs"]),

  // 2. Roast Profiles (The Recipe - NEW)
  roastProfiles: defineTable({
    name: v.string(),             // e.g., "House Blend - Medium"
    targetBeanId: v.id("greenInventory"),
    targetDuration: v.number(),
    targetShrinkage: v.number(),  // e.g., 15%
    notes: v.optional(v.string()),
  }),

  // 3. Roast Logs (The Work)
  roastLogs: defineTable({
    batchId: v.id("greenInventory"),
    profileId: v.optional(v.id("roastProfiles")),
    productName: v.string(),
    greenWeightIn: v.number(),
    roastedWeightOut: v.number(),
    shrinkagePercent: v.number(), // Auto-calculated
    trueCostPerLb: v.number(),    // The "Killer Feature" calculation
    overheadCost: v.number(),     // Labor + Gas
    durationMinutes: v.number(),
    roastDate: v.number(),
    // Link to external data (Phase 3)
    artisanLogId: v.optional(v.string()), 
  }).index("by_date", ["roastDate"]),

  // 4. Roasted Inventory (Finished Goods)
  roastedInventory: defineTable({
    roastLogId: v.optional(v.id("roastLogs")),
    productName: v.string(),
    quantityLbs: v.number(),
    costPerLb: v.number(),
    wholesalePricePerLb: v.number(),
    targetMargin: v.optional(v.number()), // Bean-specific target margin (e.g. 40%)
    status: v.union(v.literal("available"), v.literal("low_stock"), v.literal("out_of_stock")),
  }),

  // 12. Cafe Settings (Global Parameters)
  cafeSettings: defineTable({
    monthlyRevenueGoal: v.number(),
    defaultTargetMargin: v.number(),
    taxRate: v.number(),
    isBurdenEnabled: v.boolean(), // Toggle for System-wide Overhead Math
  }),

  // 13. Operating Expenses (The Burden Ledger)
  operatingExpenses: defineTable({
    name: v.string(), // Rent, Labor, etc.
    category: v.union(v.literal("fixed"), v.literal("variable")),
    cost: v.number(),
    recurrence: v.union(v.literal("monthly"), v.literal("one-time")),
    date: v.number(),
  }),

  // 14. Daily Income (Manual POS Totals)
  dailyIncome: defineTable({
    amount: v.number(),
    date: v.number(),
    notes: v.optional(v.string()),
  }).index("by_date", ["date"]),
});
