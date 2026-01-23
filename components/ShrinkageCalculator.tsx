import React, { useState } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { DollarSign, Percent, Truck, Mail, Calculator, TrendingUp, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../lib/finance';

const ShrinkageCalculator: React.FC = () => {
  // State Management
  const [inputs, setInputs] = useState({
    greenCost: 5.00,
    shrinkage: 18.0,
    shipping: 0.50,
    email: ''
  });

  const [result, setResult] = useState<number | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [showResult, setShowResult] = useState(false);

  // The Logic
  const handleCalculate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCalculating(true);

    // Formula: RoastedCost = (GreenCost + Shipping) / (1 - (Shrinkage / 100))
    const shrinkageFactor = 1 - (inputs.shrinkage / 100);
    const roastedCost = shrinkageFactor > 0 
      ? (inputs.greenCost + inputs.shipping) / shrinkageFactor 
      : 0;

    setResult(roastedCost);
    setShowResult(true);

    // Database Action: Save to Firestore
    try {
      await addDoc(collection(db, "calculator_leads"), {
        ...inputs,
        calculatedRoastedCost: roastedCost,
        timestamp: serverTimestamp(),
        source: 'web_calculator_v2'
      });
    } catch (error) {
      console.error("Error saving to Firestore:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const isCostHigher = result !== null && result > inputs.greenCost;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 animate-in fade-in duration-700">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-4">
          Green Bean Cost Calculator
        </h1>
        <p className="text-slate-500 text-lg max-w-2xl">
          Most roasters ignore moisture loss and shipping. Calculate your <span className="text-slate-900 font-bold">True Roasted Cost</span> to protect your margins.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        {/* Left Side: Inputs (Shadcn-like Card) */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden">
          <div className="p-8 border-b border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Calculator className="text-amber-500" size={24} />
              Input Parameters
            </h2>
          </div>
          <form onSubmit={handleCalculate} className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Green Cost (per lb)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <DollarSign size={18} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputs.greenCost}
                    onChange={(e) => setInputs({ ...inputs, greenCost: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Shrinkage (%)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Percent size={18} />
                  </div>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={inputs.shrinkage}
                    onChange={(e) => setInputs({ ...inputs, shrinkage: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Shipping & Landed Costs (per lb)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Truck size={18} />
                  </div>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={inputs.shipping}
                    onChange={(e) => setInputs({ ...inputs, shipping: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-4 border-t border-slate-100">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Email for your full report</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input
                    type="email"
                    required
                    placeholder="you@roastery.com"
                    value={inputs.email}
                    onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                    className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isCalculating}
              className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-lg active:scale-[0.98] disabled:opacity-50"
            >
              {isCalculating ? "Calculating..." : "Calculate True Cost"}
              <TrendingUp size={20} />
            </button>
          </form>
        </section>

        {/* Right Side: Results */}
        <section className="space-y-8">
          {showResult && result !== null ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl p-10 animate-in zoom-in-95 duration-500">
              <div className="text-center mb-8">
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-4">True Roasted Cost per lb</span>
                <div className={`text-6xl md:text-7xl font-black tracking-tighter transition-colors ${isCostHigher ? 'text-red-600' : 'text-slate-900'}`}>
                  {formatCurrency(result)}
                </div>
                {isCostHigher && (
                  <div className="mt-6 p-4 bg-red-50 rounded-2xl border border-red-100 flex items-start gap-3 text-left">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
                    <p className="text-red-700 font-bold text-sm leading-snug">
                      You are losing money if you price based on Green Cost. Your true cost is {( (result / inputs.greenCost - 1) * 100 ).toFixed(1)}% higher than your green price.
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-8">
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Green Cost Total</span>
                  <div className="text-xl font-bold text-slate-800">{formatCurrency(inputs.greenCost + inputs.shipping)}</div>
                </div>
                <div className="p-4 bg-slate-50 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Shrinkage Hit</span>
                  <div className="text-xl font-bold text-red-500">-{inputs.shrinkage}%</div>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest text-center">Recommended Minimum Pricing</h3>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-4 bg-slate-900 text-white rounded-2xl">
                    <span className="font-bold">Wholesale (35% Margin)</span>
                    <span className="text-xl font-black text-amber-400">{formatCurrency(result / 0.65)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-amber-500 text-slate-900 rounded-2xl">
                    <span className="font-bold">Retail (50% Margin)</span>
                    <span className="text-xl font-black">{formatCurrency(result / 0.50)}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-100 rounded-3xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center text-center opacity-60">
              <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center mb-6">
                <Calculator className="text-slate-400" size={32} />
              </div>
              <p className="text-slate-500 font-bold max-w-xs">
                Enter your batch details on the left to uncover the hidden costs of your roast.
              </p>
            </div>
          )}

          {/* Educational Sidebar */}
          <div className="bg-amber-600 rounded-3xl p-8 text-white shadow-xl">
            <h4 className="font-black uppercase text-xs tracking-[0.2em] mb-4 opacity-70">Roaster's Tip</h4>
            <p className="text-lg font-bold leading-tight">
              A batch that starts at 100 lbs of green coffee only yields about 82 lbs of roasted coffee. 
              <span className="block mt-4 text-amber-200">
                Failing to account for that 18% loss is like throwing every 5th bag of coffee in the trash.
              </span>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ShrinkageCalculator;