"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, X, PackageMinus, Trash2, Edit3, DollarSign, Calendar, ShoppingBag, ArrowUpRight, TrendingUp, Calculator, TrendingDown, Clock, ChevronDown } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Id } from '../../convex/_generated/dataModel';

export default function SalesPage() {
  const { unit, formatCurrency, formatWeight } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const orders = useQuery(api.orders.list);
  const products = useQuery(api.inventory.listRoasted);
  const settings = useQuery(api.cafe.getSettings);
  const addOrder = useMutation(api.orders.add);
  const addClient = useMutation(api.clients.add); 
  const updateOrder = useMutation(api.orders.update);
  const deleteOrder = useMutation(api.orders.remove);

  const isLoading = orders === undefined || products === undefined || settings === undefined;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [clientName, setClientName] = useState('');
  const [cart, setCart] = useState<any[]>([]); 
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(0);
  const [manualPrice, setManualPrice] = useState<string>('');
  const [orderStatus, setOrderStatus] = useState<"pending" | "roasting" | "shipped" | "paid">('pending');
  
  const [editingOrder, setEditingOrder] = useState<any>(null);

  // Statistics
  const stats = useMemo(() => {
    if (!orders) return { totalRevenue: 0, activeCount: 0, avgValue: 0 };
    const totalRevenue = orders.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const activeCount = orders.filter(o => o.status !== 'paid').length;
    const avgValue = orders.length > 0 ? totalRevenue / orders.length : 0;
    return { totalRevenue, activeCount, avgValue };
  }, [orders]);

  const selectedProduct = useMemo(() => {
    return (products as any[])?.find(p => p._id === selectedProductId);
  }, [products, selectedProductId]);

  const suggestedPrice = useMemo(() => {
    if (!selectedProduct || !settings) return 0;
    const margin = selectedProduct.targetMargin || settings.defaultTargetMargin || 35;
    return selectedProduct.costPerLb / (1 - (margin / 100));
  }, [selectedProduct, settings]);

  const addToCart = () => {
    if (!selectedProduct || quantity <= 0) return;
    
    const finalPrice = parseFloat(manualPrice) || suggestedPrice || selectedProduct.wholesalePricePerLb || 12;

    setCart([...cart, { 
        productId: selectedProduct._id as Id<"roastedInventory">, 
        productName: selectedProduct.productName, 
        quantity, 
        price: finalPrice 
    }]);
    setSelectedProductId('');
    setQuantity(0);
    setManualPrice('');
  };

  const handleSubmitOrder = async () => {
    if (cart.length === 0 || !clientName) return;
    setIsProcessing(true);
    try {
      const clientId = await addClient({ name: clientName, email: "placeholder@email.com", pricingTier: "Wholesale A" });

      await addOrder({
          clientId: clientId as any,
          items: cart.map(i => ({ productId: i.productId, quantity: i.quantity, price: i.price })),
          totalAmount: cart.reduce((acc, i) => acc + (i.quantity * i.price), 0),
          status: orderStatus
      });

      showToast('Order created successfully', 'success');
      setIsModalOpen(false);
      setCart([]);
      setClientName('');
      setOrderStatus('pending');
    } catch (err) {
      console.error(err);
      showToast('Failed to create order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    setIsProcessing(true);
    try {
      await updateOrder({
        id: editingOrder._id,
        status: editingOrder.status,
        totalAmount: editingOrder.totalAmount,
        clientName: editingOrder.clientName
      });
      showToast('Order updated', 'success');
      setIsEditModalOpen(false);
    } catch (err) {
      showToast('Failed to update order', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeleteOrder = async (id: Id<"orders">) => {
    if (!confirm('Are you sure you want to delete this order? Inventory will be restored.')) return;
    try {
      await deleteOrder({ id });
      showToast('Order deleted', 'success');
    } catch (err) {
      showToast('Error deleting order', 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-10 w-[300px]" />
          <Skeleton className="h-12 w-[200px] rounded-xl" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Wholesale Portal</h1>
          <p className="text-slate-500 font-medium">B2B sales distribution & contract management.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary px-8 py-4 flex items-center justify-center gap-3 w-full sm:w-auto shadow-xl hover:scale-105 transition-transform">
          <Plus size={22} /> Create Order
        </button>
      </div>

      {/* Sales Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Total Revenue" 
          value={formatCurrency(stats.totalRevenue)} 
          icon={<DollarSign className="text-green-600" />} 
          trend={<div className="flex items-center gap-1 text-green-600"><TrendingUp size={12}/> 12%</div>}
        />
        <StatCard 
          label="Active Orders" 
          value={stats.activeCount.toString()} 
          icon={<ShoppingBag className="text-blue-600" />} 
          trend="In Progress"
        />
        <StatCard 
          label="Avg. Order Value" 
          value={formatCurrency(stats.avgValue)} 
          icon={<ArrowUpRight className="text-amber-600" />} 
          trend="Profitability"
        />
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders && orders.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all p-8 group relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.07] transition-opacity">
                   <ShoppingBag size={120} />
                </div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight mb-1">{order.clientName}</h3>
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <Calendar size={12} /> {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => { setEditingOrder(order); setIsEditModalOpen(true); }} className="p-3 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                       <button onClick={() => handleDeleteOrder(order._id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 mb-8">
                     <div className="relative group/status">
                        <select 
                           value={order.status} 
                           onChange={(e) => updateOrder({ id: order._id, status: e.target.value as any })}
                           className="appearance-none pl-4 pr-10 py-2.5 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer outline-none border-none hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                        >
                           <option value="pending">Pending</option>
                           <option value="roasting">Roasting</option>
                           <option value="shipped">Shipped</option>
                           <option value="paid">Paid</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/status:text-white transition-colors">
                           <ChevronDown size={14} />
                        </div>
                     </div>
                     <div className="flex items-baseline gap-3">
                        <div className="text-2xl font-black text-slate-900">
                           {formatCurrency(order.totalAmount)}
                        </div>
                        {order.totalSuggested > 0 && Math.abs((order.totalAmount / order.totalSuggested) - 1) > 0.005 && (
                           <div className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 ${order.totalAmount < order.totalSuggested ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                              {order.totalAmount < order.totalSuggested ? (
                                 <TrendingDown size={10} />
                              ) : (
                                 <TrendingUp size={10} />
                              )}
                              {Math.abs(((order.totalAmount / order.totalSuggested) - 1) * 100).toFixed(1)}% 
                              {order.totalAmount < order.totalSuggested ? ' Discount' : ' Markup'}
                           </div>
                        )}
                     </div>
                  </div>

                  {/* Status History Log */}
                  <div className="mb-8 space-y-2">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-2">
                        <Clock size={12}/> Transaction History
                     </span>
                     <div className="space-y-1.5">
                        {!order.statusHistory && (
                           <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-200" />
                              <span className="uppercase tracking-tighter w-16">Created</span>
                              <span className="text-slate-300 font-medium">@ {new Date(order.orderDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                           </div>
                        )}
                        {order.statusHistory?.map((entry: any, i: number) => (
                           <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                              <div className={`w-1.5 h-1.5 rounded-full ${i === order.statusHistory.length - 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
                              <span className="uppercase tracking-tighter w-16">{entry.status}</span>
                              <span className="text-slate-300 font-medium">@ {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {order.items && order.items.length > 0 && (
                    <div className="space-y-3 pt-6 border-t border-slate-50">
                       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order Manifesto</span>
                       {order.items.map((item: any, idx: number) => (
                         <div key={idx} className="flex justify-between items-center text-sm font-bold text-slate-600">
                            <span>{item.quantity}x {item.productName}</span>
                            <span className="text-slate-400">{formatCurrency(item.priceAtTime * item.quantity)}</span>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 rounded-[3rem] p-20 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200">
             <div className="bg-white p-6 rounded-[2rem] shadow-sm mb-6 text-slate-300"><PackageMinus size={48} /></div>
             <h3 className="text-xl font-black text-slate-900 mb-2">No Active Pipeline</h3>
             <p className="text-slate-500 max-w-xs font-medium">Your wholesale order book is currently empty. Start by creating a new B2B contract.</p>
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-8 md:p-12 my-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Draft Order</h3>
                <p className="text-slate-500 font-medium">Add products to your wholesale cart.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
            </div>
            
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Entity</label>
                  <input value={clientName} onChange={e => setClientName(e.target.value)} placeholder="e.g. Blue Bottle Cafe" className="input-field text-lg" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Status</label>
                  <select 
                    value={orderStatus} 
                    onChange={e => setOrderStatus(e.target.value as any)}
                    className="input-field text-lg font-bold"
                  >
                    <option value="pending">Pending</option>
                    <option value="roasting">Roasting</option>
                    <option value="shipped">Shipped</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Selection</label>
                <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Coffee Variant</span>
                      <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="input-field bg-white">
                        <option value="">Select Stock...</option>
                        {(products as any[])?.map(p => <option key={p._id} value={p._id}>{p.productName} ({formatWeight(p.quantityLbs)})</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[9px] font-black text-slate-400 uppercase ml-1">Quantity ({unit})</span>
                      <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} placeholder="0.00" className="input-field bg-white" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
                    <div className="space-y-2">
                       <div className="flex justify-between items-center ml-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase">Unit Price ({unit})</span>
                          {selectedProduct && (
                             <button 
                               onClick={() => setManualPrice(suggestedPrice.toFixed(2))}
                               className="text-[8px] font-black text-amber-600 uppercase hover:text-amber-700 transition-colors"
                             >
                               Use Suggested
                             </button>
                          )}
                       </div>
                       <div className="relative">
                          <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="number" step="0.01" 
                            value={manualPrice} 
                            onChange={e => setManualPrice(e.target.value)} 
                            placeholder={suggestedPrice > 0 ? suggestedPrice.toFixed(2) : "0.00"} 
                            className="input-field bg-white pl-10" 
                          />
                       </div>
                    </div>
                    <button onClick={addToCart} className="btn-secondary h-[52px] w-full rounded-2xl font-black">Add to Cart</button>
                  </div>

                  {selectedProduct && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                       <div className="bg-amber-500 p-2 rounded-xl text-white"><Calculator size={14}/></div>
                       <div>
                          <div className="text-[10px] font-black text-amber-900 uppercase tracking-widest">Pricing Intelligence</div>
                          <div className="text-xs text-amber-700 font-medium">
                             Suggested: <span className="font-bold">{formatCurrency(suggestedPrice)}</span> based on your <span className="font-bold">{selectedProduct.targetMargin || settings?.defaultTargetMargin || 35}%</span> target margin.
                          </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {cart.length > 0 && (
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar border-t border-slate-50 pt-6">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-slate-50/50 p-4 rounded-2xl">
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900">{item.productName}</span>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.quantity} Units @ {formatCurrency(item.price)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                         <span className="font-black text-slate-900">{formatCurrency(item.quantity * item.price)}</span>
                         <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-slate-300 hover:text-red-500"><X size={16}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <button onClick={handleSubmitOrder} disabled={isProcessing || cart.length === 0} className="btn-primary w-full py-5 text-lg shadow-2xl">
                {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : (
                  <div className="flex items-center justify-center gap-3 italic">
                    Finalize Order 
                    <span className="bg-white/20 px-3 py-1 rounded-lg text-xs font-black not-italic">
                      {formatCurrency(cart.reduce((a, b) => a + (b.quantity * b.price), 0))}
                    </span>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {isEditModalOpen && editingOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Modify Order</h3>
                <p className="text-slate-500 font-medium">Updating {editingOrder.clientName}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
            </div>
            
            <div className="space-y-8">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Entity</label>
                <input 
                  value={editingOrder.clientName} 
                  onChange={e => setEditingOrder({...editingOrder, clientName: e.target.value})}
                  className="input-field text-lg font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Workflow Status</label>
                <select 
                  value={editingOrder.status} 
                  onChange={e => setEditingOrder({...editingOrder, status: e.target.value})}
                  className="input-field text-lg font-bold"
                >
                  <option value="pending">Pending</option>
                  <option value="roasting">Roasting</option>
                  <option value="shipped">Shipped</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Adjustment</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="number" 
                    step="0.01"
                    value={editingOrder.totalAmount} 
                    onChange={e => setEditingOrder({...editingOrder, totalAmount: parseFloat(e.target.value)})} 
                    className="input-field pl-12 text-2xl font-black" 
                  />
                </div>
              </div>
              
              <div className="flex gap-4">
                 <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1 py-4 font-black">Cancel</button>
                 <button onClick={handleUpdateOrder} disabled={isProcessing} className="btn-primary flex-1 py-4 font-black">
                   {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Save Changes"}
                 </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
