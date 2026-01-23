
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Package, AlertTriangle, Lightbulb } from 'lucide-react';
import { formatCurrency } from '../lib/finance';
import { getVirtualCFOAdvice } from '../services/gemini';

const MOCK_REVENUE_DATA = [
  { name: 'Jan', revenue: 12000, cogs: 7200, profit: 4800 },
  { name: 'Feb', revenue: 15000, cogs: 8800, profit: 6200 },
  { name: 'Mar', revenue: 14500, cogs: 9100, profit: 5400 },
  { name: 'Apr', revenue: 18000, cogs: 10500, profit: 7500 },
];

const MOCK_SHRINKAGE_DATA = [
  { name: 'Eth Yirga', actual: 15.2, target: 14.5 },
  { name: 'Bra Santos', actual: 16.8, target: 16.0 },
  { name: 'Col Sup', actual: 14.1, target: 15.0 },
  { name: 'Ken AA', actual: 16.1, target: 15.5 },
];

const Dashboard: React.FC = () => {
  const [advice, setAdvice] = useState<string>("Analyzing your margins...");
  const [loadingAdvice, setLoadingAdvice] = useState(true);

  useEffect(() => {
    const fetchAdvice = async () => {
      setLoadingAdvice(true);
      const res = await getVirtualCFOAdvice(24500.50, 28.5, ['Ethiopia Yirgacheffe G2']);
      setAdvice(res);
      setLoadingAdvice(false);
    };
    fetchAdvice();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          label="Total Inventory Value" 
          value={formatCurrency(24500.50)} 
          change="+4.2%" 
          positive={true} 
          icon={<Package className="text-blue-600" />}
        />
        <StatCard 
          label="Average Margin" 
          value="28.5%" 
          change="-1.2%" 
          positive={false} 
          icon={<TrendingUp className="text-green-600" />}
        />
        <StatCard 
          label="Estimated Monthly Profit" 
          value={formatCurrency(7500.00)} 
          change="+12.5%" 
          positive={true} 
          icon={<DollarSign className="text-amber-600" />}
        />
        <StatCard 
          label="Low Stock Alert" 
          value="2 Batches" 
          change="Urgent" 
          positive={false} 
          icon={<AlertTriangle className="text-red-600" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main P&L Chart */}
        <section className="lg:col-span-2 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-lg font-bold text-slate-800">Real-Time P&L Breakdown</h2>
            <div className="flex gap-2 text-xs">
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-200" /> Revenue</span>
              <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-amber-500" /> Profit</span>
            </div>
          </div>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="revenue" fill="#e2e8f0" radius={[4, 4, 0, 0]} />
                <Bar dataKey="profit" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* CFO Advice Panel */}
        <section className="bg-slate-900 text-white p-8 rounded-xl flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-500 rounded-full blur-3xl opacity-10 group-hover:opacity-20 transition-opacity" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-amber-500 mb-6 font-bold uppercase tracking-widest text-xs">
              <Lightbulb size={18} />
              Virtual CFO Advice
            </div>
            <div className={`text-lg leading-relaxed ${loadingAdvice ? 'animate-pulse' : ''}`}>
              {advice}
            </div>
          </div>
          <div className="relative z-10 mt-10">
            <button className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-semibold transition-colors border border-slate-700">
              Run New Audit
            </button>
          </div>
        </section>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Shrinkage Variance (Actual vs. Target)</h2>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={MOCK_SHRINKAGE_DATA} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12}} width={100} />
                <Tooltip />
                <Bar dataKey="actual" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} />
                <Bar dataKey="target" fill="#cbd5e1" radius={[0, 4, 4, 0]} barSize={10} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-6 text-center">Cost Distribution</h2>
          <div className="h-[250px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie 
                  data={[
                    {name: 'Green Coffee', value: 70},
                    {name: 'Admin Labor', value: 15},
                    {name: 'Utilities (Gas/Electric)', value: 8},
                    {name: 'Packaging', value: 7},
                  ]}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#f59e0b" />
                  <Cell fill="#cbd5e1" />
                  <Cell fill="#94a3b8" />
                  <Cell fill="#64748b" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-2 text-xs">
              <LegendItem color="bg-amber-500" label="Green Coffee (70%)" />
              <LegendItem color="bg-slate-300" label="Labor (15%)" />
              <LegendItem color="bg-slate-400" label="Utilities (8%)" />
              <LegendItem color="bg-slate-500" label="Packaging (7%)" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

const StatCard: React.FC<{ label: string; value: string; change: string; positive: boolean; icon: React.ReactNode }> = ({ label, value, change, positive, icon }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-slate-50 rounded-lg">{icon}</div>
      <div className={`text-xs font-bold px-2 py-1 rounded-full ${positive ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
        {change}
      </div>
    </div>
    <div className="text-2xl font-black text-slate-900 mb-1">{value}</div>
    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{label}</div>
  </div>
);

const LegendItem: React.FC<{ color: string; label: string }> = ({ color, label }) => (
  <div className="flex items-center gap-2">
    <div className={`w-2 h-2 rounded-full ${color}`} />
    <span className="text-slate-500">{label}</span>
  </div>
);

export default Dashboard;
