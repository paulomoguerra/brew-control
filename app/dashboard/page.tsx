"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DollarSign, Package, AlertTriangle, TrendingUp, Lightbulb, X, ArrowRight, Activity, Calendar } from "lucide-react";
import { useUnits } from "../../lib/units";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { StatCard, Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";

type MetricType = 'revenue' | 'inventory' | 'margin' | 'low_stock' | null;

export default function DashboardPage() {
  const { formatCurrency, formatWeight, formatPrice } = useUnits();
  const [activeMetric, setActiveMetric] = useState<MetricType>(null);
  
  // Real-time data from Convex
  const inventory = useQuery(api.inventory.list);
  const orders = useQuery(api.orders.list);
  const roasts = useQuery(api.roasts.listLogs);
  const roastedInventory = useQuery(api.inventory.listRoasted);

  // Computed Metrics
  const metrics = useMemo(() => {
    if (!inventory || !orders || !roasts) return { totalInventoryValue: 0, lowStockCount: 0, totalRevenue: 0, avgRoastMargin: 0, totalWeight: 0 };

    const totalInventoryValue = inventory.reduce((acc, curr) => acc + (curr.quantityLbs * curr.costPerLb), 0);
    const lowStockCount = inventory.filter(i => i.quantityLbs < 10).length;
    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    const totalWeight = inventory.reduce((acc, curr) => acc + curr.quantityLbs, 0);
    
    const roastsWithMargins = roasts.filter(r => r.trueCostPerLb > 0).map(r => {
      // For dashboard we use a standard 50% retail margin estimate if wholesale not provided
      const estSalePrice = r.trueCostPerLb * 2; 
      return ((estSalePrice - r.trueCostPerLb) / estSalePrice) * 100;
    });
    
    const avgRoastMargin = roastsWithMargins.length > 0 
      ? roastsWithMargins.reduce((a, b) => a + b, 0) / roastsWithMargins.length 
      : 0;
    
    return { totalInventoryValue, lowStockCount, totalRevenue, avgRoastMargin, totalWeight };
  }, [inventory, orders, roasts]);

  // Burn Down Analysis
  const burnDownData = useMemo(() => {
    if (!roasts || !inventory || roasts.length === 0 || inventory.length === 0) return [];
    
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const recentRoasts = roasts.filter(r => r.roastDate >= thirtyDaysAgo);
    
    const usageMap = new Map<string, number>();
    recentRoasts.forEach(r => {
      usageMap.set(r.batchId, (usageMap.get(r.batchId) || 0) + r.greenWeightIn);
    });

    const analysis = inventory.map(item => {
      const usedLast30 = usageMap.get(item._id) || 0;
      const dailyUsage = usedLast30 / 30;
      const daysRemaining = dailyUsage > 0 ? item.quantityLbs / dailyUsage : 999;
      return { ...item, dailyUsage, daysRemaining };
    }).filter(i => i.dailyUsage > 0 || i.quantityLbs < 50);

    return analysis.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }, [inventory, roasts]);

  // Chart Data
  const chartData = useMemo(() => {
    if (!orders) return [];
    const monthlyData: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.orderDate) {
        const date = new Date(order.orderDate);
        const month = date.toLocaleString('default', { month: 'short' });
        monthlyData[month] = (monthlyData[month] || 0) + order.totalAmount;
      }
    });
    return Object.keys(monthlyData).map(key => ({ name: key, revenue: monthlyData[key] }));
  }, [orders]);

  const isLoading = inventory === undefined || orders === undefined || roasts === undefined || roastedInventory === undefined;

  // --- MODAL CONTENT COMPONENTS ---

  const RevenueBreakdown = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-slate-50 rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Total Gross Volume</span>
          <div className="text-3xl font-black text-slate-900">{formatCurrency(metrics.totalRevenue)}</div>
        </div>
        <div className="p-6 bg-slate-50 rounded-2xl">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Order Count</span>
          <div className="text-3xl font-black text-slate-900">{orders?.length || 0}</div>
        </div>
      </div>
      <div className="border border-slate-100 rounded-2xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-100">
            <tr>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Client</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
              <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px] text-right">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {orders?.slice(0, 10).map((o, i) => (
              <tr key={i} className="hover:bg-slate-50/50">
                <td className="px-6 py-4 font-bold text-slate-900">{o.clientName || "Direct Sale"}</td>
                <td className="px-6 py-4 text-slate-500">{new Date(o.orderDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 text-right font-black text-slate-900">{formatCurrency(o.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const InventoryBreakdown = () => {
    const roastedValue = roastedInventory?.reduce((acc, curr) => acc + (curr.quantityLbs * curr.costPerLb), 0) || 0;
    const pieData = [
      { name: 'Green Coffee', value: metrics.totalInventoryValue, color: '#0f172a' },
      { name: 'Roasted Stock', value: roastedValue, color: '#f59e0b' }
    ];

    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row items-center gap-8 bg-slate-50 p-6 rounded-[2rem]">
          <div className="h-48 w-48 shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5} dataKey="value">
                  {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4 flex-grow">
            {pieData.map((d, i) => (
              <div key={i} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="font-bold text-slate-700">{d.name}</span>
                </div>
                <span className="font-black text-slate-900">{formatCurrency(d.value)}</span>
              </div>
            ))}
            <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
               <span className="font-black text-slate-400 uppercase text-[10px] tracking-widest">Total Assets</span>
               <span className="text-2xl font-black text-slate-900">{formatCurrency(metrics.totalInventoryValue + roastedValue)}</span>
            </div>
          </div>
        </div>
        <div className="space-y-4">
           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Top Green Batches</h4>
           <div className="grid gap-3">
              {inventory?.slice(0, 4).map((b, i) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white border border-slate-100 rounded-xl">
                   <div>
                      <div className="font-bold text-slate-900">{b.origin}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{b.batchNumber}</div>
                   </div>
                   <div className="text-right">
                      <div className="font-black text-slate-900">{formatCurrency(b.quantityLbs * b.costPerLb)}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase">{formatWeight(b.quantityLbs)} left</div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  };

  const MarginBreakdown = () => (
    <div className="space-y-6">
      <div className="p-6 bg-amber-50 border border-amber-100 rounded-2xl flex items-center gap-4">
         <div className="bg-amber-500 p-3 rounded-xl text-white"><TrendingUp size={24}/></div>
         <div>
            <div className="text-sm font-bold text-amber-900">Portfolio Health</div>
            <p className="text-xs text-amber-700">Average gross margin is {metrics.avgRoastMargin.toFixed(1)}%. Target for specialty micro-roasters is typically 30-40%.</p>
         </div>
      </div>
      <div className="space-y-3">
         {roasts?.slice(0, 8).map((r, i) => (
           <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
              <div>
                 <div className="font-bold text-slate-900">{r.productName}</div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase">{new Date(r.roastDate).toLocaleDateString()}</div>
              </div>
              <div className="text-right">
                 <div className={`font-black ${r.shrinkagePercent > 18 ? 'text-red-600' : 'text-slate-900'}`}>
                    {(( (r.trueCostPerLb * 2) - r.trueCostPerLb ) / (r.trueCostPerLb * 2) * 100).toFixed(1)}%
                 </div>
                 <div className="text-[10px] text-slate-400 font-bold uppercase">Margin</div>
              </div>
           </div>
         ))}
      </div>
    </div>
  );

  const LowStockBreakdown = () => (
    <div className="space-y-6">
      <div className="space-y-4">
         {inventory?.filter(i => i.quantityLbs < 30).map((item, idx) => {
           const burndown = burnDownData.find(b => b._id === item._id);
           const daysRemaining = burndown?.daysRemaining || 0;
           
           return (
             <div key={idx} className="p-5 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex justify-between items-start">
                   <div>
                      <div className="font-black text-slate-900 text-lg">{item.origin}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.batchNumber}</div>
                   </div>
                   <div className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      {daysRemaining < 7 ? 'Critical' : 'Low Stock'}
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Current Stock</span>
                      <div className="font-black text-slate-900">{formatWeight(item.quantityLbs)}</div>
                   </div>
                   <div className="p-3 bg-slate-50 rounded-xl">
                      <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Days Left</span>
                      <div className={`font-black ${daysRemaining < 14 ? 'text-red-600' : 'text-amber-600'}`}>
                        {daysRemaining > 365 ? 'Stable' : Math.floor(daysRemaining)} Days
                      </div>
                   </div>
                </div>
             </div>
           )
         })}
      </div>
      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
         <ArrowRight size={16} /> Generate Reorder Sheet
      </button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="space-y-2">
          <Skeleton className="h-8 md:h-10 w-[200px] md:w-[300px]" />
          <Skeleton className="h-4 w-full max-w-[400px]" />
        </header>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 md:h-32 w-full rounded-[2rem]" />
          ))}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
          <Skeleton className="xl:col-span-2 h-[350px] md:h-[400px] rounded-[2rem]" />
          <Skeleton className="xl:col-span-1 h-[350px] md:h-[400px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500 relative">
      <header>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Executive Dashboard</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Real-time financial visibility & predictive analytics.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <StatCard 
          label="Total Revenue" 
          value={formatCurrency(metrics.totalRevenue)} 
          icon={<DollarSign className="text-green-600" />} 
          trend="Gross Sales" 
          onClick={() => setActiveMetric('revenue')}
        />
        <StatCard 
          label="Inventory Assets" 
          value={formatCurrency(metrics.totalInventoryValue)} 
          icon={<Package className="text-blue-600" />} 
          trend={formatWeight(metrics.totalWeight)} 
          onClick={() => setActiveMetric('inventory')}
        />
        <StatCard 
          label="Avg. Roast Margin" 
          value={metrics.avgRoastMargin > 0 ? `${metrics.avgRoastMargin.toFixed(1)}%` : "N/A"} 
          icon={<TrendingUp className="text-amber-600" />} 
          trend={metrics.avgRoastMargin >= 30 ? "Above Target" : "Target: 30%"} 
          onClick={() => setActiveMetric('margin')}
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={metrics.lowStockCount.toString()} 
          icon={<AlertTriangle className="text-red-600" />} 
          alert={metrics.lowStockCount > 0} 
          trend={metrics.lowStockCount > 0 ? "Action Required" : "Healthy"} 
          onClick={() => setActiveMetric('low_stock')}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 md:gap-8">
        <div className="xl:col-span-2 space-y-6 md:space-y-8">
          <Card title="Revenue Trends" subtitle="Monthly Sales Performance" className="h-[350px] md:h-[400px] flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 6, 6]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Predictive Inventory" subtitle="Estimated Run-Out Dates">
             <div className="space-y-5 md:space-y-6">
                {burnDownData.length > 0 ? burnDownData.slice(0, 5).map((item) => (
                   <div key={item._id} className="space-y-2">
                      <div className="flex justify-between items-end">
                         <div className="truncate pr-4">
                           <span className="font-bold text-slate-900 block md:inline">{item.origin}</span>
                           <span className="md:ml-2 text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.batchNumber}</span>
                         </div>
                         <div className={`text-xs md:text-sm font-black whitespace-nowrap ${item.daysRemaining < 21 ? 'text-red-500' : 'text-slate-700'}`}>
                            {item.daysRemaining > 365 ? '> 1 Year' : `${Math.floor(item.daysRemaining)} Days Left`}
                         </div>
                      </div>
                      <div className="h-2.5 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                         <div 
                           className={`h-full rounded-full transition-all duration-1000 ${item.daysRemaining < 14 ? 'bg-red-500' : item.daysRemaining < 30 ? 'bg-amber-400' : 'bg-green-500'}`}
                           style={{ width: `${Math.min((item.daysRemaining / 60) * 100, 100)}%` }}
                         />
                      </div>
                   </div>
                )) : (
                   <div className="p-8 text-center text-slate-400 text-sm italic">Not enough roast history to predict usage yet.</div>
                )}
             </div>
          </Card>
        </div>

        <div className="xl:col-span-1 space-y-6">
          <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group shadow-2xl min-h-[300px] md:min-h-[400px]">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-amber-500 mb-6 md:mb-8 font-black uppercase tracking-[0.2em] text-[10px]">
                <Lightbulb size={18} />
                Virtual CFO Insight
              </div>
              <h3 className="text-xl md:text-2xl font-bold leading-snug mb-4">
                {burnDownData.some(i => i.daysRemaining < 14) ? "Supply Chain Risk Detected." : "Cash flow is healthy."}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {burnDownData.some(i => i.daysRemaining < 14) ? "Expedite shipping for critical beans." : "Consider locking in green coffee contracts to hedge."}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* METRIC BREAKDOWN MODAL */}
      {activeMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-6 md:p-10 my-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
             <button 
               onClick={() => setActiveMetric(null)}
               className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
             >
                <X size={20} />
             </button>
             
             <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                   <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                      {activeMetric === 'revenue' && <DollarSign size={20} />}
                      {activeMetric === 'inventory' && <Package size={20} />}
                      {activeMetric === 'margin' && <TrendingUp size={20} />}
                      {activeMetric === 'low_stock' && <AlertTriangle size={20} />}
                   </div>
                   <h2 className="text-2xl font-black text-slate-900 capitalize">
                      {activeMetric.replace('_', ' ')} Analysis
                   </h2>
                </div>
                <p className="text-slate-500 font-medium ml-1">Detailed business intelligence for your roastery.</p>
             </div>

             <div className="max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {activeMetric === 'revenue' && <RevenueBreakdown />}
                {activeMetric === 'inventory' && <InventoryBreakdown />}
                {activeMetric === 'margin' && <MarginBreakdown />}
                {activeMetric === 'low_stock' && <LowStockBreakdown />}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
