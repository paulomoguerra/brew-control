import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Settings ---

export const getSettings = query({
  args: {},
  handler: async (ctx) => {
    try {
      const settings = await ctx.db.query("cafeSettings").first();

      if (!settings) {
        return {
          monthlyRevenueGoal: 15000,
          defaultTargetMargin: 75,
          taxRate: 8,
          isBurdenEnabled: false,
          laborRate: 25.00,
          gasRate: 4.50,
          utilityRate: 1.50
        };
      }

      return {
        monthlyRevenueGoal: settings.monthlyRevenueGoal ?? 15000,
        defaultTargetMargin: settings.defaultTargetMargin ?? 75,
        taxRate: settings.taxRate ?? 8,
        isBurdenEnabled: settings.isBurdenEnabled ?? false,
        laborRate: settings.laborRate ?? 25.00,
        gasRate: settings.gasRate ?? 4.50,
        utilityRate: settings.utilityRate ?? 1.50
      };
    } catch (e) {
      console.error("Error fetching settings:", e);
      return {
        monthlyRevenueGoal: 15000,
        defaultTargetMargin: 75,
        taxRate: 8,
        isBurdenEnabled: false,
        laborRate: 25.00,
        gasRate: 4.50,
        utilityRate: 1.50
      };
    }
  }
});

export const updateSettings = mutation({
  args: {
    monthlyRevenueGoal: v.optional(v.number()),
    defaultTargetMargin: v.optional(v.number()),
    taxRate: v.optional(v.number()),
    isBurdenEnabled: v.optional(v.boolean()),
    laborRate: v.optional(v.number()),
    gasRate: v.optional(v.number()),
    utilityRate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("cafeSettings").first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("cafeSettings", {
        monthlyRevenueGoal: 15000,
        defaultTargetMargin: 75,
        taxRate: 8,
        isBurdenEnabled: false,
        laborRate: 25.00,
        gasRate: 4.50,
        utilityRate: 1.50,
        ...args
      });
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
      // 1. Get Settings
      const settingsDoc = await ctx.db.query("cafeSettings").first();
      // Default values if settings document doesn't exist
      let revenueGoal = settingsDoc?.monthlyRevenueGoal ?? 15000;
      const isBurdenEnabled = settingsDoc?.isBurdenEnabled ?? false;

      // 2. Calculate Monthly Overhead
      const expenses = await ctx.db.query("operatingExpenses").collect();
      let monthlyOverhead = expenses.reduce((sum, e) => sum + e.cost, 0);
      let burnRatePerDay = monthlyOverhead / 30;

      // 3. Calculate Income (MTD)
      const date = new Date(args.now);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
      
      // Note: In a larger app, we'd use a range index here. For now, filter in memory.
      const incomeLog = await ctx.db.query("dailyIncome").collect();
      let totalIncome = incomeLog
        .filter(i => i.date >= startOfMonth)
        .reduce((sum, i) => sum + i.amount, 0);

      // 4. Calculate Burden Per Kg (Allocation)
      // We need total roasted weight for the current month to amortize overhead
      const roastLogs = await ctx.db.query("roastLogs").collect();
      const monthlyRoastWeight = roastLogs
        .filter(r => r.roastDate >= startOfMonth)
        .reduce((sum, r) => sum + r.roastedWeightOut, 0);

      const totalRoastedWeight = (await ctx.db.query("roastedInventory").collect())
        .reduce((sum, r) => sum + r.quantityLbs, 0);
      
      const totalGreenWeight = (await ctx.db.query("greenInventory").collect())
        .reduce((sum, g) => sum + g.quantityLbs, 0);

      // 5. Order Status Counts
      const allOrders = await ctx.db.query("orders").collect();
      const statusCounts = {
        pending: allOrders.filter(o => o.status === 'pending').length,
        roasting: allOrders.filter(o => o.status === 'roasting').length,
        shipped: allOrders.filter(o => o.status === 'shipped').length,
        paid: allOrders.filter(o => o.status === 'paid').length,
      };

      // Avoid division by zero
      let burdenPerKg = 0;
      if (monthlyRoastWeight > 0) {
        burdenPerKg = monthlyOverhead / (monthlyRoastWeight * 0.453592);
      }
      
      // Safety check for Infinity/NaN
      if (!Number.isFinite(burdenPerKg)) burdenPerKg = 0;
      if (!Number.isFinite(monthlyOverhead)) monthlyOverhead = 0;
      if (!Number.isFinite(totalIncome)) totalIncome = 0;
      if (!Number.isFinite(revenueGoal)) revenueGoal = 15000;
      if (!Number.isFinite(burnRatePerDay)) burnRatePerDay = 0;

      return {
        totalIncome,
        monthlyOverhead,
        revenueGoal,
        burdenPerKg,
        isBurdenEnabled,
        burnRatePerDay,
        totalRoastedWeight,
        totalGreenWeight,
        statusCounts
      };
    } catch (e) {
      console.error("Error calculating financial summary:", e);
      return {
        totalIncome: 0,
        monthlyOverhead: 0,
        revenueGoal: 15000,
        burdenPerKg: 0,
        isBurdenEnabled: false,
        burnRatePerDay: 0,
        totalRoastedWeight: 0,
        totalGreenWeight: 0,
        statusCounts: { pending: 0, roasting: 0, shipped: 0, paid: 0 }
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
