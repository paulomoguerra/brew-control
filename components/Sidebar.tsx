"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, Database, Flame, DollarSign, Award, BookOpen, Settings, Store, Package } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  // Reorganized by logical grouping
  const navSections = [
    {
      title: "Overview",
      items: [
        { href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      title: "Inventory & Production",
      items: [
        { href: "/inventory", label: "Green Inventory", icon: <Database size={20} /> },
        { href: "/recipes", label: "Blend Designer", icon: <BookOpen size={20} /> },
        { href: "/roast", label: "Production Log", icon: <Flame size={20} /> },
        { href: "/quality", label: "Quality Control", icon: <Award size={20} /> },
      ]
    },
    {
      title: "Sales & Revenue",
      items: [
        { href: "/sales", label: "Wholesale Orders", icon: <Package size={20} /> },
        { href: "/cafe", label: "Cafe Operations", icon: <Store size={20} /> },
      ]
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 h-screen sticky top-0 z-40">
      <Link 
        href="/"
        className="p-6 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors"
      >
        <div className="bg-amber-500 p-2 rounded-lg text-slate-900">
          <Coffee size={24} />
        </div>
        <span className="text-xl font-bold tracking-tight">RoasterOS</span>
      </Link>

      <nav className="flex-1 px-4 space-y-6 mt-4 overflow-y-auto">
        {navSections.map((section) => (
          <div key={section.title}>
            <div className="px-4 py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold w-full text-left ${
                    isActive(item.href)
                      ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {item.icon}
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 mt-auto">
        <Link
          href="/settings"
          className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold w-full text-left ${
            isActive("/settings")
              ? "bg-slate-800 text-white"
              : "text-slate-500 hover:text-white hover:bg-slate-800"
          }`}
        >
          <Settings size={20} />
          Settings
        </Link>
      </div>
    </aside>
  );
}
