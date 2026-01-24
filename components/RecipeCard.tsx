"use client";

import React from 'react';
import { Coffee, Thermometer, Timer, Scale, Settings, Zap } from 'lucide-react';
import { useUnits } from '../lib/units';

interface RecipeCardProps {
  recipe: {
    name: string;
    method?: string;
    coffeeDosageGrams: number;
    waterTemp?: number;
    targetYield?: number;
    targetTime?: number;
    grindSetting?: string;
    technique?: string;
  };
  isPreview?: boolean;
}

export const RecipeCard = ({ recipe, isPreview = false }: RecipeCardProps) => {
  const { t } = useUnits();

  return (
    <div className={`bg-white border-2 border-slate-900 p-6 md:p-8 rounded-none shadow-[8px_8px_0px_0px_rgba(15,23,42,1)] max-w-md mx-auto ${isPreview ? 'scale-90' : ''} print:shadow-none print:border-slate-400 print:m-0 print:max-w-none`}>
      <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">{recipe.name}</h2>
          <span className="text-[10px] font-black bg-slate-900 text-white px-2 py-0.5 uppercase tracking-widest">{recipe.method || 'Standard Brew'}</span>
        </div>
        <Coffee size={32} className="text-slate-900" />
      </div>

      <div className="grid grid-cols-2 gap-6 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Scale size={12} /> Coffee
          </div>
          <div className="text-xl font-black text-slate-900">{recipe.coffeeDosageGrams}g</div>
        </div>
        
        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Yield <Zap size={12} />
          </div>
          <div className="text-xl font-black text-slate-900">{recipe.targetYield || '--'}g</div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            <Thermometer size={12} /> Temp
          </div>
          <div className="text-xl font-black text-slate-900">{recipe.waterTemp || '--'}°C</div>
        </div>

        <div className="space-y-1 text-right">
          <div className="flex items-center justify-end gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
            Time <Timer size={12} />
          </div>
          <div className="text-xl font-black text-slate-900">{recipe.targetTime || '--'}s</div>
        </div>
      </div>

      <div className="bg-slate-50 p-4 border-2 border-dashed border-slate-200 mb-6">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
          <Settings size={12} /> Grind Setting
        </div>
        <div className="text-lg font-black text-slate-900">{recipe.grindSetting || 'Not Specified'}</div>
      </div>

      {recipe.technique && (
        <div className="space-y-2">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Technique & Tips</div>
          <p className="text-xs font-bold leading-relaxed text-slate-600 italic">
            {recipe.technique}
          </p>
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-slate-100 flex justify-between items-center opacity-50">
        <span className="text-[8px] font-black uppercase tracking-[0.3em]">RoasterOS Precision Brew</span>
        <div className="h-4 w-4 bg-slate-900 rotate-45" />
      </div>
    </div>
  );
};
