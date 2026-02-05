"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Search, Scale, DollarSign, Menu, Languages } from "lucide-react";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { useUnits } from "../lib/units";

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const currentPath = usePathname();
  const { unit, toggleUnit, currency, toggleCurrency, language, setLanguage } = useUnits();

  const getTitle = (path: string) => {
    if (path === "/" || path === "/calculator") return "Universal Calculator";
    if (path === "/quality") return "Sensory Lab";
    return "Brew Control";
  };

  return (
    <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 sticky top-0 z-30 transition-all">
      <div className="flex items-center gap-4">
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 text-slate-600 hover:text-slate-900 lg:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-lg md:text-xl font-black text-slate-900 capitalize tracking-tight truncate max-w-[150px] md:max-w-none">
          {getTitle(currentPath)}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        
        {/* Language Toggle */}
        <button 
          onClick={() => setLanguage(language === 'en' ? 'pt-BR' : 'en')}
          className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors border border-slate-200"
          title="Toggle Language"
        >
          <Languages size={14} className="text-slate-500" />
          <span className={language === 'en' ? 'text-slate-900' : 'text-slate-400'}>EN</span>
          <span className="text-slate-300">/</span>
          <span className={language === 'pt-BR' ? 'text-slate-900' : 'text-slate-400'}>PT</span>
        </button>
        
        {/* Currency Toggle - Hidden on extra small mobile */}
        <button 
          onClick={toggleCurrency}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors border border-slate-200"
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
          className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest transition-colors border border-slate-200"
          title="Toggle Metric/Imperial"
        >
          <Scale size={14} className="text-slate-500" />
          <span className={unit === 'lbs' ? 'text-slate-900' : 'text-slate-400'}>LBS</span>
          <span className="text-slate-300">/</span>
          <span className={unit === 'kg' ? 'text-slate-900' : 'text-slate-400'}>KG</span>
        </button>

        <div className="relative hidden xl:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-caramel transition-colors" size={16} />
          <input 
            placeholder="Search..." 
            className="pl-10 pr-4 py-2 bg-slate-50 border border-transparent hover:border-slate-200 focus:border-caramel rounded-xl text-sm outline-none transition-all w-48 font-medium"
          />
        </div>

        <button className="relative p-2 text-slate-400 hover:text-slate-900 transition-colors hidden md:block">
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </button>

        <div className="h-8 w-px bg-slate-100 mx-2 hidden lg:block"></div>

        <div className="flex items-center gap-3 pl-2">
          <SignedOut>
            <Link
              href="/sign-in"
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all"
            >
              Sign In
            </Link>
          </SignedOut>
          <SignedIn>
            <UserButton appearance={{ elements: { avatarBox: "w-9 h-9 rounded-xl" } }} />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
