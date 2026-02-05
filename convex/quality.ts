import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSessions = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("cuppingSessions")
      .withIndex("by_user_date", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .collect();
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
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    await ctx.db.insert("cuppingSessions", {
      ...args,
      userId: identity.tokenIdentifier,
      sessionDate: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { id: v.id("cuppingSessions") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const session = await ctx.db.get(args.id);
    if (!session || session.userId !== identity.tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.id);
  },
});
