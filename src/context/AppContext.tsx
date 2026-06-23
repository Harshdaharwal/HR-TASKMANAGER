import React, { createContext, useContext, useState, useEffect } from 'react';
import type { Employee, LeaveRequest, AttendanceRecord, PayrollRecord, Announcement } from '../types';
import { api } from '../api/client';

// Minimal mock fallback data (used when API not available)
const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', employeeId: 'EMP001', name: 'Rahul Sharma', email: 'rahul@company.com', phone: '9876543210', department: 'Engineering', designation: 'Senior Developer', salary: 85000, joinDate: '2022-03-15', status: 'Active', avatar: 'RS', gender: 'Male', dob: '1992-05-20', address: 'Noida, UP', manager: 'Priya Mehta', skills: ['React', 'Node.js'], education: 'B.Tech CS' },
  { id: '2', employeeId: 'EMP002', name: 'Priya Mehta', email: 'priya@company.com', phone: '9876543211', department: 'Engineering', designation: 'Tech Lead', salary: 120000, joinDate: '2020-08-01', status: 'Active', avatar: 'PM', gender: 'Female', dob: '1989-11-15', address: 'Bangalore', manager: 'CEO', skills: ['Java', 'AWS'], education: 'M.Tech' },
  { id: '3', employeeId: 'EMP003', name: 'Amit Singh', email: 'amit@company.com', phone: '9876543212', department: 'Sales', designation: 'Sales Manager', salary: 95000, joinDate: '2021-01-10', status: 'Active', avatar: 'AS', gender: 'Male', dob: '1987-03-25', address: 'Mumbai', manager: 'CEO', skills: ['CRM', 'B2B Sales'], education: 'MBA' },
  { id: '4', employeeId: 'EMP004', name: 'Neha Gupta', email: 'neha@company.com', phone: '9876543213', department: 'HR', designation: 'HR Manager', salary: 75000, joinDate: '2019-06-20', status: 'Active', avatar: 'NG', gender: 'Female', dob: '1991-08-10', address: 'Delhi', manager: 'CEO', skills: ['Recruitment', 'Payroll'], education: 'MBA HR' },
  { id: '5', employeeId: 'EMP005', name: 'Vikram Joshi', email: 'vikram@company.com', phone: '9876543214', department: 'Marketing', designation: 'Marketing Manager', salary: 80000, joinDate: '2021-11-22', status: 'On Leave', avatar: 'VJ', gender: 'Male', dob: '1990-02-14', address: 'Hyderabad', manager: 'CEO', skills: ['SEO', 'Google Ads'], education: 'BBA' },
];

const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'A1', employeeId: '1', employeeName: 'Rahul Sharma', date: new Date().toISOString().slice(0, 10), checkIn: '09:02', checkOut: '18:35', status: 'Present', workHours: 9.5 },
  { id: 'A2', employeeId: '2', employeeName: 'Priya Mehta', date: new Date().toISOString().slice(0, 10), checkIn: '08:45', checkOut: '19:00', status: 'Present', workHours: 10.25 },
  { id: 'A3', employeeId: '3', employeeName: 'Amit Singh', date: new Date().toISOString().slice(0, 10), checkIn: '', checkOut: '', status: 'Work From Home', workHours: 8 },
  { id: 'A4', employeeId: '4', employeeName: 'Neha Gupta', date: new Date().toISOString().slice(0, 10), checkIn: '09:00', checkOut: '17:30', status: 'Present', workHours: 8.5 },
  { id: 'A5', employeeId: '5', employeeName: 'Vikram Joshi', date: new Date().toISOString().slice(0, 10), checkIn: '', checkOut: '', status: 'Absent', workHours: 0 },
];

const MOCK_LEAVES: LeaveRequest[] = [
  { id: 'L1', employeeId: '5', employeeName: 'Vikram Joshi', department: 'Marketing', leaveType: 'Sick', startDate: '2026-06-18', endDate: '2026-06-22', days: 5, reason: 'Viral fever', status: 'Approved', appliedOn: '2026-06-17', approvedBy: 'Neha Gupta' },
  { id: 'L2', employeeId: '1', employeeName: 'Rahul Sharma', department: 'Engineering', leaveType: 'Casual', startDate: '2026-06-25', endDate: '2026-06-26', days: 2, reason: 'Family function', status: 'Pending', appliedOn: '2026-06-19' },
  { id: 'L3', employeeId: '3', employeeName: 'Amit Singh', department: 'Sales', leaveType: 'Annual', startDate: '2026-07-01', endDate: '2026-07-05', days: 5, reason: 'Family vacation', status: 'Pending', appliedOn: '2026-06-18' },
];

const MOCK_ANNOUNCEMENTS: Announcement[] = [
  { id: 'AN1', title: 'New Health Insurance Policy Effective July 1', content: 'We are pleased to announce an upgraded health insurance policy. Cashless hospitalization up to ₹5L, OPD ₹10K/year, dental + vision benefits.', category: 'HR Policy', postedBy: 'Neha Gupta', postedOn: '2026-06-18', priority: 'High' },
  { id: 'AN2', title: 'Q1 Results — 140% Target Achieved!', content: 'Congratulations team! We achieved 140% of Q1 FY2026 revenue. Performance bonuses credited by June 30.', category: 'Achievement', postedBy: 'CEO Office', postedOn: '2026-06-12', priority: 'Medium' },
  { id: 'AN3', title: 'Office Closed — Eid Al-Adha (June 27)', content: 'Office closed on June 27 for Eid Al-Adha. WFH permitted for urgent deliverables with manager approval.', category: 'Holiday', postedBy: 'HR Department', postedOn: '2026-06-15', priority: 'High' },
];

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
  const [employees, setEmployees] = useState<Employee[]>(MOCK_EMPLOYEES);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>(MOCK_LEAVES);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(MOCK_ATTENDANCE);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>(MOCK_ANNOUNCEMENTS);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [apiOnline, setApiOnline] = useState(false);

  const currentUser = { name: 'Neha Gupta', role: 'HR Manager', avatar: 'NG', email: 'neha@company.com' };

  // Try to load from API on mount
  useEffect(() => {
    async function loadFromApi() {
      try {
        const [emps, leaves, att] = await Promise.all([
          api.get<Employee[]>('/employees'),
          api.get<LeaveRequest[]>('/leave'),
          api.get<AttendanceRecord[]>('/attendance'),
        ]);
        if (emps && emps.length > 0) {
          setEmployees(emps);
          setApiOnline(true);
        }
        if (leaves && leaves.length > 0) setLeaveRequests(leaves);
        if (att && att.length > 0) setAttendanceRecords(att);
      } catch {
        // API offline — use mock data
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
