"use client";

import React, { useState } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Link from 'next/link';
import { Plus, Loader2, Package, AlertTriangle, DollarSign, Edit3, Trash2, X, Info, TrendingUp, Flame } from 'lucide-react';
import { useUnits } from '../../../lib/units';
import { useToast } from '../../../components/ui/Toast';
import { Card, StatCard } from '../../../components/ui/Card';
import { Skeleton } from '../../../components/ui/Skeleton';
import { Id } from '../../../convex/_generated/dataModel';

export default function RoastedInventoryPage() {
  const { unit, formatWeight, formatCurrency, formatPrice } = useUnits();
  const { showToast } = useToast();
  
  const inventory = useQuery(api.inventory.listRoasted);
  const addRoasted = useMutation(api.inventory.addRoasted);
  const editRoasted = useMutation(api.inventory.editRoasted);
  const removeRoasted = useMutation(api.inventory.removeRoasted);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);

  const [newItem, setNewItem] = useState({
    productName: '',
    quantityLbs: '',
    costPerLb: '',
    wholesalePricePerLb: '',
    targetMargin: '35'
  });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await addRoasted({
        productName: newItem.productName,
        quantityLbs: parseFloat(newItem.quantityLbs) || 0,
        costPerLb: parseFloat(newItem.costPerLb) || 0,
        wholesalePricePerLb: parseFloat(newItem.wholesalePricePerLb) || 0,
        targetMargin: parseInt(newItem.targetMargin) || 35
      });
      showToast('Roasted product added', 'success');
      setIsAddModalOpen(false);
      setNewItem({ productName: '', quantityLbs: '', costPerLb: '', wholesalePricePerLb: '', targetMargin: '35' });
    } catch (err) {
      showToast('Error adding product', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    setIsSaving(true);
    
    try {
      await editRoasted({
        id: editingItem._id,
        productName: editingItem.productName,
        quantityLbs: parseFloat(editingItem.quantityLbs),
        wholesalePricePerLb: parseFloat(editingItem.wholesalePricePerLb),
        targetMargin: parseInt(editingItem.targetMargin)
      });
      showToast('Inventory updated', 'success');
      setIsModalOpen(false);
    } catch (error) {
      showToast('Failed to update', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: Id<"roastedInventory">) => {
    if (!confirm('Permanently remove this product from inventory?')) return;
    try {
      await removeRoasted({ id });
      showToast('Product removed', 'success');
    } catch (error) {
      showToast('Failed to remove', 'error');
    }
  };

  const totalWeight = inventory ? inventory.reduce((acc, curr) => acc + curr.quantityLbs, 0) : 0;
  const totalValue = inventory ? inventory.reduce((acc, curr) => acc + (curr.quantityLbs * (curr.wholesalePricePerLb || 0)), 0) : 0;
  const lowStock = inventory ? inventory.filter(i => i.quantityLbs < 5).length : 0;

  if (inventory === undefined) {
    return (
      <div className="p-4 md:p-8 space-y-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <Skeleton className="h-10 w-[300px]" />
        </header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
          <Skeleton className="h-32 rounded-[2rem]" />
        </div>
        <Skeleton className="h-[400px] w-full rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Roasted Inventory</h1>
          <p className="text-slate-500 font-medium">Finished goods stock and wholesale pricing.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <Link href="/roast" className="flex-1 md:flex-none btn-primary px-6 py-3 flex items-center justify-center gap-2 shadow-xl">
              <Flame size={18} /> Roast a Batch
           </Link>
           <button onClick={() => setIsAddModalOpen(true)} className="flex-1 md:flex-none bg-white border-2 border-slate-200 rounded-2xl px-6 py-3 flex items-center justify-center gap-2 hover:bg-slate-50 hover:border-slate-300 transition-all text-slate-900 font-black text-xs uppercase tracking-widest shadow-sm">
              <Plus size={18} className="text-slate-400" /> Manual Intake
           </button>
        </div>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          label="Roasted Assets" 
          value={formatWeight(totalWeight)} 
          icon={<Package className="text-orange-600" />} 
          trend={`${inventory.length} Products`}
        />
        <StatCard 
          label="Wholesale Value" 
          value={formatCurrency(totalValue)} 
          icon={<DollarSign className="text-green-600" />} 
          trend="Projected"
        />
        <div className="col-span-2 lg:col-span-1">
          <StatCard 
            label="Stock Alerts" 
            value={lowStock.toString()} 
            icon={<AlertTriangle className="text-amber-600" />} 
            alert={lowStock > 0}
            trend={lowStock > 0 ? "Critically Low" : "Stable"}
          />
        </div>
      </div>

      <Card title="Product Manifesto" subtitle="Active roasted coffee stock">
        {inventory.length > 0 ? (
          <div className="overflow-x-auto -mx-6 md:mx-0">
            <table className="w-full text-left min-w-[600px]">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Available</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Wholesale</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Margin</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {inventory.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">SKU: {item._id.slice(-6)}</div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <span className={`font-black ${item.quantityLbs < 5 ? 'text-red-500' : 'text-slate-900'}`}>
                        {formatWeight(item.quantityLbs)}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right font-bold text-slate-600">
                      {formatPrice(item.wholesalePricePerLb || 0)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <span className="px-3 py-1 bg-amber-50 text-amber-700 rounded-full text-[10px] font-black uppercase">
                        {item.targetMargin || 35}%
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => { setEditingItem(item); setIsModalOpen(true); }} className="p-2 text-slate-400 hover:text-amber-600 transition-colors"><Edit3 size={18}/></button>
                        <button onClick={() => handleDelete(item._id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={18}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
            <Package size={48} className="mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-black text-slate-900 mb-1">No Roasted Stock</h3>
            <p className="text-slate-500 font-medium max-w-xs mx-auto">Log your first roast session in the Production Hub to see products here.</p>
          </div>
        )}
      </Card>

      {/* EDIT MODAL */}
      {isModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tighter">Adjust Product</h3>
                <p className="text-slate-500 font-medium">Manual stock adjustment.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleEdit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required value={editingItem.productName} onChange={e => setEditingItem({...editingItem, productName: e.target.value})} className="input-field" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity ({unit})</label>
                  <input required type="number" step="0.01" value={editingItem.quantityLbs} onChange={e => setEditingItem({...editingItem, quantityLbs: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wholesale Price</label>
                  <input required type="number" step="0.01" value={editingItem.wholesalePricePerLb} onChange={e => setEditingItem({...editingItem, wholesalePricePerLb: e.target.value})} className="input-field" />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Margin (%)</label>
                <input required type="number" value={editingItem.targetMargin} onChange={e => setEditingItem({...editingItem, targetMargin: e.target.value})} className="input-field" />
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary py-4 font-black">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 btn-primary py-4 font-black">
                  {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] w-full max-w-lg p-8 md:p-12 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">Manual Intake</h3>
                <p className="text-slate-500 font-medium text-sm">Add roasted stock directly.</p>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-slate-50 rounded-full text-slate-400 hover:text-slate-900 transition-colors"><X /></button>
            </div>
            
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Product Name</label>
                <input required placeholder="e.g. Ethiopia Guji Roasted" value={newItem.productName} onChange={e => setNewItem({...newItem, productName: e.target.value})} className="input-field" />
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Initial Weight ({unit})</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={newItem.quantityLbs} onChange={e => setNewItem({...newItem, quantityLbs: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cost / {unit}</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={newItem.costPerLb} onChange={e => setNewItem({...newItem, costPerLb: e.target.value})} className="input-field" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Wholesale Price</label>
                  <input required type="number" step="0.01" placeholder="0.00" value={newItem.wholesalePricePerLb} onChange={e => setNewItem({...newItem, wholesalePricePerLb: e.target.value})} className="input-field" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Margin (%)</label>
                  <input required type="number" value={newItem.targetMargin} onChange={e => setNewItem({...newItem, targetMargin: e.target.value})} className="input-field" />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 btn-secondary py-4 font-black uppercase text-xs tracking-widest">Cancel</button>
                <button type="submit" disabled={isSaving} className="flex-1 btn-primary py-4 font-black uppercase text-xs tracking-widest">
                  {isSaving ? <Loader2 className="animate-spin mx-auto" /> : "Complete Entry"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
