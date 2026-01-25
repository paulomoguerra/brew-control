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
  ClipboardList,
  Info,
  Zap
} from "lucide-react";
import { useUnits } from "../../lib/units";
import { useToast } from "../../components/ui/Toast";
import { Card } from "../../components/ui/Card";
import { Skeleton } from "../../components/ui/Skeleton";
import { calculateRoastEconomics, calculateBlendCost } from "../../lib/finance";
import { CustomizableGrid } from "../../components/ui/CustomizableGrid";
import { RoastLogModal } from "../../components/RoastLogModal";

type TabType = "plan" | "blends" | "forecast";
type EconomicsMode = "quick" | "full";

export default function ProductionHub() {
  const { unit, toStorageWeight, toDisplayWeight, formatWeight, formatPrice, formatCurrency, toDisplayPrice } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const batches = useQuery(api.inventory.list);
  const roastedInventory = useQuery(api.inventory.listRoasted);
  const recentLogs = useQuery(api.roasts.listLogs);
  const recipes = useQuery(api.recipes.list);
  const orders = useQuery(api.orders.list);
  
  const addRecipe = useMutation(api.recipes.add);
  const logRoast = useMutation(api.roasts.logRoast);

  // Helpers
  const getAge = (arrivedAt?: number) => {
    if (!arrivedAt) return null;
    const months = Math.max(0, Math.floor((Date.now() - arrivedAt) / (30 * 24 * 60 * 60 * 1000)));
    return months === 0 ? "⁰" : months.toString().split('').map(d => "⁰¹²³⁴⁵⁶⁷⁸⁹"[parseInt(d)]).join('');
  };

  const OriginName = ({ name, arrivedAt, className = "" }: { name: string, arrivedAt?: number, className?: string }) => (
    <span className={`inline-flex items-baseline ${className}`}>
      {name}<sup className="ml-0.5 text-slate-400 font-black text-[10px]">{getAge(arrivedAt)}</sup>
    </span>
  );

  // UI State
  const [activeTab, setActiveTab] = useState<TabType>("plan");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [cardOrder, setCardOrder] = useState(["workflow", "green_assets", "roasted_stock", "activity_feed"]);
  const [economicsMode, setEconomicsMode] = useState<EconomicsMode>("full");

  // Plan Mode State
  const [plannedGreenIn, setPlannedGreenIn] = useState<string>("10");
  const [plannedRoastedOut, setPlannedRoastedOut] = useState<string>("8.5");
  const [planType, setPlanType] = useState<"single" | "blend">("single");
  const [selectedBatchId, setSelectedBatchId] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState("");
  
  // Logic: Smart Shrinkage Suggestion
  const suggestedShrinkage = useMemo(() => {
    if (selectedBatchId && recentLogs) {
      const batchLogs = recentLogs.filter(l => l.batchId === selectedBatchId);
      if (batchLogs.length > 0) {
        return (batchLogs.slice(0, 3).reduce((acc, curr) => acc + curr.shrinkagePercent, 0) / Math.min(3, batchLogs.length)).toFixed(1);
      }
    }
    return "15.0";
  }, [selectedBatchId, recentLogs]);

  const currentShrinkage = useMemo(() => {
    const g = parseFloat(plannedGreenIn) || 0;
    const r = parseFloat(plannedRoastedOut) || 0;
    if (g <= 0) return 0;
    return ((g - r) / g) * 100;
  }, [plannedGreenIn, plannedRoastedOut]);

  // Validation errors
  const validationErrors = useMemo(() => {
    const errors = [];
    const green = parseFloat(plannedGreenIn) || 0;
    const roasted = parseFloat(plannedRoastedOut) || 0;
    
    if (roasted > green && green > 0) {
      errors.push({
        type: 'critical' as const,
        message: 'Roasted weight cannot exceed green weight (violates physics)'
      });
    }
    
    const shrinkage = ((green - roasted) / green) * 100;
    if (green > 0 && roasted > 0) {
      if (shrinkage < 10) {
        errors.push({
          type: 'warning' as const,
          message: `Shrinkage ${shrinkage.toFixed(1)}% is unusually low (typical: 12-18%)`
        });
      }
      if (shrinkage > 25) {
        errors.push({
          type: 'warning' as const,
          message: `Shrinkage ${shrinkage.toFixed(1)}% is unusually high (typical: 12-18%)`
        });
      }
    }
    
    return errors;
  }, [plannedGreenIn, plannedRoastedOut]);

  // Optional Simulations - REMOVED, keeping only bag size
  const [targetBagSize, setTargetBagSize] = useState<string>("250"); // grams
  const [isCustomBagSize, setIsCustomBagSize] = useState(false);
  
  // Execution State (Logging from Plan)
  const [isLoggingPlanned, setIsLoggingPlanned] = useState(false);
  const [actualRoastedWeight, setActualRoastedWeight] = useState("");
  
  // Roast Log Modal
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);

  // Blend Designer State
  const [newBlendName, setNewBlendName] = useState("");
  const [targetShrinkage, setTargetShrinkage] = useState(15.0);
  const [blendComponents, setBlendComponents] = useState<{ greenBatchId: string, percentage: number }[]>([{ greenBatchId: "", percentage: 100 }]);

  useEffect(() => {
    const saved = localStorage.getItem("roasteros-production-layout-v6");
    if (saved) setCardOrder(JSON.parse(saved));
  }, []);

  const handleReorder = (newOrder: string[]) => {
    setCardOrder(newOrder);
    localStorage.setItem("roasteros-production-layout-v6", JSON.stringify(newOrder));
  };

  const selectedBatch = useMemo(() => batches?.find(b => b._id === selectedBatchId), [selectedBatchId, batches]);
  const selectedRecipe = useMemo(() => recipes?.find(r => r._id === selectedRecipeId), [selectedRecipeId, recipes]);
  
  // Hardcoded financials for now - will be replaced with database query
  const financials = useMemo(() => ({ laborRate: 20.00, gasRate: 5.00 }), []);

  const planResults = useMemo(() => {
    const greenVal = parseFloat(plannedGreenIn) || 0;
    const roastedVal = parseFloat(plannedRoastedOut) || 0;
    const bagSizeVal = parseFloat(targetBagSize) / 1000; // Convert grams to kg

    if (greenVal <= 0 || roastedVal <= 0) return null;
    
    // Validation: roasted cannot exceed green
    if (roastedVal > greenVal) return null;
    
    const bagsYield = Math.floor(roastedVal / bagSizeVal);

    if (planType === "single") {
      if (!selectedBatch) return null;
      
      // Check inventory availability (database stores in lbs)
      const availableKg = toDisplayWeight(selectedBatch.quantityLbs);
      const isPossible = availableKg >= greenVal;
      
      // Get cost per kg (convert from stored $/lb)
      const costPerKg = toDisplayPrice(selectedBatch.costPerLb);
      
      // Calculate costs in kg (assuming 12 min roast)
      const greenCost = greenVal * costPerKg;
      const laborCost = (financials.laborRate * (12 / 60)); // 12 minutes
      const gasCost = financials.gasRate;
      const totalCost = greenCost + laborCost + gasCost;
      const unitCost = totalCost / roastedVal;
      const costPerBag = unitCost * bagSizeVal;
      
      return { 
        type: "single" as const, 
        greenRequired: greenVal, 
        roastedYield: roastedVal,
        isPossible, 
        greenCost,
        laborCost,
        gasCost,
        totalCost,
        bagsYield,
        unitCost,
        costPerBag,
        maxPossible: availableKg,
        bottleneck: isPossible ? "" : selectedBatch.origin
      };
    } else {
      if (!selectedRecipe) return null;
      let limitingFactor = ""; 
      let maxPossibleOutput = Infinity;
      
      (selectedRecipe as any).components.forEach((comp: any) => {
        const b = batches?.find(x => x._id === comp.greenBatchId);
        if (b) {
          const availableKg = toDisplayWeight(b.quantityLbs);
          const possibleFromThis = (availableKg / (comp.percentage / 100));
          if (possibleFromThis < maxPossibleOutput) {
            maxPossibleOutput = possibleFromThis;
            limitingFactor = b.origin;
          }
        }
      });

      const isPossible = maxPossibleOutput >= greenVal;
      
      // Use recipe projected cost (already calculated per roasted kg)
      const costPerRoastedKg = (selectedRecipe as any).projectedCostPerLb * 2.20462; // Convert $/lb to $/kg
      const laborCost = (financials.laborRate * (12 / 60));
      const gasCost = financials.gasRate;
      const totalCost = (costPerRoastedKg * roastedVal) + laborCost + gasCost;
      const unitCost = totalCost / roastedVal;
      const costPerBag = unitCost * bagSizeVal;
      
      return { 
        type: "blend" as const, 
        greenRequired: greenVal, 
        roastedYield: roastedVal, 
        isPossible, 
        greenCost: costPerRoastedKg * greenVal,
        laborCost,
        gasCost,
        totalCost,
        bagsYield,
        unitCost,
        costPerBag,
        maxPossible: maxPossibleOutput,
        bottleneck: limitingFactor
      };
    }
  }, [plannedGreenIn, plannedRoastedOut, planType, selectedBatch, selectedRecipe, toStorageWeight, toDisplayWeight, toDisplayPrice, targetBagSize, batches, financials]);

  const blendStats = useMemo(() => {
    let totalPct = 0; 
    let weightedCost = 0;
    
    blendComponents.forEach(comp => {
      const b = batches?.find(x => x._id === comp.greenBatchId);
      if (b) {
        totalPct += comp.percentage;
        // Convert cost from $/lb to $/kg
        const costPerKg = toDisplayPrice(b.costPerLb);
        weightedCost += costPerKg * (comp.percentage / 100);
      }
    });
    
    // Calculate cost per roasted kg accounting for shrinkage
    const greenCostPerRoasted = weightedCost / (1 - (targetShrinkage / 100));
    
    // Operational costs (simplified - assume 10kg batch)
    const avgBatchSize = 10;
    const avgDuration = 12; // minutes
    const laborCostPerKg = (financials.laborRate * (avgDuration / 60)) / avgBatchSize;
    const gasCostPerKg = financials.gasRate / avgBatchSize;
    
    const projected = greenCostPerRoasted + laborCostPerKg + gasCostPerKg;
    
    return { 
      totalPct, 
      weightedCost,
      greenCostPerRoasted,
      operationalCost: laborCostPerKg + gasCostPerKg,
      projected 
    };
  }, [blendComponents, batches, targetShrinkage, financials, toDisplayPrice]);

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
      await logRoast({
        batchId: selectedBatch._id,
        productName: `${selectedBatch.origin} Roast`,
        greenWeightIn: toStorageWeight(planResults.greenRequired),
        roastedWeightOut: toStorageWeight(roastedOut),
        durationMinutes: 12,
        laborRate: financials.laborRate,
        gasCostPerBatch: financials.gasRate
      });
      showToast("Roast logged successfully", "success");
      setIsLoggingPlanned(false); setPlannedGreenIn("10"); setPlannedRoastedOut("8.5"); setActualRoastedWeight("");
    } catch (err) { 
      showToast((err as Error).message || "Failed to log roast", "error"); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleSaveBlend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(blendStats.totalPct - 100) > 0.1) { showToast("Blend must total 100%", "error"); return; }
    try {
      // Convert projected cost from $/kg to $/lb for storage
      const projectedPerLb = blendStats.projected / 2.20462;
      await addRecipe({ name: newBlendName, targetShrinkage, components: blendComponents as any, projectedCostPerLb: projectedPerLb });
      showToast("Blend recipe saved", "success");
      setNewBlendName(""); setBlendComponents([{ greenBatchId: "", percentage: 100 }]);
    } catch (err) { showToast("Error saving blend", "error"); }
  };

  const renderWorkflowCard = () => {
    switch(activeTab) {
      case "plan": return (
        <Card title="Production Planner" subtitle="Target-based simulations & execution">
           <div className="space-y-10">
               {/* Mode Toggle - REMOVED Advanced Simulations button */}
               <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                 <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-fit overflow-x-auto no-scrollbar">
                   <button onClick={() => setPlanType("single")} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planType === "single" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}>Single Origin</button>
                   <button onClick={() => setPlanType("blend")} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${planType === "blend" ? "bg-white shadow-md text-slate-900" : "text-slate-500"}`}>Blend Recipe</button>
                 </div>
                 
                 {/* Economics Mode Toggle */}
                 <div className="flex items-center gap-2">
                   <button onClick={() => setEconomicsMode("quick")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${economicsMode === "quick" ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-500"}`}>
                     <Zap size={12} className="inline mr-1" />Quick
                   </button>
                   <button onClick={() => setEconomicsMode("full")} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${economicsMode === "full" ? "bg-amber-500 text-slate-900" : "bg-slate-100 text-slate-500"}`}>
                     <Calculator size={12} className="inline mr-1" />Full Economics
                   </button>
                 </div>
               </div>
               
               {/* NEW 50/50 LAYOUT */}
               <div className="grid grid-cols-1 gap-12 items-start lg:grid-cols-2">
                 {/* LEFT COLUMN (1/2) - INPUTS */}
                 <div className="space-y-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Green Bean In ({unit})</label>
                     <div className="relative">
                       <input type="number" step="0.1" value={plannedGreenIn} onChange={e => setPlannedGreenIn(e.target.value)} className="input-field bg-slate-50 text-2xl font-black py-6 pl-6 pr-12 rounded-[2rem] border-none focus:ring-2 focus:ring-amber-500/20" placeholder="0.0" />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">{unit}</div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roasted Bean Out ({unit})</label>
                     <div className="relative">
                       <input type="number" step="0.1" value={plannedRoastedOut} onChange={e => setPlannedRoastedOut(e.target.value)} className="input-field bg-slate-50 text-2xl font-black py-6 pl-6 pr-12 rounded-[2rem] border-none focus:ring-2 focus:ring-amber-500/20" placeholder="0.0" />
                       <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">{unit}</div>
                     </div>
                   </div>

                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                       Calculated Shrinkage <span className="text-amber-500 italic">Suggested {suggestedShrinkage}%</span>
                     </label>
                     <div className="p-6 bg-slate-50 rounded-[2rem] text-2xl font-black text-slate-300 flex items-center justify-between shadow-inner">
                       <span>{currentShrinkage.toFixed(1)}</span>
                       <span className="text-slate-200">%</span>
                     </div>
                   </div>
                   
                   {/* Bag Size Selector */}
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bag Target</label>
                     <select 
                       value={isCustomBagSize ? "custom" : targetBagSize} 
                       onChange={(e) => {
                         if (e.target.value === "custom") {
                           setIsCustomBagSize(true);
                         } else {
                           setIsCustomBagSize(false);
                           setTargetBagSize(e.target.value);
                         }
                       }} 
                       className="input-field bg-slate-50 py-4 rounded-xl border-none font-black"
                     >
                       <option value="250">250g Retail</option>
                       <option value="500">500g Retail</option>
                       <option value="1000">1kg Wholesale</option>
                       <option value="custom">Custom...</option>
                     </select>
                     
                     {isCustomBagSize && (
                       <input 
                         type="number" 
                         placeholder="Enter bag size (grams)"
                         onChange={(e) => setTargetBagSize(e.target.value)}
                         className="input-field bg-slate-50 py-4 rounded-xl border-none font-black"
                       />
                     )}
                   </div>
                   
                   {/* Validation Errors */}
                   {validationErrors.length > 0 && (
                     <div className="space-y-2">
                       {validationErrors.map((err, idx) => (
                         <div key={idx} className={`p-4 rounded-2xl flex items-start gap-3 ${err.type === 'critical' ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                           <AlertCircle size={16} className={err.type === 'critical' ? 'text-red-600 mt-0.5' : 'text-amber-600 mt-0.5'} />
                           <span className={`text-[10px] font-bold ${err.type === 'critical' ? 'text-red-700' : 'text-amber-700'}`}>{err.message}</span>
                         </div>
                       ))}
                     </div>
                   )}

                   <div className="space-y-4">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{planType === "single" ? "Select Source Batch" : "Select Recipe"}</label>
                     <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                       {planType === "single" ? (
                         batches?.filter(b => b.quantityLbs > 1).map(b => (
                           <button key={b._id} onClick={() => setSelectedBatchId(b._id)} className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedBatchId === b._id ? "border-amber-500 bg-amber-50/50 scale-[0.98]" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"}`}>
                             <div className="flex justify-between items-start mb-1">
                               <OriginName name={b.origin} arrivedAt={b.arrivedAt} className="font-black text-slate-900 uppercase text-xs" />
                               <span className="text-[10px] font-black text-slate-400">{formatWeight(b.quantityLbs)}</span>
                             </div>
                             <div className="text-[8px] font-bold text-slate-400 uppercase">ID: {b.batchNumber}</div>
                           </button>
                         ))
                       ) : (
                         recipes?.map(r => (
                           <button key={r._id} onClick={() => setSelectedRecipeId(r._id)} className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedRecipeId === r._id ? "border-amber-500 bg-amber-50/50 scale-[0.98]" : "border-slate-50 bg-slate-50/50 hover:border-slate-200"}`}>
                             <div className="font-black text-slate-900 uppercase text-xs mb-1">{r.name}</div>
                             <div className="text-[8px] font-bold text-slate-400 uppercase">{r.components.length} Components</div>
                           </button>
                         ))
                       )}
                     </div>
                   </div>
                 </div>
                 
                 {/* RIGHT COLUMN (1/2) - RESULTS (DARK BOX) */}
                 <div className="flex flex-col justify-center h-full">
                   {planResults ? (
                     <div className={`p-10 rounded-[3rem] space-y-6 shadow-2xl transition-all ${planResults.isPossible && validationErrors.every(e => e.type !== 'critical') ? "bg-slate-900 text-white" : "bg-red-50 border-2 border-red-100 text-red-900"}`}>
                        {!isLoggingPlanned ? (
                          <>
                            {/* COST BREAKDOWN */}
                            <div className="p-6 bg-white/5 rounded-2xl">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Cost Breakdown</h3>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Green Cost</span>
                                  <span className="font-black">{formatCurrency(planResults.greenCost)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Labor Cost</span>
                                  <span className="font-black">{formatCurrency(planResults.laborCost)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Gas Cost</span>
                                  <span className="font-black">{formatCurrency(planResults.gasCost)}</span>
                                </div>
                                <div className="h-px bg-white/10 my-2"></div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-amber-500">TOTAL</span>
                                  <span className="font-black text-lg">{formatCurrency(planResults.totalCost)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-amber-500">Cost/kg</span>
                                  <span className="font-black text-xl text-amber-500">{formatPrice(planResults.unitCost)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* YIELD */}
                            <div className="p-6 bg-white/5 rounded-2xl">
                              <h3 className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-4">Yield</h3>
                              <div className="space-y-3">
                                <div className="text-center">
                                  <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Green Required</span>
                                  <div className="text-4xl font-black tracking-tighter italic">{planResults.greenRequired.toFixed(1)} <span className="text-lg not-italic uppercase opacity-40">{unit}</span></div>
                                </div>
                                <div className="h-px bg-white/10"></div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Bags Yield</span>
                                  <span className="font-black text-lg">{planResults.bagsYield} x {targetBagSize}g</span>
                                </div>
                                <div className="flex justify-between items-center">
                                  <span className="text-[9px] font-black uppercase text-slate-400">Cost/bag</span>
                                  <span className="font-black text-xl text-amber-500">{formatCurrency(planResults.costPerBag)}</span>
                                </div>
                              </div>
                            </div>
                            
                            {/* STATUS */}
                            <div className="pt-4 flex items-center justify-center gap-6 border-t border-white/5">
                              <div className="flex items-center gap-2">
                                {planResults.isPossible && validationErrors.every(e => e.type !== 'critical') ? 
                                  <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest"><div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Inventory OK</div> : 
                                  <div className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest"><AlertCircle size={14} /> {validationErrors.length > 0 ? 'Invalid Input' : `Low: ${planResults.bottleneck}`}</div>
                                }
                              </div>
                              <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Max Cap: {planResults.maxPossible.toFixed(0)} {unit}</div>
                            </div>
                            
                            {/* LOG BUTTON */}
                            {planResults.isPossible && validationErrors.every(e => e.type !== 'critical') && <button onClick={() => { setIsLoggingPlanned(true); setActualRoastedWeight(plannedRoastedOut); }} className="w-full mt-6 py-5 bg-amber-500 text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl">Log Successful Production</button>}
                          </>
                        ) : (
                          <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center px-4"><span className="text-xs font-black text-amber-500 uppercase tracking-widest italic">Fast Log</span><button onClick={() => setIsLoggingPlanned(false)} className="text-slate-500 hover:text-white"><X size={20}/></button></div>
                            <div className="bg-white/5 p-8 rounded-[2rem] border border-white/10"><div className="text-left space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Actual Roasted ({unit})</label><input type="number" step="0.1" autoFocus value={actualRoastedWeight} onChange={e => setActualRoastedWeight(e.target.value)} className="w-full bg-transparent border-none text-5xl font-black text-white focus:ring-0 placeholder:text-white/10" placeholder="0.00" /></div></div>
                            <div className="flex gap-4"><button onClick={() => setIsLoggingPlanned(false)} className="flex-1 py-4 bg-white/5 text-slate-500 font-black uppercase text-[10px] tracking-widest rounded-2xl hover:bg-white/10">Cancel</button><button disabled={isSubmitting || !actualRoastedWeight} onClick={handleLogPlanned} className="flex-[2] py-4 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-400 transition-colors disabled:opacity-50">{isSubmitting ? <Loader2 className="animate-spin mx-auto" size={16}/> : "Confirm & Update"}</button></div>
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
           <form onSubmit={handleSaveBlend} className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
                 {/* Left Column - Inputs */}
                 <div className="lg:col-span-1 space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blend Identity</label>
                      <input placeholder="Recipe Name" value={newBlendName} onChange={e => setNewBlendName(e.target.value)} className="input-field bg-slate-50 border-none rounded-[2rem] py-6 font-black text-xl focus:ring-2 focus:ring-amber-500/20" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Shrinkage %</label>
                      <div className="relative">
                        <input type="number" step="0.1" value={targetShrinkage} onChange={e => setTargetShrinkage(parseFloat(e.target.value))} className="input-field bg-slate-50 border-none rounded-[2rem] py-6 pl-6 pr-12 font-black text-2xl focus:ring-2 focus:ring-amber-500/20" />
                        <div className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 font-black">%</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex justify-between">
                        Blend Balance <span className={`${Math.abs(blendStats.totalPct - 100) < 0.1 ? "text-green-500" : "text-amber-500"}`}>{blendStats.totalPct}%</span>
                      </label>
                      <div className="p-6 bg-slate-50 rounded-[2rem] shadow-inner">
                        <div className="w-full h-4 bg-slate-200 rounded-full flex overflow-hidden">
                          {blendComponents.map((comp, idx) => { 
                            const colors = ["bg-amber-500", "bg-amber-700", "bg-slate-800", "bg-slate-400"]; 
                            return <div key={idx} style={{ width: `${comp.percentage}%` }} className={`${colors[idx % colors.length]} transition-all duration-500 border-r border-white/20 last:border-0`} />; 
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Blend Components</label>
                      <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {blendComponents.map((comp, idx) => (
                          <div key={idx} className="p-5 bg-slate-50 rounded-2xl border-2 border-transparent hover:border-amber-500/30 transition-all group">
                             <div className="flex items-center gap-3 mb-3">
                               <select 
                                 value={comp.greenBatchId} 
                                 onChange={e => { const newComps = [...blendComponents]; newComps[idx].greenBatchId = e.target.value; setBlendComponents(newComps); }} 
                                 className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm font-black uppercase focus:ring-2 focus:ring-amber-500/20"
                               >
                                 <option value="">Select Origin...</option>
                                 {batches?.map(b => <option key={b._id} value={b._id}>{b.origin}</option>)}
                               </select>
                               <button 
                                 onClick={() => setBlendComponents(blendComponents.filter((_, i) => i !== idx))} 
                                 type="button" 
                                 className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                               >
                                 <X size={18} />
                               </button>
                             </div>
                             <div className="relative">
                               <input 
                                 type="number" 
                                 value={comp.percentage} 
                                 onChange={e => { const newComps = [...blendComponents]; newComps[idx].percentage = parseFloat(e.target.value) || 0; setBlendComponents(newComps); }} 
                                 className="w-full bg-white border border-slate-200 rounded-xl px-4 pr-10 font-black py-3 text-lg focus:ring-2 focus:ring-amber-500/20 text-right" 
                               />
                               <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">%</span>
                             </div>
                          </div>
                        ))}
                        <button 
                          type="button" 
                          onClick={() => setBlendComponents([...blendComponents, { greenBatchId: "", percentage: 0 }])} 
                          className="flex items-center justify-center gap-2 p-5 border-2 border-dashed border-slate-200 rounded-2xl text-amber-600 font-black uppercase text-[10px] tracking-widest hover:border-amber-500 hover:text-amber-700 transition-all group"
                        >
                          <Plus size={16} className="group-hover:scale-110 transition-transform" /> Add Component
                        </button>
                      </div>
                    </div>
                 </div>
                 
                 {/* Right Column - Results */}
                 <div className="lg:col-span-2 flex flex-col justify-center h-full">
                    <div className="p-10 rounded-[3rem] bg-slate-900 text-white shadow-2xl space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-white/5 rounded-2xl text-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Completeness</span>
                          <div className={`text-2xl font-black ${Math.abs(blendStats.totalPct - 100) < 0.1 ? "text-green-400" : "text-red-400"}`}>{blendStats.totalPct}%</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl text-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Weighted Green</span>
                          <div className="text-lg font-black text-white">{formatPrice(blendStats.weightedCost)}</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-2xl text-center">
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 block mb-2">Shrinkage</span>
                          <div className="text-2xl font-black text-amber-500">{targetShrinkage}%</div>
                        </div>
                      </div>
                      
                      <div className="text-center py-8 border-y border-white/5">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em] block mb-3">Projected Roasted Cost</span>
                        <div className="text-6xl font-black italic tracking-tighter text-white mb-1">{formatPrice(blendStats.projected)}</div>
                        <span className="text-sm font-black text-slate-500 uppercase tracking-widest">per roasted kg</span>
                      </div>
                      
                      <div className="flex items-center justify-center gap-6">
                        <div className="flex items-center gap-2">
                          {Math.abs(blendStats.totalPct - 100) < 0.1 && newBlendName ? 
                            <div className="flex items-center gap-2 text-green-400 text-[10px] font-black uppercase tracking-widest">
                              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Ready to Save
                            </div> : 
                            <div className="flex items-center gap-2 text-amber-500 text-[10px] font-black uppercase tracking-widest">
                              <AlertCircle size={14} /> {!newBlendName ? "Name Required" : "Balance Required"}
                            </div>
                          }
                        </div>
                      </div>
                      
                      <button 
                        type="submit" 
                        disabled={Math.abs(blendStats.totalPct - 100) > 0.1 || !newBlendName} 
                        className="w-full py-5 bg-amber-500 text-slate-900 rounded-[1.5rem] font-black uppercase text-xs tracking-[0.2em] hover:bg-amber-400 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save Recipe
                      </button>
                    </div>
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
                   <button onClick={() => { setActiveTab("plan"); setPlannedRoastedOut(res.roastedQty.toString()); const recipe = recipes?.find(r => r.name === res.name); if (recipe) { setPlanType("blend"); setSelectedRecipeId(recipe._id); } else { setPlanType("single"); const batch = batches?.find(b => b.origin === res.name); if (batch) setSelectedBatchId(batch._id); } }} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-amber-500 hover:text-slate-900 transition-all">Add to Production Plan</button>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
               {batches?.map(b => {
                 const isOldCrop = b.arrivedAt && (Date.now() - b.arrivedAt > 180 * 24 * 60 * 60 * 1000);
                 const health = b.quantityLbs > 100 ? "text-green-500" : b.quantityLbs > 20 ? "text-amber-500" : "text-red-500";
                 return (
                   <div key={b._id} className="flex justify-between items-center p-5 bg-slate-50 rounded-[1.5rem] border border-transparent shadow-sm hover:border-slate-200 transition-all"><div className="flex flex-col"><div className="flex items-center gap-2"><OriginName name={b.origin} arrivedAt={b.arrivedAt} className="font-black text-slate-900 text-sm uppercase tracking-tight" />{isOldCrop && <span className="text-[7px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">Old Crop</span>}</div><span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Lot: {b.batchNumber}</span></div><div className={`font-black text-base ${health}`}>{formatWeight(b.quantityLbs)}</div></div>
                 );
               })}
            </div>
         </Card>
      );
      case "roasted_stock": return (
         <Card title="Roasted Stock" subtitle="Finished inventory health">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar p-2">
               {roastedInventory?.filter(r => r.quantityLbs > 0).map(r => (
                 <div key={r._id} className="flex justify-between items-center p-5 bg-amber-50/20 rounded-[1.5rem] border border-amber-100/50 shadow-sm"><div><div className="font-black text-amber-900 text-sm uppercase tracking-tight">{r.productName}</div><div className="text-[8px] font-black text-amber-600/60 uppercase tracking-widest mt-1">{r.roastLogId ? "Verified Batch" : "Manual Log"}</div></div><div className="text-right"><span className="font-black text-amber-950 text-base">{formatWeight(r.quantityLbs)}</span><div className="text-[8px] font-black text-slate-400 uppercase tracking-tighter mt-0.5 opacity-60">Created: {new Date(r._creationTime).toLocaleDateString()}</div></div></div>
               ))}
            </div>
         </Card>
      );
      case "activity_feed": return (
         <Card title="Roast Log History" subtitle="Complete batch tracking">
            <div className="space-y-6">
              {/* STATS */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl">
                  <div className="text-3xl font-black text-slate-900">{recentLogs?.length || 0}</div>
                  <div className="text-[10px] uppercase text-slate-500 font-black mt-1">Total Roasts</div>
                </div>
                <div className="text-center p-4 bg-amber-50 rounded-xl">
                  <div className="text-3xl font-black text-amber-600">
                    {recentLogs && recentLogs.length > 0 
                      ? (recentLogs.reduce((acc, log) => acc + log.shrinkagePercent, 0) / recentLogs.length).toFixed(1)
                      : "0.0"
                    }%
                  </div>
                  <div className="text-[10px] uppercase text-slate-500 font-black mt-1">Avg Shrinkage</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl">
                  <div className="text-3xl font-black text-green-600">
                    {recentLogs?.filter(log => log.roastDate > Date.now() - 7 * 24 * 60 * 60 * 1000).length || 0}
                  </div>
                  <div className="text-[10px] uppercase text-slate-500 font-black mt-1">Last 7 Days</div>
                </div>
              </div>
              
              {/* VIEW FULL HISTORY BUTTON */}
              <button 
                onClick={() => setIsLogModalOpen(true)}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs hover:bg-amber-500 hover:text-slate-900 transition-all shadow-lg"
              >
                View Full History →
              </button>
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
        <div><h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Production Hub</h1><p className="text-slate-500 font-medium text-sm">Design and plan every batch with precision.</p></div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="flex bg-slate-100 p-1.5 rounded-2xl flex-1 md:flex-none overflow-x-auto no-scrollbar">
            {[
              { id: "plan", label: "Planning" },
              { id: "blends", label: "Blend Design" },
              { id: "forecast", label: "Orders" }
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as TabType)} className={`flex-1 md:flex-none px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.id ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700"}`}>{t.label}</button>
            ))}
          </div>
          <button onClick={() => setIsEditMode(!isEditMode)} className={`p-3 rounded-xl transition-all ${isEditMode ? "bg-amber-500 text-slate-900 shadow-lg scale-105" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}><LayoutIcon size={18} /></button>
        </div>
      </header>
      <CustomizableGrid items={cardOrder} onReorder={handleReorder} renderItem={renderCard} isEditMode={isEditMode} columns="grid-cols-1 lg:grid-cols-3" getItemClassName={(id) => id === "workflow" ? "lg:col-span-3" : ""} />
      
      {/* Roast Log Modal */}
      <RoastLogModal isOpen={isLogModalOpen} onClose={() => setIsLogModalOpen(false)} />
    </div>
  );
}
