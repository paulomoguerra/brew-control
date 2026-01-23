"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, Database, Flame, Award, BookOpen, Settings, Store, Package, X } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

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
    <aside className={`
      fixed inset-y-0 left-0 z-40 w-64 bg-slate-900 text-white flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen
      ${isOpen ? "translate-x-0" : "-translate-x-full"}
    `}>
      <div className="flex items-center justify-between lg:block">
        <Link 
          href="/"
          onClick={onClose}
          className="p-6 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50 transition-colors w-full"
        >
          <div className="bg-amber-500 p-2 rounded-lg text-slate-900">
            <Coffee size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">RoasterOS</span>
        </Link>
        <button 
          onClick={onClose}
          className="p-6 text-slate-400 hover:text-white lg:hidden"
        >
          <X size={24} />
        </button>
      </div>

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
                  onClick={onClose}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold w-full text-left group relative ${
                    isActive(item.href)
                      ? "bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/20"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {isActive(item.href) && (
                    <div className="absolute left-0 w-1 h-6 bg-slate-900 rounded-r-full" />
                  )}
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
          onClick={onClose}
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
