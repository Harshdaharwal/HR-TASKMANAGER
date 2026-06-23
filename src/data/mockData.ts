import type { Employee, LeaveRequest, AttendanceRecord, JobPosting, Candidate, PayrollRecord, Announcement, PerformanceReview } from '../types';

export const employees: Employee[] = [
  { id: '1', employeeId: 'EMP001', name: 'Rahul Sharma', email: 'rahul.sharma@company.com', phone: '9876543210', department: 'Engineering', designation: 'Senior Developer', salary: 85000, joinDate: '2022-03-15', status: 'Active', avatar: 'RS', gender: 'Male', dob: '1992-05-20', address: 'Sector 62, Noida, UP', manager: 'Priya Mehta', skills: ['React', 'Node.js', 'TypeScript'], education: 'B.Tech Computer Science' },
  { id: '2', employeeId: 'EMP002', name: 'Priya Mehta', email: 'priya.mehta@company.com', phone: '9876543211', department: 'Engineering', designation: 'Tech Lead', salary: 120000, joinDate: '2020-08-01', status: 'Active', avatar: 'PM', gender: 'Female', dob: '1989-11-15', address: 'Koramangala, Bangalore', manager: 'Amit Singh', skills: ['Java', 'AWS', 'System Design'], education: 'M.Tech Software Engineering' },
  { id: '3', employeeId: 'EMP003', name: 'Amit Singh', email: 'amit.singh@company.com', phone: '9876543212', department: 'Sales', designation: 'Sales Manager', salary: 95000, joinDate: '2021-01-10', status: 'Active', avatar: 'AS', gender: 'Male', dob: '1987-03-25', address: 'Andheri, Mumbai', manager: 'CEO', skills: ['CRM', 'Negotiation', 'B2B Sales'], education: 'MBA Marketing' },
  { id: '4', employeeId: 'EMP004', name: 'Neha Gupta', email: 'neha.gupta@company.com', phone: '9876543213', department: 'HR', designation: 'HR Manager', salary: 75000, joinDate: '2019-06-20', status: 'Active', avatar: 'NG', gender: 'Female', dob: '1991-08-10', address: 'Dwarka, Delhi', manager: 'CEO', skills: ['Recruitment', 'Payroll', 'Compliance'], education: 'MBA Human Resources' },
  { id: '5', employeeId: 'EMP005', name: 'Rajan Verma', email: 'rajan.verma@company.com', phone: '9876543214', department: 'Finance', designation: 'Finance Analyst', salary: 70000, joinDate: '2022-09-05', status: 'Active', avatar: 'RV', gender: 'Male', dob: '1993-12-30', address: 'Salt Lake, Kolkata', manager: 'Neha Gupta', skills: ['Excel', 'Tally', 'GST'], education: 'CA Final' },
  { id: '6', employeeId: 'EMP006', name: 'Ananya Patel', email: 'ananya.patel@company.com', phone: '9876543215', department: 'Design', designation: 'UI/UX Designer', salary: 65000, joinDate: '2023-02-14', status: 'Active', avatar: 'AP', gender: 'Female', dob: '1995-07-18', address: 'Navrangpura, Ahmedabad', manager: 'Priya Mehta', skills: ['Figma', 'Adobe XD', 'Illustrator'], education: 'B.Des Visual Communication' },
  { id: '7', employeeId: 'EMP007', name: 'Vikram Joshi', email: 'vikram.joshi@company.com', phone: '9876543216', department: 'Marketing', designation: 'Digital Marketing Manager', salary: 80000, joinDate: '2021-11-22', status: 'On Leave', avatar: 'VJ', gender: 'Male', dob: '1990-02-14', address: 'Banjara Hills, Hyderabad', manager: 'Amit Singh', skills: ['SEO', 'Google Ads', 'Social Media'], education: 'BBA Marketing' },
  { id: '8', employeeId: 'EMP008', name: 'Sita Ram', email: 'sita.ram@company.com', phone: '9876543217', department: 'Operations', designation: 'Operations Executive', salary: 45000, joinDate: '2023-07-01', status: 'Probation', avatar: 'SR', gender: 'Male', dob: '1997-04-05', address: 'Vaishali Nagar, Jaipur', manager: 'Amit Singh', skills: ['Logistics', 'Inventory', 'ERP'], education: 'B.Com' },
  { id: '9', employeeId: 'EMP009', name: 'Kavya Reddy', email: 'kavya.reddy@company.com', phone: '9876543218', department: 'Engineering', designation: 'Backend Developer', salary: 72000, joinDate: '2022-05-18', status: 'Active', avatar: 'KR', gender: 'Female', dob: '1994-09-22', address: 'Madhapur, Hyderabad', manager: 'Priya Mehta', skills: ['Python', 'Django', 'PostgreSQL'], education: 'B.Tech IT' },
  { id: '10', employeeId: 'EMP010', name: 'Arjun Nair', email: 'arjun.nair@company.com', phone: '9876543219', department: 'Sales', designation: 'Business Development Executive', salary: 55000, joinDate: '2023-04-10', status: 'Active', avatar: 'AN', gender: 'Male', dob: '1996-01-28', address: 'Kakkanad, Kochi', manager: 'Amit Singh', skills: ['Lead Generation', 'Cold Calling', 'Presentations'], education: 'MBA' },
  { id: '11', employeeId: 'EMP011', name: 'Meera Iyer', email: 'meera.iyer@company.com', phone: '9876543220', department: 'Finance', designation: 'Senior Accountant', salary: 68000, joinDate: '2020-12-01', status: 'Active', avatar: 'MI', gender: 'Female', dob: '1988-06-15', address: 'T Nagar, Chennai', manager: 'Rajan Verma', skills: ['Accounting', 'Auditing', 'Taxation'], education: 'M.Com, CA' },
  { id: '12', employeeId: 'EMP012', name: 'Suresh Kumar', email: 'suresh.kumar@company.com', phone: '9876543221', department: 'Legal', designation: 'Legal Counsel', salary: 90000, joinDate: '2021-08-15', status: 'Active', avatar: 'SK', gender: 'Male', dob: '1986-10-20', address: 'Vasant Kunj, Delhi', manager: 'CEO', skills: ['Corporate Law', 'Compliance', 'Contracts'], education: 'LLB, LLM' },
];

