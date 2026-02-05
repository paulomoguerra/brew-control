"use client";

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { CheckCircle2, XCircle, AlertCircle, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  showToast: (message: string, type: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: ToastType) => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
    
    // Auto-dismiss after 4 seconds
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {toasts.map(toast => (
          <div
            key={toast.id}
            className={`
              pointer-events-auto flex items-center gap-3 px-6 py-4 rounded-2xl shadow-2xl
              backdrop-blur-md border-2 min-w-[320px] max-w-md
              animate-in slide-in-from-top-2 duration-300
              ${toast.type === 'success' ? 'bg-green-50/95 border-green-500 text-green-900' : ''}
              ${toast.type === 'error' ? 'bg-red-50/95 border-red-500 text-red-900' : ''}
              ${toast.type === 'warning' ? 'bg-cream/95 border-caramel text-espresso' : ''}
            `}
          >
            {toast.type === 'success' && <CheckCircle2 size={20} className="text-green-600 flex-shrink-0" />}
            {toast.type === 'error' && <XCircle size={20} className="text-red-600 flex-shrink-0" />}
            {toast.type === 'warning' && <AlertCircle size={20} className="text-cocoa flex-shrink-0" />}
            
            <span className="font-bold text-sm flex-1">{toast.message}</span>
            
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-slate-900 transition-colors flex-shrink-0"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
