"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Flame, Loader2, CheckCircle2, BarChart3, AlertCircle, Clock, Coins, X, Calculator } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { calculateRoastEconomics } from '../../lib/finance';

export default function RoastProductionPage() {
  const { unit, toStorageWeight, toDisplayWeight, formatWeight, formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const batches = useQuery(api.inventory.list);
  const recentLogs = useQuery(api.roasts.listLogs);
  const logRoast = useMutation(api.roasts.logRoast);

  const isLoading = batches === undefined || recentLogs === undefined;

  // UI State
  const [activeMode, setActiveMode] = useState<'log' | 'plan'>('log');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null);
  
  // Form Inputs (Log Mode)
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [greenWeightIn, setGreenWeightIn] = useState<string>('');
  const [roastedWeightOut, setRoastedWeightOut] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [duration, setDuration] = useState<number>(12);

  // Form Inputs (Plan Mode)
  const [planGoal, setPlanGoal] = useState<string>(''); 

  const selectedBatch = useMemo(() => 
    batches?.find(b => b._id === selectedBatchId), 
  [selectedBatchId, batches]);

  // Operational Config
  const financials = useMemo(() => ({
    laborRate: 20.00,
    gasRate: 5.00,
    utilityRate: 0,
  }), []);

  // Planning Math
  const planResults = useMemo(() => {
    const goalVal = parseFloat(planGoal) || 0;
    if (goalVal <= 0 || !selectedBatch) return null;
    
    const estimatedShrinkage = 15.5; // Average target
    const greenRequiredDisplay = goalVal / (1 - (estimatedShrinkage / 100));
    const greenRequiredLbs = toStorageWeight(greenRequiredDisplay);
    const isPossible = selectedBatch.quantityLbs >= greenRequiredLbs;
    
    return {
      greenRequired: greenRequiredDisplay,
      isPossible,
      remainingAfter: selectedBatch.quantityLbs - greenRequiredLbs
    };
  }, [planGoal, selectedBatch, toStorageWeight]);

  // Economics Logic (Log Mode)
  const economics = useMemo(() => {
    const greenInVal = parseFloat(greenWeightIn) || 0;
    const roastedOutVal = parseFloat(roastedWeightOut) || 0;
    
    if (!selectedBatch || greenInVal <= 0 || roastedOutVal <= 0) return null;
    
    const greenInLbs = toStorageWeight(greenInVal);
    const roastedOutLbs = toStorageWeight(roastedOutVal);
    const hourlyRate = (financials.laborRate || 0) + (financials.gasRate || 0) + (financials.utilityRate || 0);
    const overheadCost = hourlyRate * (duration / 60);

    const result = calculateRoastEconomics(
      greenInLbs,
      roastedOutLbs,
      selectedBatch.costPerLb,
      overheadCost
    );

    return {
      shrinkage: ( (greenInLbs - roastedOutLbs) / greenInLbs ) * 100,
      roastedCostPerLb: result.costPerRoastedLb,
      totalGreenCost: result.greenCost,
      overheadCost: result.totalCost - result.greenCost,
      totalBatchCost: result.totalCost
    };
  }, [selectedBatch, greenWeightIn, roastedWeightOut, duration, financials, toStorageWeight]);

  const handleSubmitRoast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch || !economics) return;
    
    setIsSubmitting(true);
    const greenInLbs = toStorageWeight(parseFloat(greenWeightIn));
    const roastedOutLbs = toStorageWeight(parseFloat(roastedWeightOut));

    try {
      await logRoast({
        batchId: selectedBatch._id,
        productName: productName || `${selectedBatch.origin} Roast`,
        greenWeightIn: greenInLbs,
        roastedWeightOut: roastedOutLbs,
        durationMinutes: duration,
        laborRate: financials.laborRate,
        gasCostPerBatch: (financials.gasRate * (duration/60))
      });

      showToast('Roast logged successfully', 'success');
      setGreenWeightIn('');
      setRoastedWeightOut('');
      setProductName('');
      setDuration(12);
    } catch (err) {
      console.error(err);
      showToast('Failed to log roast', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <div className="lg:col-span-2 space-y-6 md:space-y-8">
            <Skeleton className="h-[350px] md:h-[400px] rounded-[2rem]" />
            <Skeleton className="h-[350px] md:h-[400px] rounded-[2rem]" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[450px] md:h-[500px] rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
             <button 
               onClick={() => setActiveMode('log')}
               className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'log' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Live Log
             </button>
             <button 
               onClick={() => setActiveMode('plan')}
               className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${activeMode === 'plan' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Production Plan
             </button>
          </div>

          {activeMode === 'log' ? (
            <Card title="Log Roast Batch" subtitle="Sync Production with Inventory">
              <form onSubmit={handleSubmitRoast} className="space-y-4 md:space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Green Coffee Batch</label>
                   <select required value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input-field">
                     <option value="">Select Green Coffee...</option>
                     {batches?.map(b => (
                       <option key={b._id} value={b._id}>{b.batchNumber} - {b.origin} ({formatWeight(b.quantityLbs)})</option>
                     ))}
                   </select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                      <input type="text" placeholder="e.g. House Espresso" value={productName} onChange={e => setProductName(e.target.value)} className="input-field" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Duration</label>
                      <div className="relative">
                          <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input type="number" required min="1" placeholder="min" value={duration} onChange={e => setDuration(parseFloat(e.target.value))} className="input-field pl-12" />
                      </div>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Green In ({unit})</label>
                    <input type="number" step="0.01" required value={greenWeightIn} onChange={e => setGreenWeightIn(e.target.value)} className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Roasted Out ({unit})</label>
                    <input type="number" step="0.01" required value={roastedWeightOut} onChange={e => setRoastedWeightOut(e.target.value)} className="input-field" />
                  </div>
                </div>
                <button type="submit" disabled={isSubmitting || !economics} className="btn-primary w-full mt-2">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Flame />}
                  {isSubmitting ? "Syncing..." : "Finalize & Log Roast"}
                </button>
              </form>
            </Card>
          ) : (
            <Card title="Production Planner" subtitle="Reverse Calculation for Roast Goals">
               <div className="space-y-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Roasted Amount ({unit})</label>
                     <div className="relative">
                        <Calculator className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                          type="number" 
                          placeholder={`How much roasted coffee do you need?`} 
                          value={planGoal} 
                          onChange={e => setPlanGoal(e.target.value)} 
                          className="input-field pl-12 text-lg"
                        />
                     </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Available Green Coffee</label>
                    <div className="grid gap-3">
                       {batches?.slice(0, 5).map(b => (
                         <button 
                           key={b._id} 
                           onClick={() => setSelectedBatchId(b._id)}
                           className={`p-4 rounded-2xl border-2 text-left transition-all flex justify-between items-center ${selectedBatchId === b._id ? 'border-amber-500 bg-amber-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                         >
                            <div>
                               <div className="font-bold text-slate-900">{b.origin}</div>
                               <div className="text-[10px] font-black text-slate-400 uppercase">{b.batchNumber}</div>
                            </div>
                            <div className="text-right">
                               <div className="font-black text-slate-900">{formatWeight(b.quantityLbs)}</div>
                               <div className="text-[10px] font-bold text-slate-400 uppercase">In Stock</div>
                            </div>
                         </button>
                       ))}
                    </div>
                  </div>
               </div>
            </Card>
          )}

          <Card title="History">
            <div className="divide-y divide-slate-100 -mx-6 md:mx-0">
              {recentLogs?.map((log) => (
                <div 
                  key={log._id} 
                  onClick={() => setSelectedLog(log)}
                  className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div className="truncate pr-4">
                    <div className="font-bold text-slate-900 truncate">{log.productName}</div>
                    <div className="text-[10px] md:text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{new Date(log.roastDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <div className="font-black text-slate-900 text-sm md:text-base">{formatWeight(log.roastedWeightOut)}</div>
                    <div className={`text-[10px] md:text-xs font-bold mt-1 ${log.shrinkagePercent > 16 ? 'text-red-500' : 'text-green-600'}`}>{log.shrinkagePercent.toFixed(1)}% Loss</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Historical Detail View */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedLog(null)}>
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                <button onClick={() => setSelectedLog(null)} className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-20"><X size={16} /></button>
                <div className="relative z-10 space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Historical Analysis</span>
                    <h3 className="text-xl font-bold mt-1">{selectedLog.productName}</h3>
                    <div className="text-4xl font-black mt-4">{formatPrice(selectedLog.trueCostPerLb)}</div>
                    <p className="text-slate-400 text-[10px] font-bold mt-1 uppercase tracking-widest">True Production Cost</p>
                  </div>
                  <div className="space-y-2 text-sm border-t border-slate-800 pt-4">
                    <div className="flex justify-between"><span>Shrinkage</span><span className="font-bold text-amber-400">{selectedLog.shrinkagePercent.toFixed(1)}%</span></div>
                    <div className="flex justify-between"><span>Weight Out</span><span className="font-bold">{formatWeight(selectedLog.roastedWeightOut)}</span></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeMode === 'log' ? (
            economics ? (
              <div className="bg-slate-900 text-white rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden lg:sticky lg:top-24">
                <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                <div className="relative z-10 space-y-6">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Live Economics</span>
                    <div className="text-4xl md:text-5xl font-black tracking-tighter mt-2">{formatPrice(economics.roastedCostPerLb)}</div>
                    <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-widest">True Production Cost</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs border-b border-slate-700 pb-2">
                       <span className="text-slate-400 font-bold">Total Batch Cost</span>
                       <span className="font-bold">{formatCurrency(economics.totalBatchCost)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Shrinkage</span>
                      <div className="text-xl font-black text-amber-400">{economics.shrinkage.toFixed(1)}%</div>
                    </div>
                    <div className="p-3 bg-slate-800/50 rounded-2xl border border-slate-700 text-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Yield</span>
                      <div className="text-xl font-black">{formatWeight(parseFloat(roastedWeightOut) || 0)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-[2rem] p-8 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 h-48 opacity-60 lg:sticky lg:top-24">
                <p className="text-slate-500 text-sm font-medium">Enter data for Live Analysis.</p>
              </div>
            )
          ) : (
            // Planning Sidebar
            <div className={`rounded-[2rem] p-6 md:p-8 shadow-2xl relative overflow-hidden lg:sticky lg:top-24 transition-all ${planResults?.isPossible ? 'bg-amber-500 text-slate-900' : 'bg-slate-900 text-white'}`}>
                {planResults ? (
                  <div className="space-y-6">
                     <div>
                        <span className={`text-[10px] font-black uppercase tracking-[0.3em] ${planResults.isPossible ? 'text-slate-900/60' : 'text-amber-500'}`}>Green Coffee Required</span>
                        <div className="text-4xl md:text-5xl font-black tracking-tighter mt-2">
                          {planResults.greenRequired.toFixed(1)} <span className="text-lg">{unit}</span>
                        </div>
                        {!planResults.isPossible && (
                           <div className="flex items-center gap-2 mt-4 p-3 bg-red-500/20 rounded-xl text-red-200 text-xs font-bold">
                              <AlertCircle size={16} />
                              Insufficient Inventory
                           </div>
                        )}
                     </div>

                     <div className={`p-4 rounded-2xl border ${planResults.isPossible ? 'bg-white/20 border-white/30' : 'bg-slate-800/50 border-slate-700'} space-y-3`}>
                        <div className="flex justify-between text-xs font-bold">
                           <span>Remaining after roast</span>
                           <span>{formatWeight(toDisplayWeight(planResults.remainingAfter))}</span>
                        </div>
                        <div className="h-2 w-full bg-black/10 rounded-full overflow-hidden">
                           <div className="h-full bg-black/30" style={{ width: `${Math.max(0, (planResults.remainingAfter / selectedBatch!.quantityLbs) * 100)}%` }} />
                        </div>
                     </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-48 text-center opacity-60">
                    <Calculator size={32} className="mb-4" />
                    <p className="text-sm font-bold">Enter a goal and select a bean to calculate inventory needs.</p>
                  </div>
                )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
