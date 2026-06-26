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
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Mock fallback data (shown when backend is offline) ──────────────────────
const MOCK_EMPLOYEES: Employee[] = [
  { id: 'm1', name: 'Rahul Sharma',   email: 'rahul@company.com',  phone: '+91 98765 43210', department: 'Engineering', designation: 'Senior Developer', salary: 120000, joinDate: '2022-03-15', status: 'Active',    avatar: 'RS', gender: 'Male',   dob: '1990-05-20', address: '123 MG Road, Bangalore',    manager: 'Harsh Daharwal', employeeId: 'EMP001', skills: ['React','TypeScript','Node.js'], education: 'B.Tech CS, IIT Bombay' },
  { id: 'm2', name: 'Priya Patel',    email: 'priya@company.com',  phone: '+91 87654 32109', department: 'Marketing',   designation: 'Marketing Lead',    salary:  85000, joinDate: '2021-07-10', status: 'Active',    avatar: 'PP', gender: 'Female', dob: '1993-08-14', address: '45 Park Street, Pune',       manager: 'Harsh Daharwal', employeeId: 'EMP002', skills: ['SEO','Content','Analytics'],  education: 'MBA Marketing, IIMA' },
  { id: 'm3', name: 'Amit Kumar',     email: 'amit@company.com',   phone: '+91 76543 21098', department: 'Finance',     designation: 'Finance Manager',   salary:  95000, joinDate: '2020-11-20', status: 'Active',    avatar: 'AK', gender: 'Male',   dob: '1988-12-01', address: '78 Brigade Road, Bangalore', manager: 'Harsh Daharwal', employeeId: 'EMP003', skills: ['Excel','Tally','Accounting'],  education: 'CA, ICAI' },
  { id: 'm4', name: 'Sneha Reddy',    email: 'sneha@company.com',  phone: '+91 65432 10987', department: 'HR',          designation: 'HR Executive',      salary:  75000, joinDate: '2023-01-05', status: 'Active',    avatar: 'SR', gender: 'Female', dob: '1995-03-22', address: '12 HSR Layout, Bangalore',   manager: 'Harsh Daharwal', employeeId: 'EMP004', skills: ['Recruitment','HRMS','Policy'],education: 'MBA HR, XLRI' },
  { id: 'm5', name: 'Vikram Singh',   email: 'vikram@company.com', phone: '+91 54321 09876', department: 'Sales',       designation: 'Sales Manager',     salary:  90000, joinDate: '2021-04-18', status: 'Active',    avatar: 'VS', gender: 'Male',   dob: '1991-07-10', address: '34 Jubilee Hills, Hyderabad', manager: 'Harsh Daharwal', employeeId: 'EMP005', skills: ['CRM','Salesforce','B2B'],    education: 'BBA, Delhi University' },
  { id: 'm6', name: 'Ananya Gupta',   email: 'ananya@company.com', phone: '+91 43210 98765', department: 'Design',      designation: 'UI/UX Designer',    salary:  80000, joinDate: '2022-09-12', status: 'On Leave', avatar: 'AG', gender: 'Female', dob: '1994-11-30', address: '56 Koregaon Park, Pune',     manager: 'Harsh Daharwal', employeeId: 'EMP006', skills: ['Figma','Adobe XD','Sketch'],  education: 'B.Des NID Ahmedabad' },
  { id: 'm7', name: 'Rohan Mehta',    email: 'rohan@company.com',  phone: '+91 32109 87654', department: 'Engineering', designation: 'Backend Developer', salary: 100000, joinDate: '2021-12-01', status: 'Active',    avatar: 'RM', gender: 'Male',   dob: '1992-04-15', address: '90 Indiranagar, Bangalore',  manager: 'Rahul Sharma',   employeeId: 'EMP007', skills: ['Python','Django','AWS'],     education: 'B.Tech, NIT Trichy' },
  { id: 'm8', name: 'Kavita Joshi',   email: 'kavita@company.com', phone: '+91 21098 76543', department: 'Operations',  designation: 'Ops Coordinator',   salary:  70000, joinDate: '2023-06-20', status: 'Probation', avatar: 'KJ', gender: 'Female', dob: '1996-01-25', address: '23 Whitefield, Bangalore',   manager: 'Harsh Daharwal', employeeId: 'EMP008', skills: ['Excel','ERP','Logistics'],   education: 'B.Com, Osmania University' },
];

