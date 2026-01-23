import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
}

export function Card({ children, className = '', title, subtitle, action }: CardProps) {
  return (
    <div className={`bg-white rounded-[2rem] border border-slate-200 shadow-xl overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="px-6 md:px-8 py-5 md:py-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
          <div>
            {title && <h3 className="text-lg md:text-xl font-black text-slate-900 tracking-tight">{title}</h3>}
            {subtitle && <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{subtitle}</p>}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-6 md:p-8">
        {children}
      </div>
    </div>
  );
}

export function StatCard({ label, value, icon, trend, alert }: any) {
  return (
    <div className={`bg-white p-5 md:p-6 rounded-[2rem] border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-lg`}>
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2 md:p-3 rounded-xl border ${alert ? 'bg-white border-red-100' : 'bg-slate-50 border-slate-100'}`}>
          {icon}
        </div>
        {trend && (
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 md:px-3 py-1 rounded-full ${alert ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-500'}`}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl md:text-3xl font-black text-slate-900 mb-1 tracking-tight">
        {value}
      </div>
      <div className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
  );
}