export const leaveRequests: LeaveRequest[] = [
  { id: 'L001', employeeId: '7', employeeName: 'Vikram Joshi', department: 'Marketing', leaveType: 'Sick', startDate: '2026-06-18', endDate: '2026-06-22', days: 5, reason: 'Viral fever and doctor advised rest', status: 'Approved', appliedOn: '2026-06-17', approvedBy: 'Neha Gupta' },
  { id: 'L002', employeeId: '1', employeeName: 'Rahul Sharma', department: 'Engineering', leaveType: 'Casual', startDate: '2026-06-25', endDate: '2026-06-26', days: 2, reason: 'Family function', status: 'Pending', appliedOn: '2026-06-19' },
  { id: 'L003', employeeId: '6', employeeName: 'Ananya Patel', department: 'Design', leaveType: 'Annual', startDate: '2026-07-01', endDate: '2026-07-05', days: 5, reason: 'Family vacation', status: 'Pending', appliedOn: '2026-06-18' },
  { id: 'L004', employeeId: '10', employeeName: 'Arjun Nair', department: 'Sales', leaveType: 'Casual', startDate: '2026-06-15', endDate: '2026-06-15', days: 1, reason: 'Personal work', status: 'Approved', appliedOn: '2026-06-14', approvedBy: 'Amit Singh' },
  { id: 'L005', employeeId: '9', employeeName: 'Kavya Reddy', department: 'Engineering', leaveType: 'Sick', startDate: '2026-06-10', endDate: '2026-06-11', days: 2, reason: 'Not feeling well', status: 'Approved', appliedOn: '2026-06-10', approvedBy: 'Priya Mehta' },
  { id: 'L006', employeeId: '5', employeeName: 'Rajan Verma', department: 'Finance', leaveType: 'Annual', startDate: '2026-07-10', endDate: '2026-07-15', days: 6, reason: 'Planned holiday trip', status: 'Pending', appliedOn: '2026-06-19' },
  { id: 'L007', employeeId: '11', employeeName: 'Meera Iyer', department: 'Finance', leaveType: 'Maternity', startDate: '2026-08-01', endDate: '2026-10-31', days: 90, reason: 'Maternity leave', status: 'Approved', appliedOn: '2026-06-01', approvedBy: 'Neha Gupta' },
  { id: 'L008', employeeId: '3', employeeName: 'Amit Singh', department: 'Sales', leaveType: 'Casual', startDate: '2026-06-20', endDate: '2026-06-20', days: 1, reason: 'Child school event', status: 'Rejected', appliedOn: '2026-06-18' },
];

