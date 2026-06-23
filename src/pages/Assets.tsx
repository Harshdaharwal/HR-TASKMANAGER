import { useState, useEffect } from 'react';
import {
  Monitor, Smartphone, Wifi, Sofa, Package, Plus, Search, RefreshCw,
  RotateCcw, Pencil, Trash2, X, ChevronDown, Loader2, AlertCircle,
  Cpu, CheckCircle
} from 'lucide-react';
import { api } from '../api/client';

interface Asset {
  id: string;
  assetId: string;
  name: string;
  brand: string;
  type: 'Laptop' | 'Mobile' | 'SIM' | 'Furniture' | 'Other';
  serialNo: string;
  assignedTo: string;
  assignedToName: string;
  assignDate: string;
  condition: 'Excellent' | 'Good' | 'Fair' | 'Poor';
  status: 'Assigned' | 'Available' | 'Under Maintenance' | 'Retired';
  purchaseDate: string;
  price: number;
  warranty: string;
}

interface Employee { id: string; name: string; }

const TYPE_ICONS: Record<string, React.ElementType> = {
  Laptop: Monitor, Mobile: Smartphone, SIM: Wifi, Furniture: Sofa, Other: Package,
};

const TYPE_COLORS: Record<string, string> = {
  Laptop: 'badge-blue', Mobile: 'badge-green', SIM: 'badge-cyan',
  Furniture: 'badge-orange', Other: 'badge-gray',
};

const CONDITION_COLORS: Record<string, string> = {
  Excellent: 'badge-green', Good: 'badge-blue', Fair: 'badge-yellow', Poor: 'badge-red',
};

const STATUS_COLORS: Record<string, string> = {
  Assigned: 'badge-blue', Available: 'badge-green',
  'Under Maintenance': 'badge-yellow', Retired: 'badge-gray',
};

const MOCK_ASSETS: Asset[] = [
  { id: '1', assetId: 'AST-001', name: 'MacBook Pro 14"', brand: 'Apple', type: 'Laptop', serialNo: 'C02XJ2JHG5L4', assignedTo: 'EMP001', assignedToName: 'Rahul Sharma', assignDate: '2025-03-15', condition: 'Excellent', status: 'Assigned', purchaseDate: '2025-03-01', price: 185000, warranty: '2027-03-01' },
  { id: '2', assetId: 'AST-002', name: 'iPhone 15 Pro', brand: 'Apple', type: 'Mobile', serialNo: 'F17LK9M2X', assignedTo: 'EMP002', assignedToName: 'Priya Mehta', assignDate: '2025-06-01', condition: 'Good', status: 'Assigned', purchaseDate: '2025-05-20', price: 129000, warranty: '2026-05-20' },
  { id: '3', assetId: 'AST-003', name: 'Dell XPS 15', brand: 'Dell', type: 'Laptop', serialNo: 'DL89XKJH21', assignedTo: '', assignedToName: '', assignDate: '', condition: 'Good', status: 'Available', purchaseDate: '2024-11-10', price: 145000, warranty: '2026-11-10' },
  { id: '4', assetId: 'AST-004', name: 'Airtel SIM Corporate', brand: 'Airtel', type: 'SIM', serialNo: '89910301XXXXX', assignedTo: 'EMP003', assignedToName: 'Ananya Patel', assignDate: '2025-01-10', condition: 'Excellent', status: 'Assigned', purchaseDate: '2025-01-05', price: 0, warranty: '' },
  { id: '5', assetId: 'AST-005', name: 'Ergonomic Chair', brand: 'Herman Miller', type: 'Furniture', serialNo: 'HM-CHR-00451', assignedTo: '', assignedToName: '', assignDate: '', condition: 'Fair', status: 'Under Maintenance', purchaseDate: '2023-07-15', price: 65000, warranty: '2025-07-15' },
  { id: '6', assetId: 'AST-006', name: 'ThinkPad X1 Carbon', brand: 'Lenovo', type: 'Laptop', serialNo: 'LN7K2QP39', assignedTo: 'EMP004', assignedToName: 'Kavya Reddy', assignDate: '2025-09-01', condition: 'Excellent', status: 'Assigned', purchaseDate: '2025-08-20', price: 135000, warranty: '2027-08-20' },
];

