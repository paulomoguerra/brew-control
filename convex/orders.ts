import { v } from "convex/values";
import { query, mutation } from "./_generated/server";

export const list = query({
  handler: async (ctx) => {
    const orders = await ctx.db.query("orders").order("desc").collect();
    
    // Join with client names
    const ordersWithClients = await Promise.all(
      orders.map(async (order) => {
        const client = await ctx.db.get(order.clientId);
        return {
          ...order,
          clientName: client?.name || "Unknown Client",
        };
      })
    );
    
    return ordersWithClients;
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
  },
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      clientId: args.clientId,
      status: "pending",
      totalAmount: args.totalAmount,
      orderDate: Date.now(),
      itemCount: args.items.length,
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
            await ctx.db.patch(item.productId, {
                quantityLbs: product.quantityLbs - item.quantity,
                status: (product.quantityLbs - item.quantity) < 10 ? 'low_stock' : 'available'
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
    await ctx.db.patch(args.orderId, { status: args.status });
  },
});
