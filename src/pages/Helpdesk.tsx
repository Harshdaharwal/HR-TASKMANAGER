import { useState, useEffect } from 'react';
import {
  Ticket, Clock, CheckCircle2, AlertTriangle, Plus, Search, X,
  Loader2, User, Tag, Calendar, ChevronDown, CircleDot, Zap
} from 'lucide-react';
import { api } from '../api/client';

type TicketCategory = 'HR' | 'IT' | 'Finance' | 'Admin';
type TicketPriority = 'Critical' | 'High' | 'Medium' | 'Low';
type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed';

interface HelpTicket {
  id: string;
  ticketNo: string;
  category: TicketCategory;
  subject: string;
  description: string;
  reporter: string;
  reporterName: string;
  assignedTo: string;
  priority: TicketPriority;
  status: TicketStatus;
  createdAt: string;
  slaDeadline: string;
  overdue: boolean;
}

const CAT_COLORS: Record<TicketCategory, string> = {
  HR: 'badge-purple', IT: 'badge-blue', Finance: 'badge-green', Admin: 'badge-orange',
};

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  Critical: 'badge-red', High: 'badge-orange', Medium: 'badge-yellow', Low: 'badge-gray',
};

const STATUS_COLORS: Record<TicketStatus, string> = {
  Open: 'badge-blue', 'In Progress': 'badge-purple', Resolved: 'badge-green', Closed: 'badge-gray',
};

const STATUS_ICONS: Record<TicketStatus, React.ElementType> = {
  Open: CircleDot, 'In Progress': Clock, Resolved: CheckCircle2, Closed: X,
};

const MOCK_TICKETS: HelpTicket[] = [
  { id: '1', ticketNo: 'TKT-001', category: 'IT', subject: 'Laptop screen flickering intermittently', description: 'My Dell laptop screen has been flickering for the past 2 days making it hard to work. Tried restarting but issue persists.', reporter: 'EMP001', reporterName: 'Rahul Sharma', assignedTo: 'IT Support Team', priority: 'High', status: 'In Progress', createdAt: '2026-06-18', slaDeadline: '2026-06-20', overdue: false },
  { id: '2', ticketNo: 'TKT-002', category: 'HR', subject: 'Salary slip for May not received', description: 'I have not received my salary slip for the month of May 2026. Please check and share the document.', reporter: 'EMP002', reporterName: 'Priya Mehta', assignedTo: 'Neha Gupta (HR)', priority: 'Medium', status: 'Open', createdAt: '2026-06-19', slaDeadline: '2026-06-21', overdue: false },
  { id: '3', ticketNo: 'TKT-003', category: 'Finance', subject: 'Expense reimbursement pending for 15 days', description: 'My travel expense claim submitted on June 5th is still pending. Amount: ₹4,500. Kindly expedite.', reporter: 'EMP003', reporterName: 'Ananya Patel', assignedTo: 'Rajesh Kumar (Finance)', priority: 'High', status: 'Open', createdAt: '2026-06-15', slaDeadline: '2026-06-17', overdue: true },
  { id: '4', ticketNo: 'TKT-004', category: 'IT', subject: 'Unable to access Slack workspace', description: 'Getting authentication error when trying to log into company Slack. Error code: OAUTH_ACCESS_DENIED', reporter: 'EMP004', reporterName: 'Kavya Reddy', assignedTo: 'IT Support Team', priority: 'Critical', status: 'In Progress', createdAt: '2026-06-19', slaDeadline: '2026-06-19', overdue: true },
  { id: '5', ticketNo: 'TKT-005', category: 'Admin', subject: 'Request for parking slot allocation', description: 'Requesting a dedicated parking slot in basement B2. I have recently shifted to own vehicle commute.', reporter: 'EMP005', reporterName: 'Amit Singh', assignedTo: 'Admin Team', priority: 'Low', status: 'Resolved', createdAt: '2026-06-14', slaDeadline: '2026-06-16', overdue: false },
  { id: '6', ticketNo: 'TKT-006', category: 'HR', subject: 'Leave policy clarification - WFH during national holiday', description: 'Need clarification on whether working from home on a national holiday counts as comp-off.', reporter: 'EMP006', reporterName: 'Neha Gupta', assignedTo: 'HR Team', priority: 'Low', status: 'Closed', createdAt: '2026-06-12', slaDeadline: '2026-06-14', overdue: false },
  { id: '7', ticketNo: 'TKT-007', category: 'IT', subject: 'VPN connection drops every 30 minutes', description: 'Corporate VPN disconnects automatically every 30 minutes. Need to reconnect repeatedly which disrupts workflow.', reporter: 'EMP001', reporterName: 'Rahul Sharma', assignedTo: 'IT Support Team', priority: 'High', status: 'Open', createdAt: '2026-06-20', slaDeadline: '2026-06-22', overdue: false },
];

