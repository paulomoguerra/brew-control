"use client";

import React, { useState } from 'react';
import { Save, Monitor, Globe, Scale, Cpu, CreditCard, Link2, Smartphone, Database, Loader2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { useUnits } from '../../lib/units';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

export default function SettingsPage() {
  const { showToast } = useToast();
  const seedRecipes = useMutation(api.init.seedRecipes);
  const [isSeeding, setIsSeeding] = useState(false);
  const { 
    unit, setUnit, 
    currency, setCurrency, 
    language, setLanguage, 
    theme, setTheme,
    t 
  } = useUnits();

  const handleSave = () => {
    showToast(t('common.save_success') || 'Preferences updated', 'success');
  };

  const handleSeed = async () => {
    setIsSeeding(true);
    try {
      const result = await seedRecipes();
      showToast(result, 'success');
    } catch (error) {
      showToast('Error seeding database', 'error');
    } finally {
      setIsSeeding(false);
    }
  };

  const connectors = [
    { name: 'SumUp', icon: <CreditCard size={20}/>, status: 'Not Connected', region: 'Global / Brazil' },
    { name: 'Bling', icon: <Cpu size={20}/>, status: 'Not Connected', region: 'Brazil' },
    { name: 'Shopify', icon: <Link2 size={20}/>, status: 'Not Connected', region: 'Global' },
    { name: 'QuickBooks', icon: <Monitor size={20}/>, status: 'Not Connected', region: 'Global / Canada' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{t('common.settings')}</h1>
        <p className="text-slate-500 font-medium">Global configuration and external ERP integrations.</p>
      </div>

      <div className="grid grid-cols-1 gap-8">
        <Card title="Localization & Units" subtitle="The Foundation Layer">
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Default Language</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as any)}
                  >
                    <option value="en">English (Global)</option>
                    <option value="pt-BR">Português (Brasil)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Metric System</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value as any)}
                  >
                    <option value="kg">Metric (kg/g)</option>
                    <option value="lbs">Imperial (lb/oz)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Base Currency</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value as any)}
                  >
                    <option value="BRL">BRL (R$)</option>
                    <option value="CAD">CAD ($)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Theme Mode</label>
                  <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                      onClick={() => setTheme('light')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'light' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                    >
                      Light
                    </button>
                    <button 
                      onClick={() => setTheme('dark')}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${theme === 'dark' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
                    >
                      Dark
                    </button>
                  </div>
                </div>
             </div>
          </div>
        </Card>

        <Card title="Connectors & ERP" subtitle="Integration Hub">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {connectors.map((c) => (
               <div key={c.name} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-amber-500/30 transition-all group">
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-900 group-hover:scale-110 transition-transform">{c.icon}</div>
                    <div>
                      <div className="font-black text-slate-900 uppercase tracking-tighter">{c.name}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{c.region}</div>
                    </div>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Connect
                  </button>
               </div>
             ))}
          </div>
          <div className="mt-8 p-6 bg-amber-50 rounded-[2rem] border border-amber-100 flex items-center gap-4">
            <div className="p-3 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/20"><Smartphone size={24}/></div>
            <div>
              <h4 className="font-bold text-amber-900">Need a custom integration?</h4>
              <p className="text-xs text-amber-700">Connect RoasterOS to Zapier or Make.com to build custom workflows for your specific local services.</p>
            </div>
          </div>
        </Card>

        <Card title="System Maintenance" subtitle="Database & Tools">
          <div className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white rounded-2xl shadow-sm text-slate-900"><Database size={20}/></div>
              <div>
                <div className="font-black text-slate-900 uppercase tracking-tighter">Seed Sample Data</div>
                <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Populate Brewing Lab with examples</div>
              </div>
            </div>
            <button 
              onClick={handleSeed}
              disabled={isSeeding}
              className="px-6 py-3 bg-white border-2 border-slate-900 text-slate-900 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSeeding ? <Loader2 size={14} className="animate-spin" /> : <Database size={14} />}
              {isSeeding ? 'Seeding...' : 'Initialize Data'}
            </button>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4">
         <button onClick={handleSave} className="bg-slate-900 text-white px-10 py-5 rounded-[2rem] font-black text-sm uppercase tracking-wider flex items-center gap-3 shadow-2xl hover:bg-slate-800 transition-all active:scale-[0.98]">
            <Save size={20} /> {t('common.save')}
         </button>
      </div>
    </div>
  );
}
