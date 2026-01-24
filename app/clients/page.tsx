"use client";

import React, { useMemo } from 'react';
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Users, 
  TrendingUp, 
  Calendar, 
  Package, 
  Zap, 
  ArrowUpRight, 
  Search, 
  Filter,
  CreditCard,
  History,
  AlertCircle
} from 'lucide-react';
import { useUnits } from '../../lib/units';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export default function ClientsPage() {
  const { formatCurrency, t, unit } = useUnits();
  const clients = useQuery(api.clients.list);
  const orders = useQuery(api.orders.list);

  const clientMetrics = useMemo(() => {
    if (!clients || !orders) return [];

    return clients.map(client => {
      const clientOrders = (orders as any[]).filter(o => o.clientId === client._id);
      const totalSpent = clientOrders.reduce((acc, curr) => acc + curr.totalAmount, 0);
      const lastOrder = clientOrders.sort((a, b) => b.orderDate - a.orderDate)[0];
      
      // Advanced Prediction Logic based on Consumption Frequency & Volume
      let predictedDaysRemaining = 0;
      let avgDailyConsumption = 0;
      
      if (clientOrders.length >= 2) {
        const sorted = [...clientOrders].sort((a, b) => a.orderDate - b.orderDate);
        
        // 1. Calculate total weight purchased (excluding the very first order to get a rate of use)
        // We measure the consumption between Order A and Order B
        const totalWeightExcludingLast = sorted.slice(0, -1).reduce((acc, order) => {
          const weight = (order.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
          return acc + weight;
        }, 0);

        const firstDate = sorted[0].orderDate;
        const lastDate = sorted[sorted.length - 1].orderDate;
        const totalDays = (lastDate - firstDate) / (1000 * 60 * 60 * 24);

        if (totalDays > 0) {
          avgDailyConsumption = totalWeightExcludingLast / totalDays;
        }

        // 2. Estimate how long the LATEST order will last
        const lastOrderWeight = (lastOrder.items || []).reduce((sum: number, item: any) => sum + item.quantity, 0);
        
        if (avgDailyConsumption > 0) {
          const daysSinceLast = (Date.now() - lastOrder.orderDate) / (1000 * 60 * 60 * 24);
          const estimatedTotalDuration = lastOrderWeight / avgDailyConsumption;
          predictedDaysRemaining = Math.max(0, estimatedTotalDuration - daysSinceLast);
        }
      }

      return {
        ...client,
        totalSpent,
        orderCount: clientOrders.length,
        lastOrderDate: lastOrder?.orderDate,
        avgDailyConsumption,
        predictedDaysRemaining,
        health: predictedDaysRemaining < 3 ? 'critical' : predictedDaysRemaining < 7 ? 'warning' : 'stable'
      };
    });
  }, [clients, orders]);

  if (clients === undefined || orders === undefined) {
    return (
      <div className="p-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-[2.5rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 text-purple-600 mb-2 font-black uppercase tracking-[0.2em] text-[10px]">
            <Zap size={14} /> Pro Feature
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Client Intelligence</h1>
          <p className="text-slate-500 font-medium">Predictive CRM & Wholesale Performance tracking.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl">
            <Users size={16} /> Register Client
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          label="Total Active Clients" 
          value={clients.length.toString()} 
          icon={<Users className="text-purple-600" />} 
          trend="Registered Wholesale" 
        />
        <StatCard 
          label="Average Lifetime Value" 
          value={formatCurrency(clientMetrics.reduce((a, b) => a + b.totalSpent, 0) / (clients.length || 1))} 
          icon={<CreditCard className="text-emerald-600" />} 
          trend="Per Client" 
        />
        <StatCard 
          label="Predicted Restocks" 
          value={clientMetrics.filter(c => c.health === 'critical').length.toString()} 
          icon={<AlertCircle className="text-amber-600" />} 
          alert={clientMetrics.some(c => c.health === 'critical')}
          trend="Immediate Action" 
        />
      </div>

      <Card title="Wholesale Portfolio" subtitle="Purchase behavior & stock predictions">
        <div className="overflow-x-auto -mx-6">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Plan</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Consumption</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Revenue</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Order</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Health</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {clientMetrics.map((client) => (
                <tr key={client._id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-black text-slate-400 uppercase">
                        {client.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-black text-slate-900 leading-none">{client.name}</div>
                        <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-tighter">{client.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase whitespace-nowrap">
                      {client.pricingTier}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-bold text-slate-900">{client.avgDailyConsumption.toFixed(2)} {unit}/day</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">Burn Rate</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="font-black text-slate-900">{formatCurrency(client.totalSpent)}</div>
                    <div className="text-[9px] text-slate-400 font-bold uppercase">{client.orderCount} Orders</div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="text-sm font-bold text-slate-700">
                      {client.lastOrderDate ? new Date(client.lastOrderDate).toLocaleDateString() : 'Never'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">
                      {client.lastOrderDate ? `${Math.floor((Date.now() - client.lastOrderDate) / (1000 * 60 * 60 * 24))} days ago` : 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${
                            client.health === 'critical' ? 'bg-red-500' : client.health === 'warning' ? 'bg-amber-400' : 'bg-emerald-500'
                          }`} 
                          style={{ width: `${Math.max(10, Math.min(100, (client.predictedDaysRemaining / 14) * 100))}%` }} 
                        />
                      </div>
                      <span className={`text-[10px] font-black uppercase whitespace-nowrap ${
                        client.health === 'critical' ? 'text-red-600' : client.health === 'warning' ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {client.predictedDaysRemaining === 0 ? 'Out of Stock' : `${Math.floor(client.predictedDaysRemaining)}d Left`}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <button className="p-3 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 hover:border-slate-900 transition-all shadow-sm">
                      <ArrowUpRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Actionable Suggestions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card title="Sales Intelligence" subtitle="AI-Generated Opportunities">
           <div className="space-y-4">
              {clientMetrics.filter(c => c.health !== 'stable').slice(0, 3).map((client, i) => (
                <div key={i} className="p-5 border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                      <Zap size={20}/>
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500 font-medium italic">Stock low. Suggest the new Ethiopian Washed?</div>
                    </div>
                  </div>
                  <button className="bg-slate-900 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">Pitch</button>
                </div>
              ))}
           </div>
        </Card>

        <Card title="Client Retention" subtitle="Risk Assessment">
           <div className="space-y-4">
              {clientMetrics.filter(c => c.lastOrderDate && (Date.now() - c.lastOrderDate) > (1000 * 60 * 60 * 24 * 30)).slice(0, 3).map((client, i) => (
                <div key={i} className="p-5 border border-slate-100 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 rounded-xl text-red-600">
                      <History size={20}/>
                    </div>
                    <div>
                      <div className="font-black text-slate-900">{client.name}</div>
                      <div className="text-xs text-slate-500 font-medium">Inactive for 30+ days. Send retention discount?</div>
                    </div>
                  </div>
                  <button className="bg-red-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-red-700 transition-all">Rescue</button>
                </div>
              ))}
              {clientMetrics.filter(c => c.lastOrderDate && (Date.now() - c.lastOrderDate) > (1000 * 60 * 60 * 24 * 30)).length === 0 && (
                <div className="py-10 text-center text-slate-300 italic font-medium">No clients currently at risk.</div>
              )}
           </div>
        </Card>
      </div>
    </div>
  );
}
