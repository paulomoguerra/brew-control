"use client";

import React, { useState } from 'react';
import { DollarSign, Percent, Truck, Mail, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { useUnits } from '../../lib/units';

export default function CalculatorPage() {
  const { unit, formatCurrency } = useUnits();
  
  const [inputs, setInputs] = useState({
    greenCost: 5.00,
    shrinkage: 18.0,
    shipping: 0.50,
    email: ''
  });

  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    // Mock delay for "Crunching Numbers" effect
    await new Promise(resolve => setTimeout(resolve, 600));

    const shrinkageFactor = 1 - (inputs.shrinkage / 100);
    const roastedCost = shrinkageFactor > 0 
      ? (inputs.greenCost + inputs.shipping) / shrinkageFactor 
      : 0;

    setResult(roastedCost);
    setShowResult(true);
    setIsCalculating(false);
  };

  const isCostHigher = result !== null && result > inputs.greenCost;

  return (
    <div className="max-w-6xl mx-auto py-6 md:py-8 px-4 md:px-8 animate-in fade-in duration-700">
      <div className="mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-3 md:mb-4">
          Cost Calculator ({unit.toUpperCase()})
        </h1>
        <p className="text-slate-500 text-base md:text-lg max-w-2xl">
          Calculate your <span className="text-slate-900 font-bold">True Roasted Cost</span> by factoring in moisture loss and landed shipping expenses.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 items-start">
        {/* Inputs */}
        <section className="bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-lg md:text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="text-amber-500" size={24} />
              Input Parameters
            </h2>
          </div>
          <form onSubmit={handleCalculate} className="p-6 md:p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Green Cost (per {unit})</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputs.greenCost}
                    onChange={(e) => setInputs({ ...inputs, greenCost: parseFloat(e.target.value) || 0 })}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shrinkage (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Percent size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputs.shrinkage}
                    onChange={(e) => setInputs({ ...inputs, shrinkage: parseFloat(e.target.value) || 0 })}
                    className="input-field pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shipping & Landed (per {unit})</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Truck size={16} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputs.shipping}
                    onChange={(e) => setInputs({ ...inputs, shipping: parseFloat(e.target.value) || 0 })}
                    className="input-field pl-12"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {isCalculating ? "Crunching..." : "Calculate True Cost"}
              <TrendingUp size={20} />
            </button>
          </form>
        </section>

        {/* Results */}
        <section className="space-y-8">
          {showResult && result !== null ? (
            <div className="bg-white rounded-[2rem] border border-slate-200 shadow-2xl p-6 md:p-10 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">True Roasted Cost per {unit}</span>
                <div className={`text-5xl md:text-7xl font-black tracking-tighter transition-colors ${isCostHigher ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatCurrency(result)}
                </div>
                {isCostHigher && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-left">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-700 font-bold text-xs md:text-sm leading-snug">
                      Hidden Loss Alert: Your cost is {( (result / inputs.greenCost - 1) * 100 ).toFixed(1)}% higher than your green price due to shrinkage.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Green Total</span>
                  <div className="text-lg md:text-xl font-bold text-slate-800">{formatCurrency(inputs.greenCost + inputs.shipping)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Moisture Loss</span>
                  <div className="text-lg md:text-xl font-bold text-red-500">-{inputs.shrinkage}%</div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-widest text-center">Break-Even Pricing Guide</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl">
                    <span className="font-bold text-xs md:text-sm">Wholesale (35% Margin)</span>
                    <span className="text-lg md:text-xl font-black text-amber-400">{formatCurrency(result / 0.65)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-500 text-slate-900 rounded-2xl">
                    <span className="font-bold text-xs md:text-sm">Retail (50% Margin)</span>
                    <span className="text-lg md:text-xl font-black">{formatCurrency(result / 0.50)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-[2rem] border-2 border-dashed border-slate-200 p-8 md:p-12 flex flex-col items-center justify-center text-center opacity-60 h-[400px] md:h-[500px]">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <Calculator className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold max-w-xs text-sm md:text-base">
                Enter your batch stats on the left to reveal your actual unit economics.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
