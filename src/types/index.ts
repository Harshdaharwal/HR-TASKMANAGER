export type Department = 'Engineering' | 'Sales' | 'Marketing' | 'HR' | 'Finance' | 'Operations' | 'Design' | 'Legal';

export type EmployeeStatus = 'Active' | 'On Leave' | 'Resigned' | 'Probation';

export type LeaveType = 'Casual' | 'Sick' | 'Annual' | 'Maternity' | 'Paternity' | 'Unpaid';

export type LeaveStatus = 'Pending' | 'Approved' | 'Rejected';

export type AttendanceStatus = 'Present' | 'Absent' | 'Half Day' | 'Work From Home' | 'Holiday';

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: Department;
  designation: string;
  salary: number;
  joinDate: string;
  status: EmployeeStatus;
  avatar: string;
  gender: 'Male' | 'Female';
  dob: string;
  address: string;
  manager: string;
  employeeId: string;
  skills: string[];
  education: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedOn: string;
  approvedBy?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn: string;
  checkOut: string;
  status: AttendanceStatus;
  workHours: number;
}

export interface JobPosting {
  id: string;
  title: string;
  department: Department;
  location: string;
  type: 'Full Time' | 'Part Time' | 'Contract' | 'Internship';
  experience: string;
  salary: string;
  postedOn: string;
  closingDate: string;
  status: 'Open' | 'Closed' | 'On Hold';
  applicants: number;
  description: string;
}

export interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  jobId: string;
  jobTitle: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Technical' | 'HR Round' | 'Offer' | 'Hired' | 'Rejected';
  appliedOn: string;
  experience: string;
  skills: string[];
  rating: number;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  month: string;
  basicSalary: number;
  hra: number;
  allowances: number;
  pf: number;
  tax: number;
  netSalary: number;
  status: 'Paid' | 'Pending' | 'Processing';
  paidOn?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  category: 'General' | 'HR Policy' | 'Event' | 'Holiday' | 'Achievement' | 'Urgent';
  postedBy: string;
  postedOn: string;
  priority: 'Low' | 'Medium' | 'High';
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  department: Department;
  reviewPeriod: string;
  rating: number;
  goals: { goal: string; achieved: boolean; score: number }[];
  strengths: string[];
  improvements: string[];
  reviewedBy: string;
  reviewDate: string;
  status: 'Pending' | 'In Progress' | 'Completed';
}
