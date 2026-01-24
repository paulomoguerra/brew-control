"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Coffee, Plus, Printer, Layout, Maximize2, X, Search, Loader2, Save, Scale, Thermometer, Timer, Zap, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { RecipeCard } from '../../components/RecipeCard';
import { useUnits } from '../../lib/units';
import { Skeleton } from '../../components/ui/Skeleton';

export default function RecipesPage() {
  const { t } = useUnits();
  const recipes = useQuery(api.recipes.listMenuItems);
  const addRecipe = useMutation(api.recipes.addMenuItem);
  const removeRecipe = useMutation(api.recipes.removeMenuItem);
  
  const [isWhiteboardMode, setIsWhiteboardMode] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    method: 'V60',
    salePrice: 5,
    coffeeDosageGrams: 18,
    waterTemp: 94,
    targetYield: 300,
    targetTime: 180,
    grindSetting: '',
    technique: ''
  });

  const filteredRecipes = recipes?.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.method?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handlePrint = () => {
    window.print();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await addRecipe({ ...formData, components: [] });
      setIsAdding(false);
      setFormData({
        name: '', method: 'V60', salePrice: 5, coffeeDosageGrams: 18,
        waterTemp: 94, targetYield: 300, targetTime: 180, grindSetting: '', technique: ''
      });
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (confirm('Are you sure you want to delete this recipe?')) {
      await removeRecipe({ id });
      if (selectedRecipe?._id === id) setSelectedRecipe(null);
    }
  };

  if (recipes === undefined) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-20 w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
          <Skeleton className="h-48 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (isWhiteboardMode) {
    return (
      <div className="fixed inset-0 bg-slate-900 z-[100] p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center border-b border-slate-800 pb-8">
            <h1 className="text-5xl font-black text-white italic uppercase tracking-tighter">Dial-in Whiteboard</h1>
            <button 
              onClick={() => setIsWhiteboardMode(false)}
              className="p-4 bg-white/10 text-white rounded-full hover:bg-white/20 transition-all"
            >
              <X size={32} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredRecipes?.map((recipe) => (
              <div key={recipe._id} className="cursor-pointer hover:scale-[1.02] transition-transform" onClick={() => setSelectedRecipe(recipe)}>
                <RecipeCard recipe={recipe} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">{t('common.recipes') || 'Brewing Lab'}</h1>
          <p className="text-slate-500 font-medium">Precision recipes for every bean and brew method.</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => setIsWhiteboardMode(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-100 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
          >
            <Maximize2 size={16} /> Whiteboard
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl"
          >
            <Plus size={16} /> New Recipe
          </button>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
        <input 
          type="text" 
          placeholder="Search recipes, methods, or beans..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-16 pr-8 py-6 bg-white border-2 border-slate-100 rounded-[2.5rem] font-bold text-lg outline-none focus:border-slate-900 transition-all shadow-sm"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredRecipes?.map((recipe) => (
            <div 
              key={recipe._id} 
              className={`p-6 bg-white border-2 transition-all cursor-pointer rounded-[2rem] hover:shadow-xl relative group ${selectedRecipe?._id === recipe._id ? 'border-slate-900 shadow-xl' : 'border-slate-100 shadow-sm'}`}
              onClick={() => setSelectedRecipe(recipe)}
            >
              <button 
                onClick={(e) => { e.stopPropagation(); handleDelete(recipe._id); }}
                className="absolute top-4 right-4 p-2 bg-red-50 text-red-500 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-100"
              >
                <Trash2 size={14} />
              </button>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">{recipe.name}</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{recipe.method}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <Coffee size={24} className="text-slate-900" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Dose</span>
                  <span className="font-black text-slate-900">{recipe.coffeeDosageGrams}g</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase block">Yield</span>
                  <span className="font-black text-slate-900">{recipe.targetYield}g</span>
                </div>
              </div>
            </div>
          ))}
          {filteredRecipes?.length === 0 && (
            <div className="col-span-full py-20 text-center">
              <div className="inline-block p-6 bg-slate-100 rounded-full mb-4"><Coffee size={40} className="text-slate-400" /></div>
              <h3 className="text-xl font-black text-slate-900">No recipes found</h3>
              <p className="text-slate-500 font-medium">Try a different search or create a new recipe.</p>
            </div>
          )}
        </div>

        <div className="lg:col-span-1">
          {selectedRecipe ? (
            <div className="sticky top-8 space-y-6">
              <div className="print-section">
                <RecipeCard recipe={selectedRecipe} />
              </div>
              <button 
                onClick={handlePrint}
                className="w-full flex items-center justify-center gap-2 bg-white border-2 border-slate-900 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-[4px_4px_0px_0px_rgba(15,23,42,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
              >
                <Printer size={16} /> Print Recipe Card
              </button>
            </div>
          ) : (
            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 text-center flex flex-col items-center justify-center h-full min-h-[400px]">
              <Layout size={48} className="text-slate-300 mb-4" />
              <p className="text-slate-500 font-bold">Select a recipe to view details and print cards.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Recipe Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-xl p-8 md:p-10 shadow-2xl relative animate-in zoom-in-95 duration-200">
             <button onClick={() => setIsAdding(false)} className="absolute top-6 right-6 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X size={20} /></button>
             <h2 className="text-2xl font-black text-slate-900 mb-8 uppercase italic tracking-tighter">New Recipe</h2>
             
             <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Recipe Name</label>
                  <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="input-field" placeholder="e.g. Ethiopia V60 - Light Roast" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Method</label>
                    <select value={formData.method} onChange={e => setFormData({...formData, method: e.target.value})} className="input-field">
                      <option>V60</option>
                      <option>Espresso</option>
                      <option>Aeropress</option>
                      <option>Chemex</option>
                      <option>French Press</option>
                      <option>Hario Suiren</option>
                      <option>Origami</option>
                      <option>Stagg X</option>
                      <option>Kalita Wave</option>
                      <option>Hario Switch</option>
                      <option>Siphon</option>
                      <option>Moka Pot</option>
                      <option>Orea V3</option>
                      <option>Cezve/Ibrik</option>
                      <option>Phin</option>
                      <option>Clever Dripper</option>
                      <option>Cold Drip</option>
                      <option>Woodneck (Nel Drip)</option>
                      <option>Ginar</option>
                      <option>December Dripper</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Grind Setting</label>
                    <input value={formData.grindSetting} onChange={e => setFormData({...formData, grindSetting: e.target.value})} className="input-field" placeholder="e.g. 24 clicks" />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Dose (g)</label>
                    <input type="number" required value={formData.coffeeDosageGrams} onChange={e => setFormData({...formData, coffeeDosageGrams: parseFloat(e.target.value)})} className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Yield (g)</label>
                    <input type="number" required value={formData.targetYield} onChange={e => setFormData({...formData, targetYield: parseFloat(e.target.value)})} className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Temp (°C)</label>
                    <input type="number" value={formData.waterTemp} onChange={e => setFormData({...formData, waterTemp: parseFloat(e.target.value)})} className="input-field" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Time (s)</label>
                    <input type="number" value={formData.targetTime} onChange={e => setFormData({...formData, targetTime: parseFloat(e.target.value)})} className="input-field" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Technique & Notes</label>
                  <textarea rows={3} value={formData.technique} onChange={e => setFormData({...formData, technique: e.target.value})} className="input-field resize-none" placeholder="Step-by-step instructions..." />
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-2xl disabled:opacity-50"
                >
                  {isSubmitting ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                  {isSubmitting ? 'Saving...' : 'Create Recipe'}
                </button>
             </form>
          </div>
        </div>
      )}

      <style jsx global>{`
        @media print {
          @page {
            size: auto;
            margin: 0mm;
          }
          body {
            background-color: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          body * {
            visibility: hidden;
            border-color: transparent !important;
          }
          .print-section, .print-section * {
            visibility: visible;
          }
          .print-section {
            position: fixed;
            left: 50%;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 120mm; /* Standard card width */
            border: none !important;
          }
          header, nav, .no-print, button {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
