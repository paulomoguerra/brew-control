"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Award, Loader2, CheckCircle2, TrendingUp, Star, Microscope } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine } from 'recharts';
import { Card } from '../../components/ui/Card';

export default function QualityPage() {
  const { formatCurrency } = useUnits();
  
  // Data
  const recentRoasts = useQuery(api.roasts.listLogs);
  const sessions = useQuery(api.quality.listSessions);
  const logSession = useMutation(api.quality.logSession);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [selectedRoastId, setSelectedRoastId] = useState('');
  const [cupperName, setCupperName] = useState('');
  const [notes, setNotes] = useState('');
  
  // Sensory Attributes (0-10)
  const [attributes, setAttributes] = useState({
    aroma: 8,
    flavor: 8,
    aftertaste: 8,
    acidity: 8,
    body: 8,
    balance: 8,
    uniformity: 10,
    cleanCup: 10,
    sweetness: 10,
    defects: 0
  });

  const totalScore = Object.values(attributes).reduce((a, b) => a + b, 0) - (attributes.defects * 2);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRoastId) return;

    setIsSubmitting(true);
    try {
      await logSession({
        roastLogId: selectedRoastId as any,
        cupperName,
        score: totalScore,
        notes,
        ...attributes
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNotes('');
        setSelectedRoastId('');
        setAttributes({ aroma: 8, flavor: 8, aftertaste: 8, acidity: 8, body: 8, balance: 8, uniformity: 10, cleanCup: 10, sweetness: 10, defects: 0 });
      }, 2000);
    } catch (err) {
      console.error("Error logging session:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chart Data
  const scatterData = sessions?.map(s => ({
    x: s.roastInfo?.trueCostPerLb || 0,
    y: s.score,
    z: 1,
    name: s.roastInfo?.productName || "Unknown",
    batch: s.roastInfo?.batchId || "?",
  })).filter(d => d.x > 0) || [];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700 p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Sensory Lab</h1>
          <p className="text-slate-500 font-medium">SCA-standard cupping and value analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Microscope size={100} />
             </div>
             
             <div className="flex items-center gap-3 mb-2">
              <div className="bg-amber-100 p-2 rounded-xl text-amber-600">
                <Star size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900">New Session</h2>
            </div>

            <div className="space-y-4 relative z-10">
              <input 
                placeholder="Cupper Name" 
                value={cupperName} 
                onChange={e => setCupperName(e.target.value)} 
                className="input-field"
                required 
              />
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Select Roast Batch</label>
                <select 
                  required
                  value={selectedRoastId}
                  onChange={e => setSelectedRoastId(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold outline-none focus:ring-4 focus:ring-amber-500/10 transition-all appearance-none text-sm"
                >
                  <option value="">-- Choose Batch --</option>
                  {recentRoasts?.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.productName} ({new Date(r.roastDate).toLocaleDateString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                 {['aroma', 'flavor', 'aftertaste', 'acidity', 'body', 'balance'].map((attr) => (
                   <div key={attr} className="space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{attr}</label>
                        <span className="text-[10px] font-black">{attributes[attr as keyof typeof attributes]}</span>
                      </div>
                      <input 
                        type="range" min="6" max="10" step="0.25"
                        value={attributes[attr as keyof typeof attributes]}
                        onChange={e => setAttributes({...attributes, [attr]: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500"
                      />
                   </div>
                 ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                 <span className="font-bold text-slate-700">Total Score</span>
                 <span className={`text-3xl font-black ${totalScore >= 85 ? 'text-amber-500' : totalScore >= 80 ? 'text-slate-700' : 'text-red-500'}`}>
                    {totalScore.toFixed(2)}
                 </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Notes</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Juicy, floral, clean finish..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-amber-500/10 transition-all resize-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting || !selectedRoastId}
              className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98] ${
                success 
                ? 'bg-green-500 text-white' 
                : 'bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50'
              }`}
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : success ? <CheckCircle2 size={18} /> : <Award size={18} />}
              {isSubmitting ? "Saving..." : success ? "Score Logged" : "Submit Score"}
            </button>
          </form>
        </div>

        {/* Right: Value Matrix Chart */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm h-[500px] flex flex-col">
            <div className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-lg font-black text-slate-800">Value Matrix</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Identify High-Value vs. Low-Value Batches</p>
              </div>
              <div className="flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                <div className="flex items-center gap-1 text-green-600"><div className="w-2 h-2 bg-green-500 rounded-full" /> Gems (High Score/Low Cost)</div>
                <div className="flex items-center gap-1 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full" /> Drops (Low Score/High Cost)</div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
               {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Cost" 
                      unit="$" 
                      tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}}
                      label={{ value: 'Cost per Lb ($)', position: 'insideBottom', offset: -10, fill: '#94a3b8', fontSize: 10, fontWeight: 900 }} 
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Score" 
                      domain={[75, 95]} 
                      tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 700}}
                      label={{ value: 'SCA Score', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 10, fontWeight: 900 }}
                    />
                    <ZAxis type="number" dataKey="z" range={[60, 60]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-4 rounded-xl shadow-xl border border-slate-700">
                              <p className="font-bold text-sm mb-1">{data.name}</p>
                              <div className="flex justify-between gap-4 text-xs font-mono">
                                <span className="text-amber-400">Score: {data.y}</span>
                                <span className="text-green-400">Cost: {formatCurrency(data.x)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    {/* Quadrant Lines */}
                    <ReferenceLine x={12} stroke="#cbd5e1" strokeDasharray="3 3" />
                    <ReferenceLine y={84} stroke="#cbd5e1" strokeDasharray="3 3" />

                    <Scatter name="Batches" data={scatterData} fill="#0f172a">
                      {scatterData.map((entry, index) => (
                        <circle 
                          key={index} 
                          cx={0} cy={0} r={6} 
                          fill={entry.y >= 85 && entry.x < 12 ? '#22c55e' : entry.y < 82 && entry.x > 14 ? '#ef4444' : '#0f172a'} 
                          stroke="white"
                          strokeWidth={2}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                    <TrendingUp size={48} className="mb-4 text-slate-400" />
                    <p className="font-bold text-slate-500">Log cupping scores to visualize value.</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
