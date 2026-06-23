import { useState, useEffect, useRef } from 'react';
import {
  Plus, Check, X, Calendar, ChevronLeft, ChevronRight,
  Briefcase, Heart, Plane, Baby, Clock, AlertTriangle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../api/client';
import type { LeaveRequest, LeaveType, LeaveStatus } from '../types';

/* ─── types ─────────────────────────────────────────────── */
type ActiveTab = 'requests' | 'balance' | 'calendar';

/* ─── constants ──────────────────────────────────────────── */
const LEAVE_TYPE_BADGE: Record<LeaveType, string> = {
  Casual: 'badge-blue', Sick: 'badge-red', Annual: 'badge-green',
  Maternity: 'badge-purple', Paternity: 'badge-blue', Unpaid: 'badge-gray',
};

const STATUS_BADGE: Record<LeaveStatus, string> = {
  Pending: 'badge-yellow', Approved: 'badge-green', Rejected: 'badge-red',
};

const LEAVE_TYPE_ICONS: Record<LeaveType, React.ElementType> = {
  Casual: Briefcase, Sick: Heart, Annual: Plane,
  Maternity: Baby, Paternity: Baby, Unpaid: Clock,
};

const LEAVE_TYPE_COLORS: Record<LeaveType, string> = {
  Casual: '#3b82f6', Sick: '#ef4444', Annual: '#10b981',
  Maternity: '#8b5cf6', Paternity: '#8b5cf6', Unpaid: '#64748b',
};

const LEAVE_BALANCE_CONFIG = [
  { type: 'Casual Leave', leaveType: 'Casual' as LeaveType, total: 10, icon: Briefcase, color: '#3b82f6', iconCls: 'icon-blue' },
  { type: 'Sick Leave', leaveType: 'Sick' as LeaveType, total: 12, icon: Heart, color: '#ef4444', iconCls: 'icon-orange' },
  { type: 'Annual Leave', leaveType: 'Annual' as LeaveType, total: 21, icon: Plane, color: '#10b981', iconCls: 'icon-green' },
  { type: 'Maternity / Paternity', leaveType: 'Maternity' as LeaveType, total: 90, icon: Baby, color: '#8b5cf6', iconCls: 'icon-purple' },
];

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/* ─── helpers ────────────────────────────────────────────── */
function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function daysInRange(start: string, end: string): string[] {
  const result: string[] = [];
  const s = new Date(start), e = new Date(end);
  const cur = new Date(s);
  while (cur <= e) {
    result.push(isoDate(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/* ─── toast ──────────────────────────────────────────────── */
function Toast({ msg, type, onClose }: { msg: string; type: 'error' | 'success'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  const bg = type === 'success' ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)';
  return (
    <div className="fade-up" style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      background: bg, backdropFilter: 'blur(10px)',
      color: '#fff', padding: '12px 20px', borderRadius: 12,
      boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
      display: 'flex', alignItems: 'center', gap: 10, maxWidth: 360, fontSize: 14,
    }}>
      <span style={{ flex: 1 }}>{msg}</span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}><X size={16} /></button>
    </div>
  );
}

/* ─── new leave request modal ────────────────────────────── */
function NewLeaveModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (req: Omit<LeaveRequest, 'id'>) => Promise<void>;
}) {
  const { employees } = useApp();
  const [form, setForm] = useState({
    employeeId: employees[0]?.id || '',
    leaveType: 'Casual' as LeaveType,
    startDate: '',
    endDate: '',
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === form.employeeId);
    if (!emp) return;
    const start = new Date(form.startDate);
    const end   = new Date(form.endDate);
    const days  = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
    setSubmitting(true);
    try {
      await onSubmit({
        employeeId: form.employeeId,
        employeeName: emp.name,
        department: emp.department,
        leaveType: form.leaveType,
        startDate: form.startDate,
        endDate: form.endDate,
        days,
        reason: form.reason,
        status: 'Pending',
        appliedOn: isoDate(new Date()),
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 500 }}>
      <div className="modal-box" style={{ width: '100%', maxWidth: 520 }}>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <h2 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18, margin: 0 }}>New Leave Request</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label className="form-label">Employee *</label>
            <select
              className="input"
              value={form.employeeId}
              onChange={e => setForm(f => ({ ...f, employeeId: e.target.value }))}
            >
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>{emp.name} — {emp.department}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label">Leave Type *</label>
            <select
              className="input"
              value={form.leaveType}
              onChange={e => setForm(f => ({ ...f, leaveType: e.target.value as LeaveType }))}
            >
              {(['Casual', 'Sick', 'Annual', 'Maternity', 'Paternity', 'Unpaid'] as LeaveType[]).map(t => (
                <option key={t} value={t}>{t} Leave</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
            <div>
              <label className="form-label">Start Date *</label>
              <input
                className="input"
                type="date"
                required
                value={form.startDate}
                onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">End Date *</label>
              <input
                className="input"
                type="date"
                required
                value={form.endDate}
                min={form.startDate}
                onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))}
              />
            </div>
          </div>

          {form.startDate && form.endDate && (
            <div style={{
              background: 'rgba(59,130,246,0.1)', borderRadius: 10, padding: '10px 14px',
              display: 'flex', alignItems: 'center', gap: 8,
            }}>
              <Calendar size={14} color="#3b82f6" />
              <span style={{ color: '#93c5fd', fontSize: 13 }}>
                {Math.max(1, Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / (1000 * 3600 * 24)) + 1)} day(s) of leave
              </span>
            </div>
          )}

          <div>
            <label className="form-label">Reason *</label>
            <textarea
              className="input"
              required
              rows={3}
              placeholder="Please provide a reason for your leave request..."
              value={form.reason}
              onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
              style={{ resize: 'vertical', minHeight: 80 }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 4 }}>
            <button type="button" onClick={onClose} className="btn btn-ghost">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── leave request card ─────────────────────────────────── */
