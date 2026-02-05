import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSessions = query({
  handler: async (ctx) => {
    return await ctx.db.query("cuppingSessions").order("desc").collect();
  },
});

export const logSession = mutation({
  args: {
    coffeeName: v.optional(v.string()),
    cupperName: v.string(),
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
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("cuppingSessions", {
      ...args,
      sessionDate: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { id: v.id("cuppingSessions") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
