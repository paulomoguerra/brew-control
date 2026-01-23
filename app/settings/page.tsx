"use client";

import React, { useState, useEffect } from 'react';
import { Save, Loader2, DollarSign, Zap, Flame, Users, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    laborRate: 25.00, // $/hr
    gasRate: 4.50,    // $/hr (Estimated burn)
    utilityRate: 1.50 // $/hr (Electric/Rent allocation)
  });

  useEffect(() => {
    const saved = localStorage.getItem('roasteros-config');
    if (saved) {
      try {
        setConfig(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse config", e);
      }
    }
    setLoading(false);
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 800));
    localStorage.setItem('roasteros-config', JSON.stringify(config));
    showToast('Operational rates saved locally', 'success');
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center p-12 md:p-20"><Loader2 className="animate-spin text-slate-400" size={32} /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Operational Settings</h1>
        <p className="text-slate-500 font-medium text-sm md:text-base">Define your overhead costs to improve True Cost accuracy.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card title="Fixed Cost Allocation (Hourly)" subtitle="These rates are applied to roast duration">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users size={18} /></div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Labor Rate ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.50" required 
                   value={config.laborRate}
                   onChange={e => setConfig({...config, laborRate: parseFloat(e.target.value) || 0})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Head roaster hourly wage + burden.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-red-100 p-2 rounded-lg text-red-600"><Flame size={18} /></div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Gas Rate ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.10" required 
                   value={config.gasRate}
                   onChange={e => setConfig({...config, gasRate: parseFloat(e.target.value) || 0})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Avg propane/natural gas consumption.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Zap size={18} /></div>
                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Utility/Rent ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.10" required 
                   value={config.utilityRate}
                   onChange={e => setConfig({...config, utilityRate: parseFloat(e.target.value) || 0})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed font-medium">Electricity & facility allocation.</p>
            </div>

          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
             <div className="flex items-start gap-4 bg-slate-50 p-4 md:p-6 rounded-2xl mb-6 border border-slate-100">
                <Info className="text-amber-500 shrink-0 mt-0.5" size={20} />
                <p className="text-xs md:text-sm text-slate-500 leading-relaxed">
                   <strong className="text-slate-900 block mb-1">How this works:</strong> 
                   If your total hourly rate is <span className="text-slate-900 font-bold">${(config.laborRate + config.gasRate + config.utilityRate).toFixed(2)}/hr</span>, 
                   a 15-minute roast will add <span className="text-slate-900 font-bold">${((config.laborRate + config.gasRate + config.utilityRate) * 0.25).toFixed(2)}</span> of overhead to the production cost.
                </p>
             </div>
             
             <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center py-4 px-8">
               {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
               Save Operational Rates
             </button>
          </div>
        </Card>
      </form>
    </div>
  );
}
