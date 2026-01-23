"use client";

import React, { useState, useEffect } from 'react';
import { db } from '../../lib/firebase';
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Save, Loader2, DollarSign, Zap, Flame, Users, Info } from 'lucide-react';
import { Card } from '../../components/ui/Card';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState({
    laborRate: 25.00, // $/hr
    gasRate: 4.50,    // $/hr (Estimated burn)
    utilityRate: 1.50 // $/hr (Electric/Rent allocation)
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const docRef = doc(db, "system_settings", "financials");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setConfig({
            laborRate: data.laborRate || 25.00,
            gasRate: data.gasRate || 4.50,
            utilityRate: data.utilityRate || 1.50
          });
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchConfig();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await setDoc(doc(db, "system_settings", "financials"), {
        ...config,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error("Error saving settings:", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700 p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Operational Settings</h1>
        <p className="text-slate-500 font-medium">Define your overhead costs to improve True Cost accuracy.</p>
      </div>

      <form onSubmit={handleSave}>
        <Card title="Fixed Cost Allocation (Hourly)" subtitle="These rates are applied to roast duration">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600"><Users size={20} /></div>
                <label className="text-sm font-bold text-slate-700">Labor Rate ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.50" required 
                   value={config.laborRate}
                   onChange={e => setConfig({...config, laborRate: parseFloat(e.target.value)})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-xs text-slate-400">Head roaster hourly wage + burden.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-red-100 p-2 rounded-lg text-red-600"><Flame size={20} /></div>
                <label className="text-sm font-bold text-slate-700">Gas Rate ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.10" required 
                   value={config.gasRate}
                   onChange={e => setConfig({...config, gasRate: parseFloat(e.target.value)})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-xs text-slate-400">Avg propane/natural gas consumption.</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="bg-amber-100 p-2 rounded-lg text-amber-600"><Zap size={20} /></div>
                <label className="text-sm font-bold text-slate-700">Utility/Rent ($/hr)</label>
              </div>
              <div className="relative">
                 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                 <input 
                   type="number" step="0.10" required 
                   value={config.utilityRate}
                   onChange={e => setConfig({...config, utilityRate: parseFloat(e.target.value)})}
                   className="input-field pl-8"
                 />
              </div>
              <p className="text-xs text-slate-400">Electricity & facility allocation.</p>
            </div>

          </div>

          <div className="mt-8 pt-8 border-t border-slate-100">
             <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-xl mb-6">
                <Info className="text-slate-400 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-slate-500">
                   <strong>How this works:</strong> If your total hourly rate is <span className="text-slate-900 font-bold">${(config.laborRate + config.gasRate + config.utilityRate).toFixed(2)}/hr</span>, 
                   a 15-minute roast will add <span className="text-slate-900 font-bold">${((config.laborRate + config.gasRate + config.utilityRate) * 0.25).toFixed(2)}</span> of overhead to the batch cost.
                </p>
             </div>
             
             <button type="submit" disabled={saving} className="btn-primary w-full md:w-auto flex items-center gap-2 justify-center">
               {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
               Save Operational Rates
             </button>
          </div>
        </Card>
      </form>
    </div>
  );
}