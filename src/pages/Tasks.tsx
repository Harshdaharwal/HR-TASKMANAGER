import { useState, useEffect } from 'react'
import {
  CheckSquare, Clock, AlertCircle, TrendingUp, Plus, X,
  Search, Calendar, Edit2, Trash2
} from 'lucide-react'
import { api } from '../api/client'

interface Task {
  id: number
  title: string
  description: string
  assignee: string
  assigneeAvatar: string
  department: string
  priority: 'Critical' | 'High' | 'Medium' | 'Low'
  status: 'To Do' | 'In Progress' | 'Review' | 'Done' | 'Blocked'
  dueDate: string
  createdDate: string
  tags: string[]
  progress: number
}

const BOARD_COLUMNS = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'] as const
const PRIORITIES = ['Critical', 'High', 'Medium', 'Low'] as const
const STATUSES = ['To Do', 'In Progress', 'Review', 'Done', 'Blocked'] as const
const EMPLOYEES = ['Rahul Sharma', 'Priya Patel', 'Amit Kumar', 'Sneha Reddy', 'Vikram Singh', 'Ananya Gupta', 'Rohan Mehta']
const DEPARTMENTS = ['Engineering', 'Design', 'HR', 'Finance', 'Marketing', 'Sales']

const priorityColors: Record<string, string> = {
  Critical: 'badge-red', High: 'badge-orange', Medium: 'badge-yellow', Low: 'badge-blue'
}

const statusColors: Record<string, string> = {
  'To Do': 'badge-gray', 'In Progress': 'badge-blue', Review: 'badge-purple', Done: 'badge-green', Blocked: 'badge-red'
}

const priorityBorderColors: Record<string, string> = {
  Critical: '#ef4444', High: '#f97316', Medium: '#f59e0b', Low: '#3b82f6'
}

const emptyTask = {
  title: '', description: '', assignee: EMPLOYEES[0], department: DEPARTMENTS[0],
  priority: 'Medium' as Task['priority'], status: 'To Do' as Task['status'], dueDate: '', tags: ''
}