const EMPTY_FORM = { category: 'IT' as TicketCategory, subject: '', description: '', priority: 'Medium' as TicketPriority, assignedTo: '' };

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function TicketCard({ ticket, onClick }: { ticket: HelpTicket; onClick: () => void }) {
  const StatusIcon = STATUS_ICONS[ticket.status];
  return (
    <div className="glass-card touch-card cursor-pointer hover:border-blue-500/30 transition-all" onClick={onClick}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-mono text-slate-500">{ticket.ticketNo}</span>
          <span className={`badge ${CAT_COLORS[ticket.category]}`}>{ticket.category}</span>
          <span className={`badge ${PRIORITY_COLORS[ticket.priority]}`}>
            {ticket.priority === 'Critical' && <Zap size={9} />}
            {ticket.priority}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`badge ${STATUS_COLORS[ticket.status]}`}>
            <StatusIcon size={10} /> {ticket.status}
          </span>
          {ticket.overdue && <span className="badge badge-red"><AlertTriangle size={9} /> Overdue</span>}
        </div>
      </div>

      <h3 className="text-white font-semibold text-sm mb-2 leading-snug">{ticket.subject}</h3>
      <p className="text-slate-400 text-xs leading-relaxed mb-4 line-clamp-2">{ticket.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="avatar !w-7 !h-7 text-xs">{initials(ticket.reporterName)}</div>
          <div>
            <p className="text-slate-300 text-xs font-medium">{ticket.reporterName}</p>
            <p className="text-slate-600 text-xs">Reporter</p>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center gap-1 justify-end">
            {ticket.overdue
              ? <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              : <div className="w-2 h-2 rounded-full bg-green-500" />
            }
            <span className="text-xs text-slate-500">SLA: {ticket.slaDeadline}</span>
          </div>
          <p className="text-slate-600 text-xs mt-0.5">→ {ticket.assignedTo}</p>
        </div>
      </div>
    </div>
  );
}

