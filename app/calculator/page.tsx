"use client";

import React, { useState, useMemo } from 'react';
import { Calculator, Scale, Percent, DollarSign, ArrowRight, RotateCcw, Info, TrendingUp, ShoppingBag, Coffee, TrendingDown } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useUnits } from '../../lib/units';

export default function CoffeeCalculator() {
  const { unit, formatPrice, formatCurrency } = useUnits();
  
  // --- ROAST PLANNING CALCULATOR ---
  const [targetRoasted, setTargetRoasted] = useState<string>('5');
  const [expectedShrinkage, setExpectedShrinkage] = useState<string>('15');
  const [greenCost, setGreenCost] = useState<string>('6.50');
  const [overheadPerHour, setOverheadPerHour] = useState<string>('30');
  const [roastTime, setRoastTime] = useState<string>('12');

  const roastMath = useMemo(() => {
    const tr = parseFloat(targetRoasted) || 0;
    const es = parseFloat(expectedShrinkage) || 0;
    const gc = parseFloat(greenCost) || 0;
    const oh = parseFloat(overheadPerHour) || 0;
    const rt = parseFloat(roastTime) || 0;

    if (tr <= 0 || es >= 100) return null;

    const greenRequired = tr / (1 - (es / 100));
    const greenTotalCost = greenRequired * gc;
    const timeOverhead = (rt / 60) * oh;
    const totalBatchCost = greenTotalCost + timeOverhead;
    const costPerRoastedUnit = totalBatchCost / tr;

    return {
      greenRequired,
      totalBatchCost,
      costPerRoastedUnit,
      timeOverhead,
      shrinkageLbs: greenRequired - tr
    };
  }, [targetRoasted, expectedShrinkage, greenCost, overheadPerHour, roastTime]);

  // --- BREW RATIO CALCULATOR ---
  const [coffeeGrams, setCoffeeGrams] = useState<string>('20');
  const [ratio, setRatio] = useState<string>('16');
  const [waterVolume, setWaterVolume] = useState<string>('320');
  const [calcMode, setCalcMode] = useState<'coffee' | 'water'>('coffee');

  const brewMath = useMemo(() => {
    const cg = parseFloat(coffeeGrams) || 0;
    const r = parseFloat(ratio) || 0;
    const wv = parseFloat(waterVolume) || 0;

    if (calcMode === 'coffee') {
      return { waterNeeded: cg * r, coffeeNeeded: cg };
    } else {
      return { waterNeeded: wv, coffeeNeeded: r > 0 ? wv / r : 0 };
    }
  }, [coffeeGrams, ratio, waterVolume, calcMode]);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Universal Calculator</h1>
        <p className="text-slate-500 font-medium">Precision tools for roasting economics and brewing science.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ROASTING ECONOMICS */}
        <div className="space-y-6">
          <Card title="Roast Economics" subtitle="Reverse engineering batch costs">
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Output ({unit})</label>
                  <input type="number" value={targetRoasted} onChange={e => setTargetRoasted(e.target.value)} className="input-field bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exp. Shrinkage (%)</label>
                  <input type="number" value={expectedShrinkage} onChange={e => setExpectedShrinkage(e.target.value)} className="input-field bg-slate-50 border-none" />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Green Cost</label>
                  <input type="number" value={greenCost} onChange={e => setGreenCost(e.target.value)} className="input-field bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Overhead/hr</label>
                  <input type="number" value={overheadPerHour} onChange={e => setOverheadPerHour(e.target.value)} className="input-field bg-slate-50 border-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time (min)</label>
                  <input type="number" value={roastTime} onChange={e => setRoastTime(e.target.value)} className="input-field bg-slate-50 border-none" />
                </div>
              </div>

              {roastMath && (
                <div className="mt-8 p-8 bg-slate-900 rounded-[2.5rem] text-white relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
                    <TrendingUp size={100} />
                  </div>
                  <div className="relative z-10 space-y-6">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Green Required</span>
                        <div className="text-4xl font-black mt-1">{roastMath.greenRequired.toFixed(2)} <span className="text-lg text-slate-500 uppercase">{unit}</span></div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Shrinkage Loss</span>
                        <div className="font-bold text-slate-300">{roastMath.shrinkageLbs.toFixed(2)} {unit}</div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-800">
                      <div>
                        <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">True Production Cost</span>
                        <div className="text-2xl font-black text-amber-500">{formatPrice(roastMath.costPerRoastedUnit)} <span className="text-xs uppercase text-slate-500">/{unit}</span></div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Total Batch Basis</span>
                        <div className="text-2xl font-black">{formatCurrency(roastMath.totalBatchCost)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* BREW RATIO & EXTRACTION */}
        <div className="space-y-6">
          <Card title="Brewing Science" subtitle="Precision ratio scaling">
            <div className="space-y-8">
              <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
                <button 
                  onClick={() => setCalcMode('coffee')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcMode === 'coffee' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                >
                  Scale by Coffee
                </button>
                <button 
                  onClick={() => setCalcMode('water')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcMode === 'water' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                >
                  Scale by Water
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brew Ratio (1 : X)</label>
                  <div className="flex items-center gap-4">
                    <input type="range" min="10" max="20" step="0.5" value={ratio} onChange={e => setRatio(e.target.value)} className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" />
                    <span className="w-12 text-center font-black text-slate-900">1:{ratio}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {calcMode === 'coffee' ? (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coffee Dose (g)</label>
                      <input type="number" value={coffeeGrams} onChange={e => setCoffeeGrams(e.target.value)} className="input-field bg-slate-50 border-none text-xl font-bold" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Water Volume (ml/g)</label>
                      <input type="number" value={waterVolume} onChange={e => setWaterVolume(e.target.value)} className="input-field bg-slate-50 border-none text-xl font-bold" />
                    </div>
                  )}
                  
                  <div className="bg-slate-50 rounded-[2rem] p-6 flex items-center justify-center border-2 border-dashed border-slate-200">
                    <div className="text-center">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Required {calcMode === 'coffee' ? 'Water' : 'Coffee'}</span>
                      <div className="text-3xl font-black text-slate-900">
                        {calcMode === 'coffee' ? `${brewMath.waterNeeded.toFixed(0)}ml` : `${brewMath.coffeeNeeded.toFixed(1)}g`}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Common Presets */}
                <div className="pt-6 border-t border-slate-100">
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Ratio Presets</span>
                   <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Espresso (1:2)', val: '2' },
                        { label: 'Strong Pour Over (1:15)', val: '15' },
                        { label: 'Golden Ratio (1:16.6)', val: '16.6' },
                        { label: 'Cupping (1:18)', val: '18' }
                      ].map(p => (
                        <button key={p.val} onClick={() => setRatio(p.val)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-amber-500 hover:text-amber-500 transition-all">
                          {p.label}
                        </button>
                      ))}
                   </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

      </div>

      {/* QUICK CONVERSIONS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
         {[
           { label: '1 kg', val: '2.204 lbs' },
           { label: '1 lb', val: '453.6 g' },
           { label: '1 oz', val: '28.35 g' },
           { label: '1 gal', val: '3.785 L' }
         ].map((c, i) => (
           <div key={i} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex justify-between items-center">
              <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{c.label}</span>
              <ArrowRight size={14} className="text-slate-300" />
              <span className="font-bold text-slate-900">{c.val}</span>
           </div>
         ))}
      </div>
    </div>
  );
}
