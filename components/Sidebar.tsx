"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, LayoutDashboard, Database, Flame, Award, BookOpen, Settings, Store, Package, X, Calculator, Book, Users, GripVertical, Lock, Unlock } from "lucide-react";
import { useUnits } from "../lib/units";
import { 
  DndContext, 
  closestCenter, 
  PointerSensor, 
  useSensor, 
  useSensors 
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {

  const pathname = usePathname();
  const { t } = useUnits();
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const [sections, setSections] = useState([
    {
      id: "command",
      title: "Command Center",
      items: [
        { id: "dash", href: "/dashboard", label: t('common.dashboard'), icon: <LayoutDashboard size={20} /> },
        { id: "clients", href: "/clients", label: "Client Intelligence", icon: <Users size={20} /> },
      ]
    },
    {
      id: "revenue",
      title: "Revenue & Sales",
      items: [
        { id: "sales", href: "/sales", label: "Sales Hub", icon: <Package size={20} /> },
        { id: "cafe", href: "/cafe", label: "Cafe Operations", icon: <Store size={20} /> },
      ]
    },
    {
      id: "roastery",
      title: "The Roastery",
      items: [
        { id: "prod", href: "/roast", label: "Production Hub", icon: <Flame size={20} /> },
        { id: "green", href: "/inventory", label: "Green Coffee", icon: <Database size={20} /> },
        { id: "roasted", href: "/inventory/roasted", label: "Roasted Stock", icon: <Package size={20} /> },
      ]
    },
    {
      id: "lab",
      title: "The Laboratory",
      items: [
        { id: "sensory", href: "/quality", label: "Sensory Lab", icon: <Award size={20} /> },
        { id: "brew", href: "/recipes", label: "Brewing Lab", icon: <Book size={20} /> },
        { id: "tools", href: "/calculator", label: "Precision Tools", icon: <Calculator size={20} /> },
      ]
    },
  ]);

  useEffect(() => {
    const saved = localStorage.getItem('roasteros-sidebar-layout');
    if (saved) {
      // Logic to merge icons back would go here in a real production app
      // For now we'll stick to default layout for the icon components but allow reordering
    }
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = sections.findIndex(s => s.id === active.id);
      const newIndex = sections.findIndex(s => s.id === over.id);
      const newSections = arrayMove(sections, oldIndex, newIndex);
      setSections(newSections);
      localStorage.setItem('roasteros-sidebar-layout', JSON.stringify(newSections.map(s => s.id)));
    }
  };

  const isActive = (href: string) => pathname === href;

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

      <div className="px-6 mb-4 flex justify-between items-center">
         <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Navigation</span>
         <button 
           onClick={() => setIsCustomizeMode(!isCustomizeMode)}
           className={`p-1.5 rounded-lg transition-all ${isCustomizeMode ? 'bg-amber-500 text-slate-900' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
         >
           {isCustomizeMode ? <Unlock size={14} /> : <Lock size={14} />}
         </button>
      </div>

      <nav className="flex-1 px-4 space-y-6 overflow-y-auto custom-scrollbar">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
            {sections.map((section) => (
              <SortableSection 
                key={section.id} 
                section={section} 
                isActive={isActive} 
                onClose={onClose} 
                isCustomizeMode={isCustomizeMode} 
              />
            ))}
          </SortableContext>
        </DndContext>
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
          {t('common.settings')}
        </Link>
      </div>
    </aside>
  );
}

function SortableSection({ section, isActive, onClose, isCustomizeMode }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 0
  };

  return (
    <div ref={setNodeRef} style={style} className="space-y-1 relative">
      <div className="flex items-center justify-between px-4 py-2">
        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
          {section.title}
        </div>
        {isCustomizeMode && (
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-amber-500">
            <GripVertical size={14} />
          </div>
        )}
      </div>
      <div className="space-y-1">
        {section.items.map((item: any) => (
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
  );
}
