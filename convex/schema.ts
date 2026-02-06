import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  brewRecipes: defineTable({
    userId: v.optional(v.string()),
    coffeeName: v.string(),
    ratio: v.number(),
    coffeeDose: v.number(),
    waterAmount: v.number(),
    mode: v.union(v.literal("coffee"), v.literal("water")),
    notes: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_user_created", ["userId", "createdAt"]),

  cuppingSessions: defineTable({
    userId: v.optional(v.string()),
    coffeeName: v.optional(v.string()),
    cupperName: v.string(),
    sessionDate: v.number(),
    score: v.number(),
    notes: v.optional(v.string()),
    aroma: v.number(),
    flavor: v.number(),
    aftertaste: v.number(),
    acidity: v.number(),
    body: v.number(),
    balance: v.number(),
    overall: v.optional(v.number()),
    uniformity: v.number(),
    cleanCup: v.number(),
    sweetness: v.number(),
    defects: v.optional(v.number()),
    flavors: v.optional(v.array(v.string())),
    costPerLb: v.optional(v.number()),
  }).index("by_user_date", ["userId", "sessionDate"]),
});
