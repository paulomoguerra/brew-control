"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, Save, Trash2 } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { ResponsiveContainer, PieChart as RePie, Pie, Cell, Tooltip } from 'recharts';
import { Id } from '../../convex/_generated/dataModel';

interface RecipeComponent {
  greenBatchId: Id<"greenInventory">;
  percentage: number;
}

export default function RecipesPage() {
  const { formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Fetch Data from Convex
  const inventory = useQuery(api.inventory.list);
  const recipes = useQuery(api.recipes.list);
  const addRecipe = useMutation(api.recipes.add);
  const removeRecipe = useMutation(api.recipes.remove);

  // Form State
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const isLoading = inventory === undefined || recipes === undefined;
  const [name, setName] = useState('');
  const [targetShrinkage, setTargetShrinkage] = useState(15.0);
  const [components, setComponents] = useState<RecipeComponent[]>([{ greenBatchId: '' as Id<"greenInventory">, percentage: 100 }]);

  // Calculations
  const calculatedStats = useMemo(() => {
    if (!inventory) return { totalPercentage: 0, weightedGreenCost: 0, projectedRoastedCost: 0, pieData: [] };
    
    let totalPercentage = 0;
    let weightedGreenCost = 0;
    const pieData = [];

    components.forEach(comp => {
      const batch = inventory.find(b => b._id === comp.greenBatchId);
      if (batch) {
        totalPercentage += comp.percentage;
        weightedGreenCost += batch.costPerLb * (comp.percentage / 100);
        pieData.push({ name: batch.origin, value: comp.percentage, color: '#f59e0b' });
      }
    });

    const shrinkageFactor = 1 - (targetShrinkage / 100);
    const projectedRoastedCost = shrinkageFactor > 0 ? weightedGreenCost / shrinkageFactor : 0;

    return { totalPercentage, weightedGreenCost, projectedRoastedCost, pieData };
  }, [components, inventory, targetShrinkage]);

  // Handlers
  const addComponent = () => {
    setComponents([...components, { greenBatchId: '' as Id<"greenInventory">, percentage: 0 }]);
  };

  const removeComponent = (index: number) => {
    const newComps = [...components];
    newComps.splice(index, 1);
    setComponents(newComps);
  };

  const updateComponent = (index: number, field: keyof RecipeComponent, value: any) => {
    const newComps = [...components];
    newComps[index] = { ...newComps[index], [field]: value };
    setComponents(newComps);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Math.abs(calculatedStats.totalPercentage - 100) > 0.1) return; // Must equal 100%
    
    setIsSaving(true);
    try {
      await addRecipe({
        name,
        targetShrinkage,
        components,
        projectedCostPerLb: calculatedStats.projectedRoastedCost,
      });
      showToast('Recipe created successfully', 'success');
      setIsCreating(false);
      setName('');
      setComponents([{ greenBatchId: '' as Id<"greenInventory">, percentage: 100 }]);
    } catch (err) {
      console.error(err);
      showToast('Failed to create recipe', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"recipes">) => {
    if (confirm("Delete this recipe?")) {
      try {
        await removeRecipe({ recipeId: id });
        showToast('Recipe deleted', 'success');
      } catch (err) {
        console.error(err);
        showToast('Failed to delete recipe', 'error');
      }
    }
  };

  const COLORS = ['#f59e0b', '#0f172a', '#64748b', '#cbd5e1'];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Recipe Engineering</h1>
          <p className="text-slate-500 font-medium">Design blends and forecast margins before roasting.</p>
        </div>
        {!isCreating && (
          <button onClick={() => setIsCreating(true)} className="btn-primary flex items-center gap-2">
            <Plus size={20} /> New Recipe
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Recipe List */}
        <div className={`${isCreating ? 'lg:col-span-1' : 'lg:col-span-3'} space-y-6 transition-all`}>
           {!inventory || !recipes ? (
             <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>
           ) : recipes.length === 0 && !isCreating ? (
             <div className="text-center p-12 border-2 border-dashed border-slate-200 rounded-[2rem]">
               <p className="text-slate-400 font-bold">No recipes yet. Start designing.</p>
             </div>
           ) : (
             <div className={`grid gap-4 ${isCreating ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
                {recipes.map(recipe => (
                  <div key={recipe._id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                    <button onClick={() => handleDelete(recipe._id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Trash2 size={16} />
                    </button>
                    <h3 className="text-lg font-black text-slate-900 mb-1">{recipe.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                       <span className="text-2xl font-black text-amber-500">{formatPrice(recipe.projectedCostPerLb)}</span>
                       <span className="text-[10px] uppercase font-bold text-slate-400">Est. Base Cost</span>
                    </div>
                    <div className="space-y-2">
                       {recipe.components.map((comp, idx) => {
                         const batch = inventory.find(b => b._id === comp.greenBatchId);
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-8 space-y-8">
        <header className="flex justify-between items-center">
          <div className="space-y-2">
            <Skeleton className="h-10 w-[300px]" />
            <Skeleton className="h-4 w-[400px]" />
          </div>
          <Skeleton className="h-12 w-[150px] rounded-xl" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
          <Skeleton className="h-48 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
                           <div key={idx} className="flex justify-between text-xs">
                              <span className="font-medium text-slate-600">{batch?.origin || 'Unknown'}</span>
                              <span className="font-bold text-slate-900">{comp.percentage}%</span>
                           </div>
                         )
                       })}
                    </div>
                  </div>
                ))}
             </div>
           )}
        </div>

        {/* Right: Creator (Conditional) */}
        {isCreating && (
          <div className="lg:col-span-2">
            <Card title="Recipe Designer" action={<button onClick={() => setIsCreating(false)} className="text-sm font-bold text-slate-400 hover:text-slate-900">Cancel</button>}>
              <form onSubmit={handleSave} className="space-y-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recipe Name</label>
                    <input required value={name} onChange={e => setName(e.target.value)} className="input-field" placeholder="e.g. House Espresso" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Target Shrinkage (%)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      required 
                      value={isNaN(targetShrinkage) ? '' : targetShrinkage} 
                      onChange={e => setTargetShrinkage(parseFloat(e.target.value))} 
                      className="input-field" 
                    />
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                      <span className="text-xs font-black text-slate-900 uppercase">Blend Components</span>
                      <button type="button" onClick={addComponent} className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1">
                        <Plus size={14} /> Add Bean
                      </button>
                   </div>
                   {components.map((comp, index) => (
                     <div key={index} className="flex gap-4 items-center animate-in slide-in-from-left-2">
                        <select 
                          required 
                          value={comp.greenBatchId} 
                          onChange={e => updateComponent(index, 'greenBatchId', e.target.value)} 
                          className="input-field flex-grow"
                        >
                          <option value="">Select Inventory...</option>
                          {inventory?.map(b => (
                            <option key={b._id} value={b._id}>{b.origin} ({formatCurrency(b.costPerLb)}/lb)</option>
                          ))}
                        </select>
                        <div className="relative w-24">
                           <input 
                              type="number" 
                              required 
                              min="0"
                              max="100"
                              value={comp.percentage} 
                              onChange={e => updateComponent(index, 'percentage', parseFloat(e.target.value))} 
                              className="input-field pr-8 text-right"
                           />
                           <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                        </div>
                        {components.length > 1 && (
                          <button type="button" onClick={() => removeComponent(index)} className="text-slate-300 hover:text-red-500">
                             <Trash2 size={18} />
                          </button>
                        )}
                     </div>
                   ))}
                </div>

                {/* Live Analysis */}
                <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                   <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Total Composition</span>
                        <span className={`text-sm font-black ${Math.abs(calculatedStats.totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-red-500'}`}>
                           {calculatedStats.totalPercentage}%
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-slate-500">Raw Green Cost</span>
                        <span className="text-sm font-bold text-slate-900">{formatPrice(calculatedStats.weightedGreenCost)}</span>
                      </div>
                      <div className="pt-4 border-t border-slate-200">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Projected Roasted Cost</span>
                         <div className="text-3xl font-black text-amber-500">{formatPrice(calculatedStats.projectedRoastedCost)}</div>
                      </div>
                   </div>
                   
                   <div className="h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <RePie>
                           <Pie
                             data={calculatedStats.pieData}
                             dataKey="value"
                             nameKey="name"
                             cx="50%"
                             cy="50%"
                             innerRadius={40}
                             outerRadius={60}
                           >
                              {calculatedStats.pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                           </Pie>
                           <Tooltip />
                        </RePie>
                      </ResponsiveContainer>
                   </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isSaving || Math.abs(calculatedStats.totalPercentage - 100) > 0.1} 
                  className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  Save Recipe Config
                </button>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}