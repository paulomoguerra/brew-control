"use client";

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { BookmarkPlus, Calculator, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { SignedIn, SignedOut, useAuth } from '@clerk/nextjs';
import { useToast } from '../../components/ui/Toast';

export default function CoffeeCalculator() {
  const { showToast } = useToast();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const recipes = useQuery(api.brewRecipes.listForUser);
  const addRecipe = useMutation(api.brewRecipes.add);
  const removeRecipe = useMutation(api.brewRecipes.remove);

  const [coffeeGrams, setCoffeeGrams] = useState<string>('20');
  const [ratio, setRatio] = useState<string>('16');
  const [waterVolume, setWaterVolume] = useState<string>('320');
  const [calcMode, setCalcMode] = useState<'coffee' | 'water'>('coffee');

  const [coffeeName, setCoffeeName] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeRecipeId, setActiveRecipeId] = useState<string | null>(null);

  const brewMath = useMemo(() => {
    const cg = parseFloat(coffeeGrams) || 0;
    const r = parseFloat(ratio) || 0;
    const wv = parseFloat(waterVolume) || 0;

    if (calcMode === 'coffee') {
      return { waterNeeded: cg * r, coffeeNeeded: cg };
    } else {
      return { waterNeeded: wv, coffeeNeeded: r > 0 ? wv / r : 0 };
    }
  }, [coffeeGrams, ratio, waterVolume, calcMode]);

  const applyRecipe = (recipe: any) => {
    setCalcMode(recipe.mode);
    setRatio(recipe.ratio.toString());
    setCoffeeGrams(recipe.coffeeDose.toString());
    setWaterVolume(recipe.waterAmount.toString());
    setCoffeeName(recipe.coffeeName);
    setNotes(recipe.notes || '');
    setActiveRecipeId(recipe._id);
  };

  const handleSave = async () => {
    const ratioNum = parseFloat(ratio) || 0;
    const coffeeDose = calcMode === 'coffee' ? parseFloat(coffeeGrams) || 0 : brewMath.coffeeNeeded;
    const waterAmount = calcMode === 'coffee' ? brewMath.waterNeeded : parseFloat(waterVolume) || 0;

    if (!isLoaded || !isSignedIn) {
      showToast('Please sign in to save recipes.', 'warning');
      return;
    }

    if (!coffeeName.trim()) {
      showToast('Add a coffee name before saving.', 'warning');
      return;
    }

    if (!ratioNum || !coffeeDose || !waterAmount) {
      showToast('Please enter valid brew values.', 'warning');
      return;
    }

    setIsSaving(true);
    try {
      const token = await getToken({ template: "convex" });
      if (!token) {
        showToast('Auth token missing. Please sign out and sign back in.', 'error');
        setIsSaving(false);
        return;
      }
      await addRecipe({
        coffeeName: coffeeName.trim(),
        ratio: ratioNum,
        coffeeDose,
        waterAmount,
        mode: calcMode,
        notes: notes.trim() || undefined,
      });
      setCoffeeName('');
      setNotes('');
      setActiveRecipeId(null);
      showToast('Recipe saved to your account.', 'success');
    } catch (error) {
      console.error(error);
      const message = (error as any)?.message || 'Could not save recipe.';
      showToast(message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: any) => {
    if (!confirm('Delete this recipe?')) return;
    await removeRecipe({ id });
    if (activeRecipeId === id) setActiveRecipeId(null);
  };

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-cream rounded-2xl border border-oat">
            <Calculator className="text-espresso" size={20} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Universal Calculator</h1>
        </div>
        <p className="text-slate-500 font-medium">Brewing Science with synced recipes for every coffee.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <Card title="Brewing Science" subtitle="Precision ratio scaling">
          <div className="space-y-8">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-fit">
              <button 
                onClick={() => setCalcMode('coffee')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcMode === 'coffee' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
              >
                Scale by Coffee
              </button>
              <button 
                onClick={() => setCalcMode('water')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${calcMode === 'water' ? 'bg-white shadow-md text-slate-900' : 'text-slate-500'}`}
              >
                Scale by Water
              </button>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Brew Ratio (1 : X)</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="2" max="20" step="0.5" value={ratio} onChange={e => setRatio(e.target.value)} className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-caramel" />
                  <span className="w-12 text-center font-black text-slate-900">1:{ratio}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {calcMode === 'coffee' ? (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coffee Dose (g)</label>
                    <input type="number" value={coffeeGrams} onChange={e => setCoffeeGrams(e.target.value)} className="input-field bg-slate-50 border-none text-xl font-bold" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Water Volume (ml)</label>
                    <input type="number" value={waterVolume} onChange={e => setWaterVolume(e.target.value)} className="input-field bg-slate-50 border-none text-xl font-bold" />
                  </div>
                )}
                
                <div className="bg-slate-50 rounded-[2rem] p-6 flex items-center justify-center border-2 border-dashed border-slate-200">
                  <div className="text-center">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Required {calcMode === 'coffee' ? 'Water' : 'Coffee'}</span>
                    <div className="text-3xl font-black text-slate-900">
                      {calcMode === 'coffee' ? `${brewMath.waterNeeded.toFixed(0)}ml` : `${brewMath.coffeeNeeded.toFixed(1)}g`}
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-4">Ratio Presets</span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: 'Espresso (1:2)', val: '2' },
                    { label: 'Strong Pour Over (1:15)', val: '15' },
                    { label: 'Golden Ratio (1:16.6)', val: '16.6' },
                    { label: 'Cupping (1:18)', val: '18' }
                  ].map(p => (
                    <button key={p.val} onClick={() => setRatio(p.val)} className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-600 hover:border-caramel hover:text-cocoa transition-all">
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coffee Name</label>
                    <input
                      type="text"
                      value={coffeeName}
                      onChange={e => setCoffeeName(e.target.value)}
                      placeholder="Ethiopia Gedeb"
                      className="input-field bg-slate-50 border-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={notes}
                      onChange={e => setNotes(e.target.value)}
                      placeholder="V60, medium-fine"
                      className="input-field bg-slate-50 border-none"
                    />
                  </div>
                </div>

                <SignedOut>
                  <div className="p-4 bg-cream border border-oat rounded-2xl text-sm font-bold text-espresso">
                    Sign in to save and sync recipes across devices.
                  </div>
                  <div className="flex gap-3">
                    <Link href="/auth" className="flex-1 btn-secondary">Sign In</Link>
                    <Link href="/sign-up" className="flex-1 btn-primary">Create Account</Link>
                  </div>
                </SignedOut>

                <SignedIn>
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full btn-primary"
                  >
                    <BookmarkPlus size={16} /> {isSaving ? 'Saving...' : 'Save Recipe'}
                  </button>
                </SignedIn>
              </div>
            </div>
          </div>
        </Card>

        <Card title="Saved Recipes" subtitle="Synced to your account">
          <SignedOut>
            <div className="text-sm font-medium text-slate-500">
              Sign in to view your saved recipes.
            </div>
          </SignedOut>
          <SignedIn>
            <div className="space-y-3">
              {recipes === undefined ? (
                <div className="text-sm text-slate-500 font-medium">Loading recipes...</div>
              ) : recipes.length ? (
                recipes.map((recipe: any) => (
                  <button
                    key={recipe._id}
                    onClick={() => applyRecipe(recipe)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all group ${
                      activeRecipeId === recipe._id
                        ? 'border-caramel bg-cream'
                        : 'border-slate-100 bg-white hover:border-oat'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <div className="text-sm font-black text-slate-900 uppercase tracking-tight">
                          {recipe.coffeeName}
                        </div>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          1:{recipe.ratio} • {recipe.coffeeDose.toFixed(1)}g → {recipe.waterAmount.toFixed(0)}ml
                        </div>
                        {recipe.notes && (
                          <div className="text-xs text-slate-500 font-medium">{recipe.notes}</div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(recipe._id);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-slate-500 font-medium">No saved recipes yet.</div>
              )}
            </div>
          </SignedIn>
        </Card>
      </div>
    </div>
  );
}
