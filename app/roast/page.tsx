"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { 
  Flame, 
  Loader2, 
  AlertCircle, 
  Clock, 
  Coins, 
  X, 
  Calculator, 
  Database, 
  Plus, 
  Save, 
  TrendingUp, 
  Percent, 
  Layout as LayoutIcon, 
  ClipboardList 
} from "lucide-react";
import { useUnits } from "../../lib/units";
import { useToast } from "../../components/ui/Toast";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { calculateRoastEconomics } from "../../lib/finance";
import { CustomizableGrid } from "../../components/ui/CustomizableGrid";

type TabType = "plan" | "blends" | "forecast";

export default function ProductionHub() {
  const { unit, toStorageWeight, toDisplayWeight, formatWeight, formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const batches = useQuery(api.inventory.list);
  const roastedInventory = useQuery(api.inventory.listRoasted);
  const recentLogs = useQuery(api.roasts.listLogs);
  const recipes = useQuery(api.recipes.list);
  const orders = useQuery(api.orders.list);
  
  const addRecipe = useMutation(api.recipes.add);
  const logRoast = useMutation(api.roasts.logRoast);

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("plan");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState(["workflow", "green_assets", "roasted_stock", "activity_feed"]);

  // Plan Mode State
  const [planGoal, setPlanGoal] = useState<string>(""); 
  const [planType, setPlanType] = useState<"single" | "blend">("single");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  const [plannedShrinkage, setPlannedShrinkage] = useState<string>("15.5");
  
  // Optional Simulations
  const [showSimulations, setShowSimulations] = useState(false);
  const [machineCapacity, setMachineCapacity] = useState<string>("12");
  const [targetBagSize, setTargetBagSize] = useState<string>("0.25"); // 250g default
  
  // Execution State (Logging from Plan)
  const [isLoggingPlanned, setIsLoggingPlanned] = useState(false);
  const [actualRoastedWeight, setActualRoastedWeight] = useState("");

  // Blend Designer State
  const [newBlendName, setNewBlendName] = useState("");
  const [targetShrinkage, setTargetShrinkage] = useState(15.0);
  const [blendComponents, setBlendComponents] = useState<{ greenBatchId: string, percentage: number }[]>([{ greenBatchId: "", percentage: 100 }]);

  useEffect(() => {
    const saved = localStorage.getItem("roasteros-production-layout-v4");
    if (saved) setCardOrder(JSON.parse(saved));
  }, []);

  const handleReorder = (newOrder: string[]) => {
    setCardOrder(newOrder);
    localStorage.setItem("roasteros-production-layout-v4", JSON.stringify(newOrder));
  };

  // Logic: Smart Shrinkage Suggestion
  useEffect(() => {
    if (selectedBatchId && recentLogs) {
      const batchLogs = recentLogs.filter(l => l.batchId === selectedBatchId);
      if (batchLogs.length > 0) {
        const avg = batchLogs.slice(0, 3).reduce((acc, curr) => acc + curr.shrinkagePercent, 0) / Math.min(3, batchLogs.length);
        setPlannedShrinkage(avg.toFixed(1));
      }
    }
  }, [selectedBatchId, recentLogs]);

  const selectedBatch = useMemo(() => batches?.find(b => b._id === selectedBatchId), [selectedBatchId, batches]);
  const selectedRecipe = useMemo(() => recipes?.find(r => r._id === selectedRecipeId), [selectedRecipeId, recipes]);
  const financials = useMemo(() => ({ laborRate: 20.00, gasRate: 5.00 }), []);

  const planResults = useMemo(() => {
    const goalVal = parseFloat(planGoal) || 0;
    const shrinkVal = parseFloat(plannedShrinkage) || 0;
    const capacityVal = parseFloat(machineCapacity) || 12;
    const bagSizeVal = parseFloat(targetBagSize) || 0.25;

    if (goalVal <= 0 || shrinkVal >= 100) return null;
    
    const greenRequiredDisplay = goalVal / (1 - (shrinkVal / 100));
    const roastsNeeded = Math.ceil(greenRequiredDisplay / capacityVal);
    const bagsYield = Math.floor(goalVal / bagSizeVal);

    if (planType === "single") {
      if (!selectedBatch) return null;
      const isPossible = selectedBatch.quantityLbs >= toStorageWeight(greenRequiredDisplay);
      const totalCost = greenRequiredDisplay * toDisplayWeight(selectedBatch.costPerLb) + (financials.gasRate * roastsNeeded);
      return { 
        type: "single" as const, 
        greenRequired: greenRequiredDisplay, 
        isPossible, 
        totalCost,
        roastsNeeded,
        bagsYield,
        unitCost: totalCost / goalVal,
        maxPossible: toDisplayWeight(selectedBatch.quantityLbs) * (1 - (shrinkVal / 100)),
        bottleneck: isPossible ? "" : selectedBatch.origin
      };
    } else {
      if (!selectedRecipe) return null;
      let limitingFactor = "";
      let maxPossibleOutput = Infinity;
      
      (selectedRecipe as any).components.forEach((comp: any) => {
        const b = batches?.find(x => x._id === comp.greenBatchId);
        if (b) {
          const possibleFromThis = (toDisplayWeight(b.quantityLbs) / (comp.percentage / 100)) * (1 - (shrinkVal / 100));
          if (possibleFromThis < maxPossibleOutput) {
            maxPossibleOutput = possibleFromThis;
            limitingFactor = b.origin;
          }
        }
      });

      const isPossible = maxPossibleOutput >= goalVal;
      const totalCost = (selectedRecipe as any).projectedCostPerLb * goalVal;
      
      return { 
        type: "blend" as const, 
        greenRequired: greenRequiredDisplay, 
        isPossible, 
        totalCost,
        roastsNeeded,
        bagsYield,
        unitCost: totalCost / goalVal,
        maxPossible: maxPossibleOutput,
        bottleneck: limitingFactor
      };
    }
  }, [planGoal, planType, selectedBatch, selectedRecipe, toStorageWeight, toDisplayWeight, plannedShrinkage, machineCapacity, targetBagSize, batches, financials]);

  const blendStats = useMemo(() => {
    let totalPct = 0; let weightedCost = 0; const pieData: any[] = [];
    blendComponents.forEach(comp => {
      const b = batches?.find(x => x._id === comp.greenBatchId);
      if (b) {
        totalPct += comp.percentage;
        weightedCost += b.costPerLb * (comp.percentage / 100);
        pieData.push({ name: b.origin, value: comp.percentage });
      }
    });
    return { totalPct, weightedCost, projected: weightedCost / (1 - (targetShrinkage / 100)), pieData };
  }, [blendComponents, batches, targetShrinkage]);

  const forecastResults = useMemo(() => {
    if (!orders || !recipes) return [];
    const pendingOrders = orders.filter(o => o.status === "pending" || o.status === "roasting");
    const requirements: Record<string, number> = {};
    pendingOrders.forEach(o => { (o.items || []).forEach((item: any) => { requirements[item.productName] = (requirements[item.productName] || 0) + item.quantity; }); });
    return Object.entries(requirements).map(([name, qty]) => {
      const recipe = recipes.find(r => r.name === name);
      const shrinkage = recipe?.targetShrinkage || 15.5;
      return { name, roastedQty: qty, greenNeeded: qty / (1 - (shrinkage / 100)), shrinkage };
    });
  }, [orders, recipes]);

  const handleLogPlanned = async () => {
    if (!selectedBatch || !planResults) return;
    setIsSubmitting(true);
    try {
      const roastedOut = parseFloat(actualRoastedWeight);
      const defaultDuration = 12;
      await logRoast({
        batchId: selectedBatch._id,
        productName: `${selectedBatch.origin} Roast`,
        greenWeightIn: toStorageWeight(planResults.greenRequired),
        roastedWeightOut: toStorageWeight(roastedOut),
        durationMinutes: defaultDuration,
        laborRate: financials.laborRate,
        gasCostPerBatch: financials.gasRate
      });
      showToast("Roast logged successfully", "success");
      setIsLoggingPlanned(false);
      setPlanGoal("");
      setActualRoastedWeight("");
    } catch (err) {
      showToast("Failed to log roast", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveBlend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(blendStats.totalPct - 100) > 0.1) { showToast("Blend must total 100%", "error"); return; }
    try {
      await addRecipe({ name: newBlendName, targetShrinkage, components: blendComponents as any, projectedCostPerLb: blendStats.projected });
      showToast("Blend recipe saved", "success");
      setNewBlendName(""); setBlendComponents([{ greenBatchId: "", percentage: 100 }]);
    } catch (err) { showToast("Error saving blend", "error"); }
  };

  const renderWorkflowCard = () => {
    switch(activeTab) {
      case "plan": return (
        <Card title="Production Planner" subtitle="Target-based simulations & execution">
           <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                  <button onClick={() => setPlanType("single")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planType === "single" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}>Single Origin</button>
                  <button onClick={() => setPlanType("blend")} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planType === "blend" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}>Blend Recipe</button>
                </div>
                <button onClick={() => setShowSimulations(!showSimulations)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${showSimulations ? "bg-amber-100 text-amber-700" : "bg-slate-50 text-slate-400"}`}>
                  <Calculator size={14} /> {showSimulations ? "Hide Simulations" : "Advanced Simulations"}
                </button>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 items-start">
                <div className="lg:col-span-1 space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Output ({unit})</label>
                    <div className="relative">
                      <input type="number" value={planGoal} onChange={e => setPlanGoal(e.target.value)} className="input-field bg-slate-50 text-2xl font-black py-6 pl-6 pr-12 rounded-[2rem] border-none focus:ring-2 focus:ring-amber-500/20" placeholder="0.0" />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">{unit}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">Shrinkage % <span className="text-amber-500 italic">Suggested</span></label>
                    <div className="relative">
                      <input type="number" step="0.1" value={plannedShrinkage} onChange={e => setPlannedShrinkage(e.target.value)} className="input-field bg-slate-50 text-2xl font-black py-6 pl-6 pr-12 rounded-[2rem] border-none focus:ring-2 focus:ring-amber-500/20" placeholder="15.5" />
                      <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">%</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {planType === "single" ? (
                      <select value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input-field bg-slate-50 rounded-[1.5rem] border-none focus:ring-2 focus:ring-amber-500/20 py-4 font-black uppercase text-[10px]">
                        <option value="">Select Origin...</option>
                        {batches?.map(b => <option key={b._id} value={b._id}>{b.origin} ({formatWeight(b.quantityLbs)})</option>)}
                      </select>
                    ) : (
                      <select value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)} className="input-field bg-slate-50 rounded-[1.5rem] border-none focus:ring-2 focus:ring-amber-500/20 py-4 font-black uppercase text-[10px]">
                        <option value="">Select Recipe...</option>
                        {recipes?.map(r => <option key={r._id} value={r._id}>{r.name}</option>)}
                      </select>
                    )}
                  </div>
                </div>
                <div className="lg:col-span-1 space-y-8 min-h-[200px] border-x border-slate-50 px-8">
                  {showSimulations ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Capacity ({unit})</label>
                        <input type="number" value={machineCapacity} onChange={e => setMachineCapacity(e.target.value)} className="input-field bg-slate-50 py-3 rounded-xl border-none font-black" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bag Target</label>
                        <select value={targetBagSize} onChange={e => setTargetBagSize(e.target.value)} className="input-field bg-slate-50 py-3 rounded-xl border-none font-black">
                          <option value="0.25">250g Retail</option>
                          <option value="0.5">500g Retail</option>
                          <option value="1">1kg Wholesale</option>
                        </select>
                      </div>
                      {planResults && (
                        <div className="p-4 bg-amber-50 rounded-2xl space-y-3">
                          <div className="flex justify-between items-center"><span className="text-[8px] font-black text-amber-600 uppercase">Workload</span><span className="text-xs font-black text-amber-900">{planResults.roastsNeeded} Roasts</span></div>
                          <div className="flex justify-between items-center"><span className="text-[8px] font-black text-amber-600 uppercase">Yield</span><span className="text-xs font-black text-amber-900">{planResults.bagsYield} Bags</span></div>
                        </div>
                      )}
                    </div>
                  ) : <div className="flex flex-col items-center justify-center h-full text-center space-y-4 py-10 opacity-30"><Database size={48} strokeWidth={1} /><span className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Advanced Simulations<br/>Inactive</span></div>}
                </div>
                <div className="lg:col-span-2 flex flex-col justify-center h-full">
                  {planResults ? (
                    <div className={`p-10 rounded-[3rem] space-y-6 shadow-2xl text-center transition-all ${planResults.isPossible ? "bg-slate-900 text-white" : "bg-red-50 border-2 border-red-100 text-red-900"}`}>
                       {!isLoggingPlanned ? (
                         <>
                           <div className="flex justify-around items-center gap-4">
                             <div className="text-center"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 block mb-2">Green Required</span><div className="text-5xl font-black tracking-tighter italic">{planResults.greenRequired.toFixed(1)} <span className="text-xl not-italic uppercase opacity-40 ml-1">{unit}</span></div></div>
                             <div className="w-px h-12 bg-white/10" />
                             <div className="text-center"><span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-500 block mb-2">Projected Profit</span><div className="text-3xl font-black italic tracking-tighter text-green-400">+{formatPrice(planResults.unitCost * 0.4 * parseFloat(planGoal))}</div></div>
                           </div>
                           <div className="pt-4 flex items-center justify-center gap-6 border-t border-white/5 mt-6">
                              <div className="flex items-center gap-2">{planResults.isPossible ? <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Inventory OK</div> : <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={14} /> Low: {planResults.bottleneck}</div>}</div>
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Cap: {planResults.maxPossible.toFixed(0)} {unit}</div>
                           </div>
                           {planResults.isPossible && <button onClick={() => { setIsLoggingPlanned(true); setActualRoastedWeight(planGoal); }} className="w-full mt-6 py-5 bg-amber-500 text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl">Log Successful Production</button>}
                         </>
                       ) : (
                         <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                           <div className="flex justify-between items-center px-4"><span className="text-xs font-black text-amber-500 uppercase tracking-widest italic">Fast Log</span><button onClick={() => setIsLoggingPlanned(false)} className="text-slate-500 hover:text-white"><X size={20}/></button></div>
                           <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10"><div className="text-left space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Actual Roasted ({unit})</label><input type="number" autoFocus value={actualRoastedWeight} onChange={e => setActualRoastedWeight(e.target.value)} className="w-full bg-transparent border-none text-5xl font-black text-white focus:ring-0 placeholder:text-white/10" placeholder="0.00" /></div></div>
                           <div className="flex gap-4"><button onClick={() => setIsLoggingPlanned(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10">Cancel</button><button disabled={isSubmitting || !actualRoastedWeight} onClick={handleLogPlanned} className="flex-[2] py-4 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-colors">{isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Confirm & Update"}</button></div>
                         </div>
                       )}
                    </div>
                  ) : <div className="p-16 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center text-slate-300 gap-6 h-full min-h-[300px]"><Plus size={64} strokeWidth={1} /><span className="text-xs font-black uppercase tracking-[0.3em]">Configure Plan to Simulate Yield</span></div>}
                </div>
              </div>
           </div>
        </Card>
      );
      case "blends": return (
        <Card title="Blend Engineering" subtitle="Composition & Profitability Simulation">
           <form onSubmit={handleSaveBlend} className="space-y-12">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
                 <div className="lg:col-span-3 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blend Identity</label><input placeholder="Recipe Name" value={newBlendName} onChange={e => setNewBlendName(e.target.value)} className="input-field bg-slate-50 border-none rounded-[1.5rem] py-6 font-black text-xl" /></div>
                      <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Shrinkage %</label><input type="number" step="0.1" value={targetShrinkage} onChange={e => setTargetShrinkage(parseFloat(e.target.value))} className="input-field bg-slate-50 border-none rounded-[1.5rem] py-6 font-black text-xl" /></div>
                    </div>
                    <div className="space-y-6">
                      <div className="flex justify-between items-end"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Composition Strategy</label></div><span className={`text-[11px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${Math.abs(blendStats.totalPct - 100) < 0.1 ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>{blendStats.totalPct}% Balanced</span></div>
                      <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden shadow-inner">{blendComponents.map((comp, idx) => { const colors = ["bg-amber-500", "bg-amber-700", "bg-slate-800", "bg-slate-400"]; return <div key={idx} style={{ width: `${comp.percentage}%` }} className={`${colors[idx % colors.length]} transition-all duration-500 border-r border-white/20 last:border-0`} />; })}</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {blendComponents.map((comp, idx) => (
                            <div key={idx} className="p-6 bg-slate-50 rounded-[2rem] flex items-center gap-4 group hover:bg-slate-100 transition-all border border-transparent hover:border-slate-200">
                               <select value={comp.greenBatchId} onChange={e => { const newComps = [...blendComponents]; newComps[idx].greenBatchId = e.target.value; setBlendComponents(newComps); }} className="flex-[3] bg-transparent border-none rounded-xl text-xs font-black uppercase py-2 focus:ring-0">
                                 <option value="">Origin...</option>
                                 {batches?.map(b => <option key={b._id} value={b._id}>{b.origin}</option>)}
                               </select>
                               <div className="flex items-center gap-3">
                                 <div className="relative w-20">
                                   <input 
                                     type="number" 
                                     value={comp.percentage} 
                                     onChange={e => {
                                       const newComps = [...blendComponents];
                                       newComps[idx].percentage = parseFloat(e.target.value) || 0;
                                       setBlendComponents(newComps);
                                     }} 
                                     className="w-full bg-white border border-slate-200 rounded-xl px-2 pr-6 font-black py-2.5 text-xs focus:ring-2 focus:ring-amber-500/20 text-right" 
                                   />
                                   <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-300">%</span>
                                 </div>
                                 <button onClick={() => setBlendComponents(blendComponents.filter((_, i) => i !== idx))} type="button" className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100">
                                   <X size={18} />
                                 </button>
                               </div>
                            </div>
                          ))}
                        <button type="button" onClick={() => setBlendComponents([...blendComponents, { greenBatchId: "", percentage: 0 }])} className="p-6 border-2 border-dashed border-slate-200 rounded-[2rem] flex items-center justify-center text-slate-400 hover:border-amber-300 hover:text-amber-500 transition-all gap-3 bg-white"><Plus size={24} /><span className="text-[10px] font-black uppercase tracking-widest">Add Origin</span></button>
                      </div>
                    </div>
                 </div>
                 <div className="lg:col-span-1 bg-slate-900 rounded-[3rem] p-8 text-white flex flex-col items-center justify-between text-center shadow-2xl border-4 border-slate-800 h-full min-h-[400px]">
                    <div className="space-y-8 w-full">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-amber-500/10 flex items-center justify-center mx-auto">
                        <TrendingUp className="text-amber-500" size={32} />
                      </div>
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Projected Cost Basis</span>
                        <div className="text-4xl font-black italic tracking-tight text-amber-500 break-words leading-tight">
                          {formatPrice(blendStats.projected)}
                        </div>
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest block">per roasted {unit}</span>
                      </div>
                      
                      <div className="space-y-3 pt-6 border-t border-white/5">
                         {blendComponents.map((comp, i) => { 
                           const b = batches?.find(x => x._id === comp.greenBatchId); 
                           if (!b || comp.percentage <= 0) return null; 
                           const contribution = (b.costPerLb * (comp.percentage / 100)) / (1 - (targetShrinkage / 100)); 
                           return (
                             <div key={i} className="flex justify-between items-center gap-2">
                               <span className="text-[9px] font-black text-slate-500 uppercase truncate max-w-[100px] text-left">{b.origin}</span>
                               <span className="text-[10px] font-black text-white">{formatPrice(contribution)}</span>
                             </div>
                           ); 
                         })}
                      </div>
                    </div>
                    <button type="submit" disabled={Math.abs(blendStats.totalPct - 100) > 0.1 || !newBlendName} className="w-full py-5 bg-amber-500 text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl mt-8">
                      Lock Recipe
                    </button>
                 </div>
              </div>
           </form>
        </Card>
      );
      case "forecast": return (
        <Card title="Order Forecast" subtitle="Required roast volume for pending orders">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forecastResults?.map((res, idx) => (
                <div key={idx} className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] flex flex-col justify-between group hover:border-amber-500/30 transition-all shadow-sm hover:shadow-xl">
                   <div className="flex justify-between items-start mb-6"><div><div className="font-black text-slate-900 uppercase text-sm tracking-tight">{res.name}</div><div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Pending Orders</div></div><div className="text-[9px] font-black text-amber-600 bg-amber-50 px-3 py-1 rounded-full uppercase">{res.shrinkage}% LOSS</div></div>
                   <div className="grid grid-cols-2 gap-4 mb-6"><div className="p-4 bg-white rounded-2xl"><div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Roasted</div><div className="font-black text-slate-900 text-xl">{res.roastedQty} {unit}</div></div><div className="p-4 bg-white rounded-2xl"><span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Green Required</span><div className="font-black text-slate-900 text-xl">{res.greenNeeded.toFixed(1)} {unit}</div></div></div>
                   <button onClick={() => { setActiveTab("plan"); setPlanGoal(res.roastedQty.toString()); const recipe = recipes?.find(r => r.name === res.name); if (recipe) { setPlanType("blend"); setSelectedRecipeId(recipe._id); } else { setPlanType("single"); const batch = batches?.find(b => b.origin === res.name); if (batch) setSelectedBatchId(batch._id); } }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all">Add to Production Plan</button>
                </div>
              ))}
              {forecastResults?.length === 0 && <div className="lg:col-span-3 py-20 text-center text-slate-300 italic flex flex-col items-center gap-4"><ClipboardList size={48} strokeWidth={1} /><span className="text-xs font-black uppercase tracking-widest">No pending orders. Take the day off?</span></div>}
           </div>
        </Card>
      );
    }
  };

  const renderCard = (id: string) => {
    switch(id) {
      case "workflow": return renderWorkflowCard();
      case "green_assets": return (
         <Card title="Green Assets" subtitle="Raw availability & Aging">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {batches?.map(b => {
                 const isOldCrop = b.arrivedAt && (Date.now() - b.arrivedAt > 180 * 24 * 60 * 60 * 1000);
                 const health = b.quantityLbs > 100 ? "text-green-500" : b.quantityLbs > 20 ? "text-amber-500" : "text-red-500";
                 return (
                   <div key={b._id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-transparent hover:border-slate-200 transition-all"><div className="flex flex-col"><div className="flex items-center gap-2"><span className="font-black text-slate-900 text-xs uppercase">{b.origin}</span>{isOldCrop && <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Old Crop</span>}</div><span className="text-[8px] font-bold text-slate-400 uppercase mt-0.5">ID: {b.batchNumber}</span></div><div className={`font-black text-sm ${health}`}>{formatWeight(b.quantityLbs)}</div></div>
                 );
               })}
            </div>
         </Card>
      );
      case "roasted_stock": return (
         <Card title="Roasted Stock" subtitle="Finished inventory health">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {roastedInventory?.filter(r => r.quantityLbs > 0).map(r => (
                 <div key={r._id} className="flex justify-between items-center p-4 bg-amber-50/30 rounded-2xl border border-amber-100/50"><div><div className="font-black text-amber-900 text-xs uppercase">{r.productName}</div><div className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-1 italic">{r.roastLogId ? "Smart Yield Active" : "Manual Log"}</div></div><div className="text-right"><span className="font-black text-amber-950 text-sm">{formatWeight(r.quantityLbs)}</span><div className="text-[7px] font-black text-slate-400 uppercase tracking-tighter">Last Roast: {new Date(r._creationTime).toLocaleDateString()}</div></div></div>
               ))}
            </div>
         </Card>
      );
      case "activity_feed": return (
         <Card title="Activity Feed" subtitle="Recent roast history">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
               {recentLogs?.slice(0, 6).map(log => (
                 <div key={log._id} className="flex justify-between items-center border-b border-slate-50 pb-4 last:border-0 last:pb-0 group"><div><div className="font-black text-slate-900 text-xs uppercase tracking-tight">{log.productName}</div><div className="flex gap-2 mt-1"><div className={`text-[8px] font-black uppercase ${log.shrinkagePercent > 18 ? "text-red-500" : "text-green-600"}`}>{log.shrinkagePercent.toFixed(1)}% Loss</div><span className="text-slate-300">•</span><div className="text-[8px] font-bold text-slate-400 uppercase">{new Date(log.roastDate).toLocaleDateString()}</div></div></div><div className="flex flex-col items-end gap-2"><div className="font-black text-slate-900 text-xs">{formatWeight(log.roastedWeightOut)}</div><button onClick={() => { setActiveTab("plan"); setPlanType("single"); setSelectedBatchId(log.batchId); setPlanGoal(toDisplayWeight(log.roastedWeightOut).toString()); }} className="text-[7px] font-black uppercase text-amber-600 hover:text-amber-700 bg-amber-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-all">Clone Plan</button></div></div>
               ))}
            </div>
         </Card>
      );
      default: return null;
    }
  };

  const isLoading = batches === undefined || recentLogs === undefined || recipes === undefined || roastedInventory === undefined || orders === undefined;

  if (isLoading) return <div className="p-8"><Skeleton className="h-[600px] w-full rounded-[2rem]" /></div>;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500 relative">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Production Hub</h1>
          <p className="text-slate-500 font-medium text-sm">Design and plan every batch with precision.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-1 md:flex-none">
            {(["plan", "blends", "forecast"] as const).map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>{t}</button>
            ))}
          </div>
          <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-xl transition-all ${isEditMode ? "bg-amber-500 text-slate-900 shadow-lg scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><LayoutIcon size={18} /></button>
        </div>
      </header>
      <CustomizableGrid items={cardOrder} onReorder={handleReorder} renderItem={renderCard} isEditMode={isEditMode} columns="grid-cols-1 lg:grid-cols-3" getItemClassName={(id) => id === "workflow" ? "lg:col-span-3" : ""} />
    </div>
  );
}
