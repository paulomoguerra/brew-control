import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Settings ---

export const getSettings = query({
  handler: async (ctx) => {
    try {
      const settings = await ctx.db.query("cafeSettings").first();
      return {
        monthlyRevenueGoal: settings?.monthlyRevenueGoal ?? 15000,
        defaultTargetMargin: settings?.defaultTargetMargin ?? 75,
        taxRate: settings?.taxRate ?? 8,
        isBurdenEnabled: settings?.isBurdenEnabled ?? false,
        _id: settings?._id
      };
    } catch (e) {
      return {
        monthlyRevenueGoal: 15000,
        defaultTargetMargin: 75,
        taxRate: 8,
        isBurdenEnabled: false
      };
    }
  }
});

export const updateSettings = mutation({
  args: {
    monthlyRevenueGoal: v.number(),
    defaultTargetMargin: v.number(),
    taxRate: v.number(),
    isBurdenEnabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("cafeSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("cafeSettings", args);
    }
  }
});

// --- Expenses ---

export const listExpenses = query({
  handler: async (ctx) => {
    try {
      const expenses = await ctx.db.query("operatingExpenses").collect();
      return expenses || [];
    } catch (e) {
      return [];
    }
  }
});

export const addExpense = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("fixed"), v.literal("variable")),
    cost: v.number(),
    recurrence: v.union(v.literal("monthly"), v.literal("one-time")),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("operatingExpenses", {
      ...args,
      date: Date.now()
    });
  }
});

export const deleteExpense = mutation({
  args: { id: v.id("operatingExpenses") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  }
});

// --- Income ---

export const listIncome = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    try {
      const date = new Date(args.now);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      const income = await ctx.db.query("dailyIncome").order("desc").collect();
      return (income || []).filter(i => i.date >= startOfMonth);
    } catch (e) {
      return [];
    }
  }
});

export const addDailyIncome = mutation({
  args: { amount: v.number(), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await ctx.db.insert("dailyIncome", {
      ...args,
      date: Date.now()
    });
  }
});

// --- Analysis & Intelligence ---

export const getFinancialSummary = query({
  args: { now: v.number() },
  handler: async (ctx, args) => {
    try {
      const settings = await ctx.db.query("cafeSettings").first();
      const revenueGoal = settings?.monthlyRevenueGoal ?? 15000;
      const isBurdenEnabled = settings?.isBurdenEnabled ?? false;

      const date = new Date(args.now);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();

      // 1. Income this month
      const allIncome = await ctx.db.query("dailyIncome").collect();
      const incomeThisMonth = (allIncome || []).filter((i) => (i.date || 0) >= startOfMonth);
      const totalIncome = incomeThisMonth.reduce((acc, curr) => acc + (curr.amount || 0), 0);

      // 2. Expenses
      const allExpenses = await ctx.db.query("operatingExpenses").collect();
      const monthlyOverhead = (allExpenses || []).reduce((acc, curr) => {
        const cost = curr.cost || 0;
        if (curr.recurrence === "monthly") return acc + cost;
        if ((curr.date || 0) >= startOfMonth) return acc + cost;
        return acc;
      }, 0);

      // 3. Burden Math
      const allRoasts = await ctx.db.query("roastLogs").collect();
      const roastsThisMonth = (allRoasts || []).filter((r) => (r.roastDate || 0) >= startOfMonth);
      const totalWeightRoastedLbs = roastsThisMonth.reduce((acc, curr) => acc + (curr.roastedWeightOut || 0), 0);
      const totalWeightKg = totalWeightRoastedLbs * 0.453592;
      const burdenPerKg = totalWeightKg > 0 ? (monthlyOverhead / totalWeightKg) : 0;

      return {
        totalIncome: Number.isFinite(totalIncome) ? totalIncome : 0,
        monthlyOverhead: Number.isFinite(monthlyOverhead) ? monthlyOverhead : 0,
        revenueGoal: Number.isFinite(revenueGoal) ? revenueGoal : 15000,
        burdenPerKg: Number.isFinite(burdenPerKg) ? burdenPerKg : 0,
        isBurdenEnabled: !!isBurdenEnabled,
        burnRatePerDay: Number.isFinite(monthlyOverhead / 30) ? (monthlyOverhead / 30) : 0
      };
    } catch (err) {
      console.error("Summary Error", err);
      return {
        totalIncome: 0,
        monthlyOverhead: 0,
        revenueGoal: 15000,
        burdenPerKg: 0,
        isBurdenEnabled: false,
        burnRatePerDay: 0
      };
    }
  }
});

export const listIngredients = query({ 
  handler: async (ctx) => {
    try {
      const ingredients = await ctx.db.query("ingredients").collect();
      return ingredients || [];
    } catch (e) { return []; }
  }
});

export const addIngredient = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("milk"), v.literal("packaging"), v.literal("syrup"), v.literal("labor"), v.literal("overhead"), v.literal("other")),
    cost: v.number(),
    unit: v.string(),
    volumeOz: v.optional(v.number()),
  },
  handler: async (ctx, args) => await ctx.db.insert("ingredients", args)
});

export const deleteIngredient = mutation({ 
  args: { id: v.id("ingredients") }, 
  handler: async (ctx, args) => await ctx.db.delete(args.id) 
});

export const listMenuItems = query({
  handler: async (ctx) => {
    try {
      const items = await ctx.db.query("menuItems").collect();
      const ingredients = await ctx.db.query("ingredients").collect();
      const roastedStock = await ctx.db.query("roastedInventory").collect();

      if (!items) return [];

      return items.map((item) => {
        const totalStockWeight = (roastedStock || []).reduce((a, b) => a + (b.quantityLbs || 0), 0);
        const avgCostLb = totalStockWeight > 0 
          ? roastedStock.reduce((a, b) => a + ((b.quantityLbs || 0) * (b.costPerLb || 0)), 0) / totalStockWeight
          : 10;
        
        const coffeeCost = (item.coffeeDosageGrams || 0) * (avgCostLb / 453.592);
        let ingredCost = 0;
        (item.components || []).forEach((c) => {
          const ing = (ingredients || []).find((x) => x._id === c.ingredientId);
          if (ing) {
            const cost = ing.cost || 0;
            const volume = ing.volumeOz || 0;
            ingredCost += (volume > 0 ? (cost / volume) : cost) * (c.quantity || 0);
          }
        });

        const totalCOGS = coffeeCost + ingredCost;
        const salePrice = item.salePrice || 0;
        const margin = salePrice - totalCOGS;
        const marginPercent = salePrice > 0 ? (margin / salePrice) * 100 : 0;

        return {
          ...item,
          analysis: {
            coffeeCost: Number.isFinite(coffeeCost) ? coffeeCost : 0,
            ingredientsCost: Number.isFinite(ingredCost) ? ingredCost : 0,
            totalCost: Number.isFinite(totalCOGS) ? totalCOGS : 0,
            margin: Number.isFinite(margin) ? margin : 0,
            marginPercent: Number.isFinite(marginPercent) ? marginPercent : 0
          }
        };
      });
    } catch (e) {
      return [];
    }
  }
});

export const addMenuItem = mutation({
  args: {
    name: v.string(),
    salePrice: v.number(),
    coffeeDosageGrams: v.number(),
    components: v.array(v.object({ ingredientId: v.id("ingredients"), quantity: v.number() })),
  },
  handler: async (ctx, args) => await ctx.db.insert("menuItems", args)
});

export const deleteMenuItem = mutation({ 
  args: { id: v.id("menuItems") }, 
  handler: async (ctx, args) => await ctx.db.delete(args.id) 
});
