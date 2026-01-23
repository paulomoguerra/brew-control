"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Coffee, DollarSign, Package, ChefHat, Info } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { Card, StatCard } from '../../components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as ReTooltip, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function CafePage() {
  const { formatCurrency } = useUnits();
  
  // Data
  const ingredients = useQuery(api.cafe.listIngredients);
  const menuItems = useQuery(api.cafe.listMenuItems);
  const addIngredient = useMutation(api.cafe.addIngredient);
  const deleteIngredient = useMutation(api.cafe.deleteIngredient);
  const addMenuItem = useMutation(api.cafe.addMenuItem);
  const deleteMenuItem = useMutation(api.cafe.deleteMenuItem);

  // UI State
  const [activeTab, setActiveTab] = useState<'menu' | 'ingredients'>('menu');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingIngred, setIsAddingIngred] = useState(false);

  // Forms
  const [newIngred, setNewIngred] = useState({ name: '', category: 'milk', cost: 0, unit: 'gal', volumeOz: 128 });
  const [newItem, setNewItem] = useState({ 
    name: '', 
    salePrice: 5.00, 
    coffeeDosageGrams: 18.5, 
    components: [] as { ingredientId: string, quantity: number }[] 
  });

  // Helpers
  const handleAddComponent = () => {
    setNewItem({ ...newItem, components: [...newItem.components, { ingredientId: '', quantity: 0 }] });
  };

  const handleUpdateComponent = (idx: number, field: string, value: any) => {
    const updated = [...newItem.components];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewItem({ ...newItem, components: updated });
  };

  const submitIngredient = async (e: React.FormEvent) => {
    e.preventDefault();
    await addIngredient(newIngred as any);
    setIsAddingIngred(false);
    setNewIngred({ name: '', category: 'milk', cost: 0, unit: 'gal', volumeOz: 128 });
  };

  const submitMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    // Filter empty components
    const validComponents = newItem.components.filter(c => c.ingredientId && c.quantity > 0);
    // @ts-ignore
    await addMenuItem({ ...newItem, components: validComponents });
    setIsAddingItem(false);
    setNewItem({ name: '', salePrice: 5.00, coffeeDosageGrams: 18.5, components: [] });
  };

  // Charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

  return (
    <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Cafe Profitability</h1>
          <p className="text-slate-500 font-medium">True-cost analysis for your beverage menu.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'menu' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Menu Analysis
          </button>
          <button 
            onClick={() => setActiveTab('ingredients')}
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ingredients' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ingredients Cost
          </button>
        </div>
      </div>

      {activeTab === 'menu' && (
        <div className="space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <StatCard 
               label="Avg. Drink Margin" 
               value={menuItems && menuItems.length > 0 ? `${(menuItems.reduce((acc, i) => acc + i.analysis.marginPercent, 0) / menuItems.length).toFixed(1)}%` : "0%"} 
               icon={<DollarSign className="text-green-600" />}
               trend="Target: 75%+"
             />
             <StatCard 
               label="Menu Items" 
               value={menuItems?.length.toString() || "0"} 
               icon={<Coffee className="text-amber-600" />}
             />
             <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex flex-col justify-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Profit Tip</span>
                <p className="font-bold">Labor is often your highest cost per cup. Add a "Labor" ingredient (e.g. $25/hr) to see the true impact.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Menu List */}
            <div className="lg:col-span-2 space-y-6">
               <div className="flex justify-between items-center">
                 <h2 className="text-xl font-bold text-slate-900">Active Menu</h2>
                 <button onClick={() => setIsAddingItem(true)} className="btn-primary py-2 px-4 text-sm">
                   <Plus size={16} /> Add Drink
                 </button>
               </div>

               {isAddingItem && (
                 <Card className="border-2 border-slate-900 shadow-xl">
                   <form onSubmit={submitMenuItem} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <input required placeholder="Drink Name (e.g. Latte)" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" />
                        <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                           <input required type="number" step="0.01" placeholder="Sale Price" value={newItem.salePrice} onChange={e => setNewItem({...newItem, salePrice: parseFloat(e.target.value)})} className="input-field pl-8" />
                        </div>
                      </div>
                      
                      <div className="p-4 bg-slate-50 rounded-xl space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recipe Builder</h4>
                        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
                           <span className="font-bold text-slate-700">Coffee (Espresso/Filter)</span>
                           <div className="flex items-center gap-2">
                             <input type="number" step="0.1" value={newItem.coffeeDosageGrams} onChange={e => setNewItem({...newItem, coffeeDosageGrams: parseFloat(e.target.value)})} className="w-20 text-right font-bold bg-white border border-slate-200 rounded p-1" />
                             <span className="text-xs font-bold text-slate-400">grams</span>
                           </div>
                        </div>
                        {newItem.components.map((comp, idx) => (
                          <div key={idx} className="flex gap-2 items-center">
                             <select value={comp.ingredientId} onChange={e => handleUpdateComponent(idx, 'ingredientId', e.target.value)} className="input-field text-sm py-2">
                               <option value="">Select Ingredient...</option>
                               {ingredients?.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                             </select>
                             <input type="number" placeholder="Qty" value={comp.quantity} onChange={e => handleUpdateComponent(idx, 'quantity', parseFloat(e.target.value))} className="w-20 input-field text-sm py-2" />
                          </div>
                        ))}
                        <button type="button" onClick={handleAddComponent} className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          <Plus size={14} /> Add Ingredient (Milk, Cup, etc)
                        </button>
                      </div>

                      <div className="flex gap-3">
                        <button type="button" onClick={() => setIsAddingItem(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Save Drink</button>
                      </div>
                   </form>
                 </Card>
               )}

               <div className="grid gap-4">
                 {menuItems?.map(item => (
                   <div key={item._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-black text-slate-900">{item.name}</h3>
                          <p className="text-slate-500 text-sm font-medium">Selling Price: <span className="text-slate-900">{formatCurrency(item.salePrice)}</span></p>
                        </div>
                        <div className={`text-right ${item.analysis.marginPercent < 60 ? 'text-red-500' : 'text-green-600'}`}>
                           <div className="text-2xl font-black">{item.analysis.marginPercent.toFixed(0)}%</div>
                           <div className="text-[10px] uppercase font-bold tracking-widest">Margin</div>
                        </div>
                      </div>
                      
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                         <div className="bg-amber-700" style={{ width: `${(item.analysis.coffeeCost / item.salePrice) * 100}%` }} />
                         <div className="bg-blue-500" style={{ width: `${(item.analysis.ingredientsCost / item.salePrice) * 100}%` }} />
                         <div className="bg-green-500" style={{ width: `${item.analysis.marginPercent}%` }} />
                      </div>
                      <div className="flex justify-between mt-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-700"/> Coffee: {formatCurrency(item.analysis.coffeeCost)}</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-500"/> Goods: {formatCurrency(item.analysis.ingredientsCost)}</span>
                         <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-green-500"/> Profit: {formatCurrency(item.analysis.margin)}</span>
                      </div>
                      <button onClick={() => deleteMenuItem({id: item._id})} className="mt-4 text-xs text-red-400 hover:text-red-600 font-bold flex items-center gap-1"><Trash2 size={12} /> Delete</button>
                   </div>
                 ))}
               </div>
            </div>

            {/* Analysis Charts (Simple Placeholder) */}
            <div className="space-y-6">
               <Card title="Margin Ranking">
                  <div className="h-64 w-full">
                    <ResponsiveContainer>
                      <BarChart data={menuItems?.map(i => ({ name: i.name, margin: i.analysis.margin })).sort((a,b) => b.margin - a.margin).slice(0, 5) || []} layout="vertical">
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10}} />
                        <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                        <ReTooltip />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="max-w-4xl mx-auto space-y-8">
           <div className="flex justify-between items-center">
             <div>
               <h2 className="text-2xl font-black text-slate-900">Ingredients Database</h2>
               <p className="text-slate-500">Track costs for milk, syrups, cups, and lids.</p>
             </div>
             <button onClick={() => setIsAddingIngred(true)} className="btn-primary py-2 px-4 text-sm"><Plus size={16}/> Add Ingredient</button>
           </div>

           {isAddingIngred && (
             <Card className="bg-slate-50 border-slate-200">
               <form onSubmit={submitIngredient} className="grid grid-cols-5 gap-4 items-end">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Name</label>
                    <input required className="input-field" placeholder="e.g. Oat Milk" value={newIngred.name} onChange={e => setNewIngred({...newIngred, name: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Cost ($)</label>
                    <input required type="number" step="0.01" className="input-field" value={newIngred.cost} onChange={e => setNewIngred({...newIngred, cost: parseFloat(e.target.value)})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Unit Type</label>
                    <select className="input-field" value={newIngred.unit} onChange={e => setNewIngred({...newIngred, unit: e.target.value})}>
                      <option value="gal">Gallon</option>
                      <option value="liter">Liter</option>
                      <option value="oz">Ounce</option>
                      <option value="lb">Pound</option>
                      <option value="each">Each (Unit)</option>
                      <option value="hour">Hour (Labor)</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">Total Volume (oz)</label>
                    <input type="number" className="input-field" placeholder="128" value={newIngred.volumeOz} onChange={e => setNewIngred({...newIngred, volumeOz: parseFloat(e.target.value)})} />
                  </div>
                  <div className="col-span-5 flex gap-2 justify-end mt-2">
                    <button type="button" onClick={() => setIsAddingIngred(false)} className="btn-secondary py-2 text-sm">Cancel</button>
                    <button type="submit" className="btn-primary py-2 text-sm">Save Ingredient</button>
                  </div>
               </form>
             </Card>
           )}

           <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
             <table className="w-full text-left text-sm">
               <thead className="bg-slate-50 border-b border-slate-100">
                 <tr>
                   <th className="p-4 font-black text-slate-400 uppercase tracking-wider">Ingredient</th>
                   <th className="p-4 font-black text-slate-400 uppercase tracking-wider">Purchase Cost</th>
                   <th className="p-4 font-black text-slate-400 uppercase tracking-wider">Cost / Oz</th>
                   <th className="p-4 text-right"></th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-slate-50">
                 {ingredients?.map(ing => (
                   <tr key={ing._id} className="hover:bg-slate-50">
                     <td className="p-4 font-bold text-slate-900">
                        {ing.name}
                        <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-[10px] text-slate-500 uppercase">{ing.category}</span>
                     </td>
                     <td className="p-4 text-slate-600">{formatCurrency(ing.cost)} / {ing.unit}</td>
                     <td className="p-4 font-mono font-bold text-slate-900">
                       {ing.volumeOz ? formatCurrency(ing.cost / ing.volumeOz) : '-'}
                     </td>
                     <td className="p-4 text-right">
                       <button onClick={() => deleteIngredient({id: ing._id})} className="text-slate-300 hover:text-red-500"><Trash2 size={16}/></button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
}
