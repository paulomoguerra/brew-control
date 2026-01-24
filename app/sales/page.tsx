"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, X, PackageMinus, Trash2, Edit3, DollarSign, Calendar, ShoppingBag, ArrowUpRight, TrendingUp, Calculator, TrendingDown, Clock, ChevronDown, LayoutGrid, Kanban, ListFilter, Share2, ExternalLink } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Id } from '../../convex/_generated/dataModel';

export default function SalesPage() {
  const { unit, formatCurrency, formatWeight } = useUnits();
  const { showToast } = useToast();
  
  // View State
  const [viewMode, setViewMode] = useState<'board' | 'list' | 'analytics'>('board');
  const [activeChannel, setActiveChannel] = useState<'all' | 'wholesale' | 'shopify' | 'sumup'>('all');
  
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
  
  const [editingOrderId, setEditingOrderId] = useState<Id<"orders"> | null>(null);

  // Statistics
  const stats = useMemo(() => {
    if (!orders) return { totalRevenue: 0, activeCount: 0, avgValue: 0 };
    const filtered = activeChannel === 'all' ? orders : orders.filter(o => o.sourceSystem === activeChannel);
    const totalRevenue = filtered.reduce((acc, curr) => acc + curr.totalAmount, 0);
    const activeCount = filtered.filter(o => o.status !== 'paid').length;
    const avgValue = filtered.length > 0 ? totalRevenue / filtered.length : 0;
    return { totalRevenue, activeCount, avgValue };
  }, [orders, activeChannel]);

  const currentEditingOrder = useMemo(() => {
    if (!editingOrderId || !orders) return null;
    return orders.find(o => o._id === editingOrderId);
  }, [editingOrderId, orders]);

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

  const handleUpdateOrder = async (updatedOrder: any) => {
    if (!updatedOrder) return;
    setIsProcessing(true);
    try {
      await updateOrder({
        id: updatedOrder._id,
        status: updatedOrder.status,
        totalAmount: updatedOrder.totalAmount,
        clientName: updatedOrder.clientName
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
    if (!confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteOrder({ id });
      showToast('Order deleted', 'success');
    } catch (err) {
      showToast('Error deleting order', 'error');
    }
  };

  const renderStatusHistory = (order: any, isCompact = false) => {
    const history = order.statusHistory || [];
    if (history.length === 0) {
      return (
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
          <div className="w-2 h-2 rounded-full bg-slate-200" />
          <span className="uppercase tracking-tighter w-20">Created</span>
          {!isCompact && <span className="text-slate-300 font-medium">@ {new Date(order.orderDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' } as any)}</span>}
        </div>
      );
    }

    const displayHistory = isCompact ? history.slice(-2) : history;

    return (
      <div className="space-y-2">
        {displayHistory.map((entry: any, i: number) => (
          <div key={i} className={`flex items-center gap-3 font-bold ${isCompact ? 'text-[10px]' : 'text-[11px]'} text-slate-500`}>
            <div className={`w-2 h-2 rounded-full ${i === displayHistory.length - 1 ? 'bg-amber-500' : 'bg-slate-200'}`} />
            <span className="uppercase tracking-tighter w-20">{entry.status}</span>
            <span className="text-slate-300 font-medium">@ {new Date(entry.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' } as any)}</span>
          </div>
        ))}
      </div>
    );
  };

  const renderOrderCard = (order: any, isBoard = false) => (
    <div 
      key={order._id} 
      onClick={() => { setEditingOrderId(order._id); setIsEditModalOpen(true); }}
      className={`${isBoard ? 'p-5 md:p-6' : 'p-6 md:p-8'} bg-white rounded-[2rem] border border-slate-200 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden cursor-pointer active:scale-[0.98]`}
    >
      <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity pointer-events-none">
         <ShoppingBag size={isBoard ? 100 : 120} />
      </div>
      
      <div className="relative z-10">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`${isBoard ? 'text-lg' : 'text-xl'} font-black text-slate-900 tracking-tight leading-tight`}>{order.clientName}</h3>
            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
              <Calendar size={10} /> {new Date(order.orderDate).toLocaleDateString()}
            </div>
          </div>
          <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
             <button onClick={(e) => { e.stopPropagation(); setEditingOrderId(order._id); setIsEditModalOpen(true); }} className="p-2 bg-slate-50 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"><Edit3 size={14} /></button>
             <button onClick={(e) => { e.stopPropagation(); handleDeleteOrder(order._id); }} className="p-2 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-6">
           <div className="relative group/status">
              <select 
                 value={order.status} 
                 onClick={(e) => e.stopPropagation()}
                 onChange={(e) => updateOrder({ id: order._id, status: e.target.value as any })}
                 className="appearance-none pl-3 pr-8 py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer outline-none border-none hover:bg-slate-800 transition-all shadow-md"
              >
                 <option value="pending">Pending</option>
                 <option value="roasting">Roasting</option>
                 <option value="shipped">Shipped</option>
                 <option value="paid">Paid</option>
              </select>
              <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500 group-hover/status:text-white transition-colors">
                 <ChevronDown size={12} />
              </div>
           </div>
           <div className="flex items-baseline gap-2">
              <div className={`${isBoard ? 'text-xl' : 'text-2xl'} font-black text-slate-900`}>
                 {formatCurrency(order.totalAmount)}
              </div>
              <div className="px-1.5 py-0.5 bg-slate-100 rounded text-[7px] font-black uppercase text-slate-400">
                {order.sourceSystem || 'Wholesale'}
              </div>
           </div>
        </div>

        {/* Status History Log */}
        <div className="mb-6">
           <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-2 flex items-center gap-1.5 opacity-60">
              <Clock size={10}/> {isBoard ? 'Timeline' : 'Audit Log'}
           </span>
           <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100/50">
             {renderStatusHistory(order, true)}
           </div>
        </div>

        {!isBoard && order.items && order.items.length > 0 && (
          <div className="space-y-2 pt-4 border-t border-slate-50">
             <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block opacity-60">Manifesto</span>
             {order.items.slice(0, 3).map((item: any, idx: number) => (
               <div key={idx} className="flex justify-between items-center text-xs font-bold text-slate-600">
                  <span className="truncate pr-4">{item.quantity}x {item.productName}</span>
                  <span className="text-slate-400 flex-shrink-0">{formatCurrency((item.priceAtTime || item.price) * item.quantity)}</span>
               </div>
             ))}
             {order.items.length > 3 && (
               <div className="text-[8px] font-black text-slate-400 uppercase text-center pt-1">+{order.items.length - 3} more items</div>
             )}
          </div>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <Skeleton className="h-10 w-[300px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2rem]" />
      </div>
    );
  }

  const filteredOrders = orders?.filter(o => activeChannel === 'all' || o.sourceSystem === activeChannel);

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-500 p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Sales Hub</h1>
          <p className="text-slate-500 font-medium">Multi-channel distribution & revenue orchestration.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-[1.5rem]">
            <button onClick={() => setViewMode('board')} className={`p-3 rounded-xl transition-all ${viewMode === 'board' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><Kanban size={22}/></button>
            <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={22}/></button>
          </div>
          <div className="h-10 w-px bg-slate-200 mx-3 hidden sm:block" />
          <button onClick={() => setIsModalOpen(true)} className="btn-primary px-10 py-5 flex items-center justify-center gap-3 flex-1 sm:flex-none shadow-xl hover:scale-105 transition-transform text-base font-black uppercase tracking-widest">
            <Plus size={24} /> New Contract
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto pb-4 no-scrollbar border-b border-slate-100 px-2 pt-2">
         {[
           { id: 'all', label: 'All Channels', icon: <Share2 size={14}/> },
           { id: 'wholesale', label: 'Wholesale', icon: <PackageMinus size={14}/> },
           { id: 'shopify', label: 'Shopify', icon: <ExternalLink size={14}/> },
           { id: 'sumup', label: 'SumUp', icon: <DollarSign size={14}/> },
         ].map(tab => (
           <button 
             key={tab.id}
             onClick={() => setActiveChannel(tab.id as any)}
             className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${activeChannel === tab.id ? 'bg-slate-900 text-white border-slate-900 shadow-md' : 'bg-white border-slate-100 text-slate-400 hover:border-slate-300'}`}
           >
             {tab.icon} {tab.label}
           </button>
         ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        <StatCard label="Total Revenue" value={formatCurrency(stats.totalRevenue)} icon={<DollarSign className="text-green-600" />} trend={<div className="flex items-center gap-1 text-green-600 font-black"><TrendingUp size={14}/> {activeChannel.toUpperCase()}</div>} />
        <StatCard label="Active Orders" value={stats.activeCount.toString()} icon={<ShoppingBag className="text-blue-600" />} trend="Current Pipeline" />
        <StatCard label="Avg. Order Value" value={formatCurrency(stats.avgValue)} icon={<ArrowUpRight className="text-amber-600" />} trend="Economic Health" />
      </div>

      <div className="min-h-[600px] mt-10">
        {viewMode === 'board' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 items-start">
            {['pending', 'roasting', 'shipped', 'paid'].map((status) => (
              <div key={status} className="space-y-6">
                <div className="flex items-center justify-between px-6">
                  <h4 className="text-[12px] font-black text-slate-400 uppercase tracking-[0.25em]">{status}</h4>
                  <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-[10px] font-black shadow-md">
                    {filteredOrders?.filter(o => o.status === status).length || 0}
                  </span>
                </div>
                <div className="space-y-6">
                  {filteredOrders?.filter(o => o.status === status).map((order) => renderOrderCard(order, true))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {filteredOrders?.map((order) => renderOrderCard(order, false))}
          </div>
        )}
      </div>

      {/* CREATE MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xl overflow-y-auto">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-10 md:p-14 my-auto shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-10">
              <div><h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Draft Order</h3></div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X size={24} /></button>
            </div>
            <div className="space-y-10">
               <div className="space-y-3">
                 <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Client Business Name</label>
                 <input value={clientName} onChange={e => setClientName(e.target.value)} className="input-field py-5 text-lg" placeholder="Enter client name..." />
               </div>
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                 <div className="space-y-3">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Variant</span>
                   <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="input-field py-5">
                     <option value="">Select roasted stock...</option>
                     {products?.map(p => <option key={p._id} value={p._id}>{p.productName} ({formatWeight(p.quantityLbs)})</option>)}
                   </select>
                 </div>
                 <div className="space-y-3">
                   <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity ({unit})</span>
                   <input type="number" value={quantity || ''} onChange={e => setQuantity(Number(e.target.value))} className="input-field py-5" placeholder="0.00" />
                 </div>
               </div>
               <button onClick={addToCart} className="w-full py-5 border-2 border-dashed border-slate-200 rounded-[2rem] text-[11px] font-black uppercase tracking-widest hover:bg-slate-50 hover:border-amber-500 transition-all">Add Line Item</button>
               {cart.length > 0 && (
                 <div className="space-y-3 bg-slate-50 p-6 rounded-[2rem]">
                   {cart.map((item, i) => (
                     <div key={i} className="flex justify-between items-center p-3 bg-white rounded-2xl text-sm font-black text-slate-700 shadow-sm">
                        <span>{item.productName}</span>
                        <span>{item.quantity}{unit} x {formatCurrency(item.price)}</span>
                     </div>
                   ))}
                 </div>
               )}
               <button onClick={handleSubmitOrder} disabled={isProcessing || cart.length === 0} className="btn-primary w-full py-6 text-xl font-black uppercase tracking-widest shadow-2xl">
                 {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : `Finalize ${formatCurrency(cart.reduce((a, b) => a + (b.quantity * b.price), 0))}`}
               </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/DETAIL MODAL */}
      {isEditModalOpen && currentEditingOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-2xl overflow-y-auto">
          <div className="bg-white rounded-[3.5rem] w-full max-w-5xl p-10 md:p-16 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">Order Dossier</h3>
                <p className="text-slate-500 font-bold text-lg">System ID: {currentEditingOrder._id.slice(-8).toUpperCase()}</p>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-5 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors shadow-sm"><X size={28} /></button>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
              <div className="space-y-10">
                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Client Identity</label>
                  <input 
                    defaultValue={currentEditingOrder.clientName} 
                    id="edit-client-name"
                    className="input-field text-xl font-black py-6"
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Workflow Status</label>
                  <select 
                    defaultValue={currentEditingOrder.status} 
                    id="edit-status"
                    className="input-field text-xl font-black py-6 appearance-none"
                  >
                    <option value="pending">Pending</option>
                    <option value="roasting">Roasting</option>
                    <option value="shipped">Shipped</option>
                    <option value="paid">Paid</option>
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Financial Total</label>
                  <div className="relative">
                    <DollarSign className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={28} />
                    <input 
                      type="number" 
                      step="0.01"
                      defaultValue={currentEditingOrder.totalAmount} 
                      id="edit-total-amount"
                      className="input-field pl-16 text-4xl font-black py-8" 
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                <div>
                   <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] block mb-6 flex items-center gap-3">
                      <Clock size={20} className="text-amber-500"/> Full Transaction Log
                   </span>
                   <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-slate-100 max-h-[400px] overflow-y-auto custom-scrollbar shadow-inner">
                      {renderStatusHistory(currentEditingOrder, false)}
                   </div>
                </div>

                {currentEditingOrder.items && (
                  <div>
                    <span className="text-[12px] font-black text-slate-900 uppercase tracking-[0.2em] block mb-6">Line Item Manifesto</span>
                    <div className="space-y-3">
                      {currentEditingOrder.items.map((item: any, i: number) => (
                        <div key={i} className="flex justify-between items-center text-lg font-black text-slate-700 bg-white border border-slate-100 px-6 py-5 rounded-[1.5rem] shadow-sm">
                          <span>{item.quantity}x {item.productName}</span>
                          <span className="text-amber-600">{formatCurrency((item.priceAtTime || item.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-6 mt-16 pt-10 border-t-2 border-slate-50">
               <button onClick={() => setIsEditModalOpen(false)} className="btn-secondary flex-1 py-6 font-black rounded-[2rem] text-lg uppercase tracking-widest">Discard</button>
               <button 
                 onClick={() => {
                   const clientName = (document.getElementById('edit-client-name') as HTMLInputElement).value;
                   const status = (document.getElementById('edit-status') as HTMLSelectElement).value;
                   const totalAmount = parseFloat((document.getElementById('edit-total-amount') as HTMLInputElement).value);
                   handleUpdateOrder({ _id: editingOrderId, clientName, status, totalAmount });
                 }} 
                 disabled={isProcessing} 
                 className="btn-primary flex-1 py-6 font-black rounded-[2rem] text-lg uppercase tracking-widest shadow-2xl"
               >
                 {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : "Commit Changes"}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
