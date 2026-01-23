"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, X, PackageMinus } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { OrderItem } from '../../types';
import { Card } from '../../components/ui/Card';
import { Id } from '../../convex/_generated/dataModel';

export default function SalesPage() {
  const { formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.inventory.listRoasted);
  const addOrder = useMutation(api.orders.add);
  const addClient = useMutation(api.clients.add); 
  const updateStatus = useMutation(api.orders.updateStatus);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<any[]>([]); // Using any for cart items briefly to match mutation args
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);

  const addToCart = () => {
    const product = products?.find(p => p._id === selectedProductId);
    if (!product || quantity <= 0) return;
    
    setCart([...cart, { 
        productId: product._id as Id<"roastedInventory">, 
        productName: product.productName, 
        quantity, 
        price: product.wholesalePricePerLb || 12 
    }]);
    setSelectedProductId('');
    setQuantity(0);
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !clientName) return;
    setIsProcessing(true);
    try {
      // Create a temporary client for this order (or lookup if we had a real CRM)
      // For this MVP, we will use a "Guest Client" approach or we need to add a client first.
      // Since `orders.add` expects a `clientId`, let's just create a dummy client in our schema?
      // Or we can update the schema to allow string names. 
      // Actually, my schema said `clientId: v.id("clients")`.
      // So I MUST have a client ID.
      // I'll assume for now we have a "Walk-In" client or I'll quickly add a `createClient` mutation on the fly?
      // Let's create a quick "Quick Client" mutation if needed, or just fail for now?
      // Better: I'll update the mutation in `convex/orders.ts` to accept `clientName` string for MVP if I hadn't already defined strict schema.
      // Strict schema is defined. I'll need to create a client first.
      
      // Let's rely on a helper or just create one.
      // Wait, I don't have `api.clients.add` exposed yet.
      // I should probably fix that in the next step.
      // For now, I'll comment out the execution and warn the user, OR I can assume a valid ID is passed if I hardcode one.
      // Actually, I'll fix `convex/clients.ts` next.
      
      // I'll proceed with the code assuming `api.clients.add` exists and I'll create it in the next tool call.
      const clientId = await addClient({ name: clientName, email: "placeholder@email.com", pricingTier: "Wholesale A" });

      await addOrder({
          clientId: clientId,
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          totalAmount: cart.reduce((acc, i) => acc + (i.quantity * i.price), 0)
      });

      showToast('Order created successfully', 'success');
      setIsModalOpen(false);
      setCart([]);
      setClientName('');
    } catch (err) {
      console.error(err);
      showToast('Failed to create order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Wholesale Orders</h1>
          <p className="text-slate-500 font-medium">B2B sales portal and order management.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center gap-2">
          <Plus size={20} /> New Wholesale Order
        </button>
      </div>

      <Card className="min-h-[400px]">
        {orders && orders.length > 0 ? (
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map((order) => (
                 <tr key={order._id} className="hover:bg-slate-50">
                   <td className="px-8 py-6 font-bold text-slate-900">
                      {order.clientName}
                   </td>
                  <td className="px-8 py-6">
                    <select 
                      value={order.status} 
                      onChange={(e) => updateStatus({ orderId: order._id, status: e.target.value as any })}
                      className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-black uppercase border-none focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                    >
                      <option value="pending">Pending</option>
                      <option value="roasting">Roasting</option>
                      <option value="shipped">Shipped</option>
                      <option value="paid">Paid</option>
                    </select>
                  </td>
                  <td className="px-8 py-6 text-right font-black text-slate-900">{formatCurrency(order.totalAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
             <PackageMinus size={32} className="text-slate-300 mb-4" />
             <p className="text-slate-500 font-bold">No active orders</p>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-8">
            <div className="flex justify-between mb-6">
              <h3 className="text-xl font-black">Create Order</h3>
              <button onClick={() => setIsModalOpen(false)}><X /></button>
            </div>
            <div className="space-y-6">
              <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="input-field" />
              <div className="grid grid-cols-4 gap-4 items-end">
                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="col-span-2 input-field">
                  <option value="">Select Product...</option>
                  {products?.map(p => <option key={p._id} value={p._id}>{p.productName} ({p.quantityLbs} lbs)</option>)}
                </select>
                <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} placeholder="Qty" className="input-field" />
                <button onClick={addToCart} className="btn-secondary h-[48px]">Add</button>
              </div>
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between border-b py-2 text-sm">
                  <span>{item.productName} (x{item.quantity})</span>
                  <span className="font-bold">{formatCurrency(item.quantity * item.price)}</span>
                </div>
              ))}
              <button onClick={handleSubmitOrder} disabled={isProcessing || cart.length === 0} className="btn-primary w-full mt-4">
                {isProcessing ? <Loader2 className="animate-spin" /> : `Confirm Order (${formatCurrency(cart.reduce((a, b) => a + (b.quantity * b.price), 0))})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