const MOCK_EMPLOYEES: Employee[] = [
  { id: 'EMP001', name: 'Rahul Sharma' }, { id: 'EMP002', name: 'Priya Mehta' },
  { id: 'EMP003', name: 'Ananya Patel' }, { id: 'EMP004', name: 'Kavya Reddy' },
  { id: 'EMP005', name: 'Amit Singh' }, { id: 'EMP006', name: 'Neha Gupta' },
];

const EMPTY_FORM = {
  type: 'Laptop' as Asset['type'], name: '', brand: '', serialNo: '',
  assignedTo: '', condition: 'Good' as Asset['condition'],
  purchaseDate: '', price: '', warranty: '',
};

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function Assets() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [employees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAssets();
  }, []);

  async function fetchAssets() {
    setLoading(true);
    setError('');
    try {
      const data = await api.get<Asset[]>('/assets');
      setAssets(data);
    } catch {
      setAssets(MOCK_ASSETS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = assets.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.assetId.toLowerCase().includes(q) ||
      a.serialNo.toLowerCase().includes(q) || a.assignedToName.toLowerCase().includes(q);
    const matchType = typeFilter === 'All' || a.type === typeFilter;
    const matchStatus = statusFilter === 'All' || a.status === statusFilter;
    return matchSearch && matchType && matchStatus;
  });

  const stats = {
    total: assets.length,
    assigned: assets.filter(a => a.status === 'Assigned').length,
    available: assets.filter(a => a.status === 'Available').length,
    maintenance: assets.filter(a => a.status === 'Under Maintenance').length,
  };

  async function handleAddAsset() {
    if (!form.name || !form.brand || !form.serialNo) return;
    setSaving(true);
    const emp = employees.find(e => e.id === form.assignedTo);
    const newAsset: Partial<Asset> = {
      assetId: `AST-${String(assets.length + 1).padStart(3, '0')}`,
      name: form.name, brand: form.brand, type: form.type,
      serialNo: form.serialNo, assignedTo: form.assignedTo,
      assignedToName: emp?.name || '',
      assignDate: form.assignedTo ? new Date().toISOString().slice(0, 10) : '',
      condition: form.condition,
      status: form.assignedTo ? 'Assigned' : 'Available',
      purchaseDate: form.purchaseDate, price: Number(form.price), warranty: form.warranty,
    };
    try {
      const created = await api.post<Asset>('/assets', newAsset);
      setAssets(prev => [created, ...prev]);
    } catch {
      setAssets(prev => [{ ...newAsset, id: Date.now().toString() } as Asset, ...prev]);
    }
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  async function handleReturn(asset: Asset) {
    const updated = { ...asset, assignedTo: '', assignedToName: '', assignDate: '', status: 'Available' as const };
    try {
      await api.put(`/assets/${asset.id}`, updated);
    } catch {}
    setAssets(prev => prev.map(a => a.id === asset.id ? updated : a));
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Asset Management</h1>
          <p className="page-subtitle">Track and manage company assets across all employees</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Asset
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto grid gap-4">
        {[
          { label: 'Total Assets', value: stats.total, icon: Package, color: 'stat-blue', iconCls: 'icon-blue' },
          { label: 'Assigned', value: stats.assigned, icon: CheckCircle, color: 'stat-green', iconCls: 'icon-green' },
          { label: 'Available', value: stats.available, icon: Cpu, color: 'stat-purple', iconCls: 'icon-purple' },
          { label: 'Under Maintenance', value: stats.maintenance, icon: RefreshCw, color: 'stat-orange', iconCls: 'icon-orange' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card ${s.color} fade-up stagger-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`icon-box ${s.iconCls}`}><s.icon size={20} /></div>
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-slate-400 text-sm mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="glass-card">
        <div className="flex flex-wrap gap-3">
          <div className="search-box flex-1 min-w-48">
            <Search size={15} className="text-slate-500 shrink-0" />
            <input placeholder="Search assets, serial no, employee..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input w-44" value={typeFilter} onChange={e => setTypeFilter(e.target.value)}>
            <option value="All">All Types</option>
            {['Laptop', 'Mobile', 'SIM', 'Furniture', 'Other'].map(t => <option key={t}>{t}</option>)}
          </select>
          <select className="input w-44" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="All">All Status</option>
            {['Assigned', 'Available', 'Under Maintenance', 'Retired'].map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card !p-0 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} />
            <p className="text-slate-500">Loading assets...</p>
          </div>
        ) : error ? (
          <div className="p-12 text-center">
            <AlertCircle className="text-red-400 mx-auto mb-3" size={32} />
            <p className="text-red-400">{error}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Asset ID</th>
                  <th>Name / Brand</th>
                  <th>Type</th>
                  <th>Serial No</th>
                  <th>Assigned To</th>
                  <th>Assign Date</th>
                  <th>Condition</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(a => {
                  const TypeIcon = TYPE_ICONS[a.type] || Package;
                  return (
                    <tr key={a.id}>
                      <td className="font-mono text-xs text-slate-300">{a.assetId}</td>
                      <td>
                        <div>
                          <p className="text-white font-semibold text-sm">{a.name}</p>
                          <p className="text-slate-500 text-xs">{a.brand}</p>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${TYPE_COLORS[a.type]}`}>
                          <TypeIcon size={10} /> {a.type}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-slate-400">{a.serialNo}</td>
                      <td>
                        {a.assignedToName ? (
                          <div className="flex items-center gap-2">
                            <div className="avatar">{initials(a.assignedToName)}</div>
                            <span className="text-sm text-white">{a.assignedToName}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td className="text-slate-400 text-xs">{a.assignDate || '—'}</td>
                      <td><span className={`badge ${CONDITION_COLORS[a.condition]}`}>{a.condition}</span></td>
                      <td><span className={`badge ${STATUS_COLORS[a.status]}`}>{a.status}</span></td>
                      <td>
                        <div className="flex gap-2">
                          {a.status === 'Assigned' && (
                            <button className="btn btn-ghost !px-2 !py-1 text-xs" onClick={() => handleReturn(a)}>
                              <RotateCcw size={12} /> Return
                            </button>
                          )}
                          <button className="btn btn-ghost !px-2 !py-1 text-xs">
                            <Pencil size={12} />
                          </button>
                          <button className="btn btn-danger !px-2 !py-1 text-xs">
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={9} className="text-center py-10 text-slate-500">No assets found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff"/></button>

      {/* Add Asset Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Add New Asset</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Asset Type</label>
                <select className="input" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as Asset['type'] }))}>
                  {['Laptop', 'Mobile', 'SIM', 'Furniture', 'Other'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Asset Name</label>
                <input className="input" placeholder="e.g. MacBook Pro 14&quot;" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Brand</label>
                <input className="input" placeholder="e.g. Apple, Dell" value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Serial Number</label>
                <input className="input" placeholder="Unique serial number" value={form.serialNo} onChange={e => setForm(f => ({ ...f, serialNo: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Assign To Employee</label>
                <select className="input" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))}>
                  <option value="">Unassigned</option>
                  {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Condition</label>
                <select className="input" value={form.condition} onChange={e => setForm(f => ({ ...f, condition: e.target.value as Asset['condition'] }))}>
                  {['Excellent', 'Good', 'Fair', 'Poor'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Purchase Date</label>
                <input type="date" className="input" value={form.purchaseDate} onChange={e => setForm(f => ({ ...f, purchaseDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Purchase Price (INR)</label>
                <input type="number" className="input" placeholder="0" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Warranty Expiry Date</label>
                <input type="date" className="input" value={form.warranty} onChange={e => setForm(f => ({ ...f, warranty: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddAsset} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Add Asset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
