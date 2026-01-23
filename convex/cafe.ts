import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Settings ---

export const getSettings = query({
  handler: async (ctx) => {
    try {
      const settings = await (ctx.db as any).query("cafeSettings").first();
      if (!settings) {
        return {
          monthlyRevenueGoal: 15000,
          defaultTargetMargin: 75,
          taxRate: 8,
          isBurdenEnabled: false
        };
      }
      return settings;
    } catch (e) {
      console.error("Error fetching settings:", e);
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
    const existing = await (ctx.db as any).query("cafeSettings").first();
    if (existing) {
      await (ctx.db as any).patch(existing._id, args);
    } else {
      await (ctx.db as any).insert("cafeSettings", args);
    }
  }
});

// --- Expenses ---

export const listExpenses = query({
  handler: async (ctx) => {
    try {
      return await (ctx.db as any).query("operatingExpenses").order("desc").collect();
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
    await (ctx.db as any).insert("operatingExpenses", {
      ...args,
      date: Date.now()
    });
  }
});

export const deleteExpense = mutation({
  args: { id: v.id("operatingExpenses") },
  handler: async (ctx, args) => {
    await (ctx.db as any).delete(args.id);
  }
});

// --- Income ---

export const listIncome = query({
  handler: async (ctx) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      return await (ctx.db as any).query("dailyIncome")
        .withIndex("by_date", (q: any) => q.gte("date", startOfMonth))
        .order("desc")
        .collect();
    } catch (e) {
      // Fallback if index missing
      return await (ctx.db as any).query("dailyIncome").order("desc").take(50);
    }
  }
});

export const addDailyIncome = mutation({
  args: { amount: v.number(), notes: v.optional(v.string()) },
  handler: async (ctx, args) => {
    await (ctx.db as any).insert("dailyIncome", {
      ...args,
      date: Date.now()
    });
  }
});

// --- Analysis & Intelligence ---

export const getFinancialSummary = query({
  handler: async (ctx) => {
    try {
      const settings = await (ctx.db as any).query("cafeSettings").first() || {
        monthlyRevenueGoal: 15000,
        isBurdenEnabled: false
      };

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

      // 1. Income this month
      let incomeRecords = [];
      try {
        incomeRecords = await (ctx.db as any).query("dailyIncome")
          .withIndex("by_date", (q: any) => q.gte("date", startOfMonth))
          .collect();
      } catch (e) {
        // Fallback: fetch all and filter in memory
        const allIncome = await (ctx.db as any).query("dailyIncome").collect();
        incomeRecords = allIncome.filter((i: any) => i.date >= startOfMonth);
      }
      
      const totalIncome = incomeRecords.reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0);

      // 2. Expenses (Fixed monthly + variable this month)
      const allExpenses = await (ctx.db as any).query("operatingExpenses").collect();
      const monthlyOverhead = allExpenses.reduce((acc: number, curr: any) => {
        const cost = curr.cost || 0;
        if (curr.recurrence === "monthly") return acc + cost;
        if (curr.date >= startOfMonth) return acc + cost;
        return acc;
      }, 0);

      // 3. Burden Math
      let roasts = [];
      try {
        roasts = await (ctx.db as any).query("roastLogs")
          .withIndex("by_date", (q: any) => q.gte("roastDate", startOfMonth))
          .collect();
      } catch (e) {
        // Fallback: fetch all and filter in memory
        const allRoasts = await (ctx.db as any).query("roastLogs").collect();
        roasts = allRoasts.filter((r: any) => r.roastDate >= startOfMonth);
      }

      const totalWeightRoastedLbs = roasts.reduce((acc: number, curr: any) => acc + (curr.roastedWeightOut || 0), 0);
      
      // Convert to kg burden (Standard)
      const totalWeightKg = totalWeightRoastedLbs * 0.453592;
      const burdenPerKg = totalWeightKg > 0 ? (monthlyOverhead / totalWeightKg) : 0;

      return {
        totalIncome: Number.isFinite(totalIncome) ? totalIncome : 0,
        monthlyOverhead: Number.isFinite(monthlyOverhead) ? monthlyOverhead : 0,
        revenueGoal: settings.monthlyRevenueGoal || 15000,
        burdenPerKg: Number.isFinite(burdenPerKg) ? burdenPerKg : 0,
        isBurdenEnabled: !!settings.isBurdenEnabled,
        burnRatePerDay: Number.isFinite(monthlyOverhead / 30) ? (monthlyOverhead / 30) : 0
      };
    } catch (err) {
      console.error("Financial Summary Error:", err);
      // Return safe defaults to prevent UI crash
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

// Re-implementing ingredients/menu items
export const listIngredients = query({ 
  handler: async (ctx) => {
    try {
      return await (ctx.db as any).query("ingredients").order("desc").collect();
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
  handler: async (ctx, args) => await (ctx.db as any).insert("ingredients", args)
});

export const deleteIngredient = mutation({ 
  args: { id: v.id("ingredients") }, 
  handler: async (ctx, args) => await (ctx.db as any).delete(args.id) 
});

export const listMenuItems = query({
  handler: async (ctx) => {
    try {
      const items = await (ctx.db as any).query("menuItems").collect();
      const ingredients = await (ctx.db as any).query("ingredients").collect();
      const roastedStock = await (ctx.db as any).query("roastedInventory").collect();

      return items.map((item: any) => {
        const totalStockWeight = roastedStock.reduce((a: number, b: any) => a + (b.quantityLbs || 0), 0);
        const avgCostLb = totalStockWeight > 0 
          ? roastedStock.reduce((a: number, b: any) => a + ((b.quantityLbs || 0) * (b.costPerLb || 0)), 0) / totalStockWeight
          : 10;
        
        const coffeeCost = (item.coffeeDosageGrams || 0) * (avgCostLb / 453.592);
        let ingredCost = 0;
        (item.components || []).forEach((c: any) => {
          const ing = ingredients.find((x: any) => x._id === c.ingredientId);
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
      console.error("List Menu Items Error", e);
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
  handler: async (ctx, args) => await (ctx.db as any).insert("menuItems", args)
});

export const deleteMenuItem = mutation({ 
  args: { id: v.id("menuItems") }, 
  handler: async (ctx, args) => await (ctx.db as any).delete(args.id) 
});