export const attendanceRecords: AttendanceRecord[] = [
  { id: 'A001', employeeId: '1', employeeName: 'Rahul Sharma', date: '2026-06-20', checkIn: '09:02', checkOut: '18:35', status: 'Present', workHours: 9.5 },
  { id: 'A002', employeeId: '2', employeeName: 'Priya Mehta', date: '2026-06-20', checkIn: '08:45', checkOut: '19:00', status: 'Present', workHours: 10.25 },
  { id: 'A003', employeeId: '3', employeeName: 'Amit Singh', date: '2026-06-20', checkIn: '10:15', checkOut: '18:00', status: 'Present', workHours: 7.75 },
  { id: 'A004', employeeId: '4', employeeName: 'Neha Gupta', date: '2026-06-20', checkIn: '09:00', checkOut: '17:30', status: 'Present', workHours: 8.5 },
  { id: 'A005', employeeId: '5', employeeName: 'Rajan Verma', date: '2026-06-20', checkIn: '', checkOut: '', status: 'Work From Home', workHours: 8 },
  { id: 'A006', employeeId: '6', employeeName: 'Ananya Patel', date: '2026-06-20', checkIn: '09:30', checkOut: '14:00', status: 'Half Day', workHours: 4.5 },
  { id: 'A007', employeeId: '7', employeeName: 'Vikram Joshi', date: '2026-06-20', checkIn: '', checkOut: '', status: 'Absent', workHours: 0 },
  { id: 'A008', employeeId: '8', employeeName: 'Sita Ram', date: '2026-06-20', checkIn: '09:10', checkOut: '18:15', status: 'Present', workHours: 9 },
  { id: 'A009', employeeId: '9', employeeName: 'Kavya Reddy', date: '2026-06-20', checkIn: '08:55', checkOut: '18:00', status: 'Present', workHours: 9 },
  { id: 'A010', employeeId: '10', employeeName: 'Arjun Nair', date: '2026-06-20', checkIn: '09:45', checkOut: '18:30', status: 'Present', workHours: 8.75 },
  { id: 'A011', employeeId: '11', employeeName: 'Meera Iyer', date: '2026-06-20', checkIn: '09:00', checkOut: '17:00', status: 'Present', workHours: 8 },
  { id: 'A012', employeeId: '12', employeeName: 'Suresh Kumar', date: '2026-06-20', checkIn: '', checkOut: '', status: 'Work From Home', workHours: 8 },
];

