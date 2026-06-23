import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Search, Download, Clock, CheckCircle, XCircle,
  Home, MinusCircle, Edit2, X, Calendar, TrendingUp, Plus, Fingerprint,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import type { AttendanceRecord, AttendanceStatus, Employee } from '../types';

interface DayAttendanceStat {
  day: number; present: number; absent: number; wfh: number; halfDay: number;
}

const STATUS_CONFIG: Record<AttendanceStatus, { badge: string; icon: React.ElementType; label: string }> = {
  Present:          { badge: 'badge-green',  icon: CheckCircle, label: 'Present' },
  Absent:           { badge: 'badge-red',    icon: XCircle,     label: 'Absent' },
  'Half Day':       { badge: 'badge-yellow', icon: MinusCircle, label: 'Half Day' },
  'Work From Home': { badge: 'badge-blue',   icon: Home,        label: 'WFH' },
  Holiday:          { badge: 'badge-purple', icon: Clock,       label: 'Holiday' },
};

const ALL_STATUSES: AttendanceStatus[] = ['Present', 'Absent', 'Half Day', 'Work From Home', 'Holiday'];
const FILTER_OPTIONS = ['All', 'Present', 'Absent', 'Work From Home', 'Half Day'];

function todayISO() { return new Date().toISOString().slice(0, 10); }
function workHoursColor(h: number) { return h >= 9 ? '#10b981' : h >= 6 ? '#3b82f6' : h >= 4 ? '#f59e0b' : '#ef4444'; }
function formatHours(h: number) {
  if (h <= 0) return '—';
  const hrs = Math.floor(h), mins = Math.round((h - hrs) * 60);
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="fade-up" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: 'rgba(239,68,68,0.95)', color: '#fff', padding: '12px 20px',
      borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360, fontSize: 14,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
    </div>
  );
}

