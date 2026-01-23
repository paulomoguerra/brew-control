import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  TrendingUp, 
  Loader2, 
  X, 
  Save, 
  AlertTriangle,
  History,
  Archive,
  MoreVertical,
  CheckCircle2,
  DollarSign
} from 'lucide-react';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { formatCurrency } from '../lib/finance';

interface GreenBatch {
  id: string;
  batch_number: string;
  origin: string;
  process: string;
  quantity_lbs: number;
  cost_per_lb: number;
  variety?: string;
  timestamp?: any;
}

const InventoryManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'green' | 'roasted'>('green');
  const [inventory, setInventory] = useState<GreenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [newBatch, setNewBatch] = useState({
    batch_number: '',
    origin: '',
    process: 'Washed',
    quantity_lbs: 154, // Standard bag weight approx
    cost_per_lb: 5.50,
    variety: ''
  });

  // Real-time Firestore Sync
  useEffect(() => {
    if (activeTab === 'green') {
      const q = query(collection(db, "green_inventory"), orderBy("timestamp", "desc"));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GreenBatch[];
        setInventory(items);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      setLoading(false);
    }
  }, [activeTab]);

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addDoc(collection(db, "green_inventory"), {
        ...newBatch,
        quantity_lbs: Number(newBatch.quantity_lbs),
        cost_per_lb: Number(newBatch.cost_per_lb),
        timestamp: serverTimestamp(),
        status: 'active'
      });
      setIsModalOpen(false);
      setNewBatch({
        batch_number: '',
        origin: '',
        process: 'Washed',
        quantity_lbs: 154,
        cost_per_lb: 5.50,
        variety: ''
      });
    } catch (error) {
      console.error("Error adding batch:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredInventory = inventory.filter(item => 
    item.batch_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.origin.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Inventory Control</h2>
          <p className="text-sm text-slate-500">Track raw commodity positions and finished goods value.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Plus size={20} />
          Receive New Coffee
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-slate-200 rounded-xl w-fit">
        <button 
          onClick={() => setActiveTab('green')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'green' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Green Beans (Raw)
        </button>
        <button 
          onClick={() => setActiveTab('roasted')}
          className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'roasted' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          Roasted Stock
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="Search by batch # or origin..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500 transition-all text-sm font-medium"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
          <Filter size={18} /> Filters
        </button>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-[400px] text-slate-400 gap-4">
            <Loader2 className="animate-spin" size={40} />
            <span className="font-bold tracking-widest uppercase text-xs">Syncing with Firestore...</span>
          </div>
        ) : filteredInventory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Number</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin & Process</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Weight (lbs)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Cost ($/lb)</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total Position</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredInventory.map((item) => (
                  <tr 
                    key={item.id} 
                    className={`group transition-colors ${item.quantity_lbs < 10 ? 'bg-amber-50 hover:bg-amber-100' : 'hover:bg-slate-50'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.quantity_lbs < 10 ? 'bg-amber-500' : 'bg-green-500'}`} />
                        <span className="font-black text-slate-900 tracking-tight">{item.batch_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-slate-800">{item.origin}</div>
                      <div className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.process}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black ${item.quantity_lbs < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                          {item.quantity_lbs.toLocaleString()} lbs
                        </span>
                        {item.quantity_lbs < 10 && (
                          <span className="text-[9px] font-black text-amber-500 uppercase">Low Stock</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-bold text-slate-600">{formatCurrency(item.cost_per_lb)}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-black text-slate-900">{formatCurrency(item.quantity_lbs * item.cost_per_lb)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <button className="p-2 text-slate-400 hover:text-slate-900 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[400px] text-center p-12">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-300">
              <Archive size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No active batches found</h3>
            <p className="text-slate-500 text-sm max-w-xs mx-auto mb-6">
              You haven't added any green coffee inventory yet. Start by receiving your first shipment.
            </p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-2 bg-amber-500 text-slate-900 font-bold rounded-lg hover:bg-amber-600 transition-all"
            >
              Add Your First Batch
            </button>
          </div>
        )}
      </div>

      {/* Finance Tip */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex gap-4">
        <div className="p-2 bg-amber-100 rounded-lg text-amber-600 self-start">
          <TrendingUp size={24} />
        </div>
        <div>
          <h4 className="text-sm font-black text-amber-900 uppercase tracking-widest mb-1">Inventory Velocity Tip</h4>
          <p className="text-sm text-amber-800 leading-relaxed font-medium">
            Beans lose 10% of their complexity every 60 days in storage. Your highest cost batch ({inventory[0]?.batch_number || 'N/A'}) should be prioritized for your flagship blends to maximize extraction value and customer satisfaction.
          </p>
        </div>
      </div>

      {/* MODAL: Receive New Coffee */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">Receive Green Shipment</h3>
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Landed Logistics & Cost Entry</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-full transition-all text-slate-400">
                <X size={24} />
              </button>
            </div>
            
            <form onSubmit={handleAddBatch} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch # / Lot ID</label>
                  <input 
                    required
                    value={newBatch.batch_number}
                    onChange={e => setNewBatch({...newBatch, batch_number: e.target.value})}
                    placeholder="e.g. ETH-2024-001"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</label>
                  <input 
                    required
                    value={newBatch.origin}
                    onChange={e => setNewBatch({...newBatch, origin: e.target.value})}
                    placeholder="e.g. Ethiopia Sidamo"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Process Method</label>
                  <select 
                    value={newBatch.process}
                    onChange={e => setNewBatch({...newBatch, process: e.target.value})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold appearance-none"
                  >
                    <option>Washed</option>
                    <option>Natural</option>
                    <option>Honey</option>
                    <option>Anaerobic</option>
                    <option>Decaf (Swiss Water)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Variety / Cultivar</label>
                  <input 
                    value={newBatch.variety}
                    onChange={e => setNewBatch({...newBatch, variety: e.target.value})}
                    placeholder="e.g. Heirloom, SL28"
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Net Weight (lbs)</label>
                  <input 
                    type="number"
                    required
                    value={newBatch.quantity_lbs}
                    onChange={e => setNewBatch({...newBatch, quantity_lbs: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Landed Cost ($/lb)</label>
                  <input 
                    type="number"
                    step="0.01"
                    required
                    value={newBatch.cost_per_lb}
                    onChange={e => setNewBatch({...newBatch, cost_per_lb: parseFloat(e.target.value) || 0})}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                  />
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl flex items-center gap-4 border border-amber-100">
                <div className="p-2 bg-amber-500 text-white rounded-lg">
                  <DollarSign size={20} />
                </div>
                <div>
                  <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Estimated Inventory Asset Value</div>
                  <div className="text-2xl font-black text-slate-900">{formatCurrency(newBatch.quantity_lbs * newBatch.cost_per_lb)}</div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-4 border-2 border-slate-100 rounded-2xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={isSaving}
                  className="flex-[2] px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl flex items-center justify-center gap-2"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle2 size={20} />}
                  Complete Intake
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;