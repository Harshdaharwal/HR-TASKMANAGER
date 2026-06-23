import { useState, useEffect, useRef } from 'react';
import {
  Plus, Search, Edit2, Trash2, Eye, X, Download,
  ChevronDown, Mail, Phone, Calendar, DollarSign,
  Users, UserCheck, UserMinus, TrendingUp, Filter
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import type { Employee, Department, EmployeeStatus } from '../types';

/* ─── constants ───────────────────────────────────────── */
const DEPARTMENTS: Department[] = [
  'Engineering', 'Sales', 'Marketing', 'HR', 'Finance', 'Operations', 'Design', 'Legal',
];

const DEPT_BADGE: Record<string, string> = {
  Engineering: 'badge-blue', Sales: 'badge-green', Marketing: 'badge-purple',
  HR: 'badge-yellow', Finance: 'badge-gray', Operations: 'badge-red',
  Design: 'badge-purple', Legal: 'badge-gray',
};

const STATUS_BADGE: Record<string, string> = {
  Active: 'badge-green', 'On Leave': 'badge-yellow', Resigned: 'badge-red', Probation: 'badge-blue',
};

const AVATAR_COLORS: string[] = [
  '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#f97316',
];

function avatarColor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h);
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

function initials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function formatINR(n: number): string {
  return '₹' + n.toLocaleString('en-IN');
}

/* ─── toast ───────────────────────────────────────────── */
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);
  return (
    <div
      className="fade-up"
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
        background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(10px)',
        color: '#fff', padding: '12px 20px', borderRadius: 12,
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)', display: 'flex',
        alignItems: 'center', gap: 10, maxWidth: 360, fontSize: 14,
      }}
    >
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: 2 }}>
        <X size={16} />
      </button>
    </div>
  );
}

