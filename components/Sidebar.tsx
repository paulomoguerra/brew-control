"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coffee, Calculator, Microscope, X, GripVertical, Lock, Unlock } from "lucide-react";
import { 
  DndContext, 
  closestCenter, 
  type DragEndEvent,
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
  const [isCustomizeMode, setIsCustomizeMode] = useState(false);
  const getSections = () => [
    {
      id: "main",
      title: "Main",
      items: [
        { id: "tools", href: "/calculator", label: "Universal Calculator", icon: <Calculator size={20} /> },
        { id: "sensory", href: "/quality", label: "Sensory Lab", icon: <Microscope size={20} /> },
      ]
    },
  ];
  
  const [sections, setSections] = useState(getSections());

  useEffect(() => {
    setSections(getSections());
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('brewcontrol-sidebar-layout');
    if (saved) {
      // Logic to merge icons back would go here in a real production app
      // For now we'll stick to default layout for the icon components but allow reordering
    }
  }, []);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = sections.findIndex(s => s.id === active.id);
    const newIndex = sections.findIndex(s => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const newSections = arrayMove(sections, oldIndex, newIndex);
    setSections(newSections);
    localStorage.setItem('brewcontrol-sidebar-layout', JSON.stringify(newSections.map(s => s.id)));
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
          <div className="bg-caramel p-2 rounded-lg text-espresso">
            <Coffee size={24} />
          </div>
          <span className="text-xl font-bold tracking-tight">Brewline</span>
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
           className={`p-1.5 rounded-lg transition-all ${isCustomizeMode ? 'bg-caramel text-espresso' : 'text-slate-500 hover:text-white hover:bg-slate-800'}`}
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
          <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing text-slate-600 hover:text-caramel">
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
                ? "bg-caramel text-espresso shadow-lg shadow-caramel/20"
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
