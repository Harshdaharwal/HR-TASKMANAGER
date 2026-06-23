import { useState, useEffect } from 'react'
import {
  Briefcase, MapPin, Users, Star, Plus, X,
  Calendar, Clock, TrendingUp, Eye, UserX,
  Search, Award, Building2
} from 'lucide-react'
import { api } from '../api/client'

interface Job {
  id: number
  title: string
  department: string
  location: string
  type: 'Full-time' | 'Part-time' | 'Contract' | 'Remote'
  experience: string
  salaryMin: number
  salaryMax: number
  applicants: number
  maxApplicants: number
  status: 'Active' | 'Closed' | 'Draft' | 'Paused'
  posted: string
  closing: string
  description: string
}

interface Candidate {
  id: number
  name: string
  email: string
  appliedJob: string
  experience: string
  skills: string[]
  rating: number
  stage: string
  appliedDate: string
  avatar: string
}

const STAGES = ['Applied', 'Screening', 'Interview', 'Technical', 'HR Round', 'Offer', 'Hired', 'Rejected']

const stageColors: Record<string, string> = {
  Applied: 'badge-gray', Screening: 'badge-blue', Interview: 'badge-purple',
  Technical: 'badge-orange', 'HR Round': 'badge-cyan', Offer: 'badge-yellow',
  Hired: 'badge-green', Rejected: 'badge-red'
}

const deptColors: Record<string, string> = {
  Engineering: 'badge-blue', Design: 'badge-purple', Analytics: 'badge-cyan',
  Marketing: 'badge-orange', HR: 'badge-green', Finance: 'badge-yellow'
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} size={12} fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} color={i <= Math.round(rating) ? '#f59e0b' : '#475569'} />
      ))}
      <span style={{ color: 'var(--slate-400)', fontSize: '12px', marginLeft: '4px' }}>{rating}</span>
    </div>
  )
}

