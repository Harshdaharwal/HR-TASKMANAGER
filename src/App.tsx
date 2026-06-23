import { BrowserRouter, Routes, Route } from 'react-router';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout/Layout';
import Dashboard from './pages/Dashboard';
import Employees from './pages/Employees';
import Attendance from './pages/Attendance';
import LeaveManagement from './pages/LeaveManagement';
import Payroll from './pages/Payroll';
import Recruitment from './pages/Recruitment';
import Performance from './pages/Performance';
import Announcements from './pages/Announcements';
import Settings from './pages/Settings';
import Assets from './pages/Assets';
import Expenses from './pages/Expenses';
import Helpdesk from './pages/Helpdesk';
import CRM from './pages/CRM';
import Analytics from './pages/Analytics';
import AIAssistant from './pages/AIAssistant';
import Tasks from './pages/Tasks';
import Training from './pages/Training';
import Inventory from './pages/Inventory';
import Visitors from './pages/Visitors';
import More from './pages/More';

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="employees" element={<Employees />} />
            <Route path="attendance" element={<Attendance />} />
            <Route path="leave" element={<LeaveManagement />} />
            <Route path="payroll" element={<Payroll />} />
            <Route path="recruitment" element={<Recruitment />} />
            <Route path="performance" element={<Performance />} />
            <Route path="tasks" element={<Tasks />} />
            <Route path="training" element={<Training />} />
            <Route path="crm" element={<CRM />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="assets" element={<Assets />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="helpdesk" element={<Helpdesk />} />
            <Route path="visitors" element={<Visitors />} />
            <Route path="announcements" element={<Announcements />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="ai-assistant" element={<AIAssistant />} />
            <Route path="settings" element={<Settings />} />
            <Route path="more" element={<More />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
