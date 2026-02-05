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

export function StatCard({ label, value, icon, trend, alert, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white p-8 rounded-[3rem] border ${alert ? 'border-red-200 bg-red-50' : 'border-slate-200'} shadow-sm transition-all hover:shadow-xl flex flex-col items-center text-center h-full group ${onClick ? 'cursor-pointer active:scale-95' : ''}`}
    >
      <div className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center rounded-[1.25rem] border mb-6 ${alert ? 'bg-white border-red-100' : 'bg-slate-50 border-slate-100'} ${onClick ? 'group-hover:bg-cream group-hover:border-caramel/30 transition-colors' : ''}`}>
        {icon}
      </div>
      
      <div className="flex-1 flex flex-col items-center justify-center space-y-1">
        <div className="text-xl sm:text-2xl md:text-3xl font-black text-slate-900 leading-none tracking-tighter">
          {value}
        </div>
        <div className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] leading-tight pb-1">
          {label}
        </div>
        
        {trend && (
          <div className="pt-2">
            <span className={`text-[8px] md:text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${alert ? 'bg-red-200 text-red-700' : 'bg-slate-100 text-slate-500'} whitespace-nowrap`}>
              {trend}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
