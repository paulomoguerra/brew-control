"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, X, PackageMinus } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Id } from '../../convex/_generated/dataModel';

export default function SalesPage() {
  const { formatCurrency, formatWeight } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.inventory.listRoasted);
  const addOrder = useMutation(api.orders.add);
  const addClient = useMutation(api.clients.add); 
  const updateStatus = useMutation(api.orders.updateStatus);

  const isLoading = orders === undefined || products === undefined;

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

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 md:h-10 w-[200px] md:w-[300px]" />
            <Skeleton className="h-4 w-full max-w-[400px]" />
          </div>
          <Skeleton className="h-12 w-full sm:w-[200px] rounded-xl" />
        </header>
        <Card className="min-h-[300px] md:min-h-[400px] p-4 md:p-8 space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Wholesale Orders</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">B2B sales portal and order management.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary flex items-center justify-center gap-2 w-full sm:w-auto">
          <Plus size={20} /> New Wholesale Order
        </button>
      </div>

      <Card className="min-h-[300px] md:min-h-[400px]">
        {orders && orders.length > 0 ? (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full text-left min-w-[500px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 md:px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {orders.map((order) => (
                   <tr key={order._id} className="hover:bg-slate-50 text-sm md:text-base">
                     <td className="px-6 md:px-8 py-6 font-bold text-slate-900">
                        {order.clientName}
                     </td>
                    <td className="px-6 md:px-8 py-6 text-center">
                      <select 
                        value={order.status} 
                        onChange={(e) => updateStatus({ orderId: order._id, status: e.target.value as any })}
                        className="px-3 py-1 bg-amber-100 text-amber-900 rounded-full text-[10px] font-black uppercase border-none focus:ring-2 focus:ring-amber-500 outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="roasting">Roasting</option>
                        <option value="shipped">Shipped</option>
                        <option value="paid">Paid</option>
                      </select>
                    </td>
                    <td className="px-6 md:px-8 py-6 text-right font-black text-slate-900">{formatCurrency(order.totalAmount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
             <PackageMinus size={32} className="text-slate-300 mb-4" />
             <p className="text-slate-500 font-bold">No active orders</p>
          </div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-black">Create Order</h3>
              <button onClick={() => setIsModalOpen(false)} className="p-2 -mr-2 text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
            </div>
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Name</label>
                <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="Client Name" className="input-field" />
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Add Items</label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end bg-slate-50 p-4 rounded-2xl">
                  <div className="sm:col-span-2 space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Product</span>
                    <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="input-field bg-white">
                      <option value="">Select Product...</option>
                      {products?.map(p => <option key={p._id} value={p._id}>{p.productName} ({formatWeight(p.quantityLbs)})</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] font-bold text-slate-400 uppercase ml-1">Quantity</span>
                    <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} placeholder="Qty" className="input-field bg-white" />
                  </div>
                  <button onClick={addToCart} className="btn-secondary h-[48px] w-full">Add</button>
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center border-b border-slate-50 py-3 text-sm">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Qty: {item.quantity}</span>
                      </div>
                      <span className="font-black text-slate-900">{formatCurrency(item.quantity * item.price)}</span>
                    </div>
                  ))}
                </div>
              )}
              
              <button onClick={handleSubmitOrder} disabled={isProcessing || cart.length === 0} className="btn-primary w-full mt-4 py-4 text-base">
                {isProcessing ? <Loader2 className="animate-spin" /> : (
                  <div className="flex items-center justify-center gap-2">
                    Confirm Order 
                    <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                      {formatCurrency(cart.reduce((a, b) => a + (b.quantity * b.price), 0))}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
