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
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const currentUser = { name: 'Harsh Daharwal', role: 'HR Manager', avatar: 'HD', email: 'harsh@company.com' };

  // Try to load from API on mount
  useEffect(() => {
    async function loadFromApi() {
      try {
        const [emps, leaves, att] = await Promise.all([
          api.get<Employee[]>('/employees'),
          api.get<LeaveRequest[]>('/leave'),
          api.get<AttendanceRecord[]>('/attendance'),
        ]);
        setEmployees(emps ?? []);
        setLeaveRequests(leaves ?? []);
        setAttendanceRecords(att ?? []);
        setApiOnline(true);
      } catch {
        // API offline — leave state as empty arrays
        setApiOnline(false);
      }
    }
    loadFromApi();
  }, []);

  return (
    <AppContext.Provider value={{
      employees, setEmployees,
      leaveRequests, setLeaveRequests,
      attendanceRecords, setAttendanceRecords,
      payrollRecords, setPayrollRecords,
      announcements, setAnnouncements,
      currentUser, sidebarOpen, setSidebarOpen, apiOnline,
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