export const jobPostings: JobPosting[] = [
  { id: 'J001', title: 'Full Stack Developer', department: 'Engineering', location: 'Bangalore (Hybrid)', type: 'Full Time', experience: '3-5 years', salary: '12-18 LPA', postedOn: '2026-06-01', closingDate: '2026-07-01', status: 'Open', applicants: 45, description: 'Looking for an experienced Full Stack Developer with React and Node.js expertise.' },
  { id: 'J002', title: 'Sales Executive', department: 'Sales', location: 'Mumbai', type: 'Full Time', experience: '1-3 years', salary: '6-9 LPA', postedOn: '2026-06-05', closingDate: '2026-06-30', status: 'Open', applicants: 78, description: 'Energetic sales professional needed for enterprise B2B sales.' },
  { id: 'J003', title: 'HR Executive', department: 'HR', location: 'Delhi (Remote)', type: 'Full Time', experience: '2-4 years', salary: '5-8 LPA', postedOn: '2026-06-10', closingDate: '2026-07-10', status: 'Open', applicants: 32, description: 'Join our HR team to drive talent acquisition and employee engagement.' },
  { id: 'J004', title: 'Data Analyst', department: 'Finance', location: 'Hyderabad', type: 'Full Time', experience: '2-4 years', salary: '8-12 LPA', postedOn: '2026-05-20', closingDate: '2026-06-20', status: 'Closed', applicants: 89, description: 'Analyze financial data to provide business insights and recommendations.' },
  { id: 'J005', title: 'UI/UX Designer', department: 'Design', location: 'Bangalore', type: 'Full Time', experience: '2-5 years', salary: '10-16 LPA', postedOn: '2026-06-15', closingDate: '2026-07-15', status: 'Open', applicants: 23, description: 'Creative designer needed to build intuitive user experiences.' },
  { id: 'J006', title: 'Marketing Intern', department: 'Marketing', location: 'Remote', type: 'Internship', experience: 'Fresher', salary: '15-20K/month', postedOn: '2026-06-18', closingDate: '2026-07-05', status: 'Open', applicants: 112, description: '3-month internship for fresh graduates passionate about digital marketing.' },
];

export const candidates: Candidate[] = [
  { id: 'C001', name: 'Rohit Chauhan', email: 'rohit.c@gmail.com', phone: '9812345671', jobId: 'J001', jobTitle: 'Full Stack Developer', stage: 'Technical', appliedOn: '2026-06-05', experience: '4 years', skills: ['React', 'Node.js', 'MongoDB'], rating: 4.2 },
  { id: 'C002', name: 'Shreya Agarwal', email: 'shreya.a@gmail.com', phone: '9812345672', jobId: 'J001', jobTitle: 'Full Stack Developer', stage: 'HR Round', appliedOn: '2026-06-06', experience: '3 years', skills: ['Vue.js', 'Django', 'MySQL'], rating: 4.5 },
  { id: 'C003', name: 'Manish Tiwari', email: 'manish.t@gmail.com', phone: '9812345673', jobId: 'J002', jobTitle: 'Sales Executive', stage: 'Interview', appliedOn: '2026-06-08', experience: '2 years', skills: ['CRM', 'Cold Calling', 'Excel'], rating: 3.8 },
  { id: 'C004', name: 'Pallavi Desai', email: 'pallavi.d@gmail.com', phone: '9812345674', jobId: 'J005', jobTitle: 'UI/UX Designer', stage: 'Offer', appliedOn: '2026-06-16', experience: '3 years', skills: ['Figma', 'Adobe XD', 'Sketch'], rating: 4.8 },
  { id: 'C005', name: 'Ajay Mishra', email: 'ajay.m@gmail.com', phone: '9812345675', jobId: 'J003', jobTitle: 'HR Executive', stage: 'Screening', appliedOn: '2026-06-12', experience: '2.5 years', skills: ['Recruitment', 'HRMS', 'Excel'], rating: 3.5 },
  { id: 'C006', name: 'Divya Soni', email: 'divya.s@gmail.com', phone: '9812345676', jobId: 'J001', jobTitle: 'Full Stack Developer', stage: 'Hired', appliedOn: '2026-05-28', experience: '5 years', skills: ['React', 'AWS', 'Docker'], rating: 4.9 },
  { id: 'C007', name: 'Karan Malhotra', email: 'karan.m@gmail.com', phone: '9812345677', jobId: 'J002', jobTitle: 'Sales Executive', stage: 'Rejected', appliedOn: '2026-06-07', experience: '1 year', skills: ['Sales', 'Communication'], rating: 2.8 },
];