function LeaveCard({ leave, onApprove, onReject }: {
  leave: LeaveRequest;
  onApprove: () => void;
  onReject: () => void;
}) {
  const LeaveIcon = LEAVE_TYPE_ICONS[leave.leaveType] || Briefcase;
  const typeColor = LEAVE_TYPE_COLORS[leave.leaveType] || '#3b82f6';

  return (
    <div className="glass-card touch-card fade-up" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* top row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12,
            background: `linear-gradient(135deg,${typeColor}33,${typeColor}22)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 14, flexShrink: 0,
            border: `1px solid ${typeColor}44`,
          }}>
            {initials(leave.employeeName)}
          </div>
          <div>
            <p style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>{leave.employeeName}</p>
            <p style={{ color: '#64748b', fontSize: 12, margin: '3px 0 0' }}>{leave.department}</p>
          </div>
        </div>
        <span className={`badge ${STATUS_BADGE[leave.status]}`}>{leave.status}</span>
      </div>

      {/* leave type + dates */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <span className={`badge ${LEAVE_TYPE_BADGE[leave.leaveType]}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <LeaveIcon size={11} />
          {leave.leaveType} Leave
        </span>
        <span className="badge badge-gray">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
      </div>

      {/* date range */}
      <div style={{
        background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px',
        display: 'flex', alignItems: 'center', gap: 8,
      }}>
        <Calendar size={14} color={typeColor} />
        <span style={{ color: '#94a3b8', fontSize: 13 }}>
          {new Date(leave.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          {' → '}
          {new Date(leave.endDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* reason */}
      <p style={{
        color: '#94a3b8', fontSize: 13, fontStyle: 'italic', margin: 0,
        overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical' as any,
        lineHeight: 1.5,
      }}>
        "{leave.reason}"
      </p>

      {/* footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ color: '#475569', fontSize: 12, margin: 0 }}>
          Applied: {new Date(leave.appliedOn).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
          {leave.approvedBy ? ` · ${leave.status === 'Approved' ? 'Approved' : 'Rejected'} by ${leave.approvedBy}` : ''}
        </p>

        {leave.status === 'Pending' && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onApprove}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(16,185,129,0.15)', color: '#10b981',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              <Check size={13} /> Approve
            </button>
            <button
              onClick={onReject}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'rgba(239,68,68,0.15)', color: '#ef4444',
                fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
              }}
            >
              <X size={13} /> Reject
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── balance tab ────────────────────────────────────────── */
function BalanceTab({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {LEAVE_BALANCE_CONFIG.map(({ type, leaveType, total, icon: Icon, color, iconCls }) => {
          const used = leaveRequests.filter(
            r => r.leaveType === leaveType && r.status === 'Approved'
          ).reduce((s, r) => s + r.days, 0);
          const remaining = Math.max(0, total - used);
          const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;

          return (
            <div key={type} className="glass-card" style={{ padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <div className={`icon-box ${iconCls}`} style={{ marginBottom: 10 }}>
                    <Icon size={20} />
                  </div>
                  <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>{type}</h3>
                  <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>{total} days allocated</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ color, fontWeight: 800, fontSize: 28, margin: 0, lineHeight: 1 }}>{remaining}</p>
                  <p style={{ color: '#64748b', fontSize: 12, margin: '4px 0 0' }}>days left</p>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ color: '#64748b', fontSize: 12 }}>Usage</span>
                  <span style={{ color, fontSize: 12, fontWeight: 600 }}>{pct}%</span>
                </div>
                <div className="progress-bar" style={{ height: 8 }}>
                  <div
                    className="progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: `linear-gradient(90deg,${color},${color}88)`,
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total', value: total, c: '#e2e8f0' },
                  { label: 'Used', value: used, c: '#ef4444' },
                  { label: 'Left', value: remaining, c: '#10b981' },
                ].map(({ label, value, c }) => (
                  <div key={label} style={{
                    background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 8px', textAlign: 'center',
                  }}>
                    <p style={{ color: c, fontWeight: 700, fontSize: 20, margin: 0 }}>{value}</p>
                    <p style={{ color: '#64748b', fontSize: 11, margin: '3px 0 0' }}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* policy card */}
      <div className="glass-card" style={{ padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div className="icon-box icon-blue"><AlertTriangle size={18} /></div>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 16, margin: 0 }}>Leave Policy Summary</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {[
            { rule: 'Advance Notice', detail: 'Minimum 2 days advance notice required for planned leaves' },
            { rule: 'Sick Leave Documentation', detail: 'Medical certificate required for more than 2 consecutive sick days' },
            { rule: 'Carry Forward Policy', detail: 'Up to 5 casual leave days can be carried forward to the next year' },
            { rule: 'Weekend Counting', detail: 'Weekends and public holidays within leave period are NOT counted' },
            { rule: 'Half-Day Policy', detail: 'Half-day leaves must be applied before 10:00 AM on the same day' },
            { rule: 'Leave Encashment', detail: 'Annual leave balance can be encashed at year-end (max 10 days)' },
          ].map(({ rule, detail }) => (
            <div key={rule} style={{
              background: 'rgba(59,130,246,0.07)', borderRadius: 12, padding: '12px 14px',
              border: '1px solid rgba(59,130,246,0.15)',
            }}>
              <p style={{ color: '#93c5fd', fontWeight: 600, fontSize: 12, margin: '0 0 4px' }}>{rule}</p>
              <p style={{ color: '#64748b', fontSize: 12, margin: 0, lineHeight: 1.5 }}>{detail}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── calendar tab ───────────────────────────────────────── */
function CalendarTab({ leaveRequests }: { leaveRequests: LeaveRequest[] }) {
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const year  = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay  = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  const nextMonth = () => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));

  /* build a map: date string -> leaves on that day */
  const leaveMap: Record<string, LeaveRequest[]> = {};
  leaveRequests.forEach(lr => {
    if (lr.status === 'Rejected') return;
    daysInRange(lr.startDate, lr.endDate).forEach(d => {
      const dy = d.slice(0, 7); // YYYY-MM
      const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;
      if (dy === monthStr) {
        if (!leaveMap[d]) leaveMap[d] = [];
        leaveMap[d].push(lr);
      }
    });
  });

  const selectedLeaves = selectedDay ? (leaveMap[selectedDay] || []) : [];

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* navigation */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.04)', borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px',
      }}>
        <button onClick={prevMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 18, margin: 0 }}>
            {viewDate.toLocaleString('en-IN', { month: 'long', year: 'numeric' })}
          </h3>
          <p style={{ color: '#64748b', fontSize: 12, margin: '3px 0 0' }}>
            {Object.values(leaveMap).flat().length} leaves this month
          </p>
        </div>
        <button onClick={nextMonth} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 8, padding: 8, cursor: 'pointer', color: '#94a3b8', display: 'flex' }}>
          <ChevronRight size={18} />
        </button>
      </div>

      {/* calendar grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        {/* day names header */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', marginBottom: 8 }}>
          {DAY_NAMES.map(d => (
            <div key={d} style={{
              textAlign: 'center', padding: '8px 0',
              color: d === 'Sun' || d === 'Sat' ? '#64748b' : '#94a3b8',
              fontSize: 12, fontWeight: 700,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* day cells */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 4 }}>
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const dayLeaves = leaveMap[dateStr] || [];
            const isToday = dateStr === isoDate(new Date());
            const isSelected = selectedDay === dateStr;
            const isWeekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6;

            return (
              <button
                key={day}
                onClick={() => setSelectedDay(isSelected ? null : dateStr)}
                style={{
                  aspectRatio: '1',
                  minHeight: 52,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  paddingTop: 6,
                  gap: 3,
                  borderRadius: 10,
                  border: isSelected
                    ? '2px solid #3b82f6'
                    : isToday
                      ? '2px solid rgba(59,130,246,0.4)'
                      : '2px solid transparent',
                  background: isSelected
                    ? 'rgba(59,130,246,0.2)'
                    : isToday
                      ? 'rgba(59,130,246,0.08)'
                      : dayLeaves.length > 0
                        ? 'rgba(255,255,255,0.04)'
                        : 'transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{
                  fontSize: 13, fontWeight: isToday ? 800 : 500,
                  color: isToday ? '#3b82f6' : isWeekend ? '#64748b' : '#e2e8f0',
                }}>
                  {day}
                </span>
                {/* leave dots */}
                {dayLeaves.length > 0 && (
                  <div style={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 32 }}>
                    {dayLeaves.slice(0, 3).map((l, i) => (
                      <div key={i} style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: LEAVE_TYPE_COLORS[l.leaveType] || '#3b82f6',
                      }} />
                    ))}
                    {dayLeaves.length > 3 && (
                      <div style={{ fontSize: 8, color: '#64748b', lineHeight: '5px' }}>+{dayLeaves.length - 3}</div>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* selected day leaves */}
      {selectedDay && (
        <div className="glass-card fade-up" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h4 style={{ color: '#f1f5f9', fontWeight: 700, fontSize: 15, margin: 0 }}>
              Leaves on {new Date(selectedDay).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </h4>
            <button onClick={() => setSelectedDay(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#94a3b8' }}>
              <X size={14} />
            </button>
          </div>
          {selectedLeaves.length === 0 ? (
            <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>No leaves scheduled for this day.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {selectedLeaves.map(l => {
                const LeaveIcon = LEAVE_TYPE_ICONS[l.leaveType];
                return (
                  <div key={l.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '10px 14px',
                  }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                      background: `${LEAVE_TYPE_COLORS[l.leaveType]}22`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: LEAVE_TYPE_COLORS[l.leaveType],
                    }}>
                      <LeaveIcon size={15} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ color: '#e2e8f0', fontWeight: 600, fontSize: 14, margin: 0 }}>{l.employeeName}</p>
                      <p style={{ color: '#64748b', fontSize: 12, margin: '2px 0 0' }}>{l.department} · {l.leaveType} Leave · {l.days} day(s)</p>
                    </div>
                    <span className={`badge ${STATUS_BADGE[l.status]}`}>{l.status}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* legend */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {Object.entries(LEAVE_TYPE_COLORS).map(([type, color]) => (
          <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
            <span style={{ color: '#64748b', fontSize: 12 }}>{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── main page ──────────────────────────────────────────── */
export default function LeaveManagement() {
  const { leaveRequests, setLeaveRequests, employees } = useApp();
  const [activeTab, setActiveTab] = useState<ActiveTab>('requests');
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');
  const [leaveTypeFilter, setLeaveTypeFilter] = useState('All');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const hasFetched = useRef(false);

  /* fetch on mount */
  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;
    api.get<LeaveRequest[]>('/leave')
      .then(data => { if (data && data.length) setLeaveRequests(data); })
      .catch(() => {});
  }, [setLeaveRequests]);

  /* stats */
  const now = new Date();
  const thisMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const stats = {
    pending:   leaveRequests.filter(r => r.status === 'Pending').length,
    approved:  leaveRequests.filter(r => r.status === 'Approved').length,
    rejected:  leaveRequests.filter(r => r.status === 'Rejected').length,
    thisMonth: leaveRequests.filter(r => r.appliedOn.startsWith(thisMonth)).length,
  };

  /* filtered requests */
  const filtered = leaveRequests.filter(r => {
    const matchStatus = statusFilter === 'All' || r.status === statusFilter;
    const matchType = leaveTypeFilter === 'All' || r.leaveType === leaveTypeFilter;
    return matchStatus && matchType;
  });

  /* update leave status */
  const updateLeaveStatus = async (id: string, status: 'Approved' | 'Rejected') => {
    try {
      await api.put<LeaveRequest>(`/leave/${id}`, { status });
      setToast({ msg: `Leave request ${status.toLowerCase()} successfully.`, type: 'success' });
    } catch {
      setToast({ msg: 'API error — status updated locally.', type: 'error' });
    }
    setLeaveRequests(prev => prev.map(r =>
      r.id === id ? { ...r, status, approvedBy: 'Harsh Daharwal' } : r
    ));
  };

  /* new leave */
  const handleNewLeave = async (data: Omit<LeaveRequest, 'id'>) => {
    let created: LeaveRequest | null = null;
    try {
      created = await api.post<LeaveRequest>('/leave', data);
      setToast({ msg: 'Leave request submitted successfully.', type: 'success' });
    } catch {
      setToast({ msg: 'API error — request added locally.', type: 'error' });
    }
    const newReq: LeaveRequest = created || { ...data, id: `L${Date.now()}` };
    setLeaveRequests(prev => [newReq, ...prev]);
  };

  const TABS: { key: ActiveTab; label: string }[] = [
    { key: 'requests', label: 'Leave Requests' },
    { key: 'balance',  label: 'Leave Balance' },
    { key: 'calendar', label: 'Calendar' },
  ];

  const leaveTypes: string[] = ['All', ...Array.from(new Set(leaveRequests.map(r => r.leaveType)))];

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* ── header ── */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Leave Management</h1>
          <p className="page-subtitle">
            <span className="badge badge-yellow" style={{ marginRight: 8 }}>{stats.pending} Pending</span>
            Manage leave requests and balances
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn btn-primary">
          <Plus size={16} /> New Leave Request
        </button>
      </div>

      {/* ── stats ── */}
      <div className="stat-grid-auto" style={{ gap: 16 }}>
        {[
          { label: 'Pending', value: stats.pending, cls: 'stat-orange', iconCls: 'icon-orange', icon: Clock },
          { label: 'Approved', value: stats.approved, cls: 'stat-green', iconCls: 'icon-green', icon: Check },
          { label: 'Rejected', value: stats.rejected, cls: 'stat-orange', iconCls: 'icon-orange', icon: X },
          { label: 'This Month', value: stats.thisMonth, cls: 'stat-blue', iconCls: 'icon-blue', icon: Calendar },
        ].map(({ label, value, cls, iconCls, icon: Icon }) => (
          <div key={label} className={`stat-card ${cls} fade-up`}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
              <div className={`icon-box ${iconCls}`}><Icon size={18} /></div>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: '#f1f5f9', margin: 0 }}>{value}</p>
            <p style={{ fontSize: 13, color: '#94a3b8', margin: '4px 0 0' }}>{label}</p>
          </div>
        ))}
      </div>

      {/* ── tabs ── */}
      <div className="tab-bar">
        {TABS.map(t => (
          <button
            key={t.key}
            className={`tab-item ${activeTab === t.key ? 'active' : ''}`}
            onClick={() => setActiveTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── tab content ── */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* filter row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
            background: 'rgba(255,255,255,0.04)', borderRadius: 16,
            border: '1px solid rgba(255,255,255,0.08)', padding: '14px 18px',
          }}>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {['All', 'Pending', 'Approved', 'Rejected'].map(s => (
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

            <div style={{ position: 'relative', marginLeft: 'auto' }}>
              <select
                value={leaveTypeFilter}
                onChange={e => setLeaveTypeFilter(e.target.value)}
                className="input"
                style={{ paddingRight: 32, appearance: 'none', minWidth: 140 }}
              >
                {leaveTypes.map(t => (
                  <option key={t} value={t}>{t === 'All' ? 'All Leave Types' : `${t} Leave`}</option>
                ))}
              </select>
              <ChevronLeft size={14} color="#64748b" style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%) rotate(-90deg)', pointerEvents: 'none' }} />
            </div>

            <span style={{ color: '#64748b', fontSize: 13 }}>{filtered.length} requests</span>
          </div>

          {/* request cards grid */}
          {filtered.length === 0 ? (
            <div className="glass-card" style={{ padding: 60, textAlign: 'center' }}>
              <Calendar size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
              <p style={{ color: '#475569', fontSize: 14, margin: 0 }}>No leave requests found</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(360px, 100%), 1fr))', gap: 16 }}>
              {filtered.map(leave => (
                <LeaveCard
                  key={leave.id}
                  leave={leave}
                  onApprove={() => updateLeaveStatus(leave.id, 'Approved')}
                  onReject={() => updateLeaveStatus(leave.id, 'Rejected')}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'balance' && <BalanceTab leaveRequests={leaveRequests} />}
      {activeTab === 'calendar' && <CalendarTab leaveRequests={leaveRequests} />}

      {/* ── modals ── */}
      {showModal && (
        <NewLeaveModal
          onClose={() => setShowModal(false)}
          onSubmit={handleNewLeave}
        />
      )}

      {toast && <Toast msg={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── FAB: mobile-only Apply Leave ── */}
      <button
        className="fab mobile-only"
        onClick={() => setShowModal(true)}
        aria-label="Apply Leave"
      >
        <Plus size={22} color="#fff" />
      </button>
    </div>
  );
}
