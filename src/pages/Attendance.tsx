import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Download, Clock, CheckCircle, XCircle,
  Home, MinusCircle, Edit2, X, Calendar, TrendingUp, Plus,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import type { AttendanceRecord, AttendanceStatus } from '../types';

/* ─── types ─────────────────────────────────────────────── */
interface DayAttendanceStat {
  day: number;
  present: number;
  absent: number;
  wfh: number;
  halfDay: number;
}

/* ─── constants ──────────────────────────────────────────── */
const STATUS_CONFIG: Record<AttendanceStatus, { badge: string; barColor: string; icon: React.ElementType; label: string }> = {
  Present:         { badge: 'badge-green',  barColor: '#10b981', icon: CheckCircle, label: 'Present' },
  Absent:          { badge: 'badge-red',    barColor: '#ef4444', icon: XCircle,     label: 'Absent' },
  'Half Day':      { badge: 'badge-yellow', barColor: '#f59e0b', icon: MinusCircle, label: 'Half Day' },
  'Work From Home':{ badge: 'badge-blue',   barColor: '#3b82f6', icon: Home,        label: 'WFH' },
  Holiday:         { badge: 'badge-purple', barColor: '#8b5cf6', icon: Clock,       label: 'Holiday' },
};

const ALL_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Half Day', 'Work From Home', 'Holiday'];
const FILTER_OPTIONS = ['All', 'Present', 'Absent', 'Work From Home', 'Half Day'];

/* ─── helpers ────────────────────────────────────────────── */
function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function workHoursColor(h: number): string {
  if (h >= 9) return '#10b981';
  if (h >= 6) return '#3b82f6';
  if (h >= 4) return '#f59e0b';
  return '#ef4444';
}

function formatHours(h: number): string {
  if (h <= 0) return '—';
  const hrs = Math.floor(h);
  const mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

/* ─── toast ──────────────────────────────────────────────── */
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fade-up" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'rgba(239,68,68,0.95)', backdropFilter: 'blur(10px)',
      color: '#fff', padding: '12px 20px', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360, fontSize: 14,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
    </div>
  );
}

/* ─── skeleton row ───────────────────────────────────────── */
function SkeletonRow() {
  return (
    <tr>
      {[150, 80, 80, 120, 80, 100, 60].map((w, i) => (
        <td key={i} style={{ padding: '14px 18px' }}>
          <div style={{
            height: 13, borderRadius: 6, width: w,
            background: 'linear-gradient(90deg,rgba(255,255,255,0.04) 0%,rgba(255,255,255,0.1) 50%,rgba(255,255,255,0.04) 100%)',
            backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite',
          }} />
        </td>
      ))}
    </tr>
  );
}

/* ─── inline status editor ───────────────────────────────── */
function StatusEditor({ current, onSave, onCancel }: {
  current: AttendanceStatus;
  onSave: (s: AttendanceStatus) => void;
  onCancel: () => void;
}) {
  const [val, setVal] = useState<AttendanceStatus>(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        autoFocus
        value={val}
        onChange={e => setVal(e.target.value as AttendanceStatus)}
        className="input"
        style={{ fontSize: 12, padding: '4px 8px', minWidth: 130 }}
      >
        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={() => onSave(val)} style={{
        background: '#10b981', border: 'none', borderRadius: 6, padding: '4px 8px',
        color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600,
      }}>Save</button>
      <button onClick={onCancel} style={{
        background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6,
        padding: '4px 8px', color: '#94a3b8', fontSize: 12, cursor: 'pointer',
      }}>×</button>
    </div>
  );
}