function SkeletonRow() {
  return (
    <tr>{[150, 80, 80, 120, 80, 100, 60].map((w, i) => (
      <td key={i} style={{ padding: '14px 18px' }}>
        <div style={{ height: 13, borderRadius: 6, width: w, background: 'linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }} />
      </td>
    ))}</tr>
  );
}

function StatusEditor({ current, onSave, onCancel }: {
  current: AttendanceStatus; onSave: (s: AttendanceStatus) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState<AttendanceStatus>(current);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select autoFocus value={val} onChange={e => setVal(e.target.value as AttendanceStatus)} className="input" style={{ fontSize: 12, padding: '4px 8px', minWidth: 130 }}>
        {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={() => onSave(val)} style={{ background: '#10b981', border: 'none', borderRadius: 6, padding: '4px 10px', color: '#fff', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}>Save</button>
      <button onClick={onCancel} style={{ background: 'rgba(100,116,139,0.12)', border: 'none', borderRadius: 6, padding: '4px 8px', color: '#64748b', fontSize: 12, cursor: 'pointer' }}>×</button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   BIOMETRIC ATTENDANCE — WebAuthn fingerprint feature
   ═══════════════════════════════════════════════════════ */

interface BiometricRecord {
  id?: string;
  credentialId: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  registeredAt?: string;
}

function buf2b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function BiometricTab({ employees }: { employees: Employee[] }) {
  const [mode, setMode] = useState<'checkin' | 'register'>('checkin');
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [detected, setDetected] = useState<BiometricRecord | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [registered, setRegistered] = useState<BiometricRecord[]>([]);
  const [attendanceDone, setAttendanceDone] = useState(false);

  const isSupported = typeof PublicKeyCredential !== 'undefined';

  useEffect(() => {
    api.get<BiometricRecord[]>('/biometric').then(d => setRegistered(d ?? [])).catch(() => {});
  }, []);

  const resetState = () => {
    setDetected(null); setMsg(''); setScanStatus('idle'); setAttendanceDone(false);
  };

  const handleRegister = async () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) { setMsg('Please select an employee first'); setScanStatus('error'); return; }
    if (registered.find(r => r.employeeId === emp.id)) {
      setMsg(`${emp.name} already registered. Remove entry to re-register.`);
      setScanStatus('error'); return;
    }
    setScanning(true); setMsg(''); setScanStatus('idle');
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'NeXHR', id: window.location.hostname },
          user: { id: new TextEncoder().encode(emp.id), name: emp.email || emp.name, displayName: emp.name },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'required' },
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      const record: BiometricRecord = {
        credentialId: buf2b64url(cred.rawId),
        employeeId: emp.id,
        employeeName: emp.name,
        employeeDepartment: emp.department,
        registeredAt: new Date().toISOString(),
      };
      await api.post('/biometric', record);
      setRegistered(prev => [...prev, record]);
      setMsg(`${emp.name}'s fingerprint registered successfully!`);
      setScanStatus('success');
      setSelectedEmpId('');
    } catch (err: any) {
      const n = err?.name ?? '';
      if (n === 'NotAllowedError') setMsg('Scan cancelled or permission denied.');
      else if (n === 'InvalidStateError') setMsg('This fingerprint is already registered on this device.');
      else setMsg(err?.message ?? 'Registration failed');
      setScanStatus('error');
    } finally { setScanning(false); }
  };

  const handleCheckin = async () => {
    setScanning(true); setDetected(null); setMsg(''); setScanStatus('idle'); setAttendanceDone(false);
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: 'required',
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      const credentialId = buf2b64url(assertion.rawId);
      const result = await api.post<BiometricRecord | null>('/biometric/verify', { credentialId });
      if (!result) {
        setMsg('Fingerprint not registered. Please register first.'); setScanStatus('error'); return;
      }
      setDetected(result); setScanStatus('success');
    } catch (err: any) {
      const n = err?.name ?? '';
      setMsg(n === 'NotAllowedError' ? 'Scan cancelled.' : err?.message ?? 'Scan failed');
      setScanStatus('error');
    } finally { setScanning(false); }
  };

  const confirmAttendance = async () => {
    if (!detected) return;
    try {
      await api.post('/attendance', {
        employeeId: detected.employeeId,
        employeeName: detected.employeeName,
        date: todayISO(),
        checkIn: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
        status: 'Present',
        workHours: 0,
      });
      setAttendanceDone(true);
      setMsg(`Attendance recorded for ${detected.employeeName}!`);
      setScanStatus('success');
    } catch (err: any) {
      setMsg(`Failed: ${err.message}`); setScanStatus('error');
    }
  };

  const deleteRegistered = async (r: BiometricRecord) => {
    if (!r.id) return;
    try { await api.delete(`/biometric/${r.id}`); setRegistered(prev => prev.filter(x => x.credentialId !== r.credentialId)); }
    catch { /* ignore */ }
  };

  if (!isSupported) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Fingerprint size={48} style={{ color: '#94a3b8', marginBottom: 16 }} />
        <p style={{ color: '#94a3b8', fontSize: 15, lineHeight: 1.7 }}>
          Fingerprint authentication requires <strong>Chrome on Android</strong> with a fingerprint sensor.
        </p>
      </div>
    );
  }

  const fpBtnStyle = (active: boolean, done?: boolean): React.CSSProperties => ({
    borderRadius: '50%', border: `3px solid ${done ? '#10b981' : active ? '#8b5cf6' : '#93c5fd'}`,
    cursor: active ? 'not-allowed' : 'pointer', transition: 'all 0.3s',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    animation: active ? 'biometricPulse 1.5s ease-in-out infinite' : 'none',
    boxShadow: done ? '0 0 0 12px rgba(16,185,129,0.1)' : active ? '0 0 0 10px rgba(139,92,246,0.1)' : '0 8px 32px rgba(59,130,246,0.15)',
  });

  return (
    <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mode tabs */}
      <div className="tab-bar" style={{ width: 'fit-content' }}>
        {(['checkin', 'register'] as const).map(m => (
          <button key={m} className={`tab-item ${mode === m ? 'active' : ''}`}
            onClick={() => { setMode(m); resetState(); }}>
            {m === 'checkin' ? '✅ Mark Attendance' : '🔑 Register Fingerprint'}
          </button>
        ))}
      </div>

      {/* ── CHECK-IN MODE ── */}
      {mode === 'checkin' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '40px 24px' }}>
          {!detected || attendanceDone ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 22, margin: '0 0 6px' }}>
                  {attendanceDone ? '✅ Attendance Marked!' : 'Fingerprint Check-in'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: 0 }}>
                  {attendanceDone ? msg : 'Place your finger on the sensor'}
                </p>
              </div>
              <button onClick={attendanceDone ? resetState : handleCheckin} disabled={scanning}
                style={{ width: 150, height: 150, background: attendanceDone ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : scanning ? 'rgba(139,92,246,0.07)' : 'linear-gradient(135deg,#eff6ff,#f0fdf4)', ...fpBtnStyle(scanning, attendanceDone) }}>
                <Fingerprint size={64} color={attendanceDone ? '#10b981' : scanning ? '#8b5cf6' : '#3b82f6'} strokeWidth={1.2} />
              </button>
              <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
                {scanning ? '⏳ Scanning...' : attendanceDone ? 'Tap to scan next person' : 'Tap to scan fingerprint'}
              </p>
              {msg && !attendanceDone && (
                <div style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: 'center', background: '#fee2e2', color: '#991b1b', width: '100%' }}>{msg}</div>
              )}
            </>
          ) : (
            /* Employee detected */
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
              <div style={{ width: 76, height: 76, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30, color: '#fff', fontWeight: 800 }}>
                {detected.employeeName.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 24, margin: 0 }}>{detected.employeeName}</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>{detected.employeeDepartment}</p>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 10, padding: '6px 16px', borderRadius: 20, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Clock size={14} color="#10b981" />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>
                    {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                  </span>
                </div>
              </div>
              {msg && <div style={{ padding: '10px 18px', borderRadius: 10, fontSize: 14, background: scanStatus === 'error' ? '#fee2e2' : '#d1fae5', color: scanStatus === 'error' ? '#991b1b' : '#065f46', width: '100%', textAlign: 'center' }}>{msg}</div>}
              <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                <button onClick={resetState} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                <button onClick={confirmAttendance} className="btn btn-primary" style={{ flex: 1 }}>Mark as Present</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── REGISTER MODE ── */}
      {mode === 'register' && (
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24, padding: '32px 24px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 20, margin: '0 0 6px' }}>Register Fingerprint</h2>
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>Select employee then scan their finger on this device</p>
          </div>
          <select value={selectedEmpId}
            onChange={e => { setSelectedEmpId(e.target.value); setMsg(''); setScanStatus('idle'); }}
            className="input" style={{ width: '100%' }}>
            <option value="">— Select Employee —</option>
            {employees.map(e => {
              const isReg = registered.some(r => r.employeeId === e.id);
              return <option key={e.id} value={e.id}>{e.name} — {e.department}{isReg ? ' ✓ Registered' : ''}</option>;
            })}
          </select>
          <button onClick={handleRegister} disabled={!selectedEmpId || scanning}
            style={{ width: 120, height: 120, background: scanning ? 'rgba(139,92,246,0.08)' : selectedEmpId ? '#eff6ff' : '#f8fafc', ...fpBtnStyle(scanning) }}>
            <Fingerprint size={52} color={scanning ? '#8b5cf6' : selectedEmpId ? '#3b82f6' : '#cbd5e1'} strokeWidth={1.2} />
          </button>
          <p style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>
            {scanning ? '⏳ Place finger on sensor...' : 'Tap to register fingerprint'}
          </p>
          {msg && (
            <div style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: 'center', width: '100%', background: scanStatus === 'success' ? '#d1fae5' : '#fee2e2', color: scanStatus === 'success' ? '#065f46' : '#991b1b' }}>{msg}</div>
          )}
          {/* Registered list */}
          {registered.length > 0 && (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Registered ({registered.length})</p>
              {registered.map(r => (
                <div key={r.credentialId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15 }}>
                      {r.employeeName.charAt(0)}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14, margin: 0 }}>{r.employeeName}</p>
                      <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>{r.employeeDepartment}</p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge badge-green" style={{ fontSize: 11 }}>Registered</span>
                    <button onClick={() => deleteRegistered(r)} style={{ background: 'rgba(239,68,68,0.08)', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#ef4444', padding: '4px 8px', fontSize: 11, fontWeight: 600 }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════ */

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(99,130,246,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: 12 }}>
      <p style={{ color: '#e2e8f0', fontWeight: 700, margin: '0 0 6px' }}>Day {label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.fill, margin: '2px 0' }}>{p.name}: {p.value}</p>)}
    </div>
  );
}

