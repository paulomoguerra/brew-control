import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSessions = query({
  handler: async (ctx) => {
    const sessions = await ctx.db.query("cuppingSessions").order("desc").collect();
    
    const enrichedSessions = await Promise.all(sessions.map(async (session) => {
      let roastInfo = null;
      if (session.roastLogId) {
        roastInfo = await ctx.db.get(session.roastLogId);
      }
      return { ...session, roastInfo };
    }));

    return enrichedSessions;
  },
});

export const logSession = mutation({
  args: {
    roastLogId: v.optional(v.id("roastLogs")),
    cupperName: v.string(),
    score: v.number(),
    notes: v.optional(v.string()),
    aroma: v.number(),
    flavor: v.number(),
    aftertaste: v.number(),
    acidity: v.number(),
    body: v.number(),
    balance: v.number(),
    uniformity: v.number(),
    cleanCup: v.number(),
    sweetness: v.number(),
    defects: v.optional(v.number()),
    flavors: v.optional(v.array(v.string())),
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