export default function Tasks() {
  const [tab, setTab] = useState<'board' | 'list'>('board')
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editTask, setEditTask] = useState<Task | null>(null)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('All')
  const [filterPriority, setFilterPriority] = useState('All')
  const [filterDept, setFilterDept] = useState('All')
  const [form, setForm] = useState(emptyTask)

  useEffect(() => {
    setLoading(true)
    api.get<Task[]>('/tasks')
      .then(data => setTasks(data))
      .catch(() => setTasks([]))
      .finally(() => setLoading(false))
  }, [])

  const boardByCol = BOARD_COLUMNS.reduce((acc, col) => {
    acc[col] = tasks.filter(t => t.status === col)
    return acc
  }, {} as Record<string, Task[]>)

  const openCreate = () => { setEditTask(null); setForm(emptyTask); setShowModal(true) }
  const openEdit = (t: Task) => {
    setEditTask(t)
    setForm({ title: t.title, description: t.description, assignee: t.assignee, department: t.department, priority: t.priority, status: t.status, dueDate: t.dueDate, tags: t.tags.join(', ') })
    setShowModal(true)
  }

  const handleSave = () => {
    const tags = form.tags.split(',').map(s => s.trim()).filter(Boolean)
    if (editTask) {
      setTasks(prev => prev.map(t => t.id === editTask.id ? { ...t, ...form, tags, assigneeAvatar: form.assignee.split(' ').map(w => w[0]).join('').slice(0, 2) } : t))
    } else {
      const newTask: Task = {
        id: Date.now(), title: form.title, description: form.description, assignee: form.assignee,
        assigneeAvatar: form.assignee.split(' ').map(w => w[0]).join('').slice(0, 2),
        department: form.department, priority: form.priority, status: form.status,
        dueDate: form.dueDate, createdDate: new Date().toISOString().split('T')[0], tags, progress: 0
      }
      setTasks(prev => [newTask, ...prev])
    }
    setShowModal(false)
  }

  const handleDelete = (id: number) => setTasks(prev => prev.filter(t => t.id !== id))
  const handleStatusChange = (id: number, status: string) => setTasks(prev => prev.map(t => t.id === id ? { ...t, status: status as Task['status'] } : t))

  const filtered = tasks.filter(t =>
    (filterStatus === 'All' || t.status === filterStatus) &&
    (filterPriority === 'All' || t.priority === filterPriority) &&
    (filterDept === 'All' || t.department === filterDept) &&
    (t.title.toLowerCase().includes(search.toLowerCase()) || t.assignee.toLowerCase().includes(search.toLowerCase()))
  )

  const overdue = tasks.filter(t => t.status !== 'Done' && new Date(t.dueDate) < new Date()).length

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header fade-up" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Task Management</h1>
          <p className="page-subtitle">Assign, track and manage team tasks and delegations</p>
        </div>
        <button className="btn btn-primary" onClick={openCreate} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto" style={{ gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Tasks', value: tasks.length, color: 'blue', icon: <CheckSquare size={20} /> },
          { label: 'Completed', value: tasks.filter(t => t.status === 'Done').length, color: 'green', icon: <TrendingUp size={20} /> },
          { label: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: 'purple', icon: <Clock size={20} /> },
          { label: 'Overdue', value: overdue, color: 'orange', icon: <AlertCircle size={20} /> },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card stat-${s.color} fade-up stagger-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>{s.label}</p>
                <p style={{ color: 'white', fontSize: '32px', fontWeight: 700 }}>{s.value}</p>
              </div>
              <div className={`icon-box icon-${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tab-bar fade-up" style={{ marginBottom: '20px' }}>
        {(['board', 'list'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'board' ? 'Board (Kanban)' : 'List View'}
          </button>
        ))}
      </div>

      {/* BOARD TAB */}
      {tab === 'board' && (
        <div className="scroll-strip" style={{ paddingBottom: '16px', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content' }}>
            {BOARD_COLUMNS.map(col => (
              <div key={col} className="kanban-col" style={{ width: '260px', minWidth: '260px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ color: 'white', fontWeight: 600, fontSize: '14px' }}>{col}</h3>
                  <span className={`badge ${statusColors[col]}`}>{boardByCol[col]?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <div key={i} className="kanban-card" style={{ height: '120px', animation: 'pulse 1.5s infinite' }} />)
                  ) : boardByCol[col]?.map(task => (
                    <div key={task.id} className="kanban-card touch-card" style={{ borderLeft: `3px solid ${priorityBorderColors[task.priority]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <p style={{ color: 'white', fontWeight: 600, fontSize: '13px', flex: 1, marginRight: '8px' }}>{task.title}</p>
                        <span className={`badge ${priorityColors[task.priority]}`} style={{ fontSize: '10px', flexShrink: 0 }}>{task.priority}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                        <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '9px', flexShrink: 0 }}>{task.assigneeAvatar}</div>
                        <span style={{ color: 'var(--slate-400)', fontSize: '11px' }}>{task.assignee}</span>
                      </div>
                      {task.tags.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '8px' }}>
                          {task.tags.slice(0, 2).map(tag => <span key={tag} className="badge badge-gray" style={{ fontSize: '10px', padding: '2px 6px' }}>{tag}</span>)}
                        </div>
                      )}
                      <div style={{ marginBottom: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                          <span style={{ color: 'var(--slate-500)', fontSize: '10px' }}>Progress</span>
                          <span style={{ color: 'white', fontSize: '10px', fontWeight: 600 }}>{task.progress}%</span>
                        </div>
                        <div className="progress-bar" style={{ height: '4px' }}>
                          <div className="progress-fill" style={{ width: `${task.progress}%`, background: task.progress === 100 ? 'linear-gradient(90deg,#059669,#10b981)' : 'linear-gradient(90deg,#1d4ed8,#3b82f6)' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ color: 'var(--slate-500)', fontSize: '10px', display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={10} />{task.dueDate}</span>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          <button className="btn btn-ghost" style={{ padding: '2px 6px' }} onClick={() => openEdit(task)}><Edit2 size={11} /></button>
                          <button className="btn btn-danger" style={{ padding: '2px 6px' }} onClick={() => handleDelete(task.id)}><Trash2 size={11} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {!loading && (boardByCol[col]?.length || 0) === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>No tasks</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LIST TAB */}
      {tab === 'list' && (
        <div className="glass-card fade-up">
          <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', flexWrap: 'wrap' }}>
            <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
              <Search size={16} style={{ color: 'var(--slate-400)' }} />
              <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'white', width: '100%' }} />
            </div>
            <select className="input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="All">All Status</option>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <select className="input" value={filterPriority} onChange={e => setFilterPriority(e.target.value)}>
              <option value="All">All Priority</option>
              {PRIORITIES.map(p => <option key={p}>{p}</option>)}
            </select>
            <select className="input" value={filterDept} onChange={e => setFilterDept(e.target.value)}>
              <option value="All">All Departments</option>
              {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Task</th><th>Assignee</th><th>Dept</th><th>Priority</th><th>Status</th><th>Due Date</th><th>Created</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td>)}</tr>
                  ))
                ) : filtered.map(task => (
                  <tr key={task.id}>
                    <td>
                      <div>
                        <p style={{ color: 'white', fontWeight: 500 }}>{task.title}</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                          {task.tags.slice(0, 2).map(tag => <span key={tag} className="badge badge-gray" style={{ fontSize: '10px' }}>{tag}</span>)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>{task.assigneeAvatar}</div>
                        <span style={{ color: 'var(--slate-300)', fontSize: '13px' }}>{task.assignee}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{task.department}</span></td>
                    <td><span className={`badge ${priorityColors[task.priority]}`}>{task.priority}</span></td>
                    <td>
                      <select className="input" value={task.status} onChange={e => handleStatusChange(task.id, e.target.value)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                        {STATUSES.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'Done' ? '#f87171' : 'var(--slate-400)', fontSize: '13px' }}>{task.dueDate}</td>
                    <td style={{ color: 'var(--slate-500)', fontSize: '13px' }}>{task.createdDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px' }} onClick={() => openEdit(task)}><Edit2 size={13} /></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(task.id)}><Trash2 size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && filtered.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-500)' }}>No tasks found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAB — mobile only */}
      <button className="fab mobile-only" onClick={openCreate}><Plus size={22} color="#fff" /></button>

      {/* Task Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>{editTask ? 'Edit Task' : 'Create New Task'}</h2>
              <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setShowModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Task Title</label>
                <input className="input" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="Enter task title..." />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="input" rows={2} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Task description..." style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="form-label">Assignee</label>
                <select className="input" value={form.assignee} onChange={e => setForm(p => ({ ...p, assignee: e.target.value }))}>
                  {EMPLOYEES.map(e => <option key={e}>{e}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="input" value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Priority</label>
                <select className="input" value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as Task['priority'] }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Task['status'] }))}>
                  {STATUSES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input className="input" type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
              <div>
                <label className="form-label">Tags (comma separated)</label>
                <input className="input" value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))} placeholder="e.g. Backend, API, Security" />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave} disabled={!form.title}>{editTask ? 'Save Changes' : 'Create Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
