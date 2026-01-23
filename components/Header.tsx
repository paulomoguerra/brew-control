"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, Scale, DollarSign } from "lucide-react";
import { useUnits } from "../lib/units";

export default function Header() {
  const currentPath = usePathname();
  const { unit, toggleUnit, currency, toggleCurrency } = useUnits();

  // formatted title helper
  const getTitle = (path: string) => {
    if (path === "/" || path === "/dashboard") return "Executive Dashboard";
    const segment = path.split("/")[1];
    return segment ? segment.charAt(0).toUpperCase() + segment.slice(1).replace("-", " ") : "RoasterOS";
  };

  return (
    <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-black text-slate-900 capitalize tracking-tight">
          {getTitle(currentPath)}
        </h1>
      </div>

      <div className="flex items-center gap-6">
        
        {/* Currency Toggle */}
        <button 
          onClick={toggleCurrency}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black uppercase tracking-widest transition-colors border border-slate-200"
          title="Toggle Currency"
        >
          <DollarSign size={14} className="text-slate-500" />
          <span className={currency === 'USD' ? 'text-slate-900' : 'text-slate-400'}>USD</span>
          <span className="text-slate-300">/</span>
          <span className={currency === 'BRL' ? 'text-slate-900' : 'text-slate-400'}>BRL</span>
        </button>

        {/* Unit Toggle */}
        <button 
          onClick={toggleUnit}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-black uppercase tracking-widest transition-colors border border-slate-200"
          title="Toggle Metric/Imperial"
        >
          <Scale size={14} className="text-slate-500" />
          <span className={unit === 'lbs' ? 'text-slate-900' : 'text-slate-400'}>LBS</span>
          <span className="text-slate-300">/</span>
          <span className={unit === 'kg' ? 'text-slate-900' : 'text-slate-400'}>KG</span>
        </button>

        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-amber-500 transition-colors" size={16} />
          <input 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-amber-500 rounded-xl text-sm outline-none transition-all w-64 font-medium"
          />
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-100 mx-2 hidden md:block"></div>

        <div className="flex items-center gap-3 pl-2 border-l border-transparent md:border-slate-100">
          <div className="text-right hidden md:block">
            <div className="text-sm font-bold text-slate-900 leading-none">Head Roaster</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Admin Access</div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-slate-900 border-2 border-white shadow-lg flex items-center justify-center text-white font-black text-xs tracking-wider">
            HR
          </div>
        </div>
      </div>
    </header>
  );
}