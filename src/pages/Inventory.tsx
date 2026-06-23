import { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, TrendingDown, TrendingUp, RefreshCw, X, Loader2, Edit2, Trash2 } from 'lucide-react';
import { api } from '../api/client';

interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  quantity: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  lastUpdated: string;
}


const categoryColors: Record<string, string> = {
  'Office Supplies': 'badge-blue', Printing: 'badge-purple', Hardware: 'badge-cyan',
  Hygiene: 'badge-green', Furniture: 'badge-orange', Electronics: 'badge-pink',
};

const statusBadge: Record<string, string> = {
  'In Stock': 'badge-green', 'Low Stock': 'badge-yellow', 'Out of Stock': 'badge-red',
};

export default function Inventory() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'All' | 'Low Stock' | 'Out of Stock'>('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', sku: '', category: 'Office Supplies', quantity: '', minStock: '', unitPrice: '', supplier: '', location: 'Store A' });
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  useEffect(() => {
    api.get<InventoryItem[]>('/inventory').then(d => { setItems(d ?? []); }).catch(() => {});
  }, []);

  const filtered = items.filter(i => {
    const matchSearch = i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || i.status === tab;
    return matchSearch && matchTab;
  });

  function computeStatus(qty: number, min: number): InventoryItem['status'] {
    if (qty === 0) return 'Out of Stock';
    if (qty < min) return 'Low Stock';
    return 'In Stock';
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const qty = Number(form.quantity); const min = Number(form.minStock);
    const item: InventoryItem = {
      id: editId || String(Date.now()),
      name: form.name, sku: form.sku, category: form.category,
      quantity: qty, minStock: min, unitPrice: Number(form.unitPrice),
      supplier: form.supplier, location: form.location,
      status: computeStatus(qty, min),
      lastUpdated: new Date().toISOString().slice(0, 10),
    };
    try {
      if (editId) await api.put(`/inventory/${editId}`, item);
      else await api.post('/inventory', item);
    } catch {}
    if (editId) setItems(prev => prev.map(i => i.id === editId ? item : i));
    else setItems(prev => [item, ...prev]);
    setShowModal(false);
    setEditId(null);
    setForm({ name: '', sku: '', category: 'Office Supplies', quantity: '', minStock: '', unitPrice: '', supplier: '', location: 'Store A' });
    setSaving(false);
  }

  function openEdit(item: InventoryItem) {
    setEditId(item.id);
    setForm({ name: item.name, sku: item.sku, category: item.category, quantity: String(item.quantity), minStock: String(item.minStock), unitPrice: String(item.unitPrice), supplier: item.supplier, location: item.location });
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this item?')) return;
    try { await api.delete(`/inventory/${id}`); } catch {}
    setItems(prev => prev.filter(i => i.id !== id));
  }

  const stats = {
    total: items.length,
    inStock: items.filter(i => i.status === 'In Stock').length,
    lowStock: items.filter(i => i.status === 'Low Stock').length,
    outOfStock: items.filter(i => i.status === 'Out of Stock').length,
    totalValue: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div className="section-header">
        <div>
          <h1 className="page-title">Inventory Management</h1>
          <p className="page-subtitle">Track stock levels and suppliers</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditId(null); setShowModal(true); }}>
          <Plus size={16} /> Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto" style={{ display: 'grid', gap: '16px' }}>
        {[
          { label: 'Total Items', value: stats.total, icon: <Package size={20} />, cls: 'stat-blue', icls: 'icon-blue' },
          { label: 'In Stock', value: stats.inStock, icon: <TrendingUp size={20} />, cls: 'stat-green', icls: 'icon-green' },
          { label: 'Low Stock', value: stats.lowStock, icon: <AlertTriangle size={20} />, cls: 'stat-orange', icls: 'icon-orange' },
          { label: 'Out of Stock', value: stats.outOfStock, icon: <TrendingDown size={20} />, cls: 'stat-pink', icls: 'icon-red' },
          { label: 'Total Value', value: `₹${(stats.totalValue / 1000).toFixed(1)}K`, icon: <RefreshCw size={20} />, cls: 'stat-cyan', icls: 'icon-cyan' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className={`icon-box ${s.icls}`} style={{ marginBottom: '12px' }}>{s.icon}</div>
            <p style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ color: '#94a3b8' }} />
            <input placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%' }} />
          </div>
          <div className="tab-bar">
            {(['All', 'Low Stock', 'Out of Stock'] as const).map(t => (
              <button key={t} className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table">
            <thead>
              <tr>
                <th>Item</th><th>SKU</th><th>Category</th><th>Qty</th>
                <th>Min Stock</th><th>Unit Price</th><th>Supplier</th>
                <th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: '48px', color: '#94a3b8' }}>No items found</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id}>
                  <td><p style={{ fontWeight: 600, color: '#0f172a', fontSize: '13px' }}>{item.name}</p><p style={{ fontSize: '11px', color: '#94a3b8' }}>{item.location}</p></td>
                  <td><span style={{ fontFamily: 'monospace', fontSize: '12px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px' }}>{item.sku}</span></td>
                  <td><span className={`badge ${categoryColors[item.category] || 'badge-gray'}`}>{item.category}</span></td>
                  <td><span style={{ fontWeight: 700, color: item.quantity === 0 ? '#dc2626' : item.quantity < item.minStock ? '#d97706' : '#059669', fontSize: '15px' }}>{item.quantity}</span></td>
                  <td style={{ color: '#64748b' }}>{item.minStock}</td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>₹{item.unitPrice.toLocaleString('en-IN')}</td>
                  <td style={{ color: '#475569', fontSize: '12px' }}>{item.supplier}</td>
                  <td><span className={`badge ${statusBadge[item.status]}`}>{item.status}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button className="btn btn-ghost" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => openEdit(item)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger" style={{ padding: '5px 10px', fontSize: '12px' }} onClick={() => handleDelete(item.id)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <button className="fab mobile-only" onClick={() => { setEditId(null); setShowModal(true); }}><Plus size={22} color="#fff"/></button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ width: '520px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>{editId ? 'Edit Item' : 'Add Inventory Item'}</h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Item Name *</label><input className="input" required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} /></div>
                <div><label className="form-label">SKU</label><input className="input" value={form.sku} onChange={e => setForm(p => ({ ...p, sku: e.target.value }))} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {['Office Supplies', 'Printing', 'Hardware', 'Electronics', 'Furniture', 'Hygiene'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Location</label>
                  <select className="input" value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                    {['Store A', 'Store B', 'Store C', 'Warehouse'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Quantity *</label><input className="input" type="number" min="0" required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} /></div>
                <div><label className="form-label">Min Stock</label><input className="input" type="number" min="0" value={form.minStock} onChange={e => setForm(p => ({ ...p, minStock: e.target.value }))} /></div>
                <div><label className="form-label">Unit Price (₹)</label><input className="input" type="number" min="0" value={form.unitPrice} onChange={e => setForm(p => ({ ...p, unitPrice: e.target.value }))} /></div>
              </div>
              <div><label className="form-label">Supplier</label><input className="input" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', paddingTop: '8px' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : editId ? 'Update' : 'Add Item'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
