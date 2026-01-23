import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// --- Ingredients ---

export const listIngredients = query({
  handler: async (ctx) => {
    return await ctx.db.query("ingredients").order("desc").collect();
  },
});

export const addIngredient = mutation({
  args: {
    name: v.string(),
    category: v.union(v.literal("milk"), v.literal("packaging"), v.literal("syrup"), v.literal("labor"), v.literal("overhead"), v.literal("other")),
    cost: v.number(),
    unit: v.string(),
    volumeOz: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("ingredients", args);
  },
});

export const deleteIngredient = mutation({
  args: { id: v.id("ingredients") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

// --- Menu Items & Analysis ---

export const listMenuItems = query({
  handler: async (ctx) => {
    const items = await ctx.db.query("menuItems").collect();
    const ingredients = await ctx.db.query("ingredients").collect();
    
    // 1. Calculate Average Roasted Coffee Cost (Global)
    // In a real app, you might select *which* bean is used per recipe. 
    // For now, we use the average cost of all "available" roasted inventory.
    const roastedStock = await ctx.db.query("roastedInventory")
      .filter(q => q.eq(q.field("status"), "available"))
      .collect();

    let totalLbs = 0;
    let totalValue = 0;
    roastedStock.forEach(batch => {
      totalLbs += batch.quantityLbs;
      totalValue += (batch.quantityLbs * batch.costPerLb);
    });

    // Default to $10/lb if no stock, to prevent NaN
    const avgCostPerLb = totalLbs > 0 ? totalValue / totalLbs : 10;
    const avgCostPerGram = avgCostPerLb / 453.592;

    // 2. Map Items to include Cost Analysis
    const analyzedItems = items.map(item => {
      // A. Coffee Cost
      const coffeeCost = item.coffeeDosageGrams * avgCostPerGram;

      // B. Ingredients Cost
      let ingredientsCost = 0;
      item.components.forEach(comp => {
        const ingred = ingredients.find(i => i._id === comp.ingredientId);
        if (ingred) {
          // If unit is "gal" and recipe uses "oz", we need conversion
          // For MVP, we assume the input 'cost' is per 'unit' and quantity is in that 'unit'
          // UNLESS volumeOz is provided (meaning cost is per container, calculate cost/oz)
          
          let costPerUnit = ingred.cost;
          if (ingred.volumeOz && ingred.volumeOz > 0) {
             // If volumeOz exists, then 'cost' is for the whole container (e.g. $4 for 128oz milk)
             // And we assume the recipe uses 'oz' (standard for drinks)
             costPerUnit = ingred.cost / ingred.volumeOz;
          }
          
          ingredientsCost += (costPerUnit * comp.quantity);
        }
      });

      const totalCost = coffeeCost + ingredientsCost;
      const margin = item.salePrice - totalCost;
      const marginPercent = item.salePrice > 0 ? (margin / item.salePrice) * 100 : 0;

      return {
        ...item,
        analysis: {
          coffeeCost,
          ingredientsCost,
          totalCost,
          margin,
          marginPercent
        }
      };
    });

    return analyzedItems;
  },
});

export const addMenuItem = mutation({
  args: {
    name: v.string(),
    salePrice: v.number(),
    coffeeDosageGrams: v.number(),
    components: v.array(v.object({
      ingredientId: v.id("ingredients"),
      quantity: v.number(),
    })),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("menuItems", args);
  },
});

export const deleteMenuItem = mutation({
  args: { id: v.id("menuItems") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
