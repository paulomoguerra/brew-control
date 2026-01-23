import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const add = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    pricingTier: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("clients", args);
  },
});

export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("clients").collect();
  },
});
