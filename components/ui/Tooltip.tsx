"use client";

import React, { useState } from 'react';
import { HelpCircle } from 'lucide-react';

interface TooltipProps {
  content: string;
  children?: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ content, children, position = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help inline-flex"
      >
        {children || <HelpCircle size={16} className="text-slate-400 hover:text-slate-600 transition-colors" />}
      </div>
      
      {isVisible && (
        <div
          className={`
            absolute z-50 ${positionClasses[position]}
            px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg shadow-lg
            w-64 pointer-events-none
            animate-in fade-in duration-200
          `}
        >
          {content}
          {/* Arrow */}
          <div
            className={`
              absolute w-2 h-2 bg-slate-900 rotate-45
              ${position === 'top' ? 'bottom-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'bottom' ? 'top-[-4px] left-1/2 -translate-x-1/2' : ''}
              ${position === 'left' ? 'right-[-4px] top-1/2 -translate-y-1/2' : ''}
              ${position === 'right' ? 'left-[-4px] top-1/2 -translate-y-1/2' : ''}
            `}
          />
        </div>
      )}
    </div>
  );
}

export function HelpTooltip({ content, position = 'top' }: { content: string; position?: 'top' | 'bottom' | 'left' | 'right' }) {
  return <Tooltip content={content} position={position} />;
}
