import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const listForUser = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return [];
    }

    return await ctx.db
      .query("brewRecipes")
      .withIndex("by_user_created", (q) => q.eq("userId", identity.tokenIdentifier))
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    coffeeName: v.string(),
    ratio: v.number(),
    coffeeDose: v.number(),
    waterAmount: v.number(),
    mode: v.union(v.literal("coffee"), v.literal("water")),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    return await ctx.db.insert("brewRecipes", {
      ...args,
      userId: identity.tokenIdentifier,
      createdAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: {
    id: v.id("brewRecipes"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new Error("Unauthorized");
    }

    const recipe = await ctx.db.get(args.id);
    if (!recipe || recipe.userId !== identity.tokenIdentifier) {
      throw new Error("Not found");
    }

    await ctx.db.delete(args.id);
  },
});
