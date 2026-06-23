import { useState } from 'react';
import { Bell, Plus, X, Megaphone, Calendar, Award, AlertCircle, Info, Tag } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Announcement } from '../types';

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  General: { icon: Info, color: 'text-slate-600', bg: 'bg-slate-100' },
  'HR Policy': { icon: Tag, color: 'text-blue-600', bg: 'bg-blue-50' },
  Event: { icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
  Holiday: { icon: Calendar, color: 'text-green-600', bg: 'bg-green-50' },
  Achievement: { icon: Award, color: 'text-amber-600', bg: 'bg-amber-50' },
  Urgent: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
};

const PRIORITY_BADGE: Record<string, string> = {
  High: 'badge-red', Medium: 'badge-yellow', Low: 'badge-gray',
};

function NewAnnouncementModal({ onClose, onSubmit }: {
  onClose: () => void;
  onSubmit: (a: Announcement) => void;
}) {
  const [form, setForm] = useState({
    title: '', content: '', category: 'General' as Announcement['category'], priority: 'Medium' as Announcement['priority'],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      id: `AN${Date.now()}`,
      ...form,
      postedBy: 'Neha Gupta',
      postedOn: new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h2 className="text-lg font-semibold text-slate-800">Post Announcement</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Title</label>
            <input required type="text" placeholder="Announcement title..." value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Category</label>
              <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value as Announcement['category'] }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                {Object.keys(CATEGORY_CONFIG).map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Announcement['priority'] }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-white">
                <option>High</option><option>Medium</option><option>Low</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Content</label>
            <textarea required rows={5} placeholder="Announcement details..." value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg border border-slate-200 text-sm text-slate-600 hover:bg-slate-50">Cancel</button>
            <button type="submit" className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
              <Megaphone size={14} className="inline mr-1.5" />Post Announcement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Announcements() {
  const { announcements, setAnnouncements } = useApp();
  const [activeCategory, setActiveCategory] = useState('All');
  const [activePriority, setActivePriority] = useState('All');
  const [showModal, setShowModal] = useState(false);

  const filtered = announcements.filter(a => {
    const matchCat = activeCategory === 'All' || a.category === activeCategory;
    const matchPri = activePriority === 'All' || a.priority === activePriority;
    return matchCat && matchPri;
  });

  const handleNew = (a: Announcement) => setAnnouncements(prev => [a, ...prev]);
  const handleDelete = (id: string) => {
    if (confirm('Delete this announcement?')) setAnnouncements(prev => prev.filter(a => a.id !== id));
  };

  const urgent = announcements.filter(a => a.priority === 'High').length;

  return (
    <div className="fade-in space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Announcements</h2>
          <p className="text-sm text-slate-500">{announcements.length} announcements · {urgent} urgent</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-blue-700">
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Urgent Banner */}
      {announcements.filter(a => a.priority === 'High' && a.category === 'Urgent').length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 text-sm">Urgent Notice</p>
            <p className="text-xs text-red-600 mt-0.5">{announcements.filter(a => a.priority === 'High' && a.category === 'Urgent')[0]?.title}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card space-y-3">
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium">Category</p>
          <div className="flex flex-wrap gap-2">
            {['All', ...Object.keys(CATEGORY_CONFIG)].map(c => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activeCategory === c ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-slate-400 mb-2 font-medium">Priority</p>
          <div className="flex gap-2">
            {['All', 'High', 'Medium', 'Low'].map(p => (
              <button key={p} onClick={() => setActivePriority(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  activePriority === p ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Announcements List */}
      <div className="space-y-4">
        {filtered.map(announcement => {
          const config = CATEGORY_CONFIG[announcement.category];
          return (
            <div key={announcement.id} className="card touch-card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 ${config.bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <config.icon size={18} className={config.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-slate-800">{announcement.title}</h3>
                      <span className={`badge text-xs ${PRIORITY_BADGE[announcement.priority]}`}>{announcement.priority}</span>
                      <span className="badge badge-gray text-xs">{announcement.category}</span>
                    </div>
                    <button
                      onClick={() => handleDelete(announcement.id)}
                      className="p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg flex-shrink-0 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  <p className="text-xs text-slate-400 mt-0.5">
                    Posted by {announcement.postedBy} · {new Date(announcement.postedOn).toLocaleDateString('en-IN', {
                      day: 'numeric', month: 'short', year: 'numeric'
                    })}
                  </p>
                  <p className="text-sm text-slate-600 mt-2 leading-relaxed">{announcement.content}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="card text-center py-12">
            <Bell size={40} className="text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No announcements for selected filters</p>
          </div>
        )}
      </div>

      <button className="fab mobile-only" onClick={() => setShowModal(true)}><Plus size={22} color="#fff"/></button>

      {showModal && <NewAnnouncementModal onClose={() => setShowModal(false)} onSubmit={handleNew} />}
    </div>
  );
}
