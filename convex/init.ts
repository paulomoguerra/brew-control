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

export const seedRecipes = mutation({
  handler: async (ctx) => {
    const existing = await ctx.db.query("menuItems").first();
    if (existing) return "Recipes already exist";

    const recipes = [
      {
        name: "Classic V60",
        salePrice: 4.5,
        coffeeDosageGrams: 15,
        method: "V60",
        grindSetting: "Medium-Fine (22 clicks on Comandante)",
        waterTemp: 94,
        targetYield: 250,
        targetTime: 180,
        technique: "Bloom with 50g water for 30s. Circular pour up to 150g, then final pour up to 250g. Gentle swirl at the end.",
        components: []
      },
      {
        name: "House Espresso",
        salePrice: 3.5,
        coffeeDosageGrams: 18,
        method: "Espresso",
        grindSetting: "Fine (7.5 on EK43)",
        waterTemp: 93,
        targetYield: 36,
        targetTime: 28,
        technique: "Standard 1:2 ratio. 7 second pre-infusion if available.",
        components: []
      },
      {
        name: "Aeropress - inverted",
        salePrice: 4.0,
        coffeeDosageGrams: 14,
        method: "Aeropress",
        grindSetting: "Medium (18 clicks on Comandante)",
        waterTemp: 85,
        targetYield: 200,
        targetTime: 120,
        technique: "Steep for 90s, flip and plunge slowly for 30s.",
        components: []
      },
      {
        name: "Hario Suiren - Spiral Flow",
        salePrice: 5.5,
        coffeeDosageGrams: 15,
        method: "Hario Suiren",
        grindSetting: "Medium-Fine (20 clicks)",
        waterTemp: 92,
        targetYield: 240,
        targetTime: 165,
        technique: "Leverage the Suiren's modular ribs for high bypass. Fast center pours to maintain high slurry temperature.",
        components: []
      },
      {
        name: "Origami Dripper - Sweetness",
        salePrice: 5.0,
        coffeeDosageGrams: 12,
        method: "Origami",
        grindSetting: "Medium-Coarse",
        waterTemp: 94,
        targetYield: 200,
        targetTime: 150,
        technique: "Use Kalita Wave filters for more body, or V60 filters for clarity. Single pour technique after bloom.",
        components: []
      },
      {
        name: "Fellow Stagg X - High Extraction",
        salePrice: 6.0,
        coffeeDosageGrams: 20,
        method: "Stagg X",
        grindSetting: "Fine-Medium",
        waterTemp: 96,
        targetYield: 300,
        targetTime: 210,
        technique: "Flat-bottom geometry. Agitate heavily during bloom to maximize extraction of light roasts.",
        components: []
      },
      {
        name: "Siphon - The Theater",
        salePrice: 8.0,
        coffeeDosageGrams: 25,
        method: "Siphon",
        grindSetting: "Medium",
        waterTemp: 95,
        targetYield: 400,
        targetTime: 180,
        technique: "Maintain the bubble chain. Agitate in a cross-pattern once the water rises. 45s steep before drawdown.",
        components: []
      },
      {
        name: "Hario Switch - Hybrid Immersion",
        salePrice: 5.5,
        coffeeDosageGrams: 20,
        method: "Hario Switch",
        grindSetting: "Medium-Coarse",
        waterTemp: 92,
        targetYield: 300,
        targetTime: 240,
        technique: "Steep with switch closed for 2 mins, then open switch for a percolated finish. Best for high clarity with high body.",
        components: []
      },
      {
        name: "Turkish Coffee - Cezve",
        salePrice: 4.5,
        coffeeDosageGrams: 7,
        method: "Cezve/Ibrik",
        grindSetting: "Extra-Fine (Dust)",
        waterTemp: 90,
        targetYield: 60,
        targetTime: 150,
        technique: "Heat slowly. Remove from heat just as the foam begins to rise. Do not boil. Pour gently to preserve the foam.",
        components: []
      },
      {
        name: "Vietnamese Phin - Traditional",
        salePrice: 4.0,
        coffeeDosageGrams: 20,
        method: "Phin",
        grindSetting: "Medium-Coarse",
        waterTemp: 96,
        targetYield: 100,
        targetTime: 300,
        technique: "Add 20ml water to bloom, wait 45s. Add remaining water and compress the gravity filter slightly.",
        components: []
      },
      {
        name: "Clever Dripper - Clean Immersion",
        salePrice: 5.0,
        coffeeDosageGrams: 22,
        method: "Clever Dripper",
        grindSetting: "Medium",
        waterTemp: 94,
        targetYield: 340,
        targetTime: 240,
        technique: "Water first, then coffee. Steep for 2 minutes, stir the crust, and place on server for drawdown.",
        components: []
      },
      {
        name: "Cold Drip - Kyoto Style",
        salePrice: 7.0,
        coffeeDosageGrams: 100,
        method: "Cold Drip",
        grindSetting: "Coarse",
        waterTemp: 4,
        targetYield: 1000,
        targetTime: 28800,
        technique: "1 drop per 1.5 seconds. Use an ice/water mix. Yields a highly aromatic, liqueur-like body.",
        components: []
      }
    ];

    for (const recipe of recipes) {
      await ctx.db.insert("menuItems", recipe);
    }
    return "Created sample recipes";
  }
});
