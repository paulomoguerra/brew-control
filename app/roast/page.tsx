"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Flame, Loader2, CheckCircle2, BarChart3, AlertCircle, Clock, Coins, X, Calculator, BookOpen, Database, Plus, Save, Trash2, TrendingUp } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { calculateRoastEconomics } from '../../lib/finance';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { Id } from '../../convex/_generated/dataModel';

type TabType = 'log' | 'plan' | 'blends';

export default function ProductionHub() {
  const { unit, toStorageWeight, toDisplayWeight, formatWeight, formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const batches = useQuery(api.inventory.list);
  const roastedInventory = useQuery(api.inventory.listRoasted);
  const recentLogs = useQuery(api.roasts.listLogs);
  const recipes = useQuery(api.recipes.list);
  
  const logRoast = useMutation(api.roasts.logRoast);
  const addRecipe = useMutation(api.recipes.add);
  const removeRecipe = useMutation(api.recipes.remove);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>('log');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  // Shared Selection
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const selectedBatch = useMemo(() => 
    batches?.find(b => b._id === selectedBatchId), 
  [selectedBatchId, batches]);

  // --- LOG MODE STATE ---
  const [greenWeightIn, setGreenWeightIn] = useState<string>('');
  const [roastedWeightOut, setRoastedWeightOut] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [duration, setDuration] = useState<number>(12);

  // --- PLAN MODE STATE ---
  const [planGoal, setPlanGoal] = useState<string>(''); 
  const [planType, setPlanType] = useState<'single' | 'blend'>('single');
  const [selectedRecipeId, setSelectedRecipeId] = useState('');

  const selectedRecipe = useMemo(() => 
    recipes?.find(r => r._id === selectedRecipeId),
  [selectedRecipeId, recipes]);

  // --- BLEND DESIGNER STATE ---
  const [newBlendName, setNewBlendName] = useState('');
  const [targetShrinkage, setTargetShrinkage] = useState(15.0);
  const [blendComponents, setBlendComponents] = useState<{ greenBatchId: string, percentage: number }[]>([{ greenBatchId: '', percentage: 100 }]);

  const isLoading = batches === undefined || recentLogs === undefined || recipes === undefined || roastedInventory === undefined;

  // --- LOGIC: LOGGING ECONOMICS ---
  const financials = useMemo(() => ({ laborRate: 20.00, gasRate: 5.00, utilityRate: 0 }), []);
  const economics = useMemo(() => {
    const greenInVal = parseFloat(greenWeightIn) || 0;
    const roastedOutVal = parseFloat(roastedWeightOut) || 0;
    if (!selectedBatch || greenInVal <= 0 || roastedOutVal <= 0) return null;
    
    const greenInLbs = toStorageWeight(greenInVal);
    const roastedOutLbs = toStorageWeight(roastedOutVal);
    const overheadCost = (financials.laborRate + financials.gasRate) * (duration / 60);

    const result = calculateRoastEconomics(greenInLbs, roastedOutLbs, selectedBatch.costPerLb, overheadCost);

    return {
      shrinkage: ((greenInLbs - roastedOutLbs) / greenInLbs) * 100,
      roastedCostPerLb: result.costPerRoastedLb,
      totalBatchCost: result.totalCost
    };
  }, [selectedBatch, greenWeightIn, roastedWeightOut, duration, financials, toStorageWeight]);

  // --- LOGIC: PLANNING ---
  const planResults = useMemo(() => {
    const goalVal = parseFloat(planGoal) || 0;
    if (goalVal <= 0) return null;

    if (planType === 'single') {
      if (!selectedBatch) return null;
      const greenRequiredDisplay = goalVal / (1 - (15.5 / 100)); 
      const isPossible = selectedBatch.quantityLbs >= toStorageWeight(greenRequiredDisplay);
      return { 
        type: 'single' as const, 
        greenRequired: greenRequiredDisplay, 
        isPossible, 
        totalCost: greenRequiredDisplay * toDisplayWeight(selectedBatch.costPerLb) 
      };
    } else {
      if (!selectedRecipe) return null;
      const greenRequiredDisplay = goalVal / (1 - ( (selectedRecipe as any).targetShrinkage / 100));
      
      const componentRequirements = (selectedRecipe as any).components.map((comp: any) => {
        const batch = batches?.find(b => b._id === comp.greenBatchId);
        const requiredWeight = greenRequiredDisplay * (comp.percentage / 100);
        const requiredLbs = toStorageWeight(requiredWeight);
        return {
          origin: batch?.origin || 'Unknown',
          required: requiredWeight,
          isPossible: batch ? batch.quantityLbs >= requiredLbs : false,
          cost: requiredWeight * (batch ? toDisplayWeight(batch.costPerLb) : 0)
        };
      });

      const isPossible = componentRequirements.every((c: any) => c.isPossible);
      const totalCost = componentRequirements.reduce((acc: number, c: any) => acc + c.cost, 0);

      return { 
        type: 'blend' as const, 
        greenRequired: greenRequiredDisplay, 
        isPossible, 
        componentRequirements, 
        totalCost 
      };
    }
  }, [planGoal, planType, selectedBatch, selectedRecipe, batches, toStorageWeight, toDisplayWeight]);

  // --- LOGIC: BLENDS ---
  const blendStats = useMemo(() => {
    let totalPct = 0;
    let weightedCost = 0;
    const pieData: any[] = [];
    blendComponents.forEach(comp => {
      const b = batches?.find(x => x._id === comp.greenBatchId);
      if (b) {
        totalPct += comp.percentage;
        weightedCost += b.costPerLb * (comp.percentage / 100);
        pieData.push({ name: b.origin, value: comp.percentage });
      }
    });
    const projected = weightedCost / (1 - (targetShrinkage / 100));
    return { totalPct, weightedCost, projected, pieData };
  }, [blendComponents, batches, targetShrinkage]);

  // --- HANDLERS ---
  const handleLogRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !economics) return;
    setIsSubmitting(true);
    try {
      await logRoast({
        batchId: selectedBatch._id,
        productName: productName || `${selectedBatch.origin} Roast`,
        greenWeightIn: toStorageWeight(parseFloat(greenWeightIn)),
        roastedWeightOut: toStorageWeight(parseFloat(roastedWeightOut)),
        durationMinutes: duration,
        laborRate: financials.laborRate,
        gasCostPerBatch: (financials.gasRate * (duration/60))
      });
      showToast('Roast logged and inventory updated', 'success');
      setGreenWeightIn(''); setRoastedWeightOut(''); setProductName('');
    } catch (err) {
      showToast('Failed to log roast', 'error');
    } finally { setIsSubmitting(false); }
  };

  const handleSaveBlend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(blendStats.totalPct - 100) > 0.1) {
      showToast('Blend must total 100%', 'error');
      return;
    }
    try {
      await addRecipe({
        name: newBlendName,
        targetShrinkage,
        components: blendComponents as any,
        projectedCostPerLb: blendStats.projected,
      });
      showToast('Blend recipe saved', 'success');
      setNewBlendName(''); setBlendComponents([{ greenBatchId: '', percentage: 100 }]);
    } catch (err) { showToast('Error saving blend', 'error'); }
  };

  if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full rounded-[2rem]" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Production Hub</h1>
          <p className="text-slate-500 font-medium">Design blends, plan sessions, and log production.</p>
        </div>
        
        <div className="flex bg-slate-100 p-1 rounded-2xl w-full md:w-auto overflow-x-auto no-scrollbar">
          {(['log', 'plan', 'blends'] as const).map(t => (
            <button 
              key={t}
              onClick={() => setActiveTab(t)}
              className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
            >
              {t === 'log' ? 'Logging' : t === 'plan' ? 'Planning' : 'Blend Design'}
            </button>
          ))}
        </div>
      </header>

      {/* Overview Row: Live Inventory Mini-Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <Card title="Green Assets" subtitle="Raw Material Availability">
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
               {batches?.filter(b => b.quantityLbs > 1).map(b => (
                 <div key={b._id} className="flex justify-between items-center text-sm p-3 bg-slate-50 rounded-xl">
                    <span className="font-bold text-slate-700">{b.origin} <span className="text-[10px] text-slate-400 ml-2">{b.batchNumber}</span></span>
                    <span className="font-black text-slate-900">{formatWeight(b.quantityLbs)}</span>
                 </div>
               ))}
            </div>
         </Card>
         <Card title="Roasted Stock" subtitle="Finished Goods Inventory">
            <div className="space-y-3 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
               {roastedInventory?.filter(r => r.quantityLbs > 0).map(r => (
                 <div key={r._id} className="flex justify-between items-center text-sm p-3 bg-amber-50 rounded-xl border border-amber-100">
                    <span className="font-bold text-amber-900">{r.productName}</span>
                    <span className="font-black text-amber-950">{formatWeight(r.quantityLbs)}</span>
                 </div>
               ))}
            </div>
         </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* LOG TAB */}
          {activeTab === 'log' && (
            <Card title="Log New Roast" subtitle="Deduct from green, add to roasted stock">
               <form onSubmit={handleLogRoast} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Green Coffee Batch</label>
                    <select required value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input-field bg-white">
                      <option value="">Select Green Coffee...</option>
                      {batches?.map(b => (
                        <option key={b._id} value={b._id}>{b.origin} ({formatWeight(b.quantityLbs)})</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Product Name</label>
                      <input placeholder="e.g. House Espresso" value={productName} onChange={e => setProductName(e.target.value)} className="input-field bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Duration (min)</label>
                      <input type="number" required value={duration} onChange={e => setDuration(parseFloat(e.target.value))} className="input-field bg-white" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Green Weight In ({unit})</label>
                      <input type="number" step="0.01" required value={greenWeightIn} onChange={e => setGreenWeightIn(e.target.value)} className="input-field bg-white" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Roasted Weight Out ({unit})</label>
                      <input type="number" step="0.01" required value={roastedWeightOut} onChange={e => setRoastedWeightOut(e.target.value)} className="input-field bg-white" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmitting || !economics} className="btn-primary w-full py-4 text-base shadow-xl">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : <Flame />} Log & Sync Inventory
                  </button>
               </form>
            </Card>
          )}

          {/* PLAN TAB */}
          {activeTab === 'plan' && (
            <Card title="Production Planner" subtitle="Reverse calculation from roasted target">
               <div className="space-y-8">
                  <div className="flex bg-slate-50 p-1 rounded-xl w-fit">
                    <button 
                      onClick={() => setPlanType('single')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planType === 'single' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Single Batch
                    </button>
                    <button 
                      onClick={() => setPlanType('blend')}
                      className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${planType === 'blend' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      Blend Recipe
                    </button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Roasted Output ({unit})</label>
                    <input 
                      type="number" 
                      placeholder="How much do you need to bag?" 
                      value={planGoal} 
                      onChange={e => setPlanGoal(e.target.value)} 
                      className="input-field bg-white text-xl font-bold"
                    />
                  </div>

                  {planType === 'single' ? (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Source Batch</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {batches?.slice(0, 4).map(b => (
                            <button key={b._id} onClick={() => setSelectedBatchId(b._id)} className={`p-5 rounded-2xl border-2 text-left transition-all ${selectedBatchId === b._id ? 'border-amber-500 bg-amber-50' : 'border-slate-100 hover:border-slate-200 bg-white'}`}>
                               <div className="font-bold text-slate-900">{b.origin}</div>
                               <div className="text-xs font-medium text-slate-500">{formatWeight(b.quantityLbs)} Available</div>
                            </button>
                          ))}
                       </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                       <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Blend Recipe</label>
                       <select value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)} className="input-field bg-white">
                          <option value="">Select Recipe...</option>
                          {recipes?.map((r: any) => (
                            <option key={r._id} value={r._id}>{r.name}</option>
                          ))}
                       </select>
                    </div>
                  )}

                  {planResults && (
                    <div className={`p-8 rounded-[2rem] space-y-6 ${planResults.isPossible ? 'bg-slate-900 text-white shadow-2xl' : 'bg-red-50 border border-red-100'}`}>
                       <div className="text-center">
                          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500">Total Green Required</span>
                          <div className="text-5xl font-black mt-2">{planResults.greenRequired.toFixed(1)} {unit}</div>
                          <div className="text-xs font-bold text-slate-400 mt-2">Est. Cost: {formatCurrency(planResults.totalCost)}</div>
                          {!planResults.isPossible && <p className="text-red-500 font-bold text-xs mt-4">⚠️ Warning: Insufficient green coffee in stock.</p>}
                       </div>

                       {planResults.type === 'blend' && (
                         <div className="space-y-3 pt-6 border-t border-slate-800">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Component Breakdown</span>
                            {planResults.componentRequirements?.map((c, i) => (
                              <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl">
                                 <div>
                                    <div className="font-bold text-sm">{c.origin}</div>
                                    <div className={`text-[10px] font-black uppercase ${c.isPossible ? 'text-green-500' : 'text-red-500'}`}>
                                       {c.isPossible ? 'In Stock' : 'Out of Stock'}
                                    </div>
                                 </div>
                                 <div className="text-right">
                                    <div className="font-black">{c.required.toFixed(1)} {unit}</div>
                                    <div className="text-[10px] text-slate-500">{formatCurrency(c.cost)}</div>
                                 </div>
                              </div>
                            ))}
                         </div>
                       )}
                    </div>
                  )}
               </div>
            </Card>
          )}

          {/* BLENDS TAB */}
          {activeTab === 'blends' && (
            <div className="space-y-8">
               <Card title="New Blend Designer" subtitle="Calculate projected cost and flavor share">
                  <form onSubmit={handleSaveBlend} className="space-y-6">
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <input placeholder="Blend Name (e.g. Winter Warmth)" value={newBlendName} onChange={e => setNewBlendName(e.target.value)} className="input-field bg-white" />
                        <div className="relative">
                           <input type="number" step="0.1" value={targetShrinkage} onChange={e => setTargetShrinkage(parseFloat(e.target.value))} className="input-field bg-white pr-10" />
                           <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                        </div>
                     </div>
                     <div className="space-y-3">
                        {blendComponents.map((comp, idx) => (
                           <div key={idx} className="flex gap-4 items-center">
                              <select 
                                value={comp.greenBatchId} 
                                onChange={e => {
                                  const updated = [...blendComponents];
                                  updated[idx].greenBatchId = e.target.value;
                                  setBlendComponents(updated);
                                }}
                                className="input-field flex-grow bg-white"
                              >
                                 <option value="">Select Bean...</option>
                                 {batches?.map(b => <option key={b._id} value={b._id}>{b.origin} ({formatCurrency(b.costPerLb)}/{unit})</option>)}
                              </select>
                              <div className="relative w-24 shrink-0">
                                 <input 
                                   type="number" 
                                   value={comp.percentage} 
                                   onChange={e => {
                                      const updated = [...blendComponents];
                                      updated[idx].percentage = parseFloat(e.target.value) || 0;
                                      setBlendComponents(updated);
                                   }}
                                   className="input-field bg-white pr-8 text-right"
                                 />
                                 <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                              </div>
                              <button type="button" onClick={() => {
                                 const updated = [...blendComponents];
                                 updated.splice(idx, 1);
                                 setBlendComponents(updated);
                              }} className="text-slate-300 hover:text-red-500"><X /></button>
                           </div>
                        ))}
                        <button type="button" onClick={() => setBlendComponents([...blendComponents, { greenBatchId: '', percentage: 0 }])} className="text-xs font-black text-amber-600 flex items-center gap-1 uppercase tracking-widest"><Plus size={14}/> Add Component</button>
                     </div>
                     
                     <div className="bg-slate-50 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-8 items-center border border-slate-100">
                        <div className="space-y-4">
                           <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-500">Blend Completeness</span><span className={`font-black ${Math.abs(blendStats.totalPct - 100) < 0.1 ? 'text-green-600' : 'text-red-500'}`}>{blendStats.totalPct}%</span></div>
                           <div className="flex justify-between items-center text-sm"><span className="font-medium text-slate-500">Weighted Green Cost</span><span className="font-bold text-slate-900">{formatPrice(blendStats.weightedCost)}</span></div>
                           <div className="pt-4 border-t border-slate-200">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Projected Roasted Cost</span>
                              <div className="text-3xl font-black text-amber-500">{formatPrice(blendStats.projected)}</div>
                           </div>
                        </div>
                        <div className="h-40">
                           <ResponsiveContainer width="100%" height="100%">
                             <RePie>
                                <Pie data={blendStats.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={40} outerRadius={60}>
                                   {blendStats.pieData.map((_, i) => <Cell key={i} fill={['#f59e0b', '#0f172a', '#64748b', '#cbd5e1'][i % 4]} />)}
                                </Pie>
                                <Tooltip />
                             </RePie>
                           </ResponsiveContainer>
                        </div>
                     </div>
                     <button type="submit" disabled={Math.abs(blendStats.totalPct - 100) > 0.1} className="btn-primary w-full py-4 disabled:opacity-50"><Save /> Save Recipe</button>
                  </form>
               </Card>
            </div>
          )}
        </div>

        {/* Sidebar: Contextual Insight */}
        <div className="space-y-6">
           {activeTab === 'log' && economics && (
             <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden sticky top-24">
                <div className="absolute top-0 right-0 p-8 opacity-10"><TrendingUp size={120} /></div>
                <div className="relative z-10 space-y-8">
                   <div>
                      <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Live Economics</span>
                      <div className="text-5xl font-black tracking-tighter mt-2">{formatPrice(economics.roastedCostPerLb)}</div>
                      <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">True Production Basis</p>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Shrinkage</span>
                         <div className="text-2xl font-black text-amber-400">{economics.shrinkage.toFixed(1)}%</div>
                      </div>
                      <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                         <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Total Batch</span>
                         <div className="text-2xl font-black">{formatCurrency(economics.totalBatchCost)}</div>
                      </div>
                   </div>
                </div>
             </div>
           )}

           <Card title="Activity Feed" subtitle="Recent roast history">
              <div className="space-y-5">
                 {recentLogs?.slice(0, 5).map(log => (
                   <div key={log._id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0">
                      <div>
                        <div className="font-bold text-slate-800 text-sm truncate max-w-[120px]">{log.productName}</div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">{new Date(log.roastDate).toLocaleDateString()}</div>
                      </div>
                      <div className="text-right">
                         <div className="font-black text-slate-900 text-sm">{formatWeight(log.roastedWeightOut)}</div>
                         <div className="text-[10px] font-bold text-green-600">{log.shrinkagePercent.toFixed(1)}% Loss</div>
                      </div>
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}
