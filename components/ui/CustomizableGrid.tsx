"use client";

import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface Props {
  items: string[];
  onReorder: (newItems: string[]) => void;
  renderItem: (id: string, isDragging: boolean) => React.ReactNode;
  isEditMode: boolean;
  columns?: string;
  getItemClassName?: (id: string) => string;
}

export function CustomizableGrid({ items, onReorder, renderItem, isEditMode, columns = "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", getItemClassName }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      onReorder(arrayMove(items, oldIndex, newIndex));
    }
    setActiveId(null);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        <div className={`grid gap-6 ${columns}`}>
          {items.map((id) => (
            <SortableItem 
              key={id} 
              id={id} 
              isEditMode={isEditMode} 
              renderItem={renderItem} 
              className={getItemClassName?.(id)}
            />
          ))}
        </div>
      </SortableContext>
      <DragOverlay adjustScale={true}>
        {activeId ? (
          <div className={`opacity-80 scale-105 cursor-grabbing ${getItemClassName?.(activeId)}`}>
            {renderItem(activeId, true)}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function SortableItem({ id, isEditMode, renderItem, className }: any) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 0,
  };

  return (
    <div ref={setNodeRef} style={style} className={`relative group ${className || ''}`}>
      {isEditMode && (
        <div 
          {...attributes} 
          {...listeners}
          className="absolute -top-3 -left-3 z-30 p-2 bg-amber-500 text-slate-900 rounded-full shadow-lg cursor-grab active:cursor-grabbing hover:scale-110 transition-transform animate-bounce-subtle"
        >
          <GripVertical size={16} />
        </div>
      )}
      <div className={`${isDragging ? 'opacity-0' : 'opacity-100'}`}>
        {renderItem(id, false)}
      </div>
    </div>
  );
}
