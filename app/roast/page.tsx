"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Flame, Loader2, CheckCircle2, BarChart3, AlertCircle, Clock, Coins, X } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { calculateRoastEconomics } from '../../lib/finance';

export default function RoastProductionPage() {
  const { unit, toStorageWeight, formatWeight, formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Data Fetching
  const batches = useQuery(api.inventory.list);
  const recentLogs = useQuery(api.roasts.listLogs);
  const logRoast = useMutation(api.roasts.logRoast);

  const isLoading = batches === undefined || recentLogs === undefined;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(null); // State for modal view
  
  // Form Inputs
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [greenWeightIn, setGreenWeightIn] = useState<string>('');
  const [roastedWeightOut, setRoastedWeightOut] = useState<string>('');
  const [productName, setProductName] = useState('');
  const [duration, setDuration] = useState<number>(12); // Default 12 mins

  const selectedBatch = useMemo(() => 
    batches?.find(b => b._id === selectedBatchId), 
  [selectedBatchId, batches]);

  // Operational Config (Hardcoded for now - will be in settings later)
  const financials = useMemo(() => ({
    laborRate: 20.00, // $20/hr
    gasRate: 5.00,    // $5/hr estimate
    utilityRate: 0,
  }), []);

  // Economics Logic
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
      // The Mutation now handles inventory deduction and true-cost calc on the server
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
      console.error("Roast Transaction failed:", err);
      showToast('Failed to log roast', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <Skeleton className="h-[400px] rounded-[2rem]" />
            <Skeleton className="h-[400px] rounded-[2rem]" />
          </div>
          <div className="lg:col-span-1">
            <Skeleton className="h-[500px] rounded-[2rem]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <Card title="New Roast Batch" subtitle="Input Production Data">
            <form onSubmit={handleSubmitRoast} className="space-y-6">
              <select required value={selectedBatchId} onChange={e => setSelectedBatchId(e.target.value)} className="input-field">
                <option value="">Select Green Coffee...</option>
                {batches?.map(b => (
                  <option key={b._id} value={b._id}>{b.batchNumber} - {b.origin} ({formatWeight(b.quantityLbs)})</option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-6">
                 <input type="text" placeholder="Product Name (Optional)" value={productName} onChange={e => setProductName(e.target.value)} className="input-field" />
                 <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="number" 
                      required 
                      min="1"
                      placeholder="Duration (min)" 
                      value={duration} 
                      onChange={e => setDuration(parseFloat(e.target.value))} 
                      className="input-field pl-12" 
                    />
                 </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <input type="number" required placeholder={`Green In (${unit})`} value={greenWeightIn} onChange={e => setGreenWeightIn(e.target.value)} className="input-field" />
                <input type="number" required placeholder={`Roasted Out (${unit})`} value={roastedWeightOut} onChange={e => setRoastedWeightOut(e.target.value)} className="input-field" />
              </div>
              <button type="submit" disabled={isSubmitting || !economics} className="btn-primary w-full">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <Flame />}
                {isSubmitting ? "Finalizing..." : "Submit Production Roast"}
              </button>
            </form>
          </Card>

          <Card title="Recent Roasts">
            <div className="divide-y divide-slate-100">
              {recentLogs?.map((log) => (
                <div 
                  key={log._id} 
                  onClick={() => setSelectedLog(log)}
                  className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <div>
                    <div className="font-bold text-slate-900">{log.productName}</div>
                    <div className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{new Date(log.roastDate).toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-slate-900">{formatWeight(log.roastedWeightOut)}</div>
                    <div className={`text-xs font-bold mt-1 ${log.shrinkagePercent > 16 ? 'text-red-500' : 'text-green-600'}`}>{log.shrinkagePercent.toFixed(1)}% Loss</div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <div className="lg:col-span-1 space-y-6">
          {/* Detail View Modal (Overlay) */}
          {selectedLog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md" onClick={() => setSelectedLog(null)}>
              <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden w-full max-w-md" onClick={e => e.stopPropagation()}>
                <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
                <button 
                  onClick={() => setSelectedLog(null)}
                  className="absolute top-4 right-4 p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors z-20"
                >
                  <X size={16} />
                </button>
                <div className="relative z-10 space-y-8">
                  <div>
                    <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Historical Analysis</span>
                    <h3 className="text-2xl font-bold mt-1">{selectedLog.productName}</h3>
                    <div className="text-5xl font-black tracking-tighter mt-4">{formatPrice(selectedLog.trueCostPerLb)}</div>
                    <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">True Production Cost</p>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                       <span className="text-slate-400 font-bold">Green Weight In</span>
                       <span className="font-bold">{formatWeight(selectedLog.greenWeightIn)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                       <span className="text-slate-400 font-bold flex items-center gap-2"><Coins size={14} /> Overhead Cost</span>
                       <span className="font-bold text-amber-400">+{formatCurrency(selectedLog.overheadCost)}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pt-1">
                       <span className="text-slate-400 font-bold">Duration</span>
                       <span className="font-bold">{selectedLog.durationMinutes} min</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Shrinkage</span>
                      <div className="text-2xl font-black text-amber-400">{selectedLog.shrinkagePercent.toFixed(1)}%</div>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                      <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Yield</span>
                      <div className="text-2xl font-black">{formatWeight(selectedLog.roastedWeightOut)}</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {economics ? (
            <div className="bg-slate-900 text-white rounded-[2rem] p-8 shadow-2xl relative overflow-hidden sticky top-24">
              <div className="absolute top-0 right-0 p-8 opacity-10"><BarChart3 size={120} /></div>
              <div className="relative z-10 space-y-8">
                <div>
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Live Economics</span>
                  <div className="text-5xl font-black tracking-tighter mt-2">{formatPrice(economics.roastedCostPerLb)}</div>
                  <p className="text-slate-400 text-xs font-bold mt-2 uppercase tracking-widest">True Production Cost</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                     <span className="text-slate-400 font-bold">Raw Green Cost</span>
                     <span className="font-bold">{formatCurrency(economics.totalGreenCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-b border-slate-700 pb-2">
                     <span className="text-slate-400 font-bold flex items-center gap-2"><Coins size={14} /> Overhead ({duration}m)</span>
                     <span className="font-bold text-amber-400">+{formatCurrency(economics.overheadCost)}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm pt-1">
                     <span className="text-slate-400 font-bold">Total Batch Cost</span>
                     <span className="font-bold">{formatCurrency(economics.totalBatchCost)}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Shrinkage</span>
                    <div className="text-2xl font-black text-amber-400">{economics.shrinkage.toFixed(1)}%</div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Yield</span>
                    <div className="text-2xl font-black">{formatWeight(parseFloat(roastedWeightOut))}</div>
                  </div>
                </div>
                {economics.shrinkage > 20 && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3">
                    <AlertCircle className="text-red-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-xs text-red-200 font-medium">High Shrinkage! Check airflow.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-[2rem] p-12 flex flex-col items-center justify-center text-center border-2 border-dashed border-slate-200 h-64 opacity-60 sticky top-24">
              <p className="text-slate-500 text-sm font-medium">Enter production data to see True Cost analysis.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
