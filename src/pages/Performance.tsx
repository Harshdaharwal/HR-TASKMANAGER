import { useState, useEffect } from 'react'
import {
  Star, Target, ChevronDown, ChevronUp, Plus, X,
  Award, TrendingUp, CheckCircle, XCircle
} from 'lucide-react'
import { api } from '../api/client'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'

interface Review {
  id: number
  name: string
  dept: string
  avatar: string
  rating: number
  period: string
  status: 'Completed' | 'Pending' | 'In Progress'
  reviewer: string
  goals: { name: string; achieved: boolean; score: number }[]
  strengths: string[]
  improvements: string[]
}

interface Goal {
  id: number
  employee: string
  description: string
  target: string
  progress: number
  dueDate: string
  status: 'On Track' | 'At Risk' | 'Completed' | 'Overdue'
}

const goalStatusColor: Record<string, string> = {
  'On Track': 'badge-green', 'At Risk': 'badge-yellow', 'Completed': 'badge-blue', 'Overdue': 'badge-red'
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={14} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} color={i <= Math.round(rating) ? '#f59e0b' : '#475569'} />
      ))}
      <span style={{ color: '#f59e0b', fontWeight: 700, fontSize: '14px', marginLeft: '6px' }}>{rating}</span>
    </div>
  )
}

