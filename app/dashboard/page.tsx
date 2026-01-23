"use client";

import React, { useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { DollarSign, Package, AlertTriangle, TrendingUp, Lightbulb } from "lucide-react";
import { useUnits } from "../../lib/units";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard, Card } from "../../components/ui/Card";

export default function DashboardPage() {
  const { formatCurrency } = useUnits();
  
  // Real-time data from Convex
  const inventory = useQuery(api.inventory.list);
  const orders = useQuery(api.orders.list);
  const roasts = useQuery(api.roasts.listLogs);

  // Computed Metrics
  const metrics = useMemo(() => {
    if (!inventory || !orders || !roasts) return { totalInventoryValue: 0, lowStockCount: 0, totalRevenue: 0, avgRoastMargin: 0 };

    const totalInventoryValue = inventory.reduce((acc, curr) => acc + (curr.quantityLbs * curr.costPerLb), 0);
    const lowStockCount = inventory.filter(i => i.quantityLbs < 10).length;
    const totalRevenue = orders.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0);
    
    // Calculate actual roast margins from roast logs
    // Margin = ((Wholesale Price - True Cost) / Wholesale Price) * 100
    const roastsWithMargins = roasts.filter(r => r.trueCostPerLb > 0).map(r => {
      // Assume average wholesale price of $12/lb (we'll improve this later with real pricing)
      const avgWholesalePrice = 12;
      const margin = ((avgWholesalePrice - r.trueCostPerLb) / avgWholesalePrice) * 100;
      return margin;
    });
    
    const avgRoastMargin = roastsWithMargins.length > 0 
      ? roastsWithMargins.reduce((a, b) => a + b, 0) / roastsWithMargins.length 
      : 0;
    
    return { totalInventoryValue, lowStockCount, totalRevenue, avgRoastMargin };
  }, [inventory, orders, roasts]);

  // Burn Down Analysis
  const burnDownData = useMemo(() => {
    if (!roasts || !inventory || roasts.length === 0 || inventory.length === 0) return [];
    
    // Calculate usage per batch in last 30 days
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

    return analysis.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5);
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

  const isLoading = inventory === undefined || orders === undefined || roasts === undefined;

  if (isLoading) {
      return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Loading Dashboard...</div>;
  }

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Executive Dashboard</h1>
        <p className="text-slate-500 font-medium">Real-time financial visibility & predictive analytics.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard label="Total Revenue" value={formatCurrency(metrics.totalRevenue)} icon={<DollarSign className="text-green-600" />} trend="Gross Sales" />
        <StatCard label="Inventory Assets" value={formatCurrency(metrics.totalInventoryValue)} icon={<Package className="text-blue-600" />} trend="Live Valuation" />
        <StatCard 
          label="Avg. Roast Margin" 
          value={metrics.avgRoastMargin > 0 ? `${metrics.avgRoastMargin.toFixed(1)}%` : "N/A"} 
          icon={<TrendingUp className="text-amber-600" />} 
          trend={metrics.avgRoastMargin >= 30 ? "Above Target" : "Target: 30%"} 
        />
        <StatCard label="Low Stock Alerts" value={metrics.lowStockCount.toString()} icon={<AlertTriangle className="text-red-600" />} alert={metrics.lowStockCount > 0} trend={metrics.lowStockCount > 0 ? "Action Required" : "Healthy"} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          <Card title="Revenue Trends" subtitle="Monthly Sales Performance" className="h-[400px] flex flex-col">
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}} />
                  <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                  <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 6, 6]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card title="Predictive Inventory" subtitle="Estimated Run-Out Dates">
             <div className="space-y-6">
                {burnDownData.length > 0 ? burnDownData.map((item) => (
                  <div key={item._id} className="space-y-2">
                     <div className="flex justify-between items-end">
                        <div>
                          <span className="font-bold text-slate-900">{item.origin}</span>
                          <span className="ml-2 text-xs font-medium text-slate-400 uppercase tracking-wider">{item.batchNumber}</span>
                        </div>
                        <div className={`text-sm font-black ${item.daysRemaining < 21 ? 'text-red-500' : 'text-slate-700'}`}>
                           {item.daysRemaining > 365 ? '> 1 Year' : `${Math.floor(item.daysRemaining)} Days Left`}
                        </div>
                     </div>
                     <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
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
          <div className="bg-slate-900 text-white p-10 rounded-[2rem] flex flex-col justify-between relative overflow-hidden group shadow-2xl min-h-[400px]">
            <div className="absolute -top-20 -right-20 w-60 h-60 bg-amber-500 rounded-full blur-[80px] opacity-20 group-hover:opacity-30 transition-opacity" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 text-amber-500 mb-8 font-black uppercase tracking-[0.2em] text-xs">
                <Lightbulb size={18} />
                Virtual CFO Insight
              </div>
              <h3 className="text-2xl font-bold leading-snug mb-4">
                {burnDownData.some(i => i.daysRemaining < 14) ? "Supply Chain Risk Detected." : "Cash flow is healthy."}
              </h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                {burnDownData.some(i => i.daysRemaining < 14) ? "Expedite shipping for critical beans." : "Consider locking in green coffee contracts to hedge."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