export default function Attendance() {
  const { attendanceRecords, setAttendanceRecords, employees } = useApp();
  const [mainTab, setMainTab] = useState<'records' | 'biometric'>('records');
  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const hasFetched = useRef<Record<string, boolean>>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

  const fetchAttendance = useCallback(async (date: string) => {
    if (hasFetched.current[date]) return;
    hasFetched.current[date] = true;
    setLoading(true);
    try {
      const data = await api.get<AttendanceRecord[]>(`/attendance?date=${date}`);
      if (data && data.length) setAttendanceRecords(data);
    } catch { /* use context data */ }
    finally { setLoading(false); }
  }, [setAttendanceRecords]);

  useEffect(() => { fetchAttendance(selectedDate); }, [selectedDate, fetchAttendance]);

  const stats = {
    present: attendanceRecords.filter(r => r.status === 'Present').length,
    absent:  attendanceRecords.filter(r => r.status === 'Absent').length,
    wfh:     attendanceRecords.filter(r => r.status === 'Work From Home').length,
    halfDay: attendanceRecords.filter(r => r.status === 'Half Day').length,
    total:   attendanceRecords.length,
  };

  const attendanceRate = stats.total > 0 ? Math.round(((stats.present + stats.wfh) / stats.total) * 100) : 0;
  const totalHours  = attendanceRecords.reduce((s, r) => s + (r.workHours || 0), 0);
  const workedCount = attendanceRecords.filter(r => r.workHours > 0).length;
  const avgHours    = workedCount > 0 ? totalHours / workedCount : 0;

  const filtered = attendanceRecords.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.employeeName.toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const updateStatus = async (id: string, status: AttendanceStatus) => {
    setEditingId(null);
    try { await api.put<AttendanceRecord>(`/attendance/${id}`, { status }); }
    catch { setToast('API error — status updated locally.'); }
    setAttendanceRecords(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };

  const exportCSV = () => {
    const csv = [['Name','Date','Check In','Check Out','Work Hours','Status'],
      ...filtered.map(r => [r.employeeName, r.date, r.checkIn, r.checkOut, r.workHours, r.status])]
      .map(row => row.join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `attendance-${selectedDate}.csv`; a.click();
  };

  const now = new Date(selectedDate);
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const monthlyData: DayAttendanceStat[] = Array.from({ length: daysInMonth }, (_, i) => ({
    day: i + 1,
    present: Math.floor(Math.random() * 6) + 10,
    absent:  Math.floor(Math.random() * 4) + 1,
    wfh:     Math.floor(Math.random() * 4) + 2,
    halfDay: Math.floor(Math.random() * 3),
  }));

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* ── Page Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text-primary)', margin: 0, letterSpacing: '-0.5px' }}>
            Attendance Management
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>Track daily attendance and work hours</p>
        </div>
        {mainTab === 'records' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ position: 'relative' }}>
              <Calendar size={15} color="#64748b" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              <input ref={dateInputRef} type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
                className="input" style={{ paddingLeft: 36, minWidth: 160 }} />
            </div>
            <button onClick={exportCSV} className="btn btn-ghost">
              <Download size={15} /> Export CSV
            </button>
          </div>
        )}
      </div>

      {/* ── Main Tabs: Records | Fingerprint ── */}
      <div className="tab-bar" style={{ width: 'fit-content' }}>
        <button className={`tab-item ${mainTab === 'records' ? 'active' : ''}`} onClick={() => setMainTab('records')}>
          📋 Attendance Records
        </button>
        <button className={`tab-item ${mainTab === 'biometric' ? 'active' : ''}`} onClick={() => setMainTab('biometric')}
          style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Fingerprint size={15} style={{ display: 'inline' }} /> Fingerprint
        </button>
      </div>

      {/* ── Fingerprint Tab ── */}
      {mainTab === 'biometric' && <BiometricTab employees={employees} />}

      {mainTab === 'records' && <>
      {/* ── KPI Stat Cards ── */}
      <div className="stat-grid-auto">
        {[
          { label: 'Present',  value: stats.present,  pct: stats.total ? Math.round((stats.present/stats.total)*100)  : 0, icon: CheckCircle, cls: 'stat-green',  iconCls: 'icon-green' },
          { label: 'Absent',   value: stats.absent,   pct: stats.total ? Math.round((stats.absent/stats.total)*100)   : 0, icon: XCircle,     cls: 'stat-orange', iconCls: 'icon-orange' },
          { label: 'WFH',      value: stats.wfh,      pct: stats.total ? Math.round((stats.wfh/stats.total)*100)      : 0, icon: Home,        cls: 'stat-blue',   iconCls: 'icon-blue' },
          { label: 'Half Day', value: stats.halfDay,  pct: stats.total ? Math.round((stats.halfDay/stats.total)*100)  : 0, icon: MinusCircle, cls: 'stat-purple', iconCls: 'icon-purple' },
        ].map(({ label, value, pct, icon: Icon, cls, iconCls }) => (
          <div key={label} className={`stat-card ${cls}`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
              <div className={`icon-box ${iconCls}`}><Icon size={20} /></div>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#64748b', background: '#f1f5f9', padding: '3px 8px', borderRadius: 8 }}>{pct}%</span>
            </div>
            <p style={{ fontSize: 32, fontWeight: 900, color: 'var(--text-primary)', margin: 0, letterSpacing: '-1px' }}>{value}</p>
            <p style={{ fontSize: 13, color: '#64748b', margin: '6px 0 0', fontWeight: 600 }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── Attendance Rate Banner ── */}
      <div className="glass-card" style={{ display: 'flex', flexWrap: 'wrap', gap: 28, alignItems: 'center' }}>
        <div style={{ flex: '1 1 220px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ color: '#64748b', fontSize: 13, fontWeight: 600 }}>Overall Attendance Rate</span>
            <span style={{ color: attendanceRate >= 80 ? '#10b981' : attendanceRate >= 60 ? '#f59e0b' : '#ef4444', fontWeight: 800, fontSize: 15 }}>{attendanceRate}%</span>
          </div>
          <div className="progress-bar" style={{ height: 10 }}>
            <div className="progress-fill" style={{
              width: `${attendanceRate}%`,
              background: attendanceRate >= 80 ? 'linear-gradient(90deg,#10b981,#34d399)' : attendanceRate >= 60 ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#ef4444,#f87171)',
            }} />
          </div>
        </div>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
          {[
            { label: 'Avg Hours', value: `${avgHours.toFixed(1)}h`, icon: Clock },
            { label: 'Total Hours', value: `${Math.round(totalHours)}h`, icon: TrendingUp },
            { label: 'Overtime', value: `${attendanceRecords.filter(r => r.workHours > 9).length} emp`, icon: TrendingUp },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 4 }}>
                <Icon size={13} color="#94a3b8" />
                <span style={{ color: '#94a3b8', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
              </div>
              <p style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Filter Row ── */}
      <div className="glass-card" style={{ padding: '14px 20px', display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
        <div className="search-box" style={{ flex: '1 1 200px', minWidth: 180, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Search size={15} color="#94a3b8" />
          <input className="input" style={{ border: 'none', background: 'transparent', flex: 1, padding: '0 4px' }}
            placeholder="Search employee..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {FILTER_OPTIONS.map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} style={{
              padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.15s',
              background: statusFilter === s ? 'linear-gradient(135deg,#2563eb,#4f46e5)' : 'rgba(37,99,235,0.06)',
              color: statusFilter === s ? '#fff' : '#64748b',
              boxShadow: statusFilter === s ? '0 4px 12px rgba(37,99,235,0.3)' : 'none',
            }}>{s}</button>
          ))}
        </div>
        <span style={{ color: '#94a3b8', fontSize: 13, marginLeft: 'auto', fontWeight: 600 }}>{filtered.length} records</span>
      </div>

      {/* ── Table ── */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="premium-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                {['Employee', 'Check In', 'Check Out', 'Work Hours', 'Status', 'Location', 'Action'].map(h => (
                  <th key={h} style={{ padding: '14px 18px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid rgba(226,232,240,0.8)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({ length: 6 }).map((_, i) => <SkeletonRow key={i} />)
                : filtered.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '60px 0' }}>
                        <Clock size={40} style={{ margin: '0 auto 12px', display: 'block', color: '#cbd5e1' }} />
                        <p style={{ color: '#94a3b8', fontSize: 14, margin: 0 }}>No attendance records for this date</p>
                        <p style={{ color: '#cbd5e1', fontSize: 12, marginTop: 4 }}>Add records via the backend or Google Sheets</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((record, idx) => {
                    const cfg = STATUS_CONFIG[record.status];
                    const avatarColor = record.status === 'Present' ? '#10b981' : record.status === 'Absent' ? '#ef4444' : record.status === 'Work From Home' ? '#3b82f6' : '#f59e0b';
                    const location = record.status === 'Work From Home' ? 'Remote' : record.status === 'Present' ? 'Office' : record.status === 'Half Day' ? 'Office' : '—';
                    const isEditing = editingId === record.id;
                    return (
                      <tr key={record.id} style={{ borderBottom: '1px solid rgba(226,232,240,0.5)' }}>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: avatarColor, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12, flexShrink: 0, boxShadow: `0 4px 10px ${avatarColor}44` }}>
                              {record.employeeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                            <div>
                              <p style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 14, margin: 0 }}>{record.employeeName}</p>
                              {(record as any).department && <p style={{ color: '#94a3b8', fontSize: 12, margin: '2px 0 0' }}>{(record as any).department}</p>}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: record.checkIn ? '#10b981' : '#cbd5e1', fontSize: 13, fontWeight: record.checkIn ? 700 : 400 }}>{record.checkIn || '—'}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: record.checkOut ? 'var(--text-primary)' : '#cbd5e1', fontSize: 13, fontWeight: record.checkOut ? 600 : 400 }}>{record.checkOut || (record.status === 'Present' ? '🟢 Active' : '—')}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ flex: 1, maxWidth: 70 }}>
                              <div className="progress-bar" style={{ height: 6 }}>
                                <div className="progress-fill" style={{ width: `${Math.min(100, (record.workHours / 10) * 100)}%`, background: `linear-gradient(90deg,${workHoursColor(record.workHours)},${workHoursColor(record.workHours)}aa)` }} />
                              </div>
                            </div>
                            <span style={{ color: workHoursColor(record.workHours), fontSize: 12, fontWeight: 700, minWidth: 36 }}>{formatHours(record.workHours)}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {isEditing
                            ? <StatusEditor current={record.status} onSave={s => updateStatus(record.id, s)} onCancel={() => setEditingId(null)} />
                            : <span className={`badge ${cfg.badge}`}>{record.status}</span>}
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ color: '#94a3b8', fontSize: 12, fontWeight: 600 }}>{location}</span>
                        </td>
                        <td style={{ padding: '14px 18px' }}>
                          {!isEditing && (
                            <button onClick={() => setEditingId(record.id)} style={{ background: 'rgba(37,99,235,0.08)', border: 'none', borderRadius: 8, padding: 7, cursor: 'pointer', color: '#2563eb', display: 'flex' }}>
                              <Edit2 size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Monthly Chart ── */}
      <div className="glass-card">
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>Monthly Attendance Summary</h3>
          <p style={{ color: '#64748b', fontSize: 13, margin: '4px 0 0' }}>{now.toLocaleString('en-IN', { month: 'long', year: 'numeric' })} — daily breakdown</p>
        </div>
        <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap' }}>
          {[{ color: '#10b981', label: 'Present' }, { color: '#ef4444', label: 'Absent' }, { color: '#3b82f6', label: 'WFH' }, { color: '#f59e0b', label: 'Half Day' }].map(l => (
            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />
              <span style={{ color: '#64748b', fontSize: 12, fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} barSize={5} barGap={1}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(226,232,240,0.8)" vertical={false} />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} interval={1} />
            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="present" fill="#10b981" radius={[3,3,0,0]} name="Present" />
            <Bar dataKey="absent"  fill="#ef4444" radius={[3,3,0,0]} name="Absent" />
            <Bar dataKey="wfh"     fill="#3b82f6" radius={[3,3,0,0]} name="WFH" />
            <Bar dataKey="halfDay" fill="#f59e0b" radius={[3,3,0,0]} name="Half Day" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}

      <button className="fab mobile-only" aria-label="Mark Attendance" onClick={() => { dateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); dateInputRef.current?.focus(); }}>
        <Plus size={22} color="#fff" />
      </button>
      </>}

      <style>{`
        @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
        .premium-table tbody tr:hover td { background: rgba(37,99,235,0.03); }
        @keyframes biometricPulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.25),0 0 0 0 rgba(139,92,246,0.1); }
          50% { box-shadow: 0 0 0 14px rgba(139,92,246,0.1),0 0 0 28px rgba(139,92,246,0.04); }
        }
      `}</style>
    </div>
  );
}