export default function Recruitment() {
  const [tab, setTab] = useState<'jobs' | 'pipeline' | 'candidates'>('jobs')
  const [jobs, setJobs] = useState<Job[]>([])
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [loading, setLoading] = useState(true)
  const [showJobModal, setShowJobModal] = useState(false)
  const [search, setSearch] = useState('')
  const [newJob, setNewJob] = useState({ title: '', department: 'Engineering', location: '', type: 'Full-time', experience: '', salaryMin: '', salaryMax: '', description: '' })

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get<Job[]>('/jobs').catch(() => []),
      api.get<Candidate[]>('/candidates').catch(() => []),
    ]).then(([jobData, candidateData]) => {
      setJobs(jobData)
      setCandidates(candidateData)
    }).finally(() => setLoading(false))
  }, [])

  const pipelineByStage = STAGES.reduce((acc, s) => {
    acc[s] = candidates.filter(c => c.stage === s)
    return acc
  }, {} as Record<string, Candidate[]>)

  const handleAddJob = () => {
    const j: Job = {
      id: Date.now(), title: newJob.title, department: newJob.department,
      location: newJob.location, type: newJob.type as Job['type'],
      experience: newJob.experience, salaryMin: Number(newJob.salaryMin),
      salaryMax: Number(newJob.salaryMax), applicants: 0, maxApplicants: 50,
      status: 'Active', posted: new Date().toISOString().split('T')[0],
      closing: '', description: newJob.description
    }
    setJobs(prev => [j, ...prev])
    setShowJobModal(false)
    setNewJob({ title: '', department: 'Engineering', location: '', type: 'Full-time', experience: '', salaryMin: '', salaryMax: '', description: '' })
  }

  const handleStageChange = (id: number, stage: string) => {
    setCandidates(prev => prev.map(c => c.id === id ? { ...c, stage } : c))
  }

  const statusColor = (s: string) => {
    if (s === 'Active') return 'badge-green'
    if (s === 'Closed') return 'badge-red'
    if (s === 'Paused') return 'badge-yellow'
    return 'badge-gray'
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      <div className="section-header fade-up" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Recruitment & ATS</h1>
          <p className="page-subtitle">Manage job openings, candidates and hiring pipeline</p>
        </div>
        {tab === 'jobs' && (
          <button className="btn btn-primary" onClick={() => setShowJobModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} /> Post New Job
          </button>
        )}
      </div>

      {/* Stats Bar */}
      <div className="stat-grid-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Open Positions', value: jobs.filter(j => j.status === 'Active').length, color: 'blue', icon: <Briefcase size={20} /> },
          { label: 'Total Applicants', value: jobs.reduce((s, j) => s + j.applicants, 0), color: 'purple', icon: <Users size={20} /> },
          { label: 'In Pipeline', value: candidates.filter(c => !['Hired', 'Rejected'].includes(c.stage)).length, color: 'orange', icon: <TrendingUp size={20} /> },
          { label: 'Hired This Month', value: candidates.filter(c => c.stage === 'Hired').length, color: 'green', icon: <Award size={20} /> },
        ].map((s, i) => (
          <div key={s.label} className={`stat-card stat-${s.color} fade-up stagger-${i + 1}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>{s.label}</p>
                <p style={{ color: 'var(--text-primary)', fontSize: '32px', fontWeight: 700 }}>{s.value}</p>
              </div>
              <div className={`icon-box icon-${s.color}`}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-bar fade-up" style={{ marginBottom: '20px' }}>
        {(['jobs', 'pipeline', 'candidates'] as const).map(t => (
          <button key={t} className={`tab-item ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* JOBS TAB */}
      {tab === 'jobs' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="glass-card" style={{ height: '220px', animation: 'pulse 1.5s infinite' }} />
            ))
          ) : jobs.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px', color: 'var(--slate-500)' }}>
              <Briefcase size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
              <p>No jobs posted yet</p>
            </div>
          ) : jobs.map(job => (
            <div key={job.id} className="glass-card touch-card fade-up" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div className="icon-box icon-blue" style={{ width: '40px', height: '40px' }}><Briefcase size={18} /></div>
                <span className={`badge ${statusColor(job.status)}`}>{job.status}</span>
              </div>
              <div>
                <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, marginBottom: '4px' }}>{job.title}</h3>
                <p style={{ color: 'var(--slate-400)', fontSize: '13px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{job.description}</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                <span className={`badge ${deptColors[job.department] || 'badge-gray'}`}>{job.department}</span>
                <span className="badge badge-gray" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><MapPin size={10} />{job.location}</span>
                <span className="badge badge-purple">{job.type}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--slate-400)' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{job.experience}</span>
                <span style={{ color: '#34d399', fontWeight: 600 }}>₹{job.salaryMin}-{job.salaryMax} LPA</span>
              </div>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <span style={{ color: 'var(--slate-400)', fontSize: '12px' }}>Applicants</span>
                  <span style={{ color: 'var(--text-primary)', fontSize: '12px', fontWeight: 600 }}>{job.applicants}/{job.maxApplicants}</span>
                </div>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${Math.min(100, (job.applicants / job.maxApplicants) * 100)}%`, background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--slate-500)' }}>
                <span>Posted: {job.posted}</span>
                {job.closing && <span>Closes: {job.closing}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PIPELINE TAB */}
      {tab === 'pipeline' && (
        <div style={{ overflowX: 'auto', paddingBottom: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', minWidth: 'max-content' }}>
            {STAGES.map(stage => (
              <div key={stage} className="kanban-col" style={{ width: '220px', minWidth: '220px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '14px' }}>{stage}</h3>
                  <span className={`badge ${stageColors[stage]}`}>{pipelineByStage[stage]?.length || 0}</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {loading ? (
                    Array.from({ length: 2 }).map((_, i) => <div key={i} className="kanban-card" style={{ height: '100px', animation: 'pulse 1.5s infinite' }} />)
                  ) : pipelineByStage[stage]?.map(c => (
                    <div key={c.id} className="kanban-card">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                        <div className="avatar" style={{ width: '30px', height: '30px', fontSize: '11px', flexShrink: 0 }}>{c.avatar}</div>
                        <div style={{ minWidth: 0 }}>
                          <p style={{ color: 'var(--text-primary)', fontWeight: 600, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</p>
                          <p style={{ color: 'var(--slate-400)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.appliedJob}</p>
                        </div>
                      </div>
                      <StarRating rating={c.rating} />
                      <p style={{ color: 'var(--slate-400)', fontSize: '11px', marginTop: '6px' }}>{c.experience}</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {c.skills.slice(0, 2).map(s => <span key={s} className="badge badge-blue" style={{ fontSize: '10px', padding: '2px 6px' }}>{s}</span>)}
                      </div>
                      <select className="input" value={c.stage} onChange={e => handleStageChange(c.id, e.target.value)}
                        style={{ marginTop: '8px', fontSize: '11px', padding: '4px 8px', width: '100%' }}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                  {!loading && (pipelineByStage[stage]?.length || 0) === 0 && (
                    <div style={{ padding: '20px', textAlign: 'center', color: 'var(--slate-500)', fontSize: '12px', border: '1px dashed rgba(255,255,255,0.1)', borderRadius: '8px' }}>No candidates</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CANDIDATES TAB */}
      {tab === 'candidates' && (
        <div className="glass-card fade-up">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 600 }}>All Candidates</h2>
            <div className="search-box" style={{ maxWidth: '260px' }}>
              <Search size={16} style={{ color: 'var(--slate-400)' }} />
              <input placeholder="Search candidates..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', width: '100%' }} />
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Candidate</th><th>Applied For</th><th>Experience</th><th>Skills</th><th>Rating</th><th>Stage</th><th>Applied</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>{Array.from({ length: 8 }).map((_, j) => <td key={j}><div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td>)}</tr>
                  ))
                ) : candidates.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.appliedJob.toLowerCase().includes(search.toLowerCase())).map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>{c.avatar}</div>
                        <div>
                          <p style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{c.name}</p>
                          <p style={{ color: 'var(--slate-500)', fontSize: '12px' }}>{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--slate-300)' }}>{c.appliedJob}</td>
                    <td style={{ color: 'var(--slate-300)' }}>{c.experience}</td>
                    <td><div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>{c.skills.slice(0, 3).map(s => <span key={s} className="badge badge-blue" style={{ fontSize: '11px' }}>{s}</span>)}</div></td>
                    <td><StarRating rating={c.rating} /></td>
                    <td>
                      <select className="input" value={c.stage} onChange={e => handleStageChange(c.id, e.target.value)} style={{ fontSize: '12px', padding: '4px 8px' }}>
                        {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{c.appliedDate}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px' }}><Eye size={14} /></button>
                        <button className="btn btn-danger" style={{ padding: '4px 8px' }}><UserX size={14} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* FAB — Post Job (mobile only) */}
      <button className="fab mobile-only" onClick={() => setShowJobModal(true)} aria-label="Post New Job">
        <Plus size={22} color="#fff" />
      </button>

      {/* Post Job Modal */}
      {showJobModal && (
        <div className="modal-overlay" onClick={() => setShowJobModal(false)}>
          <div className="modal-box w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: '18px' }}>Post New Job</h2>
              <button className="btn btn-ghost" style={{ padding: '6px' }} onClick={() => setShowJobModal(false)}><X size={18} /></button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Job Title</label>
                <input className="input" value={newJob.title} onChange={e => setNewJob(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Senior React Developer" />
              </div>
              <div>
                <label className="form-label">Department</label>
                <select className="input" value={newJob.department} onChange={e => setNewJob(p => ({ ...p, department: e.target.value }))}>
                  {['Engineering', 'Design', 'HR', 'Finance', 'Marketing', 'Sales', 'Analytics'].map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Location</label>
                <input className="input" value={newJob.location} onChange={e => setNewJob(p => ({ ...p, location: e.target.value }))} placeholder="e.g. Bangalore" />
              </div>
              <div>
                <label className="form-label">Type</label>
                <select className="input" value={newJob.type} onChange={e => setNewJob(p => ({ ...p, type: e.target.value }))}>
                  {['Full-time', 'Part-time', 'Contract', 'Remote'].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="form-label">Experience</label>
                <input className="input" value={newJob.experience} onChange={e => setNewJob(p => ({ ...p, experience: e.target.value }))} placeholder="e.g. 3-5 years" />
              </div>
              <div>
                <label className="form-label">Min Salary (LPA)</label>
                <input className="input" type="number" value={newJob.salaryMin} onChange={e => setNewJob(p => ({ ...p, salaryMin: e.target.value }))} placeholder="e.g. 15" />
              </div>
              <div>
                <label className="form-label">Max Salary (LPA)</label>
                <input className="input" type="number" value={newJob.salaryMax} onChange={e => setNewJob(p => ({ ...p, salaryMax: e.target.value }))} placeholder="e.g. 25" />
              </div>
              <div style={{ gridColumn: '1/-1' }}>
                <label className="form-label">Description</label>
                <textarea className="input" rows={3} value={newJob.description} onChange={e => setNewJob(p => ({ ...p, description: e.target.value }))} placeholder="Job description..." style={{ resize: 'vertical' }} />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '20px' }}>
              <button className="btn btn-ghost" onClick={() => setShowJobModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleAddJob} disabled={!newJob.title}>Post Job</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
