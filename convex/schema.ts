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

  // 5. Clients (The CRM)
  clients: defineTable({
    name: v.string(),
    email: v.string(),
    pricingTier: v.string(), // "Wholesale A", "Distributor", "Retail"
    address: v.optional(v.string()),
  }),

  // 6. Wholesale Orders (The Revenue)
  orders: defineTable({
    clientId: v.id("clients"),
    clientName: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("roasting"), v.literal("shipped"), v.literal("paid")),
    totalAmount: v.number(),
    orderDate: v.number(),
    itemCount: v.number(),
    statusHistory: v.optional(v.array(v.object({
      status: v.string(),
      timestamp: v.number(),
    }))),
  }).index("by_date", ["orderDate"]),

  // 7. Order Items (Line Items)
  orderItems: defineTable({
    orderId: v.id("orders"),
    productId: v.id("roastedInventory"),
    quantity: v.number(),
    priceAtTime: v.number(),
  }).index("by_order", ["orderId"]),

  // 8. Cafe Ingredients (Non-Coffee Costs)
  ingredients: defineTable({
    name: v.string(), 
    category: v.union(v.literal("milk"), v.literal("packaging"), v.literal("syrup"), v.literal("labor"), v.literal("overhead"), v.literal("other")),
    cost: v.number(), // $ per unit
    unit: v.string(), // "gal", "oz", "each", "hour"
    // For converting different units (e.g. Gallon to Oz)
    volumeOz: v.optional(v.number()), 
  }),

  // 9. Cafe Menu Items (Recipes)
  menuItems: defineTable({
    name: v.string(), // "Latte 12oz"
    salePrice: v.number(), // $5.50
    coffeeDosageGrams: v.number(), // 18.5g
    // Ingredients needed
    components: v.array(v.object({
      ingredientId: v.id("ingredients"),
      quantity: v.number(), // e.g., 10 (oz of milk)
    })),
  }),

  // 10. Quality Control (Cupping Sessions)
  cuppingSessions: defineTable({
    roastLogId: v.optional(v.id("roastLogs")),
    cupperName: v.string(),
    sessionDate: v.number(),
    score: v.number(), // Total Score (0-100)
    notes: v.optional(v.string()),
    // Sensory Attributes (0-10 scale usually)
    aroma: v.number(),
    flavor: v.number(),
    aftertaste: v.number(),
    acidity: v.number(),
    body: v.number(),
    balance: v.number(),
    uniformity: v.number(),
    cleanCup: v.number(),
    sweetness: v.number(),
    defects: v.optional(v.number()), // Negative points
  }).index("by_date", ["sessionDate"]),

  // 11. Recipes (Blend Engineering)
  recipes: defineTable({
    name: v.string(),
    targetShrinkage: v.number(),
    components: v.array(v.object({
      greenBatchId: v.id("greenInventory"),
      percentage: v.number(),
    })),
    projectedCostPerLb: v.number(),
    createdAt: v.number(),
  }).index("by_date", ["createdAt"]),

  // 12. Cafe Settings (Global Parameters)
  cafeSettings: defineTable({
    monthlyRevenueGoal: v.optional(v.number()),
    defaultTargetMargin: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    isBurdenEnabled: v.optional(v.boolean()),
    // Production Rates
    laborRate: v.optional(v.number()), // $/hr
    gasRate: v.optional(v.number()),   // $/hr
    utilityRate: v.optional(v.number()), // $/hr
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
