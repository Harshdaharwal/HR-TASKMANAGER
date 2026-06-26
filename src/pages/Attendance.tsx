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
   FACE RECOGNITION — face-api.js CDN approach
   ═══════════════════════════════════════════════════════ */

// face-api.js CDN (loaded dynamically when FaceTab first mounts)
const FACEAPI_CDN = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const MODEL_URL   = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
let faceapiReady  = false;

async function ensureFaceAPI(): Promise<boolean> {
  if (faceapiReady) return true;
  return new Promise((resolve) => {
    if ((window as any).faceapi) { faceapiReady = true; resolve(true); return; }
    const timer = setTimeout(() => resolve(false), 35000);
    const s = document.createElement('script');
    s.src = FACEAPI_CDN;
    s.onload = async () => {
      const fa = (window as any).faceapi;
      try {
        await Promise.all([
          fa.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          fa.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
          fa.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
        ]);
        clearTimeout(timer);
        faceapiReady = true;
        resolve(true);
      } catch { clearTimeout(timer); resolve(false); }
    };
    s.onerror = () => { clearTimeout(timer); resolve(false); };
    document.head.appendChild(s);
  });
}

interface StoredFace {
  id?: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  descriptor: Float32Array;
}

function FaceTab({ employees: propEmployees, currentUser, onAttendanceMarked }: { employees: Employee[]; currentUser: { name: string; role: string; avatar: string; email: string }; onAttendanceMarked: (r: AttendanceRecord) => void }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const [mode, setMode] = useState<'checkin' | 'register'>('checkin');
  const [phase, setPhase] = useState<'idle'|'loading'|'camera'|'detected'|'done'|'error'>('idle');
  const [msg, setMsg] = useState('');
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [detectedEmp, setDetectedEmp] = useState<{ name: string; dept: string; id: string } | null>(null);
  const [storedFaces, setStoredFaces] = useState<StoredFace[]>([]);
  const [registeredList, setRegisteredList] = useState<Array<{ id?: string; employeeId: string; employeeName: string }>>([]);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);

  // Build employee list: prop employees + always include current user as fallback
  const employees = (() => {
    const list = localEmployees.length > 0 ? localEmployees : propEmployees;
    const currentAsEmp: Employee = {
      id: 'current-user',
      employeeId: 'YOU',
      name: currentUser.name,
      email: currentUser.email,
      department: 'HR' as import('../types').Department,
      designation: currentUser.role,
      status: 'Active',
      salary: 0, joinDate: '', dob: '', gender: 'Male',
      address: '', manager: '', skills: [], education: '',
      avatar: currentUser.avatar, phone: '',
    };
    const already = list.find(e => e.name === currentUser.name || e.email === currentUser.email);
    return already ? list : [currentAsEmp, ...list];
  })();

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef   = useRef<number | null>(null);
  const matchCount = useRef<Record<string, number>>({});

  const loadModels = useCallback(async () => {
    setPhase('loading');
    setMsg('Loading face recognition models (~6 MB, cached after first load)...');
    const ok = await ensureFaceAPI();
    if (!ok) {
      setPhase('error');
      setMsg('Failed to load face recognition models. Check your internet connection and try again.');
      return;
    }
    try {
      const rows = await api.get<any[]>('/biometric');
      const faces: StoredFace[] = (rows ?? [])
        .filter((r: any) => r.faceDescriptor)
        .map((r: any) => ({ id: r.id, employeeId: r.employeeId, employeeName: r.employeeName, employeeDepartment: r.employeeDepartment, descriptor: new Float32Array(JSON.parse(r.faceDescriptor)) }));
      setStoredFaces(faces);
      setRegisteredList((rows ?? []).filter((r: any) => r.faceDescriptor).map((r: any) => ({ id: r.id, employeeId: r.employeeId, employeeName: r.employeeName })));
    } catch {
      // API offline → load from localStorage (works on Vercel / phone without backend)
      const local = lsLoadFaces();
      setStoredFaces(local.map(f => ({ ...f, descriptor: new Float32Array(f.descriptor) })));
      setRegisteredList(local.map(f => ({ employeeId: f.employeeId, employeeName: f.employeeName })));
    }
    setPhase('idle');
    setMsg('');
  }, []);

  // Load models + stored faces + employees on first mount
  useEffect(() => {
    if (propEmployees.length === 0) {
      api.get<Employee[]>('/employees').then(d => { if (d && d.length) setLocalEmployees(d); }).catch(() => {});
    }
    loadModels();
    return () => stopCamera();
  }, [propEmployees.length, loadModels]);

  const stopCamera = () => {
    if (loopRef.current) { cancelAnimationFrame(loopRef.current); loopRef.current = null; }
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setPhase('camera'); setMsg(''); matchCount.current = {};
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } } });
      streamRef.current = stream;
      const vid = videoRef.current!;
      vid.srcObject = stream;
      await vid.play();
      startLoop();
    } catch {
      setPhase('error'); setMsg('Camera access denied. Please allow camera in browser settings.');
    }
  };

  const startLoop = () => {
    const fa = (window as any).faceapi;
    const THRESHOLD = 0.55;   // slightly lenient for real-world lighting
    const CONFIRM = 8;         // total matches needed (not consecutive)
    let framesSinceLastMatch = 0;

    const tick = async () => {
      const vid = videoRef.current;
      if (!vid || vid.readyState < 2) { loopRef.current = requestAnimationFrame(tick); return; }
      try {
        const det = await fa.detectSingleFace(vid, new fa.TinyFaceDetectorOptions({ inputSize: 224, scoreThreshold: 0.45 }))
          .withFaceLandmarks(true).withFaceDescriptor();
        const canvas = canvasRef.current;
        if (canvas) {
          // Only reset canvas dimensions when they actually change
          if (canvas.width !== vid.videoWidth) canvas.width = vid.videoWidth;
          if (canvas.height !== vid.videoHeight) canvas.height = vid.videoHeight;
          const ctx = canvas.getContext('2d')!;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          if (det) drawBox(ctx, det.detection.box);
        }
        if (det && mode === 'checkin' && storedFaces.length > 0) {
          let best: { face: StoredFace; dist: number } | null = null;
          for (const sf of storedFaces) {
            const dist = fa.euclideanDistance(det.descriptor, sf.descriptor);
            if (!best || dist < best.dist) best = { face: sf, dist };
          }
          if (best && best.dist < THRESHOLD) {
            framesSinceLastMatch = 0;
            const key = best.face.employeeId;
            // Accumulate — don't reset on misses; single bad frame won't kill progress
            matchCount.current[key] = (matchCount.current[key] || 0) + 1;
            if (matchCount.current[key] >= CONFIRM) {
              stopCamera();
              setDetectedEmp({ name: best.face.employeeName, dept: best.face.employeeDepartment, id: best.face.employeeId });
              setPhase('detected');
              return;
            }
          } else {
            framesSinceLastMatch++;
            // Reset only after ~5 s of no match so stale counts don't linger
            if (framesSinceLastMatch > 300) {
              matchCount.current = {};
              framesSinceLastMatch = 0;
            }
          }
        }
      } catch { /* ignore individual frame errors */ }
      loopRef.current = requestAnimationFrame(tick);
    };
    loopRef.current = requestAnimationFrame(tick);
  };

  const drawBox = (ctx: CanvasRenderingContext2D, box: any) => {
    const { x, y, width: w, height: h } = box;
    ctx.strokeStyle = '#3b82f6'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    const L = 18; ctx.strokeStyle = '#60a5fa'; ctx.lineWidth = 3;
    [[x,y+L,x,y,x+L,y],[x+w-L,y,x+w,y,x+w,y+L],[x,y+h-L,x,y+h,x+L,y+h],[x+w-L,y+h,x+w,y+h,x+w,y+h-L]].forEach(([x1,y1,x2,y2,x3,y3]) => {
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.lineTo(x3,y3); ctx.stroke();
    });
  };

  const captureAndRegister = async () => {
    const fa = (window as any).faceapi;
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) return;
    setMsg('Detecting face...');
    try {
      const det = await fa.detectSingleFace(videoRef.current!, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 }))
        .withFaceLandmarks(true).withFaceDescriptor();
      if (!det) { setMsg('No face detected. Look directly at the camera.'); return; }
      const descriptorArr = Array.from(det.descriptor);
      const descriptor = JSON.stringify(descriptorArr);
      const record = { employeeId: emp.id, employeeName: emp.name, employeeDepartment: emp.department, faceDescriptor: descriptor, type: 'face', registeredAt: new Date().toISOString() };
      try {
        await api.post('/biometric', record);
      } catch {
        // API offline → save to localStorage so it works on Vercel/phone
        lsSaveFace({ employeeId: emp.id, employeeName: emp.name, employeeDepartment: emp.department, descriptor: descriptorArr });
      }
      setStoredFaces(prev => [...prev, { employeeId: emp.id, employeeName: emp.name, employeeDepartment: emp.department, descriptor: det.descriptor }]);
      setRegisteredList(prev => [...prev, { employeeId: emp.id, employeeName: emp.name }]);
      stopCamera(); setPhase('done'); setMsg(`${emp.name}'s face registered!`); setSelectedEmpId('');
    } catch (err: any) {
      setMsg(`Error: ${err.message}`); setPhase('error');
    }
  };

  const confirmAttendance = async () => {
    if (!detectedEmp) return;
    const record: AttendanceRecord = {
      id: String(Date.now()),
      employeeId: detectedEmp.id,
      employeeName: detectedEmp.name,
      date: todayISO(),
      checkIn: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      checkOut: '',
      status: 'Present',
      workHours: 0,
    };
    try {
      await api.post('/attendance', record);
    } catch { lsSaveAttendance(record); }
    onAttendanceMarked(record);
    setAttendanceDone(true);
  };

  const resetAll = () => { setPhase('idle'); setMsg(''); setDetectedEmp(null); setAttendanceDone(false); stopCamera(); };

  if (phase === 'loading') {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: 14 }}>{msg}</p>
      </div>
    );
  }

  if (phase === 'error' && msg.toLowerCase().includes('model')) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <p style={{ color: '#ef4444', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>{msg}</p>
        <button onClick={loadModels} className="btn btn-primary">Retry Loading Models</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="tab-bar bio-sub-tabs">
        {(['checkin','register'] as const).map(m => (
          <button key={m} className={`tab-item ${mode === m ? 'active' : ''}`} onClick={() => { setMode(m); resetAll(); }}>
            {m === 'checkin' ? '📷 Face Check-in' : '📝 Register Face'}
          </button>
        ))}
      </div>

      {/* Camera + canvas overlay */}
      {phase === 'camera' && (
        <div className="glass-card" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', background: '#000' }}>
            <video ref={videoRef} style={{ width: '100%', display: 'block', borderRadius: 12 }} muted playsInline />
            <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', borderRadius: 12 }} />
          </div>
          {msg && <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center' }}>{msg}</p>}
          {mode === 'register' && (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => { stopCamera(); setPhase('idle'); }} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
              <button onClick={captureAndRegister} className="btn btn-primary" style={{ flex: 1 }}>Capture Face</button>
            </div>
          )}
          {mode === 'checkin' && <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', fontWeight: 600 }}>🔍 Identifying... look at camera</p>}
        </div>
      )}

      {/* CHECK-IN MODE — idle/detected/done */}
      {mode === 'checkin' && phase !== 'camera' && (
        <div className="glass-card bio-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '28px 20px' }}>
          {phase === 'detected' || attendanceDone ? (
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="face-avatar-lg" style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg,#10b981,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: '#fff', fontWeight: 800 }}>
                {detectedEmp?.name.charAt(0).toUpperCase()}
              </div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 22, margin: 0 }}>{detectedEmp?.name}</h2>
                <p style={{ color: '#64748b', fontSize: 14, margin: '4px 0 0' }}>{detectedEmp?.dept}</p>
                {!attendanceDone && <p style={{ color: '#10b981', fontSize: 13, fontWeight: 700, marginTop: 8 }}>✓ Face Identified</p>}
                {attendanceDone && <p style={{ color: '#10b981', fontSize: 14, fontWeight: 700, marginTop: 8 }}>✅ Attendance Marked!</p>}
              </div>
              {!attendanceDone ? (
                <div style={{ display: 'flex', gap: 10, width: '100%' }}>
                  <button onClick={resetAll} className="btn btn-ghost" style={{ flex: 1 }}>Cancel</button>
                  <button onClick={confirmAttendance} className="btn btn-primary" style={{ flex: 1 }}>Mark as Present</button>
                </div>
              ) : (
                <button onClick={resetAll} className="btn btn-primary">Scan Next Person</button>
              )}
            </div>
          ) : (
            <>
              <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 20, margin: 0 }}>Face ID Attendance</h2>
              <p style={{ color: '#64748b', fontSize: 14, textAlign: 'center', margin: 0 }}>
                {storedFaces.length === 0 ? 'No faces registered yet. Go to Register Face first.' : `${storedFaces.length} face(s) registered. Open camera to identify.`}
              </p>
              <button onClick={startCamera} disabled={storedFaces.length === 0} className="btn btn-primary" style={{ padding: '14px 36px', fontSize: 15, borderRadius: 14 }}>
                📷 Open Camera
              </button>
              {phase === 'error' && <p style={{ color: '#ef4444', fontSize: 13 }}>{msg}</p>}
            </>
          )}
        </div>
      )}

      {/* REGISTER MODE */}
      {mode === 'register' && phase !== 'camera' && (
        <div className="glass-card bio-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, padding: '24px 20px' }}>
          <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: 20, margin: 0 }}>Register Face</h2>
          <p style={{ color: '#64748b', fontSize: 13, textAlign: 'center', margin: 0 }}>Select employee, open camera, then click Capture</p>
          <select value={selectedEmpId} onChange={e => { setSelectedEmpId(e.target.value); setMsg(''); }} className="input" style={{ width: '100%' }}>
            <option value="">— Select Employee —</option>
            {employees.map(e => {
              const reg = registeredList.some(r => r.employeeId === e.id);
              return <option key={e.id} value={e.id}>{e.name} — {e.department}{reg ? ' ✓' : ''}</option>;
            })}
          </select>
          {(phase === 'done' || phase === 'error') && msg && (
            <div style={{ padding: '12px 20px', borderRadius: 12, fontSize: 14, fontWeight: 600, textAlign: 'center', width: '100%', background: phase === 'done' ? '#d1fae5' : '#fee2e2', color: phase === 'done' ? '#065f46' : '#991b1b' }}>{msg}</div>
          )}
          <button onClick={startCamera} disabled={!selectedEmpId} className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: 15 }}>
            📷 Open Camera
          </button>
          {registeredList.length > 0 && (
            <div style={{ width: '100%' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 10 }}>Registered Faces ({registeredList.length})</p>
              {registeredList.map((r, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', borderRadius: 10, background: '#f8fafc', border: '1px solid #e2e8f0', marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: 14 }}>{r.employeeName}</span>
                  <span className="badge badge-green" style={{ fontSize: 11 }}>Face ID</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
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

function b64url2buf(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  const padded = b64.padEnd(b64.length + (4 - (b64.length % 4)) % 4, '=');
  return Uint8Array.from(atob(padded), c => c.charCodeAt(0));
}

// ── localStorage fallback (used when backend is unreachable, e.g. Vercel deploy) ──
const LS_FACES      = 'nexhr_faces';
const LS_BIO        = 'nexhr_biometric';
const LS_ATTENDANCE = 'nexhr_attendance';

function lsLoadFaces(): Array<Omit<StoredFace, 'descriptor'> & { descriptor: number[] }> {
  try { const d = localStorage.getItem(LS_FACES); return d ? JSON.parse(d) : []; } catch { return []; }
}
function lsSaveFace(f: { employeeId: string; employeeName: string; employeeDepartment: string; descriptor: number[] }) {
  try {
    const prev = lsLoadFaces().filter(x => x.employeeId !== f.employeeId);
    localStorage.setItem(LS_FACES, JSON.stringify([...prev, f]));
  } catch {}
}
function lsLoadBio(): BiometricRecord[] {
  try { const d = localStorage.getItem(LS_BIO); return d ? JSON.parse(d) : []; } catch { return []; }
}
function lsSaveBio(r: BiometricRecord) {
  try {
    const prev = lsLoadBio().filter(x => x.credentialId !== r.credentialId);
    localStorage.setItem(LS_BIO, JSON.stringify([...prev, r]));
  } catch {}
}
function lsLoadAttendance(date: string): AttendanceRecord[] {
  try { const d = localStorage.getItem(LS_ATTENDANCE); const all: AttendanceRecord[] = d ? JSON.parse(d) : []; return all.filter(r => r.date === date); } catch { return []; }
}
function lsSaveAttendance(r: AttendanceRecord) {
  try {
    const all: AttendanceRecord[] = (() => { try { return JSON.parse(localStorage.getItem(LS_ATTENDANCE) || '[]'); } catch { return []; } })();
    const filtered = all.filter(x => !(x.employeeId === r.employeeId && x.date === r.date));
    localStorage.setItem(LS_ATTENDANCE, JSON.stringify([r, ...filtered]));
  } catch {}
}

function BiometricTab({ employees: propEmployees, currentUser, onAttendanceMarked }: { employees: Employee[]; currentUser: { name: string; role: string; avatar: string; email: string }; onAttendanceMarked: (r: AttendanceRecord) => void }) {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 600;
  const [mode, setMode] = useState<'checkin' | 'register'>('checkin');
  const [scanning, setScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [detected, setDetected] = useState<BiometricRecord | null>(null);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [registered, setRegistered] = useState<BiometricRecord[]>([]);
  const [attendanceDone, setAttendanceDone] = useState(false);
  const [localEmployees, setLocalEmployees] = useState<Employee[]>([]);

  // Build dropdown list — always include the currently logged-in user
  const employees = (() => {
    const list = localEmployees.length > 0 ? localEmployees : propEmployees;
    const currentAsEmp: Employee = {
      id: 'current-user',
      employeeId: 'YOU',
      name: currentUser.name,
      email: currentUser.email,
      department: 'HR' as import('../types').Department,
      designation: currentUser.role,
      status: 'Active',
      salary: 0, joinDate: '', dob: '', gender: 'Male',
      address: '', manager: '', skills: [], education: '',
      avatar: currentUser.avatar, phone: '',
    };
    const already = list.find(e => e.name === currentUser.name || e.email === currentUser.email);
    return already ? list : [currentAsEmp, ...list];
  })();

  const isSupported = typeof PublicKeyCredential !== 'undefined';
  const isSecureContext = window.isSecureContext || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  useEffect(() => {
    if (propEmployees.length === 0) {
      api.get<Employee[]>('/employees').then(d => { if (d && d.length) setLocalEmployees(d); }).catch(() => {});
    }
    // Only load fingerprint records (credentialId present), not face records
    api.get<any[]>('/biometric')
      .then(d => setRegistered((d ?? []).filter((r: any) => r.credentialId)))
      .catch(() => {
        // API offline → load from localStorage
        setRegistered(lsLoadBio());
      });
  }, [propEmployees.length]);

  const resetState = () => {
    setDetected(null); setMsg(''); setScanStatus('idle'); setAttendanceDone(false);
  };

  const handleRegister = async () => {
    const emp = employees.find(e => e.id === selectedEmpId);
    if (!emp) { setMsg('Please select an employee first'); setScanStatus('error'); return; }
    // Allow re-registration (user can register multiple fingers)
    setScanning(true); setMsg(''); setScanStatus('idle');
    try {
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: 'NeXHR', id: window.location.hostname },
          user: { id: new TextEncoder().encode(emp.id.slice(0, 64)), name: emp.email || emp.name, displayName: emp.name },
          pubKeyCredParams: [{ type: 'public-key', alg: -7 }, { type: 'public-key', alg: -257 }],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'preferred',   // 'required' blocks many Android devices
            residentKey: 'preferred',          // 'required' fails if device storage is full
          },
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
      try {
        await api.post('/biometric', record);
      } catch {
        // API offline → save to localStorage so check-in works on phone/Vercel
        lsSaveBio(record);
      }
      setRegistered(prev => [...prev, record]);
      setMsg(`${emp.name}'s fingerprint registered successfully!`);
      setScanStatus('success');
      setSelectedEmpId('');
    } catch (err: any) {
      const n = err?.name ?? '';
      if (n === 'NotAllowedError') setMsg('Cancelled or fingerprint not verified. Try again.');
      else if (n === 'InvalidStateError') setMsg('This exact fingerprint is already stored. Try a different finger.');
      else if (n === 'NotSupportedError') setMsg('Fingerprint not supported on this device/browser. Use Chrome on Android.');
      else if (n === 'SecurityError') setMsg('HTTPS required for fingerprint. Open via https:// or use localhost.');
      else setMsg(`${n ? n + ': ' : ''}${err?.message ?? 'Registration failed'}`);
      setScanStatus('error');
    } finally { setScanning(false); }
  };

  const handleCheckin = async () => {
    setScanning(true); setDetected(null); setMsg(''); setScanStatus('idle'); setAttendanceDone(false);
    try {
      // Build explicit allowCredentials from registered list — much more reliable than empty array
      const allowCredentials = registered
        .filter(r => r.credentialId)
        .map(r => {
          try { return { type: 'public-key' as const, id: b64url2buf(r.credentialId) }; }
          catch { return null; }
        })
        .filter((x): x is { type: 'public-key'; id: Uint8Array } => x !== null);

      if (allowCredentials.length === 0) {
        setMsg('No fingerprints registered yet. Please register first.');
        setScanStatus('error');
        setScanning(false);
        return;
      }

      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          userVerification: 'preferred',
          allowCredentials,
          timeout: 60000,
        },
      }) as PublicKeyCredential;

      const credentialId = buf2b64url(assertion.rawId);
      let result: BiometricRecord | null = null;
      try {
        result = await api.post<BiometricRecord | null>('/biometric/verify', { credentialId });
      } catch {
        // API offline → find in registered state or localStorage
        result = registered.find(r => r.credentialId === credentialId)
          ?? lsLoadBio().find(r => r.credentialId === credentialId)
          ?? null;
      }
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
    const record: AttendanceRecord = {
      id: String(Date.now()),
      employeeId: detected.employeeId,
      employeeName: detected.employeeName,
      date: todayISO(),
      checkIn: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false }),
      checkOut: '',
      status: 'Present',
      workHours: 0,
    };
    try {
      await api.post('/attendance', record);
    } catch { lsSaveAttendance(record); }
    onAttendanceMarked(record);
    setAttendanceDone(true);
    setMsg(`Attendance recorded for ${detected.employeeName}!`);
    setScanStatus('success');
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

  if (!isSecureContext) {
    return (
      <div className="glass-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Fingerprint size={48} style={{ color: '#f59e0b', marginBottom: 16 }} />
        <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, fontSize: 17, margin: '0 0 10px' }}>HTTPS Required</h3>
        <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.7, maxWidth: 380, margin: '0 auto' }}>
          Fingerprint scanning needs a <strong>secure connection</strong>.<br />
          On desktop open <strong>localhost:5173</strong>. On phone, use an HTTPS URL or connect via a tunnel (e.g. ngrok).
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
    <div style={{ maxWidth: 500, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Mode tabs */}
      <div className="tab-bar bio-sub-tabs">
        {(['checkin', 'register'] as const).map(m => (
          <button key={m} className={`tab-item ${mode === m ? 'active' : ''}`}
            onClick={() => { setMode(m); resetState(); }}>
            {m === 'checkin' ? '✅ Mark Attendance' : '🔑 Register Fingerprint'}
          </button>
        ))}
      </div>

      {/* ── CHECK-IN MODE ── */}
      {mode === 'checkin' && (
        <div className="glass-card bio-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 16 : 24, padding: isMobile ? '24px 16px' : '36px 24px' }}>
          {!detected || attendanceDone ? (
            <>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: isMobile ? 18 : 22, margin: '0 0 6px' }}>
                  {attendanceDone ? '✅ Attendance Marked!' : 'Fingerprint Check-in'}
                </h2>
                <p style={{ color: '#64748b', fontSize: 13, margin: 0 }}>
                  {attendanceDone ? msg : 'Place your finger on the sensor'}
                </p>
              </div>
              <button onClick={attendanceDone ? resetState : handleCheckin} disabled={scanning}
                className="fp-btn-lg"
                style={{ width: isMobile ? 120 : 150, height: isMobile ? 120 : 150, background: attendanceDone ? 'linear-gradient(135deg,#d1fae5,#a7f3d0)' : scanning ? 'rgba(139,92,246,0.07)' : 'linear-gradient(135deg,#eff6ff,#f0fdf4)', ...fpBtnStyle(scanning, attendanceDone) }}>
                <Fingerprint size={isMobile ? 50 : 64} color={attendanceDone ? '#10b981' : scanning ? '#8b5cf6' : '#3b82f6'} strokeWidth={1.2} />
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
        <div className="glass-card bio-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isMobile ? 14 : 24, padding: isMobile ? '20px 16px' : '28px 24px' }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text-primary)', fontWeight: 800, fontSize: isMobile ? 17 : 20, margin: '0 0 4px' }}>Register Fingerprint</h2>
            <p style={{ color: '#64748b', fontSize: 12, margin: 0 }}>Select employee then scan their finger on this device</p>
          </div>
          <select value={selectedEmpId}
            onChange={e => { setSelectedEmpId(e.target.value); setMsg(''); setScanStatus('idle'); }}
            className="input bio-select" style={{ width: '100%' }}>
            <option value="">— Select Employee —</option>
            {employees.map(e => {
              const isReg = registered.some(r => r.employeeId === e.id);
              return <option key={e.id} value={e.id}>{e.name} — {e.department}{isReg ? ' ✓' : ''}</option>;
            })}
          </select>
          <button onClick={handleRegister} disabled={!selectedEmpId || scanning}
            className="fp-btn-md"
            style={{ width: isMobile ? 96 : 120, height: isMobile ? 96 : 120, background: scanning ? 'rgba(139,92,246,0.08)' : selectedEmpId ? '#eff6ff' : '#f8fafc', ...fpBtnStyle(scanning) }}>
            <Fingerprint size={isMobile ? 40 : 52} color={scanning ? '#8b5cf6' : selectedEmpId ? '#3b82f6' : '#cbd5e1'} strokeWidth={1.2} />
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
  const { attendanceRecords, setAttendanceRecords, employees, currentUser } = useApp();
  const [mainTab, setMainTab] = useState<'records' | 'face' | 'biometric'>('records');
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
      if (data && data.length) {
        setAttendanceRecords(data);
      } else {
        const local = lsLoadAttendance(date);
        if (local.length > 0) setAttendanceRecords(local);
      }
    } catch {
      // API offline → prefer localStorage over mock data
      const local = lsLoadAttendance(date);
      if (local.length > 0) setAttendanceRecords(local);
    }
    finally { setLoading(false); }
  }, [setAttendanceRecords]);

  const handleAttendanceMarked = useCallback((record: AttendanceRecord) => {
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.employeeId === record.employeeId && r.date === record.date));
      return [record, ...filtered];
    });
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
  const monthPrefix = selectedDate.slice(0, 7); // "YYYY-MM"
  const monthlyData: DayAttendanceStat[] = Array.from({ length: daysInMonth }, (_, i) => {
    const dayStr = `${monthPrefix}-${String(i + 1).padStart(2, '0')}`;
    const dayRecords = attendanceRecords.filter(r => r.date === dayStr);
    return {
      day: i + 1,
      present: dayRecords.filter(r => r.status === 'Present').length,
      absent:  dayRecords.filter(r => r.status === 'Absent').length,
      wfh:     dayRecords.filter(r => r.status === 'Work From Home').length,
      halfDay: dayRecords.filter(r => r.status === 'Half Day').length,
    };
  });

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

      {/* ── Main Tabs: Records | Face | Fingerprint ── */}
      <div className="tab-bar attendance-tabs">
        <button className={`tab-item ${mainTab === 'records' ? 'active' : ''}`} onClick={() => setMainTab('records')}>📋 Records</button>
        <button className={`tab-item ${mainTab === 'face' ? 'active' : ''}`} onClick={() => setMainTab('face')}>👤 Face ID</button>
        <button className={`tab-item ${mainTab === 'biometric' ? 'active' : ''}`} onClick={() => setMainTab('biometric')} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
          <Fingerprint size={13} /> Fingerprint
        </button>
      </div>

      {/* ── Face Tab ── */}
      {mainTab === 'face' && <FaceTab employees={employees} currentUser={currentUser} onAttendanceMarked={handleAttendanceMarked} />}

      {/* ── Fingerprint Tab ── */}
      {mainTab === 'biometric' && <BiometricTab employees={employees} currentUser={currentUser} onAttendanceMarked={handleAttendanceMarked} />}

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
                      <td colSpan={7} style={{ textAlign: 'center', padding: '50px 20px' }}>
                        <Clock size={36} style={{ margin: '0 auto 12px', display: 'block', color: '#cbd5e1' }} />
                        <p style={{ color: '#94a3b8', fontSize: 14, fontWeight: 700, margin: '0 0 6px' }}>No attendance for {selectedDate}</p>
                        <p style={{ color: '#cbd5e1', fontSize: 12, margin: 0 }}>Use Face ID or Fingerprint tab to mark attendance</p>
                      </td>
                    </tr>
                  )
                  : filtered.map((record) => {
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
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
