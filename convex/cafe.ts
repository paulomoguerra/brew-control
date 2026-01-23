import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Settings ---

export const getSettings = query({
  handler: async (ctx) => {
    const settings = await (ctx.db as any).query("cafeSettings").first();
    if (!settings) {
      // Return defaults if none exist
      return {
        monthlyRevenueGoal: 15000,
        defaultTargetMargin: 75,
        taxRate: 8,
        isBurdenEnabled: false
      };
    }
    return settings;
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
    return await (ctx.db as any).query("operatingExpenses").order("desc").collect();
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
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return await (ctx.db as any).query("dailyIncome")
      .withIndex("by_date", (q: any) => q.gte("date", startOfMonth))
      .order("desc")
      .collect();
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
    const settings = await (ctx.db as any).query("cafeSettings").first() || {
      monthlyRevenueGoal: 15000,
      isBurdenEnabled: false
    };

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    // 1. Income this month
    const incomeRecords = await (ctx.db as any).query("dailyIncome")
      .withIndex("by_date", (q: any) => q.gte("date", startOfMonth))
      .collect();
    const totalIncome = incomeRecords.reduce((acc: number, curr: any) => acc + curr.amount, 0);

    // 2. Expenses (Fixed monthly + variable this month)
    const allExpenses = await (ctx.db as any).query("operatingExpenses").collect();
    const monthlyOverhead = allExpenses.reduce((acc: number, curr: any) => {
      if (curr.recurrence === "monthly") return acc + curr.cost;
      if (curr.date >= startOfMonth) return acc + curr.cost;
      return acc;
    }, 0);

    // 3. Burden Math
    const roasts = await (ctx.db as any).query("roastLogs")
      .withIndex("by_date", (q: any) => q.gte("roastDate", startOfMonth))
      .collect();
    const totalWeightRoastedLbs = roasts.reduce((acc: number, curr: any) => acc + curr.roastedWeightOut, 0);
    
    // Convert to kg burden (Standard)
    const totalWeightKg = totalWeightRoastedLbs * 0.453592;
    const burdenPerKg = totalWeightKg > 0 ? monthlyOverhead / totalWeightKg : 0;

    return {
      totalIncome,
      monthlyOverhead,
      revenueGoal: settings.monthlyRevenueGoal,
      burdenPerKg,
      isBurdenEnabled: settings.isBurdenEnabled,
      burnRatePerDay: monthlyOverhead / 30
    };
  }
});

// Re-implementing ingredients/menu items
export const listIngredients = query({ handler: async (ctx) => await (ctx.db as any).query("ingredients").order("desc").collect() });

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

export const deleteIngredient = mutation({ args: { id: v.id("ingredients") }, handler: async (ctx, args) => await (ctx.db as any).delete(args.id) });

export const listMenuItems = query({
  handler: async (ctx) => {
    const items = await (ctx.db as any).query("menuItems").collect();
    const ingredients = await (ctx.db as any).query("ingredients").collect();
    const roastedStock = await (ctx.db as any).query("roastedInventory").collect();

    return items.map((item: any) => {
      const avgCostLb = roastedStock.length > 0 
        ? roastedStock.reduce((a: number, b: any) => a + (b.quantityLbs * b.costPerLb), 0) / roastedStock.reduce((a: number, b: any) => a + b.quantityLbs, 0)
        : 10;
      
      const coffeeCost = item.coffeeDosageGrams * (avgCostLb / 453.592);
      let ingredCost = 0;
      item.components.forEach((c: any) => {
        const ing = ingredients.find((x: any) => x._id === c.ingredientId);
        if (ing) ingredCost += (ing.volumeOz ? (ing.cost / ing.volumeOz) : ing.cost) * c.quantity;
      });

      const totalCOGS = coffeeCost + ingredCost;
      return {
        ...item,
        analysis: {
          coffeeCost,
          ingredientsCost: ingredCost,
          totalCost: totalCOGS,
          margin: item.salePrice - totalCOGS,
          marginPercent: ((item.salePrice - totalCOGS) / item.salePrice) * 100
        }
      };
    });
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

export const deleteMenuItem = mutation({ args: { id: v.id("menuItems") }, handler: async (ctx, args) => await (ctx.db as any).delete(args.id) });
