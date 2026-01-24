import { mutation } from "./_generated/server";

export const seedSettings = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("cafeSettings").first();
    if (!existing) {
      await ctx.db.insert("cafeSettings", {
        monthlyRevenueGoal: 15000,
        defaultTargetMargin: 75,
        taxRate: 8,
        isBurdenEnabled: false,
      });
      return "Created default settings";
    }
    return "Settings already exist";
  },
});