/* ─── skeleton row ────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {Array.from({ length: 8 }).map((_, i) => (
        <td key={i} className="px-5 py-4">
          <div style={{
            height: 14, borderRadius: 7,
            background: 'linear-gradient(90deg,rgba(255,255,255,0.05) 0%,rgba(255,255,255,0.12) 50%,rgba(255,255,255,0.05) 100%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite',
            width: i === 0 ? 120 : i === 3 ? 100 : 80,
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── detail slide-over ───────────────────────────────── */
function DetailPanel({ employee, onClose, onEdit }: {
  employee: Employee;
  onClose: () => void;
  onEdit: () => void;
}) {
  const color = avatarColor(employee.name);
  const basic = Math.round(employee.salary * 0.5);
  const hra = Math.round(employee.salary * 0.2);
  const allowances = Math.round(employee.salary * 0.15);
  const pf = Math.round(employee.salary * 0.12);
  const net = basic + hra + allowances - pf;

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 400, backdropFilter: 'blur(2px)',
        }}
      />
      <div
        className="fade-up"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, width: 420,
          zIndex: 401, overflowY: 'auto',
          background: 'rgba(15,23,42,0.97)', backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
        }}
      >
        {/* header banner */}
        <div style={{
          background: `linear-gradient(135deg, ${color}44 0%, ${color}22 100%)`,
          borderBottom: `1px solid ${color}33`, padding: '28px 24px 20px',
          position: 'relative',
        }}>
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 16, right: 16,
              background: 'rgba(255,255,255,0.08)', border: 'none',
              borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8',
            }}
          >
            <X size={18} />
          </button>

          <div style={{
            width: 64, height: 64, borderRadius: 16, background: color,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 22, marginBottom: 14,
            boxShadow: `0 8px 24px ${color}66`,
          }}>
            {initials(employee.name)}
          </div>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 20, margin: 0 }}>{employee.name}</h2>
          <p style={{ color: '#94a3b8', fontSize: 13, margin: '4px 0 8px' }}>
            {employee.designation} &middot; {employee.department}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className={`badge ${STATUS_BADGE[employee.status]}`}>{employee.status}</span>
            <span className="badge badge-gray">{employee.employeeId}</span>
          </div>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* contact */}
          <section>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Contact Information
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { icon: Mail, label: 'Email', value: employee.email },
                { icon: Phone, label: 'Phone', value: employee.phone },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, background: 'rgba(59,130,246,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={15} color="#3b82f6" />
                  </div>
                  <div>
                    <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{label}</p>
                    <p style={{ color: '#e2e8f0', fontSize: 13, margin: '2px 0 0', fontWeight: 500 }}>{value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* details grid */}
          <section>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Employee Details
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Join Date', value: new Date(employee.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { label: 'Date of Birth', value: new Date(employee.dob).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) },
                { label: 'Gender', value: employee.gender },
                { label: 'Manager', value: employee.manager },
                { label: 'Education', value: employee.education },
                { label: 'Address', value: employee.address },
              ].map(({ label, value }) => (
                <div key={label} style={{
                  background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 12px',
                  ...(label === 'Education' || label === 'Address' ? { gridColumn: '1 / -1' } : {}),
                }}>
                  <p style={{ color: '#64748b', fontSize: 11, margin: 0 }}>{label}</p>
                  <p style={{ color: '#e2e8f0', fontSize: 13, margin: '3px 0 0', fontWeight: 500, wordBreak: 'break-word' }}>{value || '—'}</p>
                </div>
              ))}
            </div>
          </section>

          {/* skills */}
          {employee.skills.length > 0 && (
            <section>
              <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
                Skills
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {employee.skills.map(s => (
                  <span key={s} className="badge badge-blue" style={{ fontSize: 12 }}>{s}</span>
                ))}
              </div>
            </section>
          )}

          {/* salary breakdown */}
          <section>
            <p style={{ color: '#64748b', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
              Salary Breakdown
            </p>
            <div style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px 16px' }}>
              {[
                { label: 'Basic Salary', value: basic, color: '#e2e8f0' },
                { label: 'HRA (20%)', value: hra, color: '#e2e8f0' },
                { label: 'Allowances (15%)', value: allowances, color: '#e2e8f0' },
                { label: 'PF Deduction (-12%)', value: -pf, color: '#ef4444' },
              ].map(({ label, value, color: c }) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <span style={{ color: '#94a3b8', fontSize: 13 }}>{label}</span>
                  <span style={{ color: c, fontSize: 13, fontWeight: 600 }}>{value < 0 ? '-' : ''}{formatINR(Math.abs(value))}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0 0', marginTop: 4 }}>
                <span style={{ color: '#f1f5f9', fontSize: 14, fontWeight: 700 }}>Net Salary</span>
                <span style={{ color: '#10b981', fontSize: 14, fontWeight: 700 }}>{formatINR(net)}</span>
              </div>
            </div>
          </section>

          <button
            onClick={onEdit}
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}
          >
            <Edit2 size={15} /> Edit Employee
          </button>
        </div>
      </div>
    </>
  );
}

/* ─── add / edit modal ────────────────────────────────── */
interface EmployeeFormData {
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: string;
  joinDate: string;
  dob: string;
  gender: 'Male' | 'Female';
  status: EmployeeStatus;
  manager: string;
  address: string;
  education: string;
  skillsRaw: string;
}

function EmployeeModal({ employee, onClose, onSave }: {
  employee: Employee | null;
  onClose: () => void;
  onSave: (emp: Omit<Employee, 'id' | 'employeeId' | 'avatar'>) => Promise<void>;
}) {
  const [form, setForm] = useState<EmployeeFormData>({
    name: employee?.name || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    department: employee?.department || 'Engineering',
    designation: employee?.designation || '',
    salary: employee?.salary?.toString() || '',
    joinDate: employee?.joinDate || '',
    dob: employee?.dob || '',
    gender: employee?.gender || 'Male',
    status: employee?.status || 'Active',
    manager: employee?.manager || '',
    address: employee?.address || '',
    education: employee?.education || '',
    skillsRaw: employee?.skills?.join(', ') || '',
  });
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof EmployeeFormData>(k: K, v: EmployeeFormData[K]) =>
    setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave({
        name: form.name,
        email: form.email,
        phone: form.phone,
        department: form.department,
        designation: form.designation,
        salary: Number(form.salary) || 0,
        joinDate: form.joinDate,
        dob: form.dob,
        gender: form.gender,
        status: form.status,
        manager: form.manager,
        address: form.address,
        education: form.education,
        skills: form.skillsRaw.split(',').map(s => s.trim()).filter(Boolean),
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 500 }}>
      <div className="modal-box" style={{ width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: '1px solid rgba(100,116,139,0.2)', position: 'sticky', top: 0, background: 'var(--glass)', zIndex: 1 }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: 0 }}>
            {employee ? 'Edit Employee' : 'Add New Employee'}
          </h2>
          <button onClick={onClose} style={{ background: 'rgba(100,116,139,0.12)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
          {/* name */}
          <div>
            <label className="form-label">Full Name *</label>
            <input className="input" required value={form.name} onChange={e => set('name', e.target.value)} placeholder="Rahul Sharma" />
          </div>
          {/* email */}
          <div>
            <label className="form-label">Email *</label>
            <input className="input" type="email" required value={form.email} onChange={e => set('email', e.target.value)} placeholder="rahul@company.com" />
          </div>
          {/* phone */}
          <div>
            <label className="form-label">Phone</label>
            <input className="input" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
          </div>
          {/* designation */}
          <div>
            <label className="form-label">Designation *</label>
            <input className="input" required value={form.designation} onChange={e => set('designation', e.target.value)} placeholder="Senior Developer" />
          </div>
          {/* department */}
          <div>
            <label className="form-label">Department *</label>
            <select className="input" value={form.department} onChange={e => set('department', e.target.value as Department)}>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          {/* salary */}
          <div>
            <label className="form-label">Monthly Salary (₹)</label>
            <input className="input" type="number" min="0" value={form.salary} onChange={e => set('salary', e.target.value)} placeholder="85000" />
          </div>
          {/* join date */}
          <div>
            <label className="form-label">Join Date</label>
            <input className="input" type="date" value={form.joinDate} onChange={e => set('joinDate', e.target.value)} />
          </div>
          {/* dob */}
          <div>
            <label className="form-label">Date of Birth</label>
            <input className="input" type="date" value={form.dob} onChange={e => set('dob', e.target.value)} />
          </div>
          {/* gender */}
          <div>
            <label className="form-label">Gender</label>
            <select className="input" value={form.gender} onChange={e => set('gender', e.target.value as 'Male' | 'Female')}>
              <option>Male</option>
              <option>Female</option>
            </select>
          </div>
          {/* status */}
          <div>
            <label className="form-label">Status</label>
            <select className="input" value={form.status} onChange={e => set('status', e.target.value as EmployeeStatus)}>
              <option>Active</option>
              <option>On Leave</option>
              <option>Probation</option>
              <option>Resigned</option>
            </select>
          </div>
          {/* manager */}
          <div>
            <label className="form-label">Reporting Manager</label>
            <input className="input" value={form.manager} onChange={e => set('manager', e.target.value)} placeholder="Neha Gupta" />
          </div>
          {/* education */}
          <div>
            <label className="form-label">Education</label>
            <input className="input" value={form.education} onChange={e => set('education', e.target.value)} placeholder="B.Tech Computer Science" />
          </div>
          {/* address */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Address</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} placeholder="123 MG Road, Bangalore" />
          </div>
          {/* skills */}
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="form-label">Skills (comma-separated)</label>
            <input className="input" value={form.skillsRaw} onChange={e => set('skillsRaw', e.target.value)} placeholder="React, TypeScript, Node.js, AWS" />
          </div>

          <div style={{ gridColumn: '1 / -1', display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : employee ? 'Save Changes' : 'Add Employee'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── delete confirm modal ────────────────────────────── */
function DeleteModal({ name, onClose, onConfirm }: { name: string; onClose: () => void; onConfirm: () => Promise<void> }) {
  const [deleting, setDeleting] = useState(false);
  return (
    <div className="modal-overlay" style={{ zIndex: 500 }}>
      <div className="modal-box" style={{ maxWidth: 420, textAlign: 'center', padding: 32 }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: 'rgba(239,68,68,0.15)', margin: '0 auto 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Trash2 size={24} color="#ef4444" />
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 18, margin: '0 0 8px' }}>Delete Employee</h3>
        <p style={{ color: '#94a3b8', fontSize: 14, margin: '0 0 24px', lineHeight: 1.6 }}>
          Are you sure you want to remove <strong style={{ color: 'var(--text-primary)' }}>{name}</strong>?
          This action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onClose} className="btn btn-ghost">Cancel</button>
          <button
            onClick={async () => { setDeleting(true); await onConfirm(); }}
            disabled={deleting}
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg,#ef4444,#dc2626)',
              color: '#fff', fontWeight: 600, fontSize: 14,
            }}
          >
            <Trash2 size={15} /> {deleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── main page ───────────────────────────────────────── */
export default function Employees() {
  const { employees, setEmployees } = useApp();
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<string>('name');
  const [showModal, setShowModal] = useState(false);
  const [editEmp, setEditEmp] = useState<Employee | null>(null);
  const [viewEmp, setViewEmp] = useState<Employee | null>(null);
  const [deleteEmp, setDeleteEmp] = useState<Employee | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasFetched = useRef(false);

  /* fetch on mount */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    setLoading(true);
    api.get<Employee[]>('/employees')
      .then(data => { if (data && data.length) setEmployees(data); })
      .catch(() => { /* use context data */ })
      .finally(() => setLoading(false));
  }, [setEmployees]);

  /* derived data */
  const sorted = [...employees].sort((a, b) => {
    if (sortBy === 'salary') return b.salary - a.salary;
    if (sortBy === 'joinDate') return b.joinDate.localeCompare(a.joinDate);
    return a.name.localeCompare(b.name);
  });

  const filtered = sorted.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q ||
      e.name.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q) ||
      e.employeeId.toLowerCase().includes(q) ||
      e.designation.toLowerCase().includes(q);
    const matchDept = deptFilter === 'All' || e.department === deptFilter;
    const matchStatus = statusFilter === 'All' || e.status === statusFilter;
    return matchSearch && matchDept && matchStatus;
  });

  const stats = {
    total: employees.length,
    active: employees.filter(e => e.status === 'Active').length,
    onLeave: employees.filter(e => e.status === 'On Leave').length,
    newThisMonth: employees.filter(e => {
      const now = new Date();
      const joined = new Date(e.joinDate);
      return joined.getFullYear() === now.getFullYear() && joined.getMonth() === now.getMonth();
    }).length,
  };

  /* CRUD */
  const handleSave = async (data: Omit<Employee, 'id' | 'employeeId' | 'avatar'>) => {
    try {
      if (editEmp) {
        const updated = await api.put<Employee>(`/employees/${editEmp.id}`, data);
        setEmployees(prev => prev.map(e => e.id === editEmp.id ? (updated || { ...editEmp, ...data }) : e));
      } else {
        const created = await api.post<Employee>('/employees', {
          ...data,
          avatar: data.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase(),
          employeeId: `EMP${String(Date.now()).slice(-4)}`,
        });
        setEmployees(prev => [created || { ...data, id: String(Date.now()), employeeId: `EMP${String(Date.now()).slice(-4)}`, avatar: initials(data.name) }, ...prev]);
      }
    } catch {
      setToast('Failed to save employee. Changes saved locally.');
      /* apply locally anyway */
      if (editEmp) {
        setEmployees(prev => prev.map(e => e.id === editEmp.id ? { ...editEmp, ...data } : e));
      } else {
        const newEmp: Employee = {
          ...data,
          id: String(Date.now()),
          employeeId: `EMP${String(Date.now()).slice(-4)}`,
          avatar: initials(data.name),
        };
        setEmployees(prev => [newEmp, ...prev]);
      }
    }
    setEditEmp(null);
  };

  const handleDelete = async () => {
    if (!deleteEmp) return;
    try {
      await api.delete(`/employees/${deleteEmp.id}`);
    } catch {
      setToast('API error — employee removed locally.');
    }
    setEmployees(prev => prev.filter(e => e.id !== deleteEmp.id));
    setDeleteEmp(null);
  };

  /* export */
  const exportCSV = () => {
    const header = ['ID', 'Name', 'Email', 'Phone', 'Department', 'Designation', 'Salary', 'Status', 'Join Date'];
    const rows = filtered.map(e => [e.employeeId, e.name, e.email, e.phone, e.department, e.designation, e.salary, e.status, e.joinDate]);
    const csv = [header, ...rows].map(r => r.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── header ── */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Employee Management</h1>
          <p className="page-subtitle">
            <span className="badge badge-blue" style={{ marginRight: 8 }}>{employees.length} Total</span>
            Manage your workforce
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={exportCSV} className="btn btn-ghost">
            <Download size={15} /> Export
          </button>
          <button
            onClick={() => { setEditEmp(null); setShowModal(true); }}
            className="btn btn-primary"
          >
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── stats row ── */}
      <div className="stat-grid-auto" style={{ gap: 16 }}>
        {[
          { label: 'Total Employees', value: stats.total, icon: Users, cls: 'stat-blue', iconCls: 'icon-blue' },
          { label: 'Active', value: stats.active, icon: UserCheck, cls: 'stat-green', iconCls: 'icon-green' },
          { label: 'On Leave', value: stats.onLeave, icon: UserMinus, cls: 'stat-orange', iconCls: 'icon-orange' },
          { label: 'New This Month', value: stats.newThisMonth, icon: TrendingUp, cls: 'stat-purple', iconCls: 'icon-purple' },
        ].map(({ label, value, icon: Icon, cls, iconCls }) => (
          <div key={label} className={`stat-card ${cls} fade-up`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className={`icon-box ${iconCls}`}>
                <Icon size={20} />
              </div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── filter bar ── */}
      <div className="glass-card" style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        padding: '14px 18px',
      }}>
        <div className="search-box" style={{ flex: '1 1 100%', minWidth: 180 }}>
          <Search size={15} color="#64748b" />
          <input
            className="input"
            style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 4px' }}
            placeholder="Search by name, email, ID, designation..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}>
              <X size={14} />
            </button>
          )}
        </div>

        {[
          { label: 'Department', value: deptFilter, options: ['All', ...DEPARTMENTS], onChange: setDeptFilter },
          { label: 'Status', value: statusFilter, options: ['All', 'Active', 'On Leave', 'Probation', 'Resigned'], onChange: setStatusFilter },
          { label: 'Sort', value: sortBy, options: [{ value: 'name', label: 'Name A–Z' }, { value: 'salary', label: 'Salary' }, { value: 'joinDate', label: 'Join Date' }] as any, onChange: setSortBy },
        ].map(({ label, value, options, onChange }) => (
          <div key={label} style={{ position: 'relative' }}>
            <select
              value={value}
              onChange={e => onChange(e.target.value)}
              className="input"
              style={{ paddingRight: 32, appearance: 'none', minWidth: 130, cursor: 'pointer' }}
            >
              {(options as any[]).map((o: any) =>
                typeof o === 'string'
                  ? <option key={o} value={o}>{o === 'All' ? `All ${label}s` : o}</option>
                  : <option key={o.value} value={o.value}>{o.label}</option>
              )}
            </select>
            <ChevronDown size={14} color="#64748b" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
          </div>
        ))}

        <span style={{ color: '#64748b', fontSize: 13, marginLeft: 'auto' }}>
          <Filter size={13} style={{ display: 'inline', marginRight: 4 }} />
          {filtered.length} of {employees.length}
        </span>
      </div>

      {/* ── table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 16, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <table className="premium-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Employee', 'Department', 'Designation', 'Contact', 'Join Date', 'Salary', 'Status', 'Actions'].map(h => (
                <th key={h} style={{
                  padding: '14px 18px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: '1px solid rgba(100,116,139,0.2)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
                      <Users size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      No employees found matching your criteria
                    </td>
                  </tr>
                )
                : filtered.map((emp, idx) => {
                  const color = avatarColor(emp.name);
                  return (
                    <tr key={emp.id} className={`fade-up stagger-${Math.min(idx + 1, 6)}`} style={{ cursor: 'default' }}>
                      {/* employee col */}
                      <td style={{ padding: '14px 18px' }}>
                        <div
                          style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
                          onClick={() => setViewEmp(emp)}
                        >
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, background: color,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                            boxShadow: `0 4px 12px ${color}55`,
                          }}>
                            {emp.avatar || initials(emp.name)}
                          </div>
                          <div>
                            <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: 14, margin: 0 }}
                              className="hover-text">{emp.name}</p>
                            <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{emp.employeeId}</p>
                          </div>
                        </div>
                      </td>

                      {/* dept */}
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${DEPT_BADGE[emp.department] || 'badge-gray'}`}>{emp.department}</span>
                      </td>

                      {/* designation */}
                      <td style={{ padding: '14px 18px', color: '#64748b', fontSize: 13 }}>{emp.designation}</td>

                      {/* contact */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Mail size={12} color="#64748b" />
                          <span style={{ color: '#94a3b8', fontSize: 12 }}>{emp.email}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Phone size={12} color="#64748b" />
                          <span style={{ color: '#64748b', fontSize: 12 }}>{emp.phone}</span>
                        </div>
                      </td>

                      {/* join date */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Calendar size={12} color="#64748b" />
                          <span style={{ color: '#94a3b8', fontSize: 13 }}>
                            {new Date(emp.joinDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </td>

                      {/* salary */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <DollarSign size={12} color="#64748b" />
                          <span style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 600 }}>
                            {formatINR(emp.salary)}
                          </span>
                        </div>
                      </td>

                      {/* status */}
                      <td style={{ padding: '14px 18px' }}>
                        <span className={`badge ${STATUS_BADGE[emp.status] || 'badge-gray'}`}>{emp.status}</span>
                      </td>

                      {/* actions */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button
                            onClick={() => setViewEmp(emp)}
                            title="View"
                            style={{ background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#3b82f6', transition: 'all 0.15s' }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            onClick={() => { setEditEmp(emp); setShowModal(true); }}
                            title="Edit"
                            style={{ background: 'rgba(16,185,129,0.1)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#10b981', transition: 'all 0.15s' }}
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={() => setDeleteEmp(emp)}
                            title="Delete"
                            style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#ef4444', transition: 'all 0.15s' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── modals ── */}
      {showModal && (
        <EmployeeModal
          employee={editEmp}
          onClose={() => { setShowModal(false); setEditEmp(null); }}
          onSave={handleSave}
        />
      )}

      {viewEmp && (
        <DetailPanel
          employee={viewEmp}
          onClose={() => setViewEmp(null)}
          onEdit={() => { setEditEmp(viewEmp); setViewEmp(null); setShowModal(true); }}
        />
      )}

      {deleteEmp && (
        <DeleteModal
          name={deleteEmp.name}
          onClose={() => setDeleteEmp(null)}
          onConfirm={handleDelete}
        />
      )}

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── FAB: mobile-only Add Employee ── */}
      <button
        className="fab mobile-only"
        onClick={() => { setEditEmp(null); setShowModal(true); }}
        aria-label="Add Employee"
      >
        <Plus size={22} color="#fff" />
      </button>

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .hover-text:hover { color: #3b82f6 !important; }
        .premium-table tbody tr:hover td { background: rgba(255,255,255,0.04); }
      `}</style>
    </div>
  );
}
