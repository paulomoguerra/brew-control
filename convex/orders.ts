import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").order("desc").collect();
    const settings = await ctx.db.query("cafeSettings").first();
    const defaultMargin = settings?.defaultTargetMargin ?? 35;
    
    const ordersWithDetails = await Promise.all(
      orders.map(async (order) => {
        try {
          const client = order.clientId ? await ctx.db.get(order.clientId) : null;
          const items = await ctx.db
            .query("orderItems")
            .withIndex("by_order", (q) => q.eq("orderId", order._id))
            .collect();

          let totalSuggested = 0;

          const itemsWithProducts = await Promise.all(
            items.map(async (item) => {
              const product = await ctx.db.get(item.productId);
              const margin = product?.targetMargin ?? defaultMargin;
              const cost = product?.costPerLb ?? 10;
              const suggestedPrice = cost / (1 - (margin / 100));
              totalSuggested += (suggestedPrice * item.quantity);

              return { 
                ...item, 
                productName: product?.productName || "Unknown Product",
                suggestedPrice 
              };
            })
          );

          return {
            ...order,
            clientName: client?.name || order.clientName || "Unknown Client",
            items: itemsWithProducts,
            totalSuggested
          };
        } catch (e) {
          console.error(`Error loading details for order ${order._id}:`, e);
          return { ...order, clientName: "Error Loading", items: [], totalSuggested: 0 };
        }
      })
    );
    
    return ordersWithDetails;
  },
});

export const remove = mutation({
  args: { id: v.id("orders") },
  handler: async (ctx, args) => {
    // 1. Get items to restore inventory
    const items = await ctx.db
      .query("orderItems")
      .withIndex("by_order", (q) => q.eq("orderId", args.id))
      .collect();

    for (const item of items) {
      const product = await ctx.db.get(item.productId);
      if (product) {
        const newQty = product.quantityLbs + item.quantity;
        await ctx.db.patch(item.productId, {
          quantityLbs: newQty,
          status: newQty < 5 ? 'low_stock' : newQty <= 0 ? 'out_of_stock' : 'available'
        });
      }
      await ctx.db.delete(item._id);
    }

    await ctx.db.delete(args.id);
  },
});

export const update = mutation({
  args: {
    id: v.id("orders"),
    status: v.optional(v.union(v.literal("pending"), v.literal("roasting"), v.literal("shipped"), v.literal("paid"))),
    totalAmount: v.optional(v.number()),
    clientName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    
    if (updates.status) {
      const order = await ctx.db.get(id);
      if (order && order.status !== updates.status) {
        const history = order.statusHistory || [];
        await ctx.db.patch(id, {
          ...updates,
          statusHistory: [...history, { status: updates.status, timestamp: Date.now() }]
        });
        return;
      }
    }
    
    await ctx.db.patch(id, updates);
  },
});

export const add = mutation({
  args: {
    clientId: v.id("clients"),
    items: v.array(v.object({
        productId: v.id("roastedInventory"),
        quantity: v.number(),
        price: v.number()
    })),
    totalAmount: v.number(),
    status: v.optional(v.union(v.literal("pending"), v.literal("roasting"), v.literal("shipped"), v.literal("paid"))),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    const initialStatus = args.status || "pending";
    const orderId = await ctx.db.insert("orders", {
      clientId: args.clientId,
      clientName: client?.name || "Unknown",
      status: initialStatus,
      totalAmount: args.totalAmount,
      orderDate: Date.now(),
      itemCount: args.items.length,
      statusHistory: [{ status: initialStatus, timestamp: Date.now() }]
    });

    for (const item of args.items) {
        await ctx.db.insert("orderItems", {
            orderId,
            productId: item.productId,
            quantity: item.quantity,
            priceAtTime: item.price
        });
        
        // Deduct from Roasted Inventory
        const product = await ctx.db.get(item.productId);
        if (product) {
            const newQty = product.quantityLbs - item.quantity;
            await ctx.db.patch(item.productId, {
                quantityLbs: newQty,
                status: newQty < 5 ? 'low_stock' : newQty <= 0 ? 'out_of_stock' : 'available'
            });
        }
    }
    return orderId;
  },
});

export const updateStatus = mutation({
  args: { 
    orderId: v.id("orders"), 
    status: v.union(v.literal("pending"), v.literal("roasting"), v.literal("shipped"), v.literal("paid")) 
  },
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (order && order.status !== args.status) {
      const history = order.statusHistory || [];
      await ctx.db.patch(args.orderId, { 
        status: args.status,
        statusHistory: [...history, { status: args.status, timestamp: Date.now() }]
      });
    }
  },
});