export const payrollRecords: PayrollRecord[] = employees.map(emp => ({
  id: `PAY_${emp.id}_JUN`,
  employeeId: emp.id,
  employeeName: emp.name,
  department: emp.department,
  month: 'June 2026',
  basicSalary: Math.round(emp.salary * 0.5),
  hra: Math.round(emp.salary * 0.2),
  allowances: Math.round(emp.salary * 0.15),
  pf: Math.round(emp.salary * 0.12),
  tax: Math.round(emp.salary * 0.08),
  netSalary: Math.round(emp.salary * 0.85),
  status: emp.id === '5' || emp.id === '8' ? 'Pending' : 'Paid',
  paidOn: emp.id === '5' || emp.id === '8' ? undefined : '2026-06-01',
}));

export const announcements: Announcement[] = [
  { id: 'AN001', title: 'Office Closure - Eid Al-Adha', content: 'The office will remain closed on June 27, 2026 on account of Eid Al-Adha. All employees can enjoy this public holiday. Work from home is permitted for urgent deliverables with prior manager approval.', category: 'Holiday', postedBy: 'HR Department', postedOn: '2026-06-15', priority: 'High' },
  { id: 'AN002', title: 'New Health Insurance Policy Effective July 1', content: 'We are pleased to announce an upgraded health insurance policy starting July 1, 2026. The new policy includes cashless hospitalization up to 5 lakhs, OPD coverage of 10,000/year, and dental + vision benefits. More details will be shared via email.', category: 'HR Policy', postedBy: 'Neha Gupta', postedOn: '2026-06-18', priority: 'High' },
  { id: 'AN003', title: 'Q1 Results - Company Achieves 140% Target!', content: 'Congratulations to the entire team! We have achieved 140% of our Q1 FY2026 revenue target. Special appreciation to the Sales and Engineering teams. Performance bonuses will be credited by June 30.', category: 'Achievement', postedBy: 'CEO Office', postedOn: '2026-06-12', priority: 'Medium' },
  { id: 'AN004', title: 'Team Outing - July 15, 2026', content: 'Get ready for our annual team outing at Wonderla, Bangalore on July 15! Buses will depart from office at 8 AM. Family members are welcome. Please confirm attendance by July 10 by filling the form shared on Slack.', category: 'Event', postedBy: 'HR Department', postedOn: '2026-06-17', priority: 'Medium' },
  { id: 'AN005', title: 'Work From Home Policy Update', content: 'Effective July 1, 2026, employees can work from home 2 days per week (Tuesday and Thursday). WFH requests for other days require manager approval 24 hours in advance. Please update your calendar accordingly.', category: 'HR Policy', postedBy: 'Neha Gupta', postedOn: '2026-06-19', priority: 'High' },
  { id: 'AN006', title: 'Mandatory Cybersecurity Training', content: 'All employees must complete the mandatory cybersecurity awareness training by June 30. The training is available on the company LMS. Non-completion may affect your performance review.', category: 'General', postedBy: 'IT Department', postedOn: '2026-06-10', priority: 'High' },
];