/* ─── custom tooltip for recharts ────────────────────────── */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: 10, padding: '10px 14px', fontSize: 12,
    }}>
      <p style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px' }}>Day {label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.fill, margin: '2px 0' }}>
          {p.name}: {p.value}
        </p>
      ))}
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */
export default function Attendance() {
  const { attendanceRecords, setAttendanceRecords } = useApp();
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasFetched = useRef<Record<string, boolean>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  /* fetch attendance for selected date */
  const fetchAttendance = useCallback(async (date: string) => {
    if (hasFetched.current[date]) return;
    hasFetched.current[date] = true;
    setLoading(true);
    try {
      const data = await api.get<AttendanceRecord[]>(`/attendance?date=${date}`);
      if (data && data.length) setAttendanceRecords(data);
    } catch {
      /* use context data */
    } finally {
      setLoading(false);
    }
  }, [setAttendanceRecords]);

  useEffect(() => { fetchAttendance(selectedDate); }, [selectedDate, fetchAttendance]);

  /* derived stats */
  const stats = {
    present:  attendanceRecords.filter(r => r.status === 'Present').length,
    absent:   attendanceRecords.filter(r => r.status === 'Absent').length,
    wfh:      attendanceRecords.filter(r => r.status === 'Work From Home').length,
    halfDay:  attendanceRecords.filter(r => r.status === 'Half Day').length,
    total:    attendanceRecords.length,
  };

  const attendanceRate = stats.total > 0
    ? Math.round(((stats.present + stats.wfh) / stats.total) * 100)
    : 0;

  const totalHours   = attendanceRecords.reduce((s, r) => s + (r.workHours || 0), 0);
  const workedCount  = attendanceRecords.filter(r => r.workHours > 0).length;
  const avgHours     = workedCount > 0 ? (totalHours / workedCount) : 0;

  /* filter */
  const filtered = attendanceRecords.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.employeeName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All'
      || r.status === statusFilter
      || (statusFilter === 'Work From Home' && r.status === 'Work From Home');
    return matchSearch && matchStatus;
  });

  /* update status */
  const updateStatus = async (id: string, status: AttendanceStatus) => {
    setEditingId(null);
    try {
      await api.put<AttendanceRecord>(`/attendance/${id}`, { status });
    } catch {
      setToast('API error — status updated locally.');
    }
    setAttendanceRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  /* export CSV */
  const exportCSV = () => {
    const header = ['Name', 'Date', 'Check In', 'Check Out', 'Work Hours', 'Status'];
    const rows = filtered.map(r => [r.employeeName, r.date, r.checkIn, r.checkOut, r.workHours, r.status]);
    const csv = [header, ...rows].map(row => row.join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a');
    a.href = url; a.download = `attendance-${selectedDate}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  /* monthly chart data (simulate for current month) */
  const now = new Date(selectedDate);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyData: DayAttendanceStat[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    present: Math.floor(Math.random() * 6) + 10,
    absent: Math.floor(Math.random() * 4) + 1,
    wfh: Math.floor(Math.random() * 4) + 2,
    halfDay: Math.floor(Math.random() * 3),
  }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── header ── */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Attendance Management</h1>
          <p className="page-subtitle">Track daily attendance and work hours</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <Calendar size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            <input
              ref={dateInputRef}
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="input"
              style={{ paddingLeft: 36, minWidth: 160 }}
            />
          </div>
          <button onClick={exportCSV} className="btn btn-ghost">
            <Download size={15} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── stats ── */}
      <div className="stat-grid-auto" style={{ gap: 16 }}>
        {[
          { label: 'Present', value: stats.present, pct: stats.total ? Math.round((stats.present/stats.total)*100) : 0, icon: CheckCircle, cls: 'stat-green', iconCls: 'icon-green' },
          { label: 'Absent',  value: stats.absent,  pct: stats.total ? Math.round((stats.absent/stats.total)*100)  : 0, icon: XCircle,     cls: 'stat-orange', iconCls: 'icon-orange' },
          { label: 'WFH',     value: stats.wfh,     pct: stats.total ? Math.round((stats.wfh/stats.total)*100)     : 0, icon: Home,         cls: 'stat-blue',   iconCls: 'icon-blue' },
          { label: 'Half Day',value: stats.halfDay,  pct: stats.total ? Math.round((stats.halfDay/stats.total)*100) : 0, icon: MinusCircle,  cls: 'stat-purple', iconCls: 'icon-purple' },
        ].map(({ label, value, pct, icon: Icon, cls, iconCls }) => (
          <div key={label} className={`stat-card ${cls} fade-up`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className={`icon-box ${iconCls}`}><Icon size={20} /></div>
              <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{pct}%</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{value}</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── attendance rate bar + summary ── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)', padding: '20px 24px',
        display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center',
      }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ color: '#94a3b8', fontSize: 13 }}>Overall Attendance Rate</span>
            <span style={{ color: '#10b981', fontWeight: 700, fontSize: 14 }}>{attendanceRate}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{
                width: `${attendanceRate}%`,
                background: attendanceRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' :
                            attendanceRate >= 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' :
                            'linear-gradient(90deg,#ef4444,#f87171)',
              }}
            />
          </div>
        </div>

        {[
          { label: 'Avg Work Hours', value: `${avgHours.toFixed(1)}h`, icon: Clock },
          { label: 'Total Hours', value: `${Math.round(totalHours)}h`, icon: TrendingUp },
          { label: 'Overtime (>9h)', value: `${attendanceRecords.filter(r => r.workHours > 9).length} emp`, icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 4 }}>
              <Icon size={14} color="#64748b" />
              <span style={{ color: '#64748b', fontSize: 12 }}>{label}</span>
            </div>
            <p style={{ fontSize: 20, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── filter row ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
        background: 'rgba(255,255,255,0.04)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px',
      }}>
        <div className="search-box" style={{ flex: '1 1 200px', minWidth: 180 }}>
          <Search size={15} color="#64748b" />
          <input
            className="input"
            style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 4px' }}
            placeholder="Search employee..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              style={{
                padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
                background: statusFilter === s ? 'linear-gradient(135deg,#3b82f6,#6366f1)' : 'rgba(255,255,255,0.06)',
                color: statusFilter === s ? '#fff' : '#94a3b8',
                boxShadow: statusFilter === s ? '0 4px 12px rgba(59,130,246,0.4)' : 'none',
              }}
            >
              {s}
            </button>
          ))}
        </div>
        <span style={{ color: '#64748b', fontSize: 13, marginLeft: 'auto' }}>{filtered.length} records</span>
      </div>

      {/* ── table ── */}
      <div style={{ overflowX: 'auto', borderRadius: 16, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
        <table className="premium-table" style={{ width: '100%' }}>
          <thead>
            <tr>
              {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Location', 'Action'].map(h => (
                <th key={h} style={{
                  padding: '14px 18px', textAlign: 'left',
                  fontSize: 11, fontWeight: 700, color: '#64748b',
                  textTransform: 'uppercase', letterSpacing: '0.08em',
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : filtered.length === 0
                ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
                      <Clock size={36} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                      No attendance records found
                    </td>
                  </tr>
                )
                : filtered.map((record, idx) => {
                  const cfg = STATUS_CONFIG[record.status];
                  const avatarBg = record.status === 'Present' ? '#10b981' :
                                   record.status === 'Absent'  ? '#ef4444' :
                                   record.status === 'Work From Home' ? '#3b82f6' : '#f59e0b';
                  const dept = (record as any).department || '';
                  const isEditing = editingId === record.id;

                  /* guess location */
                  const location = record.status === 'Work From Home' ? 'Remote' :
                                   record.status === 'Present' ? 'Office' :
                                   record.status === 'Half Day' ? 'Office' : '—';

                  return (
                    <tr key={record.id} className={`fade-up stagger-${Math.min(idx + 1, 6)}`}>
                      {/* employee */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 36, height: 36, borderRadius: 10, background: avatarBg,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0,
                            boxShadow: `0 4px 10px ${avatarBg}55`,
                          }}>
                            {record.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                          </div>
                          <div>
                            <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, margin: 0 }}>{record.employeeName}</p>
                            {dept && <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{dept}</p>}
                          </div>
                        </div>
                      </td>

                      {/* check in */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: record.checkIn ? '#10b981' : '#475569', fontSize: 13, fontWeight: record.checkIn ? 600 : 400 }}>
                          {record.checkIn || '—'}
                        </span>
                      </td>

                      {/* check out */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: record.checkOut ? '#e2e8f0' : '#475569', fontSize: 13, fontWeight: record.checkOut ? 600 : 400 }}>
                          {record.checkOut || (record.status === 'Present' ? 'Active' : '—')}
                        </span>
                      </td>

                      {/* work hours */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{ flex: 1, maxWidth: 80 }}>
                            <div className="progress-bar" style={{ height: 6 }}>
                              <div
                                className="progress-fill"
                                style={{
                                  width: `${Math.min(100, (record.workHours / 10) * 100)}%`,
                                  background: `linear-gradient(90deg,${workHoursColor(record.workHours)},${workHoursColor(record.workHours)}88)`,
                                }}
                              />
                            </div>
                          </div>
                          <span style={{ color: workHoursColor(record.workHours), fontSize: 12, fontWeight: 600, minWidth: 36 }}>
                            {formatHours(record.workHours)}
                          </span>
                        </div>
                      </td>

                      {/* status */}
                      <td style={{ padding: '14px 18px' }}>
                        {isEditing
                          ? <StatusEditor
                              current={record.status}
                              onSave={s => updateStatus(record.id, s)}
                              onCancel={() => setEditingId(null)}
                            />
                          : <span className={`badge ${cfg.badge}`}>{record.status}</span>
                        }
                      </td>

                      {/* location */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>{location}</span>
                      </td>

                      {/* action */}
                      <td style={{ padding: '14px 18px' }}>
                        {!isEditing && (
                          <button
                            onClick={() => setEditingId(record.id)}
                            style={{
                              background: 'rgba(59,130,246,0.1)', border: 'none', borderRadius: 8,
                              padding: 7, cursor: 'pointer', color: '#3b82f6',
                              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
                            }}
                          >
                            <Edit2 size={13} />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* ── monthly summary chart ── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.08)', padding: '24px',
      }}>
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: 0 }}>
            Monthly Attendance Summary
          </h3>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>
            {now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} — daily breakdown
          </p>
        </div>

        {/* legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[
            { key: 'present', color: '#10b981', label: 'Present' },
            { key: 'absent',  color: '#ef4444', label: 'Absent' },
            { key: 'wfh',     color: '#3b82f6', label: 'WFH' },
            { key: 'halfDay', color: '#f59e0b', label: 'Half Day' },
          ].map(l => (
            <div key={l.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ color: '#94a3b8', fontSize: 12 }}>{l.label}</span>
            </div>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barSize={5} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="day"
              axisLine={false} tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b' }}
              interval={1}
            />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="present" fill="#10b981" radius={[3, 3, 0, 0]} name="Present" />
            <Bar dataKey="absent"  fill="#ef4444" radius={[3, 3, 0, 0]} name="Absent" />
            <Bar dataKey="wfh"     fill="#3b82f6" radius={[3, 3, 0, 0]} name="WFH" />
            <Bar dataKey="halfDay" fill="#f59e0b" radius={[3, 3, 0, 0]} name="Half Day" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      {/* ── FAB: mobile-only Mark Attendance ── */}
      <button
        className="fab mobile-only"
        aria-label="Mark Attendance"
        onClick={() => {
          dateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          dateInputRef.current?.focus();
          dateInputRef.current?.click();
        }}
      >
        <Plus size={22} color="#fff" />
      </button>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .premium-table tbody tr:hover td { background: rgba(255,255,255,0.03); }
      `}</style>
    </div>
  );
}
