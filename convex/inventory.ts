import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Green Inventory
export const list = query({
  handler: async (ctx) => {
    return await ctx.db.query("greenInventory")
      .withIndex("by_quantity")
      .order("desc")
      .collect();
  },
});

export const add = mutation({
  args: {
    batchNumber: v.string(),
    origin: v.string(),
    process: v.optional(v.string()),
    quantityLbs: v.number(),
    costPerLb: v.number(),
    shippingCost: v.optional(v.number()),
    taxCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("greenInventory", {
      ...args,
      initialQuantityLbs: args.quantityLbs,
      arrivedAt: Date.now(),
      status: "active",
    });
  },
});

export const updateQuantity = mutation({
  args: { id: v.id("greenInventory"), newQuantity: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { 
      quantityLbs: args.newQuantity,
      status: args.newQuantity <= 0 ? "archived" : "active"
    });
  },
});

export const edit = mutation({
  args: {
    id: v.id("greenInventory"),
    batchNumber: v.optional(v.string()),
    origin: v.optional(v.string()),
    process: v.optional(v.string()),
    quantityLbs: v.optional(v.number()),
    costPerLb: v.optional(v.number()),
    shippingCost: v.optional(v.number()),
    taxCost: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const updateRoastedMargin = mutation({
  args: { id: v.id("roastedInventory"), targetMargin: v.number() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { targetMargin: args.targetMargin });
  }
});

// Roasted Inventory (Finished Goods)
export const listRoasted = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("roastedInventory").collect();
  },
});

export const addRoasted = mutation({
  args: {
    productName: v.string(),
    quantityLbs: v.number(),
    costPerLb: v.number(),
    wholesalePricePerLb: v.number(),
    targetMargin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await ctx.db.insert("roastedInventory", {
      ...args,
      status: args.quantityLbs <= 0 ? "out_of_stock" : args.quantityLbs < 5 ? "low_stock" : "available",
    });
  },
});

export const editRoasted = mutation({
  args: {
    id: v.id("roastedInventory"),
    productName: v.optional(v.string()),
    quantityLbs: v.optional(v.number()),
    costPerLb: v.optional(v.number()),
    wholesalePricePerLb: v.optional(v.number()),
    targetMargin: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const removeRoasted = mutation({
  args: { id: v.id("roastedInventory") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
