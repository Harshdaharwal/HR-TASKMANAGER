import { useState, useEffect } from 'react'
import {
  DollarSign, Download, Eye, Play, Building2,
  X, TrendingUp, AlertCircle, Clock, Plus
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'

interface PayrollEmployee {
  id: number
  name: string
  dept: string
  basic: number
  hra: number
  allowances: number
  pf: number
  tax: number
  bonus: number
  netSalary: number
  status: 'Paid' | 'Pending' | 'Processing'
  avatar: string
}

const mockPayroll: PayrollEmployee[] = [
  { id: 1, name: 'Rahul Sharma', dept: 'Engineering', basic: 80000, hra: 32000, allowances: 15000, pf: 9600, tax: 12000, bonus: 10000, netSalary: 115400, status: 'Paid', avatar: 'RS' },
  { id: 2, name: 'Priya Patel', dept: 'Design', basic: 65000, hra: 26000, allowances: 12000, pf: 7800, tax: 9500, bonus: 8000, netSalary: 93700, status: 'Paid', avatar: 'PP' },
  { id: 3, name: 'Amit Kumar', dept: 'HR', basic: 55000, hra: 22000, allowances: 10000, pf: 6600, tax: 7500, bonus: 5000, netSalary: 77900, status: 'Pending', avatar: 'AK' },
  { id: 4, name: 'Sneha Reddy', dept: 'Finance', basic: 72000, hra: 28800, allowances: 13000, pf: 8640, tax: 11000, bonus: 9000, netSalary: 103160, status: 'Processing', avatar: 'SR' },
  { id: 5, name: 'Vikram Singh', dept: 'Engineering', basic: 90000, hra: 36000, allowances: 18000, pf: 10800, tax: 15000, bonus: 12000, netSalary: 130200, status: 'Paid', avatar: 'VS' },
  { id: 6, name: 'Ananya Gupta', dept: 'Marketing', basic: 60000, hra: 24000, allowances: 11000, pf: 7200, tax: 8500, bonus: 7000, netSalary: 86300, status: 'Pending', avatar: 'AG' },
  { id: 7, name: 'Rohan Mehta', dept: 'Sales', basic: 50000, hra: 20000, allowances: 9000, pf: 6000, tax: 6500, bonus: 15000, netSalary: 81500, status: 'Paid', avatar: 'RM' },
]

const deptChartData = [
  { dept: 'Eng', amount: 24.56 },
  { dept: 'Design', amount: 9.37 },
  { dept: 'HR', amount: 7.79 },
  { dept: 'Finance', amount: 10.32 },
  { dept: 'Marketing', amount: 8.63 },
  { dept: 'Sales', amount: 8.15 },
]

const months = ['January 2026','February 2026','March 2026','April 2026','May 2026','June 2026','July 2026','August 2026']

export default function Payroll() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<PayrollEmployee[]>([])
  const [selectedMonth, setSelectedMonth] = useState('June 2026')
  const [payslipEmp, setPayslipEmp] = useState<PayrollEmployee | null>(null)
  const [runningPayroll, setRunningPayroll] = useState(false)

  useEffect(() => {
    setLoading(true)
    const t = setTimeout(() => {
      setData(mockPayroll)
      setLoading(false)
    }, 1000)
    return () => clearTimeout(t)
  }, [selectedMonth])

  const gross = data.reduce((s, e) => s + e.basic + e.hra + e.allowances + e.bonus, 0)
  const net = data.reduce((s, e) => s + e.netSalary, 0)
  const deductions = data.reduce((s, e) => s + e.pf + e.tax, 0)
  const pending = data.filter(e => e.status === 'Pending').reduce((s, e) => s + e.netSalary, 0)

  const toL = (n: number) => `₹${(n / 100000).toFixed(2)}L`

  const statusBadge = (s: string) => {
    if (s === 'Paid') return <span className="badge badge-green">Paid</span>
    if (s === 'Pending') return <span className="badge badge-yellow">Pending</span>
    return <span className="badge badge-blue">Processing</span>
  }

  const handleRunPayroll = () => {
    setRunningPayroll(true)
    setTimeout(() => {
      setRunningPayroll(false)
      alert('Payroll processed successfully!')
    }, 2000)
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div className="section-header fade-up" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">Payroll Management</h1>
          <p className="page-subtitle">Process salaries, view payslips and manage compensation</p>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <select className="input" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={{ minWidth: '160px' }}>
            {months.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <button className="btn btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Download size={16} /> Export to Bank
          </button>
          <button className="btn btn-primary" onClick={handleRunPayroll} disabled={runningPayroll} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Play size={16} /> {runningPayroll ? 'Processing...' : 'Run Payroll'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid-auto" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card stat-blue fade-up stagger-1">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>Gross Payroll</p>
              <p style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{toL(gross)}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '12px', marginTop: '4px' }}>Total before deductions</p>
            </div>
            <div className="icon-box icon-blue"><DollarSign size={20} /></div>
          </div>
        </div>
        <div className="stat-card stat-green fade-up stagger-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>Net Payroll</p>
              <p style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{toL(net)}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '12px', marginTop: '4px' }}>After all deductions</p>
            </div>
            <div className="icon-box icon-green"><TrendingUp size={20} /></div>
          </div>
        </div>
        <div className="stat-card stat-orange fade-up stagger-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>Total Deductions</p>
              <p style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{toL(deductions)}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '12px', marginTop: '4px' }}>PF + Tax</p>
            </div>
            <div className="icon-box icon-orange"><AlertCircle size={20} /></div>
          </div>
        </div>
        <div className="stat-card stat-purple fade-up stagger-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <p style={{ color: 'var(--slate-400)', fontSize: '13px', marginBottom: '8px' }}>Pending Payments</p>
              <p style={{ color: 'white', fontSize: '28px', fontWeight: 700 }}>{toL(pending)}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '12px', marginTop: '4px' }}>{data.filter(e => e.status === 'Pending').length} employees</p>
            </div>
            <div className="icon-box icon-purple"><Clock size={20} /></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px' }}>
        {/* Payroll Table */}
        <div className="glass-card fade-up stagger-2">
          <h2 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Employee Payroll — {selectedMonth}</h2>
          <div style={{ overflowX: 'auto' }}>
            <table className="premium-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Dept</th>
                  <th>Basic</th>
                  <th>HRA</th>
                  <th>Allowances</th>
                  <th style={{ color: '#f87171' }}>PF</th>
                  <th style={{ color: '#f87171' }}>Tax</th>
                  <th>Bonus</th>
                  <th>Net Salary</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 11 }).map((_, j) => (
                        <td key={j}><div style={{ height: '16px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', animation: 'pulse 1.5s infinite' }} /></td>
                      ))}
                    </tr>
                  ))
                ) : data.map(emp => (
                  <tr key={emp.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div className="avatar" style={{ width: '34px', height: '34px', fontSize: '12px' }}>{emp.avatar}</div>
                        <span style={{ color: 'white', fontWeight: 500 }}>{emp.name}</span>
                      </div>
                    </td>
                    <td><span className="badge badge-blue">{emp.dept}</span></td>
                    <td>₹{emp.basic.toLocaleString()}</td>
                    <td>₹{emp.hra.toLocaleString()}</td>
                    <td>₹{emp.allowances.toLocaleString()}</td>
                    <td style={{ color: '#f87171' }}>₹{emp.pf.toLocaleString()}</td>
                    <td style={{ color: '#f87171' }}>₹{emp.tax.toLocaleString()}</td>
                    <td style={{ color: '#34d399' }}>₹{emp.bonus.toLocaleString()}</td>
                    <td style={{ color: 'white', fontWeight: 700 }}>₹{emp.netSalary.toLocaleString()}</td>
                    <td>{statusBadge(emp.status)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '12px' }} onClick={() => setPayslipEmp(emp)}>
                          <Eye size={14} />
                        </button>
                        {emp.status === 'Pending' && (
                          <button className="btn btn-success" style={{ padding: '4px 10px', fontSize: '12px' }}>Pay</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Department Chart */}
        <div className="glass-card fade-up stagger-3">
          <h2 style={{ color: 'white', fontWeight: 600, marginBottom: '16px' }}>Dept-wise Payroll (₹L)</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={deptChartData} layout="vertical" margin={{ left: 0, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis type="number" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} />
              <YAxis dataKey="dept" type="category" stroke="#64748b" tick={{ fill: '#94a3b8', fontSize: 11 }} width={52} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#f1f5f9' }}
                formatter={(v: number) => [`₹${v}L`, 'Payroll']}
              />
              <Bar dataKey="amount" radius={[0, 6, 6, 0]} fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {deptChartData.map(d => (
              <div key={d.dept} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{d.dept}</span>
                <span style={{ color: 'white', fontWeight: 600 }}>₹{d.amount}L</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FAB — Run Payroll (mobile only) */}
      <button className="fab mobile-only" onClick={handleRunPayroll} disabled={runningPayroll} aria-label="Run Payroll">
        <Plus size={22} color="#fff" />
      </button>

      {/* Payslip Modal */}
      {payslipEmp && (
        <div className="modal-overlay" onClick={() => setPayslipEmp(null)}>
          <div className="modal-box w-full max-w-2xl p-6" onClick={e => e.stopPropagation()}>
            {/* Blue gradient header */}
            <div style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #7c3aed 100%)', borderRadius: '12px', padding: '24px', marginBottom: '24px', position: 'relative' }}>
              <button onClick={() => setPayslipEmp(null)} style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'white' }}>
                <X size={16} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '12px' }}>
                  <Building2 size={28} color="white" />
                </div>
                <div>
                  <h2 style={{ color: 'white', fontSize: '20px', fontWeight: 700 }}>TechCorp India Pvt. Ltd.</h2>
                  <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px' }}>Payslip for {selectedMonth}</p>
                </div>
              </div>
              <div style={{ marginTop: '20px', display: 'flex', gap: '32px' }}>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Employee Name</p>
                  <p style={{ color: 'white', fontWeight: 600 }}>{payslipEmp.name}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Department</p>
                  <p style={{ color: 'white', fontWeight: 600 }}>{payslipEmp.dept}</p>
                </div>
                <div>
                  <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>Employee ID</p>
                  <p style={{ color: 'white', fontWeight: 600 }}>EMP-{String(payslipEmp.id).padStart(4, '0')}</p>
                </div>
              </div>
            </div>

            {/* Earnings vs Deductions */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
              <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ color: '#34d399', fontWeight: 600, marginBottom: '12px' }}>Earnings</h3>
                {([
                  ['Basic Salary', payslipEmp.basic],
                  ['HRA', payslipEmp.hra],
                  ['Allowances', payslipEmp.allowances],
                  ['Bonus', payslipEmp.bonus],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{label}</span>
                    <span style={{ color: 'white', fontWeight: 500 }}>₹{val.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(16,185,129,0.3)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#34d399', fontWeight: 600 }}>Total Earnings</span>
                  <span style={{ color: '#34d399', fontWeight: 700 }}>₹{(payslipEmp.basic + payslipEmp.hra + payslipEmp.allowances + payslipEmp.bonus).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '16px' }}>
                <h3 style={{ color: '#f87171', fontWeight: 600, marginBottom: '12px' }}>Deductions</h3>
                {([
                  ['Provident Fund', payslipEmp.pf],
                  ['Income Tax', payslipEmp.tax],
                ] as [string, number][]).map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ color: 'var(--slate-400)', fontSize: '13px' }}>{label}</span>
                    <span style={{ color: '#f87171', fontWeight: 500 }}>₹{val.toLocaleString()}</span>
                  </div>
                ))}
                <div style={{ borderTop: '1px solid rgba(239,68,68,0.3)', marginTop: '8px', paddingTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#f87171', fontWeight: 600 }}>Total Deductions</span>
                  <span style={{ color: '#f87171', fontWeight: 700 }}>₹{(payslipEmp.pf + payslipEmp.tax).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Net Salary Highlight */}
            <div style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.2) 0%, rgba(124,58,237,0.2) 100%)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: '10px', padding: '20px', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ color: 'var(--slate-400)', fontSize: '13px' }}>NET SALARY PAYABLE</p>
              <p style={{ color: 'white', fontSize: '36px', fontWeight: 800, marginTop: '4px' }}>₹{payslipEmp.netSalary.toLocaleString()}</p>
              <p style={{ color: 'var(--slate-400)', fontSize: '12px', marginTop: '4px' }}>For the month of {selectedMonth}</p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn btn-ghost" onClick={() => setPayslipEmp(null)}>Close</button>
              <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Download size={16} /> Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