export const performanceReviews: PerformanceReview[] = [
  {
    id: 'PR001', employeeId: '1', employeeName: 'Rahul Sharma', department: 'Engineering',
    reviewPeriod: 'H1 2026', rating: 4.2,
    goals: [{ goal: 'Complete microservices migration', achieved: true, score: 90 }, { goal: 'Reduce API response time by 30%', achieved: true, score: 85 }, { goal: 'Mentor 2 junior developers', achieved: false, score: 60 }],
    strengths: ['Problem solving', 'Code quality', 'Team collaboration'],
    improvements: ['Time management', 'Documentation'],
    reviewedBy: 'Priya Mehta', reviewDate: '2026-06-18', status: 'Completed'
  },
  {
    id: 'PR002', employeeId: '3', employeeName: 'Amit Singh', department: 'Sales',
    reviewPeriod: 'H1 2026', rating: 4.8,
    goals: [{ goal: 'Achieve 120% of sales target', achieved: true, score: 140 }, { goal: 'Onboard 5 enterprise clients', achieved: true, score: 100 }, { goal: 'Reduce churn rate by 15%', achieved: true, score: 95 }],
    strengths: ['Client relationship', 'Negotiation', 'Leadership'],
    improvements: ['CRM data entry', 'Reporting'],
    reviewedBy: 'CEO', reviewDate: '2026-06-15', status: 'Completed'
  },
  {
    id: 'PR003', employeeId: '6', employeeName: 'Ananya Patel', department: 'Design',
    reviewPeriod: 'H1 2026', rating: 3.9,
    goals: [{ goal: 'Redesign mobile app UI', achieved: true, score: 88 }, { goal: 'Create design system', achieved: false, score: 65 }, { goal: 'Conduct 10 user research sessions', achieved: true, score: 80 }],
    strengths: ['Creativity', 'Attention to detail', 'User empathy'],
    improvements: ['Meeting deadlines', 'Stakeholder communication'],
    reviewedBy: 'Priya Mehta', reviewDate: '2026-06-19', status: 'Completed'
  },
  {
    id: 'PR004', employeeId: '9', employeeName: 'Kavya Reddy', department: 'Engineering',
    reviewPeriod: 'H1 2026', rating: 4.5,
    goals: [{ goal: 'Build payment gateway integration', achieved: true, score: 95 }, { goal: 'Improve test coverage to 85%', achieved: true, score: 87 }, { goal: 'Learn Kubernetes', achieved: true, score: 90 }],
    strengths: ['Technical depth', 'Self-learning', 'Code reviews'],
    improvements: ['Presentation skills', 'Cross-team collaboration'],
    reviewedBy: 'Priya Mehta', reviewDate: '2026-06-17', status: 'Completed'
  },
];

export const monthlyAttendanceData = [
  { month: 'Jan', present: 95, absent: 3, leave: 2 },
  { month: 'Feb', present: 92, absent: 5, leave: 3 },
  { month: 'Mar', present: 96, absent: 2, leave: 2 },
  { month: 'Apr', present: 90, absent: 6, leave: 4 },
  { month: 'May', present: 94, absent: 3, leave: 3 },
  { month: 'Jun', present: 91, absent: 4, leave: 5 },
];

export const payrollTrendData = [
  { month: 'Jan', amount: 980000 },
  { month: 'Feb', amount: 985000 },
  { month: 'Mar', amount: 1020000 },
  { month: 'Apr', amount: 1010000 },
  { month: 'May', amount: 1045000 },
  { month: 'Jun', amount: 1060000 },
];

export const departmentData = [
  { name: 'Engineering', count: 4, color: '#3b82f6' },
  { name: 'Sales', count: 2, color: '#10b981' },
  { name: 'Finance', count: 2, color: '#f59e0b' },
  { name: 'HR', count: 1, color: '#8b5cf6' },
  { name: 'Design', count: 1, color: '#ec4899' },
  { name: 'Marketing', count: 1, color: '#06b6d4' },
  { name: 'Operations', count: 1, color: '#f97316' },
  { name: 'Legal', count: 1, color: '#6366f1' },
];

export const leaveBalances = {
  casual: { total: 12, used: 4, remaining: 8 },
  sick: { total: 10, used: 2, remaining: 8 },
  annual: { total: 18, used: 5, remaining: 13 },
  unpaid: { total: 0, used: 0, remaining: 0 },
};
