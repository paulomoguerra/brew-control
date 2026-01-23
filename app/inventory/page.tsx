"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Plus, Loader2, Package, AlertTriangle, DollarSign } from 'lucide-react';
import { useUnits } from '../../lib/units';
import { useToast } from '../../components/ui/Toast';
import { Card, StatCard } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

export default function InventoryPage() {
  const { unit, toStorageWeight, toDisplayWeight, toDisplayPrice, formatWeight, formatPrice, formatCurrency } = useUnits();
  const { showToast } = useToast();
  
  // Use Convex hooks instead of Firebase
  const inventory = useQuery(api.inventory.list);
  const addInventory = useMutation(api.inventory.add);
  const editInventory = useMutation(api.inventory.edit);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<any>(null);
  const [newBatch, setNewBatch] = useState({
    batchNumber: '',
    origin: '',
    process: 'Washed',
    quantityInput: '',
    costInput: ''
  });

  const handleAddBatch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    const quantityLbs = toStorageWeight(parseFloat(newBatch.quantityInput) || 0);
    const inputCost = parseFloat(newBatch.costInput) || 0;
    const costPerLb = unit === 'lbs' ? inputCost : inputCost / 2.20462;

    try {
      if (editingId) {
        await editInventory({
          id: editingId,
          batchNumber: newBatch.batchNumber,
          origin: newBatch.origin,
          process: newBatch.process,
          quantityLbs: quantityLbs,
          costPerLb: costPerLb
        });
        showToast('Batch updated successfully', 'success');
      } else {
        await addInventory({
          batchNumber: newBatch.batchNumber,
          origin: newBatch.origin,
          process: newBatch.process,
          quantityLbs: quantityLbs,
          costPerLb: costPerLb
        });
        showToast('Batch added successfully', 'success');
      }
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving batch:", error);
      showToast('Failed to save batch', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setNewBatch({ batchNumber: '', origin: '', process: 'Washed', quantityInput: '', costInput: '' });
    setEditingId(null);
  };

  const openEditModal = (item: any) => {
    setEditingId(item._id);
    setNewBatch({
      batchNumber: item.batchNumber,
      origin: item.origin,
      process: item.process || 'Washed',
      quantityInput: toDisplayWeight(item.quantityLbs).toString(),
      costInput: toDisplayPrice(item.costPerLb).toString()
    });
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  // Safe checks for loading state (inventory is undefined while loading)
  const totalWeightLbs = inventory ? inventory.reduce((acc, curr) => acc + curr.quantityLbs, 0) : 0;
  const totalValue = inventory ? inventory.reduce((acc, curr) => acc + (curr.quantityLbs * curr.costPerLb), 0) : 0;
  const lowStockCount = inventory ? inventory.filter(i => i.quantityLbs < 10).length : 0;

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 p-4 md:p-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard 
          label="Total Weight" 
          value={formatWeight(totalWeightLbs)} 
          icon={<Package size={20} className="text-blue-600" />} 
          trend={inventory ? `${inventory.length} Batches` : "..."}
        />
        <StatCard 
          label="Asset Value" 
          value={formatCurrency(totalValue)} 
          icon={<DollarSign size={20} className="text-green-600" />} 
          trend="Live Valuation"
        />
        <StatCard 
          label="Low Stock Alerts" 
          value={lowStockCount.toString()} 
          icon={<AlertTriangle size={20} className="text-amber-600" />} 
          alert={lowStockCount > 0}
          trend={lowStockCount > 0 ? "Reorder Needed" : "Healthy"}
        />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-lg md:text-xl font-bold text-slate-900">Green Coffee Stock</h2>
        <button 
          onClick={() => { resetForm(); setIsModalOpen(true); }}
          className="w-full sm:w-auto bg-slate-900 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-lg active:scale-95"
        >
          <Plus size={18} />
          Receive Shipment
        </button>
      </div>

      <Card className="min-h-[300px] md:min-h-[400px]">
        {inventory === undefined ? (
          <div className="p-4 md:p-8 space-y-4">
            <Skeleton className="h-8 w-[150px] md:w-[200px]" />
            <Skeleton className="h-[250px] md:h-[300px] w-full" />
          </div>
        ) : inventory.length > 0 ? (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch #</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Weight</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right text-slate-400 hidden sm:table-cell">Cost</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventory.map((item) => (
                  <tr 
                    key={item._id} 
                    className="hover:bg-slate-50 cursor-pointer transition-colors text-sm md:text-base"
                    onClick={() => openEditModal(item)}
                  >
                    <td className="px-6 py-4 font-black text-slate-900 whitespace-nowrap">{item.batchNumber}</td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800 whitespace-nowrap">{item.origin}</div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">{item.process}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className={`font-black ${item.quantityLbs < 10 ? 'text-amber-600' : 'text-slate-900'}`}>
                        {formatWeight(item.quantityLbs)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-600 hidden sm:table-cell whitespace-nowrap">{formatPrice(item.costPerLb)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 whitespace-nowrap">{formatCurrency(item.quantityLbs * item.costPerLb)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 text-slate-400">No inventory found. Add your first batch.</div>
        )}
      </Card>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2rem] w-full max-w-2xl p-6 md:p-8 my-auto">
            <h3 className="text-xl md:text-2xl font-black text-slate-900 mb-6">{editingId ? "Edit Batch" : "Receive Green Shipment"}</h3>
            <form onSubmit={handleAddBatch} className="space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Batch Number</label>
                  <input required placeholder="Batch #" value={newBatch.batchNumber} onChange={e => setNewBatch({...newBatch, batchNumber: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Origin</label>
                  <input required placeholder="Origin" value={newBatch.origin} onChange={e => setNewBatch({...newBatch, origin: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity ({unit})</label>
                  <input required type="number" placeholder={`Weight (${unit})`} value={newBatch.quantityInput} onChange={e => setNewBatch({...newBatch, quantityInput: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost per {unit}</label>
                  <input required type="number" placeholder={`Cost ($/${unit})`} value={newBatch.costInput} onChange={e => setNewBatch({...newBatch, costInput: e.target.value})} className="input-field" />
                </div>
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-4 pt-2">
                <button type="button" onClick={handleCloseModal} className="w-full sm:flex-1 btn-secondary">Cancel</button>
                <button type="submit" disabled={isSaving} className="w-full sm:flex-2 btn-primary">
                  {isSaving ? <Loader2 className="animate-spin" /> : (editingId ? "Save Changes" : "Complete Intake")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
