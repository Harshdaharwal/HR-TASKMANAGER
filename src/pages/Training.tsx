import { useState, useEffect } from 'react';
import { BookOpen, Plus, Search, Play, Clock, Users, Award, ChevronRight, Star, X, Loader2 } from 'lucide-react';
import { api } from '../api/client';

interface Course {
  id: string;
  title: string;
  category: string;
  instructor: string;
  duration: string;
  enrolled: number;
  completed: number;
  status: 'Active' | 'Draft' | 'Completed';
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  rating: number;
  description: string;
}


const categoryColors: Record<string, string> = {
  Technical: 'badge-blue', 'Soft Skills': 'badge-purple', Productivity: 'badge-green',
  Finance: 'badge-orange', Marketing: 'badge-pink', HR: 'badge-cyan',
};

const levelColors: Record<string, string> = {
  Beginner: 'badge-green', Intermediate: 'badge-yellow', Advanced: 'badge-red',
};

export default function Training() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'All' | 'Active' | 'Completed'>('All');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title: '', category: 'Technical', instructor: '', duration: '', level: 'Beginner', description: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<Course[]>('/training').then(d => { setCourses(d ?? []); }).catch(() => {});
  }, []);

  const filtered = courses.filter(c => {
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase()) || c.instructor.toLowerCase().includes(search.toLowerCase());
    const matchTab = tab === 'All' || c.status === tab;
    return matchSearch && matchTab;
  });

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const newCourse: Course = {
      id: String(Date.now()), ...form as Course['level'] extends string ? Course : Course,
      enrolled: 0, completed: 0, status: 'Active', rating: 0,
      level: form.level as Course['level'],
    };
    try {
      await api.post('/training', newCourse);
    } catch {}
    setCourses(prev => [newCourse, ...prev]);
    setShowModal(false);
    setForm({ title: '', category: 'Technical', instructor: '', duration: '', level: 'Beginner', description: '' });
    setSaving(false);
  }

  const stats = {
    total: courses.length,
    active: courses.filter(c => c.status === 'Active').length,
    totalEnrolled: courses.reduce((s, c) => s + c.enrolled, 0),
    avgRating: courses.length ? (courses.reduce((s, c) => s + c.rating, 0) / courses.length).toFixed(1) : '0',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div className="section-header">
        <div>
          <h1 className="page-title">Training & Development</h1>
          <p className="page-subtitle">Upskill your teams with curated courses</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={16} /> Add Course
        </button>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto" style={{ gap: '16px' }}>
        {[
          { label: 'Total Courses', value: stats.total, icon: <BookOpen size={20} />, cls: 'stat-blue', icls: 'icon-blue' },
          { label: 'Active Courses', value: stats.active, icon: <Play size={20} />, cls: 'stat-green', icls: 'icon-green' },
          { label: 'Total Enrolled', value: stats.totalEnrolled, icon: <Users size={20} />, cls: 'stat-purple', icls: 'icon-purple' },
          { label: 'Avg Rating', value: `⭐ ${stats.avgRating}`, icon: <Award size={20} />, cls: 'stat-orange', icls: 'icon-orange' },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.cls}`}>
            <div className={`icon-box ${s.icls}`} style={{ marginBottom: '12px' }}>{s.icon}</div>
            <p style={{ fontSize: '26px', fontWeight: 800, color: '#0f172a' }}>{s.value}</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#334155', marginTop: '4px' }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="glass-card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div className="search-box" style={{ flex: 1, minWidth: '200px' }}>
            <Search size={15} style={{ color: '#94a3b8' }} />
            <input placeholder="Search courses or instructor..." value={search} onChange={e => setSearch(e.target.value)} style={{ background: 'none', border: 'none', outline: 'none', fontSize: '13px', color: '#0f172a', width: '100%' }} />
          </div>
          <div className="tab-bar">
            {(['All', 'Active', 'Completed'] as const).map(t => (
              <button key={t} className={`tab-item${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Courses Grid */}
      <div className="stat-grid-auto" style={{ gap: '16px', gridTemplateColumns: 'repeat(auto-fill,minmax(min(300px,100%),1fr))' }}>
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <div key={i} className="glass-card skeleton" style={{ height: '220px' }} />)
        ) : filtered.length === 0 ? (
          <div className="glass-card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
            <BookOpen size={40} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
            <p style={{ color: '#94a3b8' }}>No courses found</p>
          </div>
        ) : filtered.map(course => (
          <div key={course.id} className="glass-card touch-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
              <div className={`icon-box ${categoryColors[course.category]?.replace('badge-', 'icon-') || 'icon-blue'}`} style={{ flexShrink: 0 }}>
                <BookOpen size={20} />
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <span className={`badge ${categoryColors[course.category] || 'badge-blue'}`}>{course.category}</span>
                <span className={`badge ${levelColors[course.level]}`}>{course.level}</span>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#0f172a', lineHeight: 1.3 }}>{course.title}</h3>
              <p style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{course.description}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: '#64748b' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={12} />{course.duration}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Users size={12} />{course.enrolled} enrolled</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Star size={12} style={{ color: '#f59e0b' }} />{course.rating}</span>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#64748b', marginBottom: '4px' }}>
                <span>Completion</span>
                <span style={{ fontWeight: 600, color: '#0f172a' }}>{course.enrolled ? Math.round((course.completed / course.enrolled) * 100) : 0}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${course.enrolled ? Math.round((course.completed / course.enrolled) * 100) : 0}%`, background: 'linear-gradient(90deg,#2563eb,#10b981)' }} />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>By {course.instructor}</span>
              <button className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '12px' }}>
                <ChevronRight size={14} /> View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* FAB — mobile only */}
      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff" /></button>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" style={{ width: '500px', padding: '28px' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>Add New Course</h2>
              <button onClick={() => setShowModal(false)} style={{ background: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer', color: '#64748b' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleAdd} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label className="form-label">Course Title *</label><input className="input" required value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. React Advanced Patterns" /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Category</label>
                  <select className="input" value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                    {['Technical', 'Soft Skills', 'Productivity', 'Finance', 'Marketing', 'HR'].map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
                <div><label className="form-label">Level</label>
                  <select className="input" value={form.level} onChange={e => setForm(p => ({ ...p, level: e.target.value }))}>
                    {['Beginner', 'Intermediate', 'Advanced'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label className="form-label">Instructor</label><input className="input" required value={form.instructor} onChange={e => setForm(p => ({ ...p, instructor: e.target.value }))} placeholder="e.g. Priya Mehta" /></div>
                <div><label className="form-label">Duration</label><input className="input" required value={form.duration} onChange={e => setForm(p => ({ ...p, duration: e.target.value }))} placeholder="e.g. 8h" /></div>
              </div>
              <div><label className="form-label">Description</label><textarea className="input" rows={3} value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Brief description..." style={{ resize: 'vertical' }} /></div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Saving…</> : 'Add Course'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
