import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, LeaveRequest, AttendanceRecord, PayrollRecord, Announcement } from '../types';
import { api } from '../api/client';

interface AppContextType {
  employees: Employee[];
  setEmployees: React.Dispatch<React.SetStateAction<Employee[]>>;
  leaveRequests: LeaveRequest[];
  setLeaveRequests: React.Dispatch<React.SetStateAction<LeaveRequest[]>>;
  attendanceRecords: AttendanceRecord[];
  setAttendanceRecords: React.Dispatch<React.SetStateAction<AttendanceRecord[]>>;
  payrollRecords: PayrollRecord[];
  setPayrollRecords: React.Dispatch<React.SetStateAction<PayrollRecord[]>>;
  announcements: Announcement[];
  setAnnouncements: React.Dispatch<React.SetStateAction<Announcement[]>>;
  currentUser: { name: string; role: string; avatar: string; email: string };
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  apiOnline: boolean;
  apiError: string;
  retryApi: () => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);


export function AppProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [apiOnline, setApiOnline] = useState(false);
  const [apiError, setApiError] = useState('');

  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? saved === 'true' : window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const currentUser = { name: 'Harsh Daharwal', role: 'HR Manager', avatar: 'HD', email: 'harsh@company.com' };

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    localStorage.setItem('darkMode', String(darkMode));
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(d => !d);

  const loadFromApi = React.useCallback(async (isRetry = false) => {
    try {
      setApiError('');
      const [emps, leaves, att] = await Promise.all([
        api.get<Employee[]>('/employees'),
        api.get<LeaveRequest[]>('/leave'),
        api.get<AttendanceRecord[]>('/attendance'),
      ]);
      setEmployees(emps ?? []);
      setLeaveRequests(leaves ?? []);
      setAttendanceRecords(att ?? []);
      setApiOnline(true);
      setApiError('');
    } catch (err: unknown) {
      if (!isRetry) {
        setTimeout(() => loadFromApi(true), 4000);
      } else {
        const msg = err instanceof Error ? err.message : String(err);
        console.error('[NeXHR] API offline:', msg);
        setApiOnline(false);
        // Try health endpoint for specific Google Sheets error
        try {
          const BASE = (import.meta.env.VITE_API_URL as string | undefined)
            || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');
          const h = await fetch(`${BASE}/health`);
          const j = await h.json();
          if (!j.success) setApiError(j.error || 'Google Sheets auth failed');
          else { setApiOnline(true); setApiError(''); }
        } catch {
          setApiError(import.meta.env.PROD ? 'Serverless function unreachable' : 'Run: npm run server');
        }
      }
    }
  }, []);

  const retryApi = React.useCallback(() => loadFromApi(false), [loadFromApi]);

  useEffect(() => { loadFromApi(); }, [loadFromApi]);

  return (
    <AppContext.Provider value={{
      employees, setEmployees,
      leaveRequests, setLeaveRequests,
      attendanceRecords, setAttendanceRecords,
      payrollRecords, setPayrollRecords,
      announcements, setAnnouncements,
      currentUser, sidebarOpen, setSidebarOpen, apiOnline, apiError, retryApi, darkMode, toggleDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
