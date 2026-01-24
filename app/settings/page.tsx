"use client";

import React, { useState } from 'react';
import { Save, Settings2, Monitor, Bell, Globe, Shield } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';

export default function SettingsPage() {
  const { showToast } = useToast();
  
  const [preferences, setPreferences] = useState({
    appearance: 'light',
    notifications: true,
    language: 'English',
    currency: 'USD'
  });

  const handleSave = () => {
    showToast('Preferences updated', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">App Configuration</h1>
        <p className="text-slate-500 font-medium">Manage your personal preferences and interface settings.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card title="Display & Language" subtitle="Visual experience settings">
          <div className="space-y-6">
             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-slate-600"><Monitor size={20}/></div>
                   <div>
                      <div className="font-bold text-slate-900">Appearance</div>
                      <div className="text-xs text-slate-500">System default or custom theme</div>
                   </div>
                </div>
                <select className="input-field w-32" value={preferences.appearance} onChange={e => setPreferences({...preferences, appearance: e.target.value})}>
                   <option value="light">Light</option>
                   <option value="dark">Dark</option>
                   <option value="system">System</option>
                </select>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-slate-600"><Globe size={20}/></div>
                   <div>
                      <div className="font-bold text-slate-900">Default Currency</div>
                      <div className="text-xs text-slate-500">Used for all financial reports</div>
                   </div>
                </div>
                <select className="input-field w-32" value={preferences.currency} onChange={e => setPreferences({...preferences, currency: e.target.value})}>
                   <option value="USD">USD ($)</option>
                   <option value="BRL">BRL (R$)</option>
                   <option value="EUR">EUR (€)</option>
                </select>
             </div>

             <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-white rounded-xl shadow-sm text-slate-600"><Bell size={20}/></div>
                   <div>
                      <div className="font-bold text-slate-900">Notifications</div>
                      <div className="text-xs text-slate-500">Low stock and order alerts</div>
                   </div>
                </div>
                <button 
                  onClick={() => setPreferences({...preferences, notifications: !preferences.notifications})}
                  className={`w-12 h-6 rounded-full transition-all relative ${preferences.notifications ? 'bg-amber-500' : 'bg-slate-200'}`}
                >
                   <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${preferences.notifications ? 'left-7' : 'left-1'}`} />
                </button>
             </div>
          </div>
          
          <div className="mt-8 pt-8 border-t border-slate-100">
             <button onClick={handleSave} className="btn-primary px-8 py-3 flex items-center gap-2">
                <Save size={18} /> Save Preferences
             </button>
          </div>
        </Card>

        <Card title="Security & API" subtitle="Platform integration access">
           <div className="space-y-4">
              <div className="p-6 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
                 <Shield className="mx-auto text-slate-300 mb-4" size={32} />
                 <h4 className="font-bold text-slate-900 mb-1">Advanced Settings Protected</h4>
                 <p className="text-xs text-slate-500 max-w-xs mx-auto mb-6">Database migrations and API keys require administrator elevation.</p>
                 <button className="text-xs font-black text-amber-600 uppercase tracking-widest hover:text-amber-700 transition-colors">Request Access</button>
              </div>
           </div>
        </Card>
      </div>
    </div>
  );
}