export default function Helpdesk() {
  const [tickets, setTickets] = useState<HelpTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState<'All' | TicketCategory>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | TicketPriority>('All');
  const [showModal, setShowModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<HelpTicket | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchTickets(); }, []);

  async function fetchTickets() {
    setLoading(true);
    try {
      const data = await api.get<HelpTicket[]>('/tickets');
      setTickets(data);
    } catch {
      setTickets(MOCK_TICKETS);
    } finally {
      setLoading(false);
    }
  }

  const filtered = tickets.filter(t => {
    const q = search.toLowerCase();
    const matchSearch = !q || t.subject.toLowerCase().includes(q) || t.reporterName.toLowerCase().includes(q) || t.ticketNo.toLowerCase().includes(q);
    const matchCat = catFilter === 'All' || t.category === catFilter;
    const matchPri = priorityFilter === 'All' || t.priority === priorityFilter;
    return matchSearch && matchCat && matchPri;
  });

  const stats = {
    open: tickets.filter(t => t.status === 'Open').length,
    inProgress: tickets.filter(t => t.status === 'In Progress').length,
    resolved: tickets.filter(t => t.status === 'Resolved').length,
    overdue: tickets.filter(t => t.overdue).length,
  };

  async function handleCreate() {
    if (!form.subject || !form.description) return;
    setSaving(true);
    const newTicket: HelpTicket = {
      id: Date.now().toString(),
      ticketNo: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      category: form.category, subject: form.subject, description: form.description,
      reporter: 'EMP001', reporterName: 'Current User',
      assignedTo: form.assignedTo || `${form.category} Team`,
      priority: form.priority, status: 'Open',
      createdAt: new Date().toISOString().slice(0, 10),
      slaDeadline: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      overdue: false,
    };
    try { await api.post('/tickets', newTicket); } catch {}
    setTickets(prev => [newTicket, ...prev]);
    setSaving(false);
    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  return (
    <div className="space-y-6 fade-up">
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">IT &amp; HR Helpdesk</h1>
          <p className="page-subtitle">Support tickets with SLA tracking across departments</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Create Ticket
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto grid gap-4">
        {[
          { label: 'Open Tickets', value: stats.open, sub: 'Awaiting action', icon: CircleDot, color: 'stat-blue', iconCls: 'icon-blue' },
          { label: 'In Progress', value: stats.inProgress, sub: 'Being worked on', icon: Clock, color: 'stat-purple', iconCls: 'icon-purple' },
          { label: 'Resolved', value: stats.resolved, sub: 'This month', icon: CheckCircle2, color: 'stat-green', iconCls: 'icon-green' },
          { label: 'Overdue (SLA)', value: stats.overdue, sub: 'Breached SLA', icon: AlertTriangle, color: 'stat-orange', iconCls: 'icon-orange' },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card ${s.color} fade-up stagger-${i + 1}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`icon-box ${s.iconCls}`}><s.icon size={20} /></div>
            </div>
            <p className="text-3xl font-bold text-white">{s.value}</p>
            <p className="text-slate-300 text-sm font-semibold mt-1">{s.label}</p>
            <p className="text-slate-500 text-xs">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="glass-card">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="search-box flex-1 min-w-48">
            <Search size={15} className="text-slate-500 shrink-0" />
            <input placeholder="Search tickets, subjects, reporters..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          {/* Category pills */}
          <div className="flex gap-2 flex-wrap">
            {(['All', 'HR', 'IT', 'Finance', 'Admin'] as const).map(c => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${catFilter === c ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-slate-500 border border-white/5 hover:text-slate-300'}`}>
                {c}
              </button>
            ))}
          </div>
          <select className="input w-40" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)}>
            {['All', 'Critical', 'High', 'Medium', 'Low'].map(p => <option key={p} value={p}>{p === 'All' ? 'All Priority' : p}</option>)}
          </select>
        </div>
      </div>

      {/* Ticket Cards Grid */}
      {loading ? (
        <div className="p-12 text-center">
          <Loader2 className="animate-spin text-blue-400 mx-auto mb-3" size={32} />
          <p className="text-slate-500">Loading tickets...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(t => (
            <TicketCard key={t.id} ticket={t} onClick={() => setSelectedTicket(t)} />
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 py-16 text-center text-slate-500">
              <Ticket size={40} className="mx-auto mb-3 opacity-20" />
              <p>No tickets match your filters</p>
            </div>
          )}
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setSelectedTicket(null)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className="text-slate-500 text-xs font-mono">{selectedTicket.ticketNo}</span>
                  <span className={`badge ${CAT_COLORS[selectedTicket.category]}`}>{selectedTicket.category}</span>
                  <span className={`badge ${PRIORITY_COLORS[selectedTicket.priority]}`}>{selectedTicket.priority}</span>
                  <span className={`badge ${STATUS_COLORS[selectedTicket.status]}`}>{selectedTicket.status}</span>
                  {selectedTicket.overdue && <span className="badge badge-red"><AlertTriangle size={9} /> Overdue</span>}
                </div>
                <h2 className="text-lg font-bold text-white">{selectedTicket.subject}</h2>
              </div>
              <button className="btn btn-ghost !p-2" onClick={() => setSelectedTicket(null)}><X size={18} /></button>
            </div>

            <div className="space-y-4">
              <div className="glass-card !p-4">
                <p className="text-slate-300 text-sm leading-relaxed">{selectedTicket.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="glass-card !p-4">
                  <p className="form-label">Reporter</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className="avatar">{initials(selectedTicket.reporterName)}</div>
                    <span className="text-white text-sm">{selectedTicket.reporterName}</span>
                  </div>
                </div>
                <div className="glass-card !p-4">
                  <p className="form-label">Assigned To</p>
                  <p className="text-white text-sm mt-2">{selectedTicket.assignedTo}</p>
                </div>
                <div className="glass-card !p-4">
                  <p className="form-label">Created</p>
                  <p className="text-white text-sm mt-2">{selectedTicket.createdAt}</p>
                </div>
                <div className="glass-card !p-4">
                  <p className="form-label">SLA Deadline</p>
                  <div className="flex items-center gap-2 mt-2">
                    <div className={`w-2 h-2 rounded-full ${selectedTicket.overdue ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`} />
                    <p className={`text-sm font-semibold ${selectedTicket.overdue ? 'text-red-400' : 'text-white'}`}>{selectedTicket.slaDeadline}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <select
                  className="input w-48"
                  value={selectedTicket.status}
                  onChange={e => {
                    const s = e.target.value as TicketStatus;
                    setSelectedTicket(prev => prev ? { ...prev, status: s } : null);
                    setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, status: s } : t));
                  }}
                >
                  {(['Open', 'In Progress', 'Resolved', 'Closed'] as TicketStatus[]).map(s => <option key={s}>{s}</option>)}
                </select>
                <button className="btn btn-primary" onClick={() => setSelectedTicket(null)}>Save &amp; Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff"/></button>

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Create New Ticket</h2>
              <button className="btn btn-ghost !p-2" onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="form-label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as TicketCategory }))}>
                  {(['HR', 'IT', 'Finance', 'Admin'] as TicketCategory[]).map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as TicketPriority }))}>
                  {(['Critical', 'High', 'Medium', 'Low'] as TicketPriority[]).map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="form-label">Subject</label>
                <input className="input" placeholder="Brief description of the issue" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Description</label>
                <textarea className="input" rows={4} placeholder="Detailed description, error messages, steps to reproduce..." value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="col-span-2">
                <label className="form-label">Assignee (optional)</label>
                <input className="input" placeholder="Team or person to assign (default: category team)" value={form.assignedTo} onChange={e => setForm(f => ({ ...f, assignedTo: e.target.value }))} />
              </div>
            </div>
            <div className="flex gap-3 mt-6 justify-end">
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
