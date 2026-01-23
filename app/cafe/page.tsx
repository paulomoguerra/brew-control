"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Trash2, Coffee, DollarSign, Package, ChefHat, Info, X, Calculator } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
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
  const [activeTab, setActiveTab] = useState<'menu' | 'ingredients' | 'overhead'>('menu');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [isAddingIngred, setIsAddingIngred] = useState(false);

  // Overhead state (local storage for MVP, integrated with ingredients for persistence)
  const [fixedCosts, setFixedCosts] = useState([
    { name: 'Rent & Facility', cost: 2500, period: 'month' },
    { name: 'Utilities (Gas/Water)', cost: 450, period: 'month' },
    { name: 'Insurance', cost: 120, period: 'month' },
    { name: 'Software Subscriptions', cost: 85, period: 'month' },
  ]);

  const [variableCosts, setVariableCosts] = useState([
    { name: 'Maintenance & Repairs', cost: 200, period: 'avg/mo' },
    { name: 'Marketing & Social', cost: 150, period: 'avg/mo' },
  ]);

  // Forms
  const [newIngred, setNewIngred] = useState({ name: '', category: 'milk', cost: 0, unit: 'gal', volumeOz: 128 });
  const [newItem, setNewItem] = useState({ 
    name: '', 
    salePrice: 5.00, 
    coffeeDosageGrams: 18.5, 
    components: [] as { ingredientId: string, quantity: number }[] 
  });

  const isLoading = ingredients === undefined || menuItems === undefined;

  // Helpers
  const handleAddComponent = () => {
    setNewItem({ ...newItem, components: [...newItem.components, { ingredientId: '', quantity: 0 }] });
  };

  const handleUpdateComponent = (idx: number, field: string, value: any) => {
    const updated = [...newItem.components];
    updated[idx] = { ...updated[idx], [field]: value };
    setNewItem({ ...newItem, components: updated });
  };

  const handleRemoveComponent = (idx: number) => {
    const updated = [...newItem.components];
    updated.splice(idx, 1);
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
    const validComponents = newItem.components.filter(c => c.ingredientId && c.quantity > 0);
    // @ts-ignore
    await addMenuItem({ ...newItem, components: validComponents });
    setIsAddingItem(false);
    setNewItem({ name: '', salePrice: 5.00, coffeeDosageGrams: 18.5, components: [] });
  };

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2">
            <Skeleton className="h-8 md:h-10 w-[200px] md:w-[300px]" />
            <Skeleton className="h-4 w-full max-w-[400px]" />
          </div>
          <Skeleton className="h-10 w-[200px] rounded-xl" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <Skeleton className="h-28 rounded-[2rem]" />
          <Skeleton className="h-28 rounded-[2rem]" />
          <Skeleton className="h-28 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6 md:space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Cafe Profitability</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">True-cost analysis for your beverage menu.</p>
        </div>
        <div className="flex bg-slate-100 p-1 rounded-xl w-full lg:w-auto overflow-x-auto no-scrollbar">
          <button 
            onClick={() => setActiveTab('menu')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'menu' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Menu Analysis
          </button>
          <button 
            onClick={() => setActiveTab('ingredients')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'ingredients' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Ingredients
          </button>
          <button 
            onClick={() => setActiveTab('overhead')}
            className={`flex-1 lg:flex-none px-4 py-2 rounded-lg text-xs md:text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overhead' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Shop Overhead
          </button>
        </div>
      </div>

      {activeTab === 'overhead' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Fixed Costs */}
            <Card title="Fixed Operating Costs" subtitle="Recurring monthly expenses">
               <div className="space-y-4">
                  {fixedCosts.map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                       <div>
                          <div className="font-bold text-slate-900">{cost.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cost.period}</div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-slate-900">{formatCurrency(cost.cost)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Per Month</div>
                       </div>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2">
                     <Plus size={14} /> Add Fixed Cost
                  </button>
               </div>
            </Card>

            {/* Non-Fixed Costs */}
            <Card title="Variable & Non-Fixed" subtitle="Estimated or project-based costs">
               <div className="space-y-4">
                  {variableCosts.map((cost, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                       <div>
                          <div className="font-bold text-slate-900">{cost.name}</div>
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cost.period}</div>
                       </div>
                       <div className="text-right">
                          <div className="font-black text-slate-900">{formatCurrency(cost.cost)}</div>
                          <div className="text-[10px] font-bold text-slate-400 uppercase">Est. Monthly</div>
                       </div>
                    </div>
                  ))}
                  <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-xs font-black text-slate-400 uppercase tracking-widest hover:border-amber-500 hover:text-amber-500 transition-all flex items-center justify-center gap-2">
                     <Plus size={14} /> Add Variable Cost
                  </button>
               </div>
            </Card>
          </div>

          {/* Total Overhead Analysis */}
          <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-8 opacity-10"><Calculator size={140} /></div>
             <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
                <div className="md:col-span-2">
                   <span className="text-[10px] font-black text-amber-500 uppercase tracking-[0.3em]">Monthly Operating Burden</span>
                   <div className="text-6xl font-black tracking-tighter mt-2">
                      {formatCurrency(fixedCosts.reduce((a,b) => a+b.cost, 0) + variableCosts.reduce((a,b) => a+b.cost, 0))}
                   </div>
                   <p className="text-slate-400 text-sm mt-4 leading-relaxed max-w-md">
                      This is the total amount of gross profit required from beverage sales just to break even on facility and administrative costs.
                   </p>
                </div>
                <div className="bg-white/10 p-6 rounded-2xl border border-white/10 text-center">
                   <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Sales</div>
                   <div className="text-2xl font-black text-amber-400">1,240 Cups</div>
                   <p className="text-[10px] font-bold text-slate-500 mt-2">at avg. $3.50 margin/cup</p>
                </div>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'menu' && (
        <div className="space-y-6 md:space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
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
             <div className="bg-slate-900 text-white p-6 rounded-[2rem] flex flex-col justify-center sm:col-span-2 md:col-span-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Profit Tip</span>
                <p className="font-bold text-sm leading-snug">Labor is often your highest cost cup. Add a "Labor" ingredient (e.g. $25/hr) to see the true impact.</p>
             </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="lg:col-span-2 space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-lg md:text-xl font-bold text-slate-900">Active Menu</h2>
                  <button onClick={() => setIsAddingItem(true)} className="btn-primary py-2 px-4 text-xs md:text-sm">
                    <Plus size={16} /> Add Drink
                  </button>
                </div>

                {isAddingItem && (
                  <Card className="border-2 border-slate-900 shadow-xl" title="Create New Drink">
                    <form onSubmit={submitMenuItem} className="space-y-6">
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Drink Name</label>
                            <input required placeholder="e.g. 12oz Latte" value={newItem.name} onChange={e => setNewItem({...newItem, name: e.target.value})} className="input-field" />
                         </div>
                         <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sale Price</label>
                            <div className="relative">
                               <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</span>
                               <input required type="number" step="0.01" placeholder="5.00" value={newItem.salePrice} onChange={e => setNewItem({...newItem, salePrice: parseFloat(e.target.value)})} className="input-field pl-8" />
                            </div>
                         </div>
                       </div>
                       
                       <div className="p-4 md:p-6 bg-slate-50 rounded-2xl space-y-4">
                         <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Components</h4>
                         <div className="flex justify-between items-center border-b border-slate-200 pb-3">
                            <span className="font-bold text-slate-700 text-sm">Coffee Dosage</span>
                            <div className="flex items-center gap-2">
                              <input type="number" step="0.1" value={newItem.coffeeDosageGrams} onChange={e => setNewItem({...newItem, coffeeDosageGrams: parseFloat(e.target.value)})} className="w-20 text-right font-black bg-white border border-slate-200 rounded-lg p-2 text-sm" />
                              <span className="text-[10px] font-black text-slate-400 uppercase">grams</span>
                            </div>
                         </div>
                         <div className="space-y-3">
                          {newItem.components.map((comp, idx) => (
                            <div key={idx} className="flex gap-2 items-center">
                                <select value={comp.ingredientId} onChange={e => handleUpdateComponent(idx, 'ingredientId', e.target.value)} className="input-field text-sm flex-grow bg-white">
                                  <option value="">Ingredient...</option>
                                  {ingredients?.map(i => <option key={i._id} value={i._id}>{i.name} ({i.unit})</option>)}
                                </select>
                                <input type="number" placeholder="Qty" value={comp.quantity} onChange={e => handleUpdateComponent(idx, 'quantity', parseFloat(e.target.value))} className="w-20 md:w-24 input-field text-sm bg-white" />
                                <button type="button" onClick={() => handleRemoveComponent(idx)} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={16} /></button>
                            </div>
                          ))}
                         </div>
                         <button type="button" onClick={handleAddComponent} className="text-[10px] font-black text-amber-600 flex items-center gap-1 uppercase tracking-widest hover:text-amber-700">
                           <Plus size={14} /> Add Ingredient
                         </button>
                       </div>

                       <div className="flex flex-col-reverse sm:flex-row gap-3">
                         <button type="button" onClick={() => setIsAddingItem(false)} className="btn-secondary flex-1">Cancel</button>
                         <button type="submit" className="btn-primary flex-1">Save Menu Item</button>
                       </div>
                    </form>
                  </Card>
                )}

                <div className="grid gap-4">
                  {menuItems?.map(item => (
                    <div key={item._id} className="bg-white p-5 md:p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group">
                       <div className="flex justify-between items-start mb-4">
                         <div className="truncate pr-4">
                           <h3 className="text-base md:text-lg font-black text-slate-900 truncate">{item.name}</h3>
                           <p className="text-slate-500 text-xs md:text-sm font-medium">Selling Price: <span className="text-slate-900 font-bold">{formatCurrency(item.salePrice)}</span></p>
                         </div>
                         <div className={`text-right shrink-0 ${item.analysis.marginPercent < 60 ? 'text-red-500' : 'text-green-600'}`}>
                            <div className="text-xl md:text-2xl font-black leading-none">{item.analysis.marginPercent.toFixed(0)}%</div>
                            <div className="text-[9px] uppercase font-black tracking-widest mt-1">Margin</div>
                         </div>
                       </div>
                       
                       <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden flex">
                          <div className="bg-amber-700" style={{ width: `${(item.analysis.coffeeCost / item.salePrice) * 100}%` }} />
                          <div className="bg-blue-500" style={{ width: `${(item.analysis.ingredientsCost / item.salePrice) * 100}%` }} />
                          <div className="bg-green-500" style={{ width: `${item.analysis.marginPercent}%` }} />
                       </div>
                       <div className="flex flex-wrap justify-between mt-3 gap-y-2 text-[9px] md:text-[10px] font-black uppercase tracking-wider text-slate-400">
                          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-700"/> Coffee: {formatCurrency(item.analysis.coffeeCost)}</span>
                          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-blue-500"/> Goods: {formatCurrency(item.analysis.ingredientsCost)}</span>
                          <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-green-500"/> Profit: {formatCurrency(item.analysis.margin)}</span>
                       </div>
                       <button onClick={() => deleteMenuItem({id: item._id})} className="mt-4 text-[10px] text-slate-300 hover:text-red-500 font-black flex items-center gap-1 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={12} /> Delete</button>
                    </div>
                  ))}
                </div>
            </div>

            <div className="space-y-6">
                <Card title="Margin Ranking">
                   <div className="h-64 w-full">
                     <ResponsiveContainer>
                       <BarChart data={menuItems?.map(i => ({ name: i.name, margin: i.analysis.margin })).sort((a,b) => b.margin - a.margin).slice(0, 5) || []} layout="vertical">
                         <XAxis type="number" hide />
                         <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                         <Bar dataKey="margin" fill="#10b981" radius={[0, 4, 4, 0]} barSize={20} />
                         <ReTooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                </Card>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'ingredients' && (
        <div className="max-w-4xl mx-auto space-y-6 md:space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-black text-slate-900">Ingredients Database</h2>
                <p className="text-slate-500 text-sm">Track costs for milk, syrups, cups, and lids.</p>
              </div>
              <button onClick={() => setIsAddingIngred(true)} className="btn-primary py-2 px-4 text-xs md:text-sm w-full sm:w-auto"><Plus size={16}/> Add Ingredient</button>
            </div>

            {isAddingIngred && (
              <Card className="bg-slate-50 border-slate-200" title="New Ingredient">
                <form onSubmit={submitIngredient} className="space-y-6">
                   <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="sm:col-span-2 space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Ingredient Name</label>
                        <input required className="input-field bg-white" placeholder="e.g. Oat Milk" value={newIngred.name} onChange={e => setNewIngred({...newIngred, name: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Cost ($)</label>
                        <input required type="number" step="0.01" className="input-field bg-white" value={newIngred.cost} onChange={e => setNewIngred({...newIngred, cost: parseFloat(e.target.value)})} />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Unit</label>
                        <select className="input-field bg-white" value={newIngred.unit} onChange={e => setNewIngred({...newIngred, unit: e.target.value})}>
                          <option value="gal">Gallon</option>
                          <option value="liter">Liter</option>
                          <option value="oz">Ounce</option>
                          <option value="lb">Pound</option>
                          <option value="each">Each</option>
                          <option value="hour">Hour</option>
                        </select>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Volume (oz) - for cost/oz</label>
                        <input type="number" className="input-field bg-white" placeholder="128" value={newIngred.volumeOz} onChange={e => setNewIngred({...newIngred, volumeOz: parseFloat(e.target.value)})} />
                      </div>
                      <div className="flex gap-3 items-end">
                        <button type="button" onClick={() => setIsAddingIngred(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" className="btn-primary flex-1">Save</button>
                      </div>
                   </div>
                </form>
              </Card>
            )}

            <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm min-w-[500px]">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Ingredient</th>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Purchase Cost</th>
                      <th className="px-6 py-4 font-black text-slate-400 uppercase tracking-widest text-[10px]">Cost / Oz</th>
                      <th className="px-6 py-4 text-right"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ingredients?.map(ing => (
                      <tr key={ing._id} className="hover:bg-slate-50 group">
                        <td className="px-6 py-4 font-bold text-slate-900">
                           {ing.name}
                           <span className="ml-2 px-2 py-0.5 bg-slate-100 rounded-full text-[9px] font-black text-slate-500 uppercase tracking-tighter">{ing.category}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">{formatCurrency(ing.cost)} / {ing.unit}</td>
                        <td className="px-6 py-4 font-mono font-black text-slate-900">
                          {ing.volumeOz ? formatCurrency(ing.cost / ing.volumeOz) : '-'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button onClick={() => deleteIngredient({id: ing._id})} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
      )}
    </div>
  );
}
