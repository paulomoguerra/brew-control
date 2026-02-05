"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Microscope } from 'lucide-react';

export default function MobileNav() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  const navItems = [
    { href: "/calculator", label: "Calculator", icon: <Calculator size={20} /> },
    { href: "/quality", label: "Sensory Lab", icon: <Microscope size={20} /> },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-50 px-4 pb-safe-offset-2">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {navItems.map((item) => (
          <Link 
            key={item.href} 
            href={item.href}
            className={`flex flex-col items-center gap-1 transition-all ${
              isActive(item.href) 
                ? "text-cocoa scale-110" 
                : "text-slate-400"
            }`}
          >
            <div className={`p-1.5 rounded-xl ${isActive(item.href) ? "bg-cream" : ""}`}>
              {item.icon}
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
