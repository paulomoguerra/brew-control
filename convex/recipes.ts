import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("recipes")
      .withIndex("by_date", (q) => q)
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    name: v.string(),
    targetShrinkage: v.number(),
    components: v.array(v.object({
      greenBatchId: v.id("greenInventory"),
      percentage: v.number(),
    })),
    projectedCostPerLb: v.number(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("recipes", {
      ...args,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { recipeId: v.id("recipes") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.recipeId);
  },
});
