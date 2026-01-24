"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Coffee, DollarSign, Package, ChefHat, Info, X, Calculator, TrendingUp, Settings, Activity, ArrowRight, Wallet, Target, Coins, Lightbulb, Database, Clock, Truck, CheckCircle, Flame } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { useToast } from '../../components/ui/Toast';

type CafeMetricType = 'profit' | 'goal' | 'burden' | 'expenses' | null;

export default function CafePage() {
  const { formatCurrency, formatWeight, formatPrice } = useUnits();
  const { showToast } = useToast();
  
  // --- DATA ---
  const now = useMemo(() => Date.now(), []);
  const summary = useQuery(api.cafe.getFinancialSummary, { now });
  const settings = useQuery(api.cafe.getSettings);
  const expenses = useQuery(api.cafe.listExpenses);
  const income = useQuery(api.cafe.listIncome, { now });
  const ingredients = useQuery(api.cafe.listIngredients);
  const menuItems = useQuery(api.cafe.listMenuItems);
  const roastedStock = useQuery(api.inventory.listRoasted);

  const addIncome = useMutation(api.cafe.addDailyIncome);
  const updateSettings = useMutation(api.cafe.updateSettings);
  const addExpense = useMutation(api.cafe.addExpense);
  const deleteExpense = useMutation(api.cafe.deleteExpense);
  const updateRoastedMargin = useMutation(api.inventory.updateRoastedMargin);

  // --- UI STATE ---
  const [activeMetric, setActiveMetric] = useState<CafeMetricType>(null);
  const [isAddingIncome, setIsAddingIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);

  const isLoading = summary === undefined || settings === undefined || expenses === undefined || menuItems === undefined;

  // --- CALCULATIONS ---
  const netProfit = (summary?.totalIncome || 0) - (summary?.monthlyOverhead || 0);
  const goalProgress = (summary && summary.revenueGoal > 0) ? (summary.totalIncome / summary.revenueGoal) * 100 : 0;

  // Contribution Data
  const contributionData = useMemo(() => {
    if (!menuItems) return [];
    return menuItems.map((i: any) => ({
      name: i.name,
      margin: i.analysis.margin,
      pct: i.analysis.marginPercent,
      contribution: i.analysis.margin * 100 
    })).sort((a: any, b: any) => b.margin - a.margin);
  }, [menuItems]);

  // --- HANDLERS ---
  const handleAddIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addIncome({ amount: parseFloat(incomeAmount) });
      showToast('Daily income recorded', 'success');
      setIsAddingIncome(false);
      setIncomeAmount('');
    } catch (err) { showToast('Error saving income', 'error'); }
  };

  const handleUpdateMargin = async (id: any, val: number) => {
    try {
       await updateRoastedMargin({ id, targetMargin: val });
    } catch (err) { showToast('Error updating margin', 'error'); }
  };

  if (isLoading) return <div className="p-4 md:p-8 space-y-8"><Skeleton className="h-[600px] w-full rounded-[2.5rem]" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Cafe Command Center</h1>
          <p className="text-slate-500 font-medium">Real-time retail profitability & overhead management.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <button onClick={() => setIsAddingIncome(true)} className="flex-1 md:flex-none btn-primary px-6 py-4 flex items-center justify-center gap-2 shadow-xl">
              <Plus size={18} /> Record Sales
           </button>
           <button onClick={() => setIsConfiguring(true)} className="flex-1 md:flex-none bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm">
              <Settings size={18} className="text-slate-400" /> Configure Economics
           </button>
        </div>
      </header>

      {/* Primary Scorecard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 md:gap-6">
         <StatCard 
            label="Est. Net Profit" 
            value={formatCurrency(netProfit)} 
            icon={<Wallet className="text-green-600" />} 
            trend={netProfit > 0 ? "Profitable" : "Under Water"}
            alert={netProfit < 0}
            onClick={() => setActiveMetric('profit')}
         />
         <StatCard 
            label="Revenue vs Goal" 
            value={`${goalProgress.toFixed(1)}%`} 
            icon={<Target className="text-blue-600" />} 
            trend={formatCurrency(summary.totalIncome)}
            onClick={() => setActiveMetric('goal')}
         />
         <StatCard 
            label="Operating Burden" 
            value={formatPrice(summary.burdenPerKg)} 
            icon={<Activity className="text-amber-600" />} 
            trend={summary.isBurdenEnabled ? "ACTIVE" : "DISABLED"}
            alert={!summary.isBurdenEnabled}
            onClick={() => setActiveMetric('burden')}
         />
         <StatCard 
            label="Monthly Overhead" 
            value={formatCurrency(summary.monthlyOverhead)} 
            icon={<Coins className="text-slate-600" />} 
            trend={`$${summary.burnRatePerDay.toFixed(0)} /day`}
            onClick={() => setActiveMetric('expenses')}
         />
         <StatCard 
            label="Green Assets" 
            value={formatWeight(summary.totalGreenWeight || 0)} 
            icon={<Database className="text-emerald-600" />} 
            trend="Raw Material"
         />
         <StatCard 
            label="Roasted Stock" 
            value={formatWeight(summary.totalRoastedWeight || 0)} 
            icon={<Package className="text-orange-600" />} 
            trend="Finished Goods"
         />
      </div>

      {/* Order Status Pipeline */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
         <StatCard 
            label="Pending Orders" 
            value={summary.statusCounts?.pending.toString() || "0"} 
            icon={<Clock className="text-slate-400" />} 
            trend="Waiting"
         />
         <StatCard 
            label="Roasting" 
            value={summary.statusCounts?.roasting.toString() || "0"} 
            icon={<Flame className="text-amber-500" />} 
            trend="In Oven"
         />
         <StatCard 
            label="Shipped" 
            value={summary.statusCounts?.shipped.toString() || "0"} 
            icon={<Truck className="text-blue-500" />} 
            trend="In Transit"
         />
         <StatCard 
            label="Paid" 
            value={summary.statusCounts?.paid.toString() || "0"} 
            icon={<CheckCircle className="text-green-600" />} 
            trend="Completed"
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         <div className="lg:col-span-2 space-y-8">
            {/* Coffee Portfolio Manager */}
            <Card title="Coffee Portfolio" subtitle="Manage specific margins for your beans">
               <div className="overflow-x-auto -mx-6 md:mx-0">
                  <table className="w-full text-left min-w-[500px]">
                     <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Bean</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Base Cost</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Target Margin</th>
                           <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Target Price</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {roastedStock?.filter((b: any) => b.quantityLbs > 0).map((bean: any) => {
                           const currentMargin = bean.targetMargin || settings?.defaultTargetMargin || 75;
                           const targetPrice = bean.costPerLb / (1 - (currentMargin / 100));
                           return (
                             <tr key={bean._id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-5">
                                   <div className="font-bold text-slate-900">{bean.productName}</div>
                                   <div className="text-[10px] text-slate-400 font-black uppercase">{formatWeight(bean.quantityLbs)} in stock</div>
                                </td>
                                <td className="px-6 py-5 text-center font-bold text-slate-600">{formatPrice(bean.costPerLb)}</td>
                                <td className="px-6 py-5">
                                   <div className="flex flex-col items-center gap-2">
                                      <span className="text-xs font-black text-amber-600">{currentMargin}%</span>
                                      <input 
                                        type="range" min="30" max="95" step="5" 
                                        value={currentMargin} 
                                        onChange={(e) => handleUpdateMargin(bean._id, parseInt(e.target.value))}
                                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" 
                                      />
                                   </div>
                                </td>
                                <td className="px-6 py-5 text-right font-black text-slate-900">{formatPrice(targetPrice)}</td>
                             </tr>
                           )
                        })}
                     </tbody>
                  </table>
               </div>
            </Card>

            <Card title="Profit Performance" subtitle="Ranking drinks by margin contribution">
               <div className="h-64 mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                     <BarChart data={contributionData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize: 10, fontWeight: 800, fill: '#64748b'}} axisLine={false} tickLine={false} />
                        <ReTooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                        <Bar dataKey="margin" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={24} />
                     </BarChart>
                  </ResponsiveContainer>
               </div>
            </Card>
         </div>

         <div className="space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group">
               <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-[60px] opacity-20 group-hover:opacity-30 transition-all" />
               <div className="relative z-10 space-y-6">
                  <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em]">
                     <Lightbulb size={16} /> Strategy Guide
                  </div>
                  <h3 className="text-xl font-bold leading-snug">
                     {summary.isBurdenEnabled ? "Overhead is covered." : "Switch to Net Margin Mode."}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed">
                     Your current operating burden is <strong>{formatPrice(summary.burdenPerKg)} per kg</strong>. Adjust your coffee prices to reflect this reality.
                  </p>
                  <button 
                    onClick={() => updateSettings({ ...settings, isBurdenEnabled: !summary.isBurdenEnabled } as any)}
                    className={`w-full py-3 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${summary.isBurdenEnabled ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-slate-300'}`}
                  >
                     {summary.isBurdenEnabled ? "Disable System Burden" : "Enable System Burden"}
                  </button>
               </div>
            </div>

            <Card title="Quick Ledger" subtitle="Reporting daily sales">
               <div className="space-y-4">
                  <div className="p-4 bg-slate-50 rounded-2xl text-center">
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Today's Income</span>
                     <div className="text-3xl font-black text-slate-900">{formatCurrency(summary.totalIncome / 30)}</div>
                  </div>
                  <button onClick={() => setIsAddingIncome(true)} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all">
                     Log Daily Total
                  </button>
               </div>
            </Card>
         </div>
      </div>

      {/* --- MODALS --- */}

      {isAddingIncome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
           <Card className="w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200" title="Daily POS Total" subtitle="Enter total sales for the business day">
              <form onSubmit={handleAddIncome} className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Total Amount ({summary.isBurdenEnabled ? 'Net' : 'Gross'})</label>
                    <div className="relative">
                       <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                       <input autoFocus required type="number" step="0.01" value={incomeAmount} onChange={e => setIncomeAmount(e.target.value)} className="input-field pl-12 text-2xl font-black" placeholder="0.00" />
                    </div>
                 </div>
                 <div className="flex gap-3">
                    <button type="button" onClick={() => setIsAddingIncome(false)} className="btn-secondary flex-1">Cancel</button>
                    <button type="submit" className="btn-primary flex-1">Confirm Entry</button>
                 </div>
              </form>
           </Card>
        </div>
      )}

      {activeMetric && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
           <div className="bg-white rounded-[2.5rem] w-full max-w-2xl p-6 md:p-10 my-auto shadow-2xl relative">
              <button onClick={() => setActiveMetric(null)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20}/></button>
              <div className="mb-8">
                 <h2 className="text-2xl font-black text-slate-900 capitalize">{activeMetric.replace('_', ' ')} Intelligence</h2>
                 <p className="text-slate-500 font-medium">Detailed financial drill-down.</p>
              </div>

              <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                 {activeMetric === 'expenses' && (
                    <div className="space-y-4">
                       {expenses?.map((e: any) => (
                         <div key={e._id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl">
                            <div>
                               <div className="font-bold text-slate-900">{e.name}</div>
                               <div className="text-[10px] text-slate-400 font-black uppercase">{e.category} | {e.recurrence}</div>
                            </div>
                            <div className="text-right">
                               <div className="font-black text-slate-900">{formatCurrency(e.cost)}</div>
                               <button onClick={() => deleteExpense({id: e._id})} className="text-[10px] font-bold text-red-500 uppercase mt-1">Delete</button>
                            </div>
                         </div>
                       ))}
                    </div>
                 )}
                 {activeMetric === 'burden' && (
                    <div className="space-y-6">
                       <div className="p-8 bg-slate-900 text-white rounded-[2rem] text-center space-y-4">
                          <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Overhead per kg</span>
                          <div className="text-6xl font-black">{formatPrice(summary.burdenPerKg)}</div>
                          <p className="text-slate-400 text-sm max-w-xs mx-auto">This amount is amortized across every unit roasted this month.</p>
                       </div>
                    </div>
                 )}
                 {activeMetric === 'goal' && (
                    <div className="space-y-8">
                       <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${Math.min(goalProgress, 100)}%` }} />
                       </div>
                       <div className="grid grid-cols-2 gap-6 text-center">
                          <div className="p-6 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Current Revenue</span>
                             <div className="text-2xl font-black text-slate-900">{formatCurrency(summary.totalIncome)}</div>
                          </div>
                          <div className="p-6 bg-slate-50 rounded-2xl">
                             <span className="text-[10px] font-black text-slate-400 uppercase mb-1 block">Monthly Target</span>
                             <div className="text-2xl font-black text-slate-900">{formatCurrency(summary.revenueGoal)}</div>
                          </div>
                       </div>
                    </div>
                 )}
                 {activeMetric === 'profit' && (
                    <div className="space-y-6">
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-5 bg-green-50 rounded-2xl border border-green-100">
                             <span className="text-[10px] font-black text-green-700 uppercase block mb-1">Gross Revenue</span>
                             <div className="text-xl font-black text-green-900">{formatCurrency(summary.totalIncome)}</div>
                          </div>
                          <div className="p-5 bg-red-50 rounded-2xl border border-red-100">
                             <span className="text-[10px] font-black text-red-700 uppercase block mb-1">Operating OpEx</span>
                             <div className="text-xl font-black text-red-900">-{formatCurrency(summary.monthlyOverhead)}</div>
                          </div>
                       </div>
                       <div className="p-8 bg-slate-50 rounded-[2rem] text-center border-2 border-slate-200 border-dashed">
                          <span className="text-[10px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Calculated Net Profit</span>
                          <div className="text-5xl font-black text-slate-900">{formatCurrency(netProfit)}</div>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {isConfiguring && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
           <Card className="w-full max-w-3xl shadow-2xl animate-in zoom-in-95 my-auto" title="Operational Parameters" subtitle="Configure global business settings and overhead">
              <div className="space-y-8 max-h-[80vh] overflow-y-auto pr-2 custom-scrollbar">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Monthly Revenue Goal</label>
                       <input type="number" className="input-field" value={settings?.monthlyRevenueGoal} onChange={(e) => updateSettings({ ...settings, monthlyRevenueGoal: parseFloat(e.target.value) } as any)} />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Margin (%)</label>
                       <input type="number" className="input-field" value={settings?.defaultTargetMargin} onChange={(e) => updateSettings({ ...settings, defaultTargetMargin: parseFloat(e.target.value) } as any)} />
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Roast Production Rates (Allocation Basis)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Labor ($/hr)</label>
                          <input type="number" step="0.50" className="input-field" value={settings?.laborRate} onChange={(e) => updateSettings({ ...settings, laborRate: parseFloat(e.target.value) } as any)} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Gas ($/hr)</label>
                          <input type="number" step="0.50" className="input-field" value={settings?.gasRate} onChange={(e) => updateSettings({ ...settings, gasRate: parseFloat(e.target.value) } as any)} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Misc/Facility ($/hr)</label>
                          <input type="number" step="0.50" className="input-field" value={settings?.utilityRate} onChange={(e) => updateSettings({ ...settings, utilityRate: parseFloat(e.target.value) } as any)} />
                       </div>
                    </div>
                    <p className="mt-4 text-[10px] text-slate-400 font-medium">These rates are used to calculate the "True Cost" of roasted coffee based on machine run-time.</p>
                 </div>
                 
                 <div className="pt-6 border-t border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-4">Add Recurring Overhead (Fixed Costs)</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                       <input id="exp-name" placeholder="Expense Name" className="input-field text-sm" />
                       <input id="exp-cost" type="number" placeholder="Amount" className="input-field text-sm" />
                       <select id="exp-cat" className="input-field text-sm">
                          <option value="fixed">Rent/Fixed</option>
                          <option value="fixed">Insurance</option>
                          <option value="fixed">Subscriptions</option>
                          <option value="fixed">Licenses</option>
                          <option value="fixed">Marketing</option>
                          <option value="variable">Utilities</option>
                          <option value="variable">Maintenance</option>
                          <option value="variable">Other</option>
                       </select>
                       <button 
                         onClick={async () => {
                            const nameEl = (document.getElementById('exp-name') as HTMLInputElement);
                            const costEl = (document.getElementById('exp-cost') as HTMLInputElement);
                            const name = nameEl.value;
                            const cost = parseFloat(costEl.value);
                            const category = (document.getElementById('exp-cat') as HTMLSelectElement).value as 'fixed' | 'variable';
                            if (name && cost) {
                               await addExpense({ name, cost, category, recurrence: 'monthly' });
                               showToast('Expense added', 'success');
                               nameEl.value = '';
                               costEl.value = '';
                            }
                         }}
                         className="btn-primary py-2 text-xs"
                       >Add Expense</button>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-2xl">
                       <p className="text-[10px] text-slate-500 font-bold mb-3 uppercase tracking-widest">Common Micro-Roaster Costs:</p>
                       <div className="flex flex-wrap gap-2">
                          {['Rent/Facility', 'Equipment Lease', 'Software (Cropster/POS)', 'GL Insurance', 'Cleaning Services', 'Marketing/SEO'].map(suggest => (
                            <button key={suggest} onClick={() => {(document.getElementById('exp-name') as HTMLInputElement).value = suggest}} className="px-3 py-1 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 hover:border-amber-500 transition-colors">
                               + {suggest}
                            </button>
                          ))}
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsConfiguring(false)} className="w-full btn-secondary py-4 font-black uppercase text-xs tracking-[0.2em] sticky bottom-0">Close Settings</button>
              </div>
           </Card>
        </div>
      )}
    </div>
  );
}