export default function Performance() {
  const [tab, setTab] = useState<'reviews' | 'goals' | 'analytics'>('reviews')
  const [reviews, setReviews] = useState<Review[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [period, setPeriod] = useState('Q2 2026')
  const [deptFilter, setDeptFilter] = useState('All')
  const [newGoal, setNewGoal] = useState({ employee: '', description: '', target: '', dueDate: '' })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<Review[]>('/performance').catch(() => []),
      api.get<Goal[]>('/goals').catch(() => []),
    ]).then(([reviewData, goalData]) => {
      setReviews(reviewData)
      setGoals(goalData)
    }).finally(() => setLoading(false))
  }, [])

  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : '0'

  const deptData = Object.entries(
    reviews.reduce((acc, r) => {
      if (!acc[r.dept]) acc[r.dept] = { sum: 0, count: 0 }
      acc[r.dept].sum += r.rating; acc[r.dept].count += 1
      return acc
    }, {} as Record<string, { sum: number; count: number }>)
  ).map(([dept, { sum, count }]) => ({ dept, avg: Math.round((sum / count) * 10) / 10 }))

  const ratingDist = [
    { name: '5 Stars', value: reviews.filter(r => r.rating >= 4.8).length, color: '#10b981' },
    { name: '4-5 Stars', value: reviews.filter(r => r.rating >= 4 && r.rating < 4.8).length, color: '#3b82f6' },
    { name: '3-4 Stars', value: reviews.filter(r => r.rating >= 3 && r.rating < 4).length, color: '#f59e0b' },
    { name: 'Below 3', value: reviews.filter(r => r.rating < 3).length, color: '#ef4444' },
  ]

  const addGoal = () => {
    const g: Goal = { id: Date.now(), employee: newGoal.employee, description: newGoal.description, target: newGoal.target, progress: 0, dueDate: newGoal.dueDate, status: 'On Track' }
    setGoals(prev => [g, ...prev])
    setShowGoalModal(false)
    setNewGoal({ employee: '', description: '', target: '', dueDate: '' })
  }

  const filteredReviews = reviews.filter(r => deptFilter === 'All' || r.dept === deptFilter)
  const topPerformers = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 5)

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header fade-up" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Performance Management</h1>
          <p className="page-subtitle">Track reviews, goals and team performance analytics</p>
        </div>
        {tab === 'goals' && (
          <button className="btn btn-primary" onClick={() => setShowGoalModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Add Goal
          </button>
        )}
      </div>

      <div className="tab-bar fade-up" style={{ marginBottom: '20px' }}>
        {(['reviews', 'goals', 'analytics'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* REVIEWS TAB */}
      {tab === 'reviews' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '20px' }}>
          <div>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <select className="input" value={period} onChange={e => setPeriod(e.target.value)} style={{ minWidth: '130px' }}>
                {['Q1 2026', 'Q2 2026', 'Q3 2025', 'Q4 2025'].map(p => <option key={p}>{p}</option>)}
              </select>
              <select className="input" value={deptFilter} onChange={e => setDeptFilter(e.target.value)}>
                <option value="All">All Departments</option>
                {['Engineering', 'Design', 'HR', 'Finance', 'Marketing'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => <div key={i} className="glass-card" style={{ height: '80px', animation: 'pulse 1.5s infinite' }} />)
              ) : filteredReviews.map(r => (
                <div key={r.id} className="glass-card touch-card fade-up">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }} onClick={() => setExpanded(expanded === r.id ? null : r.id)}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div className="avatar-lg" style={{ width: '44px', height: '44px', fontSize: '14px' }}>{r.avatar}</div>
                      <div>
                        <p style={{ color: 'white', fontWeight: 600 }}>{r.name}</p>
                        <p style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{r.dept} · {r.period}</p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <StarDisplay rating={r.rating} />
                      <span className={`badge ${r.status === 'Completed' ? 'badge-green' : r.status === 'In Progress' ? 'badge-blue' : 'badge-yellow'}`}>{r.status}</span>
                      {expanded === r.id ? <ChevronUp size={18} color="var(--slate-400)" /> : <ChevronDown size={18} color="var(--slate-400)" />}
                    </div>
                  </div>

                  {expanded === r.id && (
                    <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <div style={{ marginBottom: '16px' }}>
                        <h4 style={{ color: 'var(--slate-300)', fontWeight: 600, marginBottom: '10px', fontSize: '14px' }}>Goals Assessment</h4>
                        {r.goals.map((g, i) => (
                          <div key={i} style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {g.achieved ? <CheckCircle size={14} color="#34d399" /> : <XCircle size={14} color="#f87171" />}
                                <span style={{ color: 'var(--slate-300)', fontSize: '13px' }}>{g.name}</span>
                              </div>
                              <span style={{ color: g.score >= 80 ? '#34d399' : g.score >= 60 ? '#f59e0b' : '#f87171', fontWeight: 700, fontSize: '13px' }}>{g.score}%</span>
                            </div>
                            <div className="progress-bar">
                              <div className="progress-fill" style={{ width: `${g.score}%`, background: g.score >= 80 ? 'linear-gradient(90deg,#059669,#10b981)' : g.score >= 60 ? 'linear-gradient(90deg,#d97706,#f59e0b)' : 'linear-gradient(90deg,#dc2626,#ef4444)' }} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                        <div>
                          <h4 style={{ color: '#34d399', fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>Strengths</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {r.strengths.map(s => <span key={s} className="badge badge-green">{s}</span>)}
                          </div>
                        </div>
                        <div>
                          <h4 style={{ color: '#fbbf24', fontWeight: 600, marginBottom: '8px', fontSize: '13px' }}>Areas for Improvement</h4>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                            {r.improvements.map(s => <span key={s} className="badge badge-yellow">{s}</span>)}
                          </div>
                        </div>
                      </div>
                      <p style={{ color: 'var(--slate-500)', fontSize: '12px' }}>Reviewed by: <span style={{ color: 'var(--slate-400)' }}>{r.reviewer}</span></p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar widgets */}
          <div>
            <div className="glass-card fade-up" style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h3 style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '12px' }}>Average Rating</h3>
              <div style={{ position: 'relative', width: '120px', height: '120px', margin: '0 auto 16px' }}>
                <svg viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                  <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="10" />
                  <circle cx="60" cy="60" r="50" fill="none" stroke="url(#perfGrad)" strokeWidth="10" strokeDasharray={`${(Number(avgRating) / 5) * 314} 314`} strokeLinecap="round" />
                  <defs>
                    <linearGradient id="perfGrad" x1="0%" y1="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ color: 'white', fontSize: '26px', fontWeight: 800 }}>{avgRating}</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '2px' }}>
                {[1, 2, 3, 4, 5].map(i => <Star key={i} size={16} fill={i <= Number(avgRating) ? '#f59e0b' : 'none'} color={i <= Number(avgRating) ? '#f59e0b' : '#475569'} />)}
              </div>
              <p style={{ color: 'var(--slate-500)', fontSize: '12px', marginTop: '8px' }}>Based on {reviews.length} reviews</p>
            </div>
            <div className="glass-card fade-up">
              <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '12px' }}>Top Performers</h3>
              {[...reviews].sort((a, b) => b.rating - a.rating).slice(0, 3).map((r, i) => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <span style={{ color: (['#f59e0b', '#9ca3af', '#b45309'] as string[])[i] || 'var(--slate-400)', fontWeight: 700, width: '20px', fontSize: '14px' }}>#{i + 1}</span>
                  <div className="avatar" style={{ width: '32px', height: '32px', fontSize: '11px' }}>{r.avatar}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ color: 'white', fontSize: '13px', fontWeight: 500 }}>{r.name}</p>
                    <p style={{ color: 'var(--slate-500)', fontSize: '11px' }}>{r.dept}</p>
                  </div>
                  <span style={{ color: '#f59e0b', fontWeight: 700 }}>{r.rating}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* GOALS TAB */}
      {tab === 'goals' && (
        <div className="glass-card fade-up">
          <h2 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Team Goals</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table" style={{ width: '100%' }}>
              <thead>
                <tr><th>Employee</th><th>Goal</th><th>Target</th><th>Progress</th><th>Due Date</th><th>Status</th></tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 6 }).map((_, j) => <td key={j}><div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px' }} /></td>)}</tr>
                  ))
                ) : goals.map(g => (
                  <tr key={g.id}>
                    <td style={{ color: 'white', fontWeight: 500 }}>{g.employee}</td>
                    <td style={{ color: 'var(--slate-300)' }}>{g.description}</td>
                    <td style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{g.target}</td>
                    <td style={{ minWidth: '140px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className="progress-bar" style={{ flex: 1 }}>
                          <div className="progress-fill" style={{ width: `${g.progress}%`, background: g.progress === 100 ? 'linear-gradient(90deg,#059669,#10b981)' : g.progress >= 60 ? 'linear-gradient(90deg,#1d4ed8,#3b82f6)' : 'linear-gradient(90deg,#d97706,#f59e0b)' }} />
                        </div>
                        <span style={{ color: 'white', fontSize: '12px', fontWeight: 600, minWidth: '32px' }}>{g.progress}%</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{g.dueDate}</td>
                    <td><span className={`badge ${goalStatusColor[g.status]}`}>{g.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ANALYTICS TAB */}
      {tab === 'analytics' && (
        <div className="stat-grid-auto" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-card fade-up">
            <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Dept Average Ratings</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={deptData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="dept" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <YAxis domain={[0, 5]} stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }} />
                <Bar dataKey="avg" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card fade-up">
            <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={ratingDist} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                  {ratingDist.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                <Legend formatter={(v) => <span style={{ color: 'var(--slate-300)', fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="glass-card fade-up">
            <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Top 5 Performers</h3>
            {topPerformers.map((r, i) => (
              <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: i === 0 ? 'linear-gradient(135deg,#f59e0b,#d97706)' : i === 1 ? 'linear-gradient(135deg,#9ca3af,#6b7280)' : i === 2 ? 'linear-gradient(135deg,#b45309,#92400e)' : 'rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '13px', color: 'white', flexShrink: 0 }}>{i + 1}</div>
                <div className="avatar" style={{ width: '36px', height: '36px', fontSize: '12px' }}>{r.avatar}</div>
                <div style={{ flex: 1 }}>
                  <p style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>{r.name}</p>
                  <p style={{ color: 'var(--slate-500)', fontSize: '12px' }}>{r.dept}</p>
                </div>
                <StarDisplay rating={r.rating} />
              </div>
            ))}
          </div>
          <div className="glass-card fade-up">
            <h3 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Team KPI Summary</h3>
            {[
              { label: 'Reviews Completed', value: `${reviews.filter(r => r.status === 'Completed').length}/${reviews.length}`, color: 'badge-green' },
              { label: 'Goals On Track', value: `${goals.filter(g => g.status === 'On Track').length}/${goals.length}`, color: 'badge-blue' },
              { label: 'Avg Goal Progress', value: `${Math.round(goals.reduce((s, g) => s + g.progress, 0) / Math.max(goals.length, 1))}%`, color: 'badge-purple' },
              { label: 'Overdue Goals', value: goals.filter(g => g.status === 'Overdue').length.toString(), color: 'badge-red' },
            ].map(k => (
              <div key={k.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <span style={{ color: 'var(--slate-300)', fontSize: '14px' }}>{k.label}</span>
                <span className={`badge ${k.color}`} style={{ fontSize: '13px', fontWeight: 700 }}>{k.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FAB — Add Goal/Review (mobile only) */}
      <button className="fab mobile-only" onClick={() => setShowGoalModal(true)} aria-label="Add Goal">
        <Plus size={22} color="#fff" />
      </button>

      {/* Add Goal Modal */}
      {showGoalModal && (
        <div className="modal-overlay" onClick={() => setShowGoalModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>Add New Goal</h2>
              <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setShowGoalModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
              <div>
                <label className="form-label">Employee Name</label>
                <input className="input" value={newGoal.employee} onChange={e => setNewGoal(p => ({ ...p, employee: e.target.value }))} placeholder="e.g. Rahul Sharma" />
              </div>
              <div>
                <label className="form-label">Goal Description</label>
                <textarea className="input" rows={2} value={newGoal.description} onChange={e => setNewGoal(p => ({ ...p, description: e.target.value }))} placeholder="Describe the goal..." style={{ resize: 'vertical' }} />
              </div>
              <div>
                <label className="form-label">Success Target</label>
                <input className="input" value={newGoal.target} onChange={e => setNewGoal(p => ({ ...p, target: e.target.value }))} placeholder="e.g. Reduce bug count by 30%" />
              </div>
              <div>
                <label className="form-label">Due Date</label>
                <input className="input" type="date" value={newGoal.dueDate} onChange={e => setNewGoal(p => ({ ...p, dueDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setShowGoalModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={addGoal} disabled={!newGoal.employee || !newGoal.description}>Add Goal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
