import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listSessions = query({
  handler: async (ctx) => {
    // We could join with roastLogs here to get the bean name
    const sessions = await (ctx.db as any).query("cuppingSessions").order("desc").collect();
    
    // Manual join to get Roast Info
    const enrichedSessions = await Promise.all(sessions.map(async (session: any) => {
      let roastInfo = null;
      if (session.roastLogId) {
        roastInfo = await (ctx.db as any).get(session.roastLogId);
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
  },
  handler: async (ctx, args) => {
    await (ctx.db as any).insert("cuppingSessions", {
      ...args,
      sessionDate: Date.now(),
    });
  },
});

export const deleteSession = mutation({
  args: { id: v.id("cuppingSessions") },
  handler: async (ctx, args) => {
    await (ctx.db as any).delete(args.id);
  },
});
