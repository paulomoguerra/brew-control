"use client";

import React, { useState, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Award, Loader2, CheckCircle2, TrendingUp, Star, Microscope, X, Search } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export default function QualityPage() {
  const { toDisplayPrice, formatUnitPrice, toStoragePrice, unit } = useUnits();
  
  // Data
  const sessions = useQuery(api.quality.listSessions);
  const logSession = useMutation(api.quality.logSession);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Form State
  const [coffeeName, setCoffeeName] = useState('');
  const [cupperName, setCupperName] = useState('');
  const [notes, setNotes] = useState('');
  const [costPerUnit, setCostPerUnit] = useState('');
  
  // Sensory Attributes (0-10)
  const [attributes, setAttributes] = useState({
    aroma: 8,
    flavor: 8,
    aftertaste: 8,
    acidity: 8,
    body: 8,
    balance: 8,
    overall: 8,
    uniformity: 10,
    cleanCup: 10,
    sweetness: 10,
    defects: 0
  });

  const [selectedFlavors, setSelectedFlavors] = useState<string[]>([]);
  const [flavorSearch, setFlavorSearch] = useState('');

  const flavorWheel = {
    "Fruity": ["Berry", "Dried Fruit", "Citrus", "Stone Fruit", "Tropical Fruit"],
    "Floral": ["Black Tea", "Chamomile", "Rose", "Jasmine"],
    "Sweet": ["Caramel", "Brown Sugar", "Honey", "Maple Syrup", "Vanilla"],
    "Nutty/Cocoa": ["Peanut", "Hazelnut", "Almond", "Dark Chocolate", "Milk Chocolate"],
    "Spices": ["Clove", "Cinnamon", "Nutmeg", "Black Pepper"],
    "Roasted": ["Pipe Tobacco", "Burnt Sugar", "Smoky", "Acrid"],
    "Green/Vegetal": ["Grassy", "Pea Pod", "Hay-like", "Herbaceous"]
  };

  const allFlavors = Object.entries(flavorWheel).flatMap(([cat, items]) => 
    items.map(item => ({ category: cat, name: item }))
  );

  const filteredFlavors = allFlavors.filter(f => 
    f.name.toLowerCase().includes(flavorSearch.toLowerCase()) ||
    f.category.toLowerCase().includes(flavorSearch.toLowerCase())
  );

  const toggleFlavor = (flavor: string) => {
    setSelectedFlavors(prev => 
      prev.includes(flavor) ? prev.filter(f => f !== flavor) : [...prev, flavor]
    );
  };

  const [selectedSession, setSelectedSession] = useState<any>(null);

  const isLoading = sessions === undefined;
  const { defects, ...scoreFields } = attributes;
  const totalScore = Object.values(scoreFields).reduce((a, b) => a + b, 0) - (defects * 2);

  const radarData = useMemo(() => {
    const source = selectedSession || attributes;
    return [
      { subject: 'Aroma', A: source.aroma, fullMark: 10 },
      { subject: 'Flavor', A: source.flavor, fullMark: 10 },
      { subject: 'Acidity', A: source.acidity, fullMark: 10 },
      { subject: 'Body', A: source.body, fullMark: 10 },
      { subject: 'Balance', A: source.balance, fullMark: 10 },
      { subject: 'Sweetness', A: source.sweetness, fullMark: 10 },
    ];
  }, [selectedSession, attributes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const parsedCost = parseFloat(costPerUnit);
      const storedCost = Number.isFinite(parsedCost) ? toStoragePrice(parsedCost) : undefined;

      await logSession({
        coffeeName: coffeeName || undefined,
        cupperName,
        score: totalScore,
        notes,
        flavors: selectedFlavors,
        costPerLb: storedCost,
        ...attributes
      });
      
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setNotes('');
        setCoffeeName('');
        setCostPerUnit('');
        setSelectedFlavors([]);
        setAttributes({ aroma: 8, flavor: 8, aftertaste: 8, acidity: 8, body: 8, balance: 8, overall: 8, uniformity: 10, cleanCup: 10, sweetness: 10, defects: 0 });
      }, 2000);
    } catch (err) {
      console.error("Error logging session:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chart Data
  const fallbackCost = 12;
  const scatterData = (sessions as any[])?.map(s => {
    const costPerLb = s.costPerLb ?? fallbackCost;
    return {
      x: toDisplayPrice(costPerLb),
      y: s.score,
      z: 1,
      name: s.coffeeName || "Unknown",
      batch: s.coffeeName || "?",
      original: s
    };
  }) || [];

  const costReference = toDisplayPrice(fallbackCost);

  if (isLoading) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="space-y-2">
          <Skeleton className="h-8 md:h-10 w-[200px] md:w-[300px]" />
          <Skeleton className="h-4 w-full max-w-[400px]" />
        </header>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
          <Skeleton className="lg:col-span-1 h-[600px] rounded-[2rem]" />
          <Skeleton className="lg:col-span-2 h-[500px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tighter">Sensory Lab</h1>
          <p className="text-slate-500 font-medium text-sm md:text-base">SCA-standard cupping and value analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <form onSubmit={handleSubmit} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-xl space-y-6 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                <Microscope size={100} />
             </div>
             
             <div className="flex items-center gap-3 mb-2">
              <div className="bg-cream p-2 rounded-xl text-cocoa">
                <Star size={24} />
              </div>
              <h2 className="text-xl font-black text-slate-900">New Session</h2>
            </div>

            <div className="space-y-4 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cupper Name</label>
                <input 
                  placeholder="Your Name" 
                  value={cupperName} 
                  onChange={e => setCupperName(e.target.value)} 
                  className="input-field"
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Coffee Name</label>
                <input 
                  placeholder="Ethiopia Gedeb"
                  value={coffeeName}
                  onChange={e => setCoffeeName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost per {unit} (optional)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="12.50"
                  value={costPerUnit}
                  onChange={e => setCostPerUnit(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Attributes Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 py-2">
                 {['aroma', 'flavor', 'aftertaste', 'acidity', 'body', 'balance'].map((attr) => (
                   <div key={attr} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{attr}</label>
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-full">{attributes[attr as keyof typeof attributes]}</span>
                      </div>
                      <input 
                        type="range" min="6" max="10" step="0.25"
                        value={attributes[attr as keyof typeof attributes]}
                        onChange={e => setAttributes({...attributes, [attr]: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-caramel"
                      />
                   </div>
                 ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                 {['overall', 'uniformity', 'cleanCup', 'sweetness'].map((attr) => (
                   <div key={attr} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">{attr}</label>
                        <span className="text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded-full">{attributes[attr as keyof typeof attributes]}</span>
                      </div>
                      <input 
                        type="range" min="6" max="10" step="0.25"
                        value={attributes[attr as keyof typeof attributes]}
                        onChange={e => setAttributes({...attributes, [attr]: parseFloat(e.target.value)})}
                        className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-caramel"
                      />
                   </div>
                 ))}
              </div>

              {/* Flavor Wheel Selector */}
              <div className="space-y-4">
                <div className="flex justify-between items-end">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Flavor Notes</label>
                  <span className="text-[10px] font-black text-caramel uppercase">{selectedFlavors.length} Selected</span>
                </div>
                
                <div className="relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text"
                    placeholder="Search flavors (e.g. Jasmine, Citrus...)"
                    value={flavorSearch}
                    onChange={e => setFlavorSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-slate-900 transition-all"
                  />
                </div>

                <div className="h-40 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                  {Object.entries(flavorWheel).map(([category, items]) => {
                    const categoryMatches = items.filter(item => 
                      item.toLowerCase().includes(flavorSearch.toLowerCase()) || 
                      category.toLowerCase().includes(flavorSearch.toLowerCase())
                    );
                    
                    if (categoryMatches.length === 0) return null;

                    return (
                      <div key={category} className="space-y-2">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em]">{category}</span>
                        <div className="flex flex-wrap gap-2">
                          {categoryMatches.map(flavor => (
                            <button
                              key={flavor}
                              type="button"
                              onClick={() => toggleFlavor(flavor)}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all border ${
                                selectedFlavors.includes(flavor)
                                ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-caramel'
                              }`}
                            >
                              {flavor}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 md:p-5 bg-slate-900 text-white rounded-2xl flex justify-between items-center shadow-lg">
                 <div className="flex flex-col">
                   <span className="text-[10px] font-black text-caramel uppercase tracking-widest">Total SCA Score</span>
                   <span className="text-sm font-medium text-slate-400">Standard Calibration</span>
                 </div>
                 <span className={`text-3xl md:text-4xl font-black ${totalScore >= 85 ? 'text-green-400' : totalScore >= 80 ? 'text-caramel' : 'text-red-400'}`}>
                    {totalScore.toFixed(2)}
                 </span>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Notes & Sensory Experience</label>
                <textarea 
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  placeholder="e.g. Juicy acidity, stone fruit notes..."
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-medium text-sm outline-none focus:ring-4 focus:ring-caramel/20 transition-all resize-none"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isSubmitting}
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

        {/* Right: Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Radar Chart */}
            <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-[400px] flex flex-col items-center">
               <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Sensory Profile</h3>
               <div className="flex-1 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                      <PolarGrid stroke="#f1f5f9" />
                      <PolarAngleAxis dataKey="subject" tick={{fontSize: 10, fontWeight: 700, fill: '#64748b'}} />
                      <Radar
                        name="Score"
                        dataKey="A"
                        stroke="#f59e0b"
                        fill="#f59e0b"
                        fillOpacity={0.6}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
               </div>
            </div>

            {/* Selected Info Card */}
            <div className={`bg-slate-900 text-white p-6 md:p-8 rounded-[2rem] shadow-sm h-[400px] flex flex-col justify-between relative overflow-hidden transition-all ${selectedSession ? 'opacity-100' : 'opacity-40'}`}>
               <div className="absolute top-0 right-0 p-8 opacity-10"><Award size={120} /></div>
               {selectedSession ? (
                 <>
                   <div className="relative z-10">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <span className="text-[10px] font-black text-caramel uppercase tracking-widest">Selected Session</span>
                          <h3 className="text-xl font-bold mt-1">{selectedSession.coffeeName || "Unknown"}</h3>
                         </div>
                         <button onClick={() => setSelectedSession(null)} className="p-2 bg-slate-800 rounded-full hover:bg-slate-700 transition-colors"><X size={14}/></button>
                      </div>
                      <div className="text-4xl font-black text-white mb-6">{selectedSession.score.toFixed(1)} <span className="text-xs text-slate-400 font-bold uppercase tracking-widest">SCA Score</span></div>
                      <p className="text-slate-400 text-sm italic leading-relaxed">"{selectedSession.notes || 'No cupping notes provided for this session.'}"</p>
                   </div>
                   <div className="relative z-10 grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-slate-800">
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Cupper</div>
                        <div className="font-bold text-sm">{selectedSession.cupperName}</div>
                      </div>
                      <div>
                        <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</div>
                        <div className="font-bold text-sm">{new Date(selectedSession.sessionDate).toLocaleDateString()}</div>
                      </div>
                   </div>
                 </>
               ) : (
                 <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="font-bold text-slate-500 text-sm">Select a point in the matrix to view profile.</p>
                 </div>
               )}
            </div>
          </div>

          {/* Value Matrix */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm h-[400px] flex flex-col">
            <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h3 className="text-lg font-black text-slate-800 tracking-tight">Value Matrix</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Cost vs. Quality Analysis</p>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-[9px] font-black uppercase tracking-wider">
                <div className="flex items-center gap-1.5 text-green-600"><div className="w-2 h-2 bg-green-500 rounded-full" /> Gems (High Value)</div>
                <div className="flex items-center gap-1.5 text-red-500"><div className="w-2 h-2 bg-red-500 rounded-full" /> Risky (Low Value)</div>
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-0">
               {scatterData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      type="number" 
                      dataKey="x" 
                      name="Cost" 
                      unit="$" 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      type="number" 
                      dataKey="y" 
                      name="Score" 
                      domain={[75, 95]} 
                      tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 700}}
                      axisLine={false}
                      tickLine={false}
                    />
                    <ZAxis type="number" dataKey="z" range={[80, 80]} />
                    <Tooltip 
                      cursor={{ strokeDasharray: '3 3' }} 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl border border-slate-700">
                              <p className="font-bold text-xs mb-1">{data.name}</p>
                              <div className="flex justify-between gap-4 text-[10px] font-black uppercase">
                                <span className="text-caramel">Score: {data.y}</span>
                                <span className="text-green-400">Cost: {formatUnitPrice(data.x)}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    
                    <ReferenceLine x={costReference} stroke="#e2e8f0" strokeWidth={2} />
                    <ReferenceLine y={84} stroke="#e2e8f0" strokeWidth={2} />

                    <Scatter 
                      name="Batches" 
                      data={scatterData} 
                      fill="#0f172a"
                      onClick={(e) => setSelectedSession(e.original)}
                      className="cursor-pointer"
                    >
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
                    <p className="font-bold text-slate-500 text-sm">Log cupping scores to visualize value.</p>
                 </div>
               )}
            </div>
          </div>

          {/* History Card */}
          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-black text-slate-800 tracking-tight">Logged Scores</h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sessions?.length || 0} Total</span>
            </div>
            <div className="space-y-3 max-h-[320px] overflow-y-auto custom-scrollbar pr-2">
              {sessions && sessions.length > 0 ? sessions.map((session: any) => (
                <button
                  key={session._id}
                  onClick={() => setSelectedSession(session)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    selectedSession?._id === session._id ? 'border-caramel bg-cream' : 'border-slate-100 hover:border-oat'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-black text-slate-900">
                        {session.coffeeName || "Unknown"}
                      </div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                        {session.cupperName} • {new Date(session.sessionDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-black text-slate-900">{session.score.toFixed(1)}</div>
                      <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Score</div>
                    </div>
                  </div>
                </button>
              )) : (
                <div className="text-sm text-slate-500 font-medium">No scores logged yet.</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
