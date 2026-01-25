"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { useUnits } from "../lib/units";
import { X, Download, ChevronDown, ChevronRight } from "lucide-react";

interface RoastLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RoastLogModal({ isOpen, onClose }: RoastLogModalProps) {
  const { formatWeight, formatPrice, formatCurrency, toDisplayWeight, toDisplayPrice } = useUnits();
  const logs = useQuery(api.roasts.listLogs);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  
  if (!isOpen) return null;
  
  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };
  
  const exportCSV = () => {
    if (!logs) return;
    
    // CSV export logic
    const headers = ["Date", "Time", "Coffee", "Green In (kg)", "Roasted Out (kg)", "Shrinkage %", "Cost/kg", "Cost/250g", "Batch ID"];
    const rows = logs.map(log => {
      const costPerKg = log.trueCostPerLb * 2.20462; // Convert $/lb to $/kg
      const costPer250g = costPerKg * 0.25;
      
      return [
        new Date(log.roastDate).toLocaleDateString(),
        new Date(log.roastDate).toLocaleTimeString(),
        log.productName,
        toDisplayWeight(log.greenWeightIn).toFixed(2),
        toDisplayWeight(log.roastedWeightOut).toFixed(2),
        log.shrinkagePercent.toFixed(1),
        costPerKg.toFixed(2),
        costPer250g.toFixed(2),
        log.batchId
      ];
    });
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roast-log-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const getShrinkageColor = (shrinkage: number) => {
    if (shrinkage >= 12 && shrinkage <= 18) return "text-green-600";
    if (shrinkage < 10 || shrinkage > 25) return "text-red-600";
    return "text-amber-600";
  };
  
  const getShrinkageIcon = (shrinkage: number) => {
    if (shrinkage >= 12 && shrinkage <= 18) return "✅";
    if (shrinkage < 10 || shrinkage > 25) return "🔴";
    return "⚠️";
  };
  
  const filteredLogs = logs?.filter(log => 
    log.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* HEADER */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200">
          <h2 className="text-2xl font-black uppercase text-slate-900">Roast Log History</h2>
          <div className="flex gap-4">
            <button 
              onClick={exportCSV} 
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl font-black uppercase text-xs hover:bg-amber-600 transition-colors"
            >
              <Download size={16} /> Export CSV
            </button>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>
        
        {/* SEARCH/FILTER */}
        <div className="p-6 border-b border-slate-200 bg-slate-50">
          <input 
            type="text" 
            placeholder="🔍 Search by coffee name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full bg-white py-3 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500/20"
          />
        </div>
        
        {/* TABLE */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead className="sticky top-0 bg-slate-100 z-10">
              <tr className="text-left text-[10px] font-black uppercase tracking-widest text-slate-500">
                <th className="p-4">Date</th>
                <th className="p-4">Coffee</th>
                <th className="p-4">Green In</th>
                <th className="p-4">Roasted Out</th>
                <th className="p-4">Shrinkage %</th>
                <th className="p-4">Cost/kg</th>
                <th className="p-4">Cost/250g</th>
                <th className="p-4">Batch ID</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs && filteredLogs.length > 0 ? (
                filteredLogs.map(log => {
                  const isExpanded = expandedRows.has(log._id);
                  const costPerKg = log.trueCostPerLb * 2.20462; // Convert $/lb to $/kg
                  const costPer250g = costPerKg * 0.25;
                  
                  return (
                    <tr key={log._id}>
                      <td colSpan={9} className="p-0">
                        <div 
                          className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                          onClick={() => toggleRow(log._id)}
                        >
                          <div className="grid grid-cols-9 gap-4 p-4">
                            <div>
                              <div className="font-bold text-sm">{new Date(log.roastDate).toLocaleDateString()}</div>
                              <div className="text-xs text-slate-400">{new Date(log.roastDate).toLocaleTimeString()}</div>
                            </div>
                            <div className="font-black uppercase text-sm">{log.productName}</div>
                            <div>{formatWeight(log.greenWeightIn)}</div>
                            <div>{formatWeight(log.roastedWeightOut)}</div>
                            <div className={`font-black ${getShrinkageColor(log.shrinkagePercent)}`}>
                              {log.shrinkagePercent.toFixed(1)}% {getShrinkageIcon(log.shrinkagePercent)}
                            </div>
                            <div>{formatPrice(costPerKg)}</div>
                            <div className="font-bold">{formatCurrency(costPer250g)}</div>
                            <div className="text-xs text-slate-400">{log.batchId}</div>
                            <div className="text-slate-400">
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="bg-slate-50 px-4 pb-4">
                              <div className="grid grid-cols-4 gap-4 text-sm p-4 bg-white rounded-xl">
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 font-black block mb-1">Duration</span>
                                  <div className="font-bold">{log.durationMinutes} minutes</div>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 font-black block mb-1">Overhead Cost</span>
                                  <div className="font-bold">{formatCurrency(log.overheadCost || 0)}</div>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 font-black block mb-1">Green Cost</span>
                                  <div className="font-bold">{formatCurrency(toDisplayPrice(log.trueCostPerLb - (log.overheadCost || 0) / toDisplayWeight(log.roastedWeightOut)) * toDisplayWeight(log.greenWeightIn))}</div>
                                </div>
                                <div>
                                  <span className="text-[10px] uppercase text-slate-500 font-black block mb-1">Total Cost</span>
                                  <div className="font-bold text-lg text-amber-600">{formatCurrency(log.trueCostPerLb * log.roastedWeightOut)}</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-slate-400">
                    <div className="text-4xl mb-4">☕</div>
                    <div className="font-black uppercase text-sm">No roast logs found</div>
                    {searchTerm && <div className="text-xs mt-2">Try a different search term</div>}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* FOOTER */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 text-xs text-slate-500 flex justify-between items-center">
          <div>
            <span className="font-bold">{filteredLogs?.length || 0}</span> roasts found
          </div>
          <div className="flex gap-4">
            <span>✅ Normal (12-18%)</span>
            <span>⚠️ Unusual (&lt;10% or &gt;25%)</span>
            <span>🔴 Critical (&lt;10% or &gt;25%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