const MOCK_LEAVE: LeaveRequest[] = [
  { id: 'l1', employeeId: 'EMP006', employeeName: 'Ananya Gupta',  department: 'Design',      leaveType: 'Sick',    startDate: '2026-06-20', endDate: '2026-06-24', days: 5, reason: 'Fever and rest required',       status: 'Approved', appliedOn: '2026-06-19', approvedBy: 'Harsh Daharwal' },
  { id: 'l2', employeeId: 'EMP002', employeeName: 'Priya Patel',   department: 'Marketing',   leaveType: 'Casual',  startDate: '2026-06-25', endDate: '2026-06-25', days: 1, reason: 'Personal work',                  status: 'Pending',  appliedOn: '2026-06-22' },
  { id: 'l3', employeeId: 'EMP005', employeeName: 'Vikram Singh',  department: 'Sales',       leaveType: 'Annual',  startDate: '2026-07-01', endDate: '2026-07-05', days: 5, reason: 'Family vacation',                status: 'Pending',  appliedOn: '2026-06-20' },
  { id: 'l4', employeeId: 'EMP007', employeeName: 'Rohan Mehta',   department: 'Engineering', leaveType: 'Casual',  startDate: '2026-06-18', endDate: '2026-06-18', days: 1, reason: 'Bank work',                      status: 'Approved', appliedOn: '2026-06-17', approvedBy: 'Rahul Sharma' },
  { id: 'l5', employeeId: 'EMP004', employeeName: 'Sneha Reddy',   department: 'HR',          leaveType: 'Sick',    startDate: '2026-06-10', endDate: '2026-06-11', days: 2, reason: 'Not feeling well',               status: 'Rejected', appliedOn: '2026-06-09', approvedBy: 'Harsh Daharwal' },
  { id: 'l6', employeeId: 'EMP008', employeeName: 'Kavita Joshi',  department: 'Operations',  leaveType: 'Casual',  startDate: '2026-06-28', endDate: '2026-06-28', days: 1, reason: 'Appointment',                    status: 'Pending',  appliedOn: '2026-06-22' },
];

const today = new Date().toISOString().slice(0, 10);
const MOCK_ATTENDANCE: AttendanceRecord[] = [
  { id: 'a1', employeeId: 'EMP001', employeeName: 'Rahul Sharma',  date: today, checkIn: '09:12', checkOut: '18:45', status: 'Present',          workHours: 9.5 },
  { id: 'a2', employeeId: 'EMP002', employeeName: 'Priya Patel',   date: today, checkIn: '09:30', checkOut: '18:00', status: 'Present',          workHours: 8.5 },
  { id: 'a3', employeeId: 'EMP003', employeeName: 'Amit Kumar',    date: today, checkIn: '10:00', checkOut: '19:00', status: 'Present',          workHours: 9.0 },
  { id: 'a4', employeeId: 'EMP004', employeeName: 'Sneha Reddy',   date: today, checkIn: '',       checkOut: '',      status: 'Absent',           workHours: 0   },
  { id: 'a5', employeeId: 'EMP005', employeeName: 'Vikram Singh',  date: today, checkIn: '09:00', checkOut: '14:00', status: 'Half Day',         workHours: 5.0 },
  { id: 'a6', employeeId: 'EMP006', employeeName: 'Ananya Gupta',  date: today, checkIn: '',       checkOut: '',      status: 'Absent',           workHours: 0   },
  { id: 'a7', employeeId: 'EMP007', employeeName: 'Rohan Mehta',   date: today, checkIn: '09:05', checkOut: '18:30', status: 'Present',          workHours: 9.4 },
  { id: 'a8', employeeId: 'EMP008', employeeName: 'Kavita Joshi',  date: today, checkIn: '09:15', checkOut: '18:15', status: 'Work From Home',   workHours: 9.0 },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 768);
  const [apiOnline, setApiOnline] = useState(false);

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

  // Try to load from API on mount; fall back to mock data if offline
  useEffect(() => {
    async function loadFromApi() {
      try {
        const [emps, leaves, att] = await Promise.all([
          api.get<Employee[]>('/employees'),
          api.get<LeaveRequest[]>('/leave'),
          api.get<AttendanceRecord[]>('/attendance'),
        ]);
        setEmployees(emps?.length ? emps : MOCK_EMPLOYEES);
        setLeaveRequests(leaves?.length ? leaves : MOCK_LEAVE);
        setAttendanceRecords(att?.length ? att : []); // no fake records — only real check-ins
        setApiOnline(true);
      } catch {
        setEmployees(MOCK_EMPLOYEES);
        setLeaveRequests(MOCK_LEAVE);
        setAttendanceRecords([]); // API offline — start empty, real data comes from localStorage
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
      currentUser, sidebarOpen, setSidebarOpen, apiOnline, darkMode, toggleDarkMode,
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
