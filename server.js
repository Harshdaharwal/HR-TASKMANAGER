import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { google } from 'googleapis';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const credentials = {
  type: process.env.GOOGLE_TYPE,
  project_id: process.env.GOOGLE_PROJECT_ID,
  private_key_id: process.env.GOOGLE_PRIVATE_KEY_ID,
  private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.GOOGLE_CLIENT_EMAIL,
  client_id: process.env.GOOGLE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
};

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

async function getSheets() {
  const client = await auth.getClient();
  return google.sheets({ version: 'v4', auth: client });
}

const SHEET_HEADERS = {
  Employees:     ['id','employeeId','name','email','phone','department','designation','salary','joinDate','status','avatar','gender','dob','address','manager','skills','education','emergencyContact'],
  Attendance:    ['id','employeeId','employeeName','date','checkIn','checkOut','status','workHours','location'],
  Leave:         ['id','employeeId','employeeName','department','leaveType','startDate','endDate','days','reason','status','appliedOn','approvedBy'],
  Payroll:       ['id','employeeId','employeeName','department','month','basicSalary','hra','allowances','pf','tax','bonus','netSalary','status','paidOn'],
  Jobs:          ['id','title','department','location','type','experience','salary','postedOn','closingDate','status','applicants','description','responsibilities'],
  Candidates:    ['id','name','email','phone','jobId','jobTitle','stage','appliedOn','experience','skills','rating','resume','notes'],
  Announcements: ['id','title','content','category','postedBy','postedOn','priority','expiresOn'],
  Performance:   ['id','employeeId','employeeName','department','reviewPeriod','rating','goals','strengths','improvements','reviewedBy','reviewDate','status'],
  Tasks:         ['id','title','description','assignedTo','assignedBy','department','priority','status','dueDate','createdOn','completedOn','tags'],
  Assets:        ['id','assetId','type','name','brand','serialNo','assignedTo','assignedDate','condition','status','purchaseDate','purchasePrice','warrantyExpiry'],
  Expenses:      ['id','employeeId','employeeName','category','amount','description','date','receiptUrl','status','approvedBy','paidOn'],
  Tickets:       ['id','ticketNo','employeeId','employeeName','category','subject','description','priority','status','assignedTo','createdOn','resolvedOn','slaHours'],
  Leads:         ['id','name','company','email','phone','source','status','value','assignedTo','createdOn','lastFollowUp','notes'],
  Inventory:     ['id','itemCode','name','category','quantity','unit','reorderLevel','vendor','purchasePrice','location','lastUpdated'],
  Visitors:      ['id','name','company','phone','email','hostEmployee','purpose','checkIn','checkOut','passNo','date'],
  Training:      ['id','title','description','category','instructor','duration','startDate','endDate','status','enrolledCount','maxCapacity','completionRate'],
  // Biometrics: stores fingerprint credentialId AND/OR face descriptor — one row per registration per employee per type
  Biometrics:    ['id','employeeId','employeeName','employeeDepartment','credentialId','faceDescriptor','type','registeredAt'],
};

// ── Quota guard: cache which sheets are already set up (reset on restart) ──
const _sheetsReady = new Set();

// ── Read cache: avoid hammering Sheets API on frequent GETs ──
const _readCache = new Map(); // sheetName → { data, ts }
const READ_CACHE_TTL = 15000; // 15 seconds

function invalidateCache(sheetName) {
  _readCache.delete(sheetName);
}

async function ensureSheet(sheets, sheetName, dynamicHeaders) {
  if (_sheetsReady.has(sheetName)) return; // already verified this session
  try {
    const res = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const exists = res.data.sheets.some(s => s.properties.title === sheetName);
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetName } } }] }
      });
    }
    const headerRow = SHEET_HEADERS[sheetName] || dynamicHeaders;
    if (headerRow) {
      const headerRes = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!1:1`
      });
      if (!headerRes.data.values || headerRes.data.values.length === 0) {
        await sheets.spreadsheets.values.update({
          spreadsheetId: SPREADSHEET_ID,
          range: `${sheetName}!A1`,
          valueInputOption: 'RAW',
          requestBody: { values: [headerRow] }
        });
      }
    }
    _sheetsReady.add(sheetName); // mark as ready so future calls skip this
  } catch (err) {
    console.error(`ensureSheet(${sheetName}) error:`, err.message);
    throw err;
  }
}

async function readSheet(sheetName) {
  // Serve from cache if fresh
  const cached = _readCache.get(sheetName);
  if (cached && (Date.now() - cached.ts) < READ_CACHE_TTL) {
    return cached.data;
  }
  const sheets = await getSheets();
  await ensureSheet(sheets, sheetName);
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`
  });
  const rows = res.data.values || [];
  const data = rows.length < 2 ? [] : (() => {
    const headers = rows[0];
    return rows.slice(1).map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i] || ''; });
      return obj;
    });
  })();
  _readCache.set(sheetName, { data, ts: Date.now() });
  return data;
}

async function appendRow(sheetName, data) {
  const sheets = await getSheets();
  // Use known header order, or derive from data keys for unknown sheets
  const headers = SHEET_HEADERS[sheetName] || Object.keys(data);
  await ensureSheet(sheets, sheetName, headers);
  const row = headers.map(h => {
    const v = data[h];
    if (v === undefined || v === null) return '';
    if (Array.isArray(v)) return v.join(',');
    return String(v);
  });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`,
    valueInputOption: 'RAW',
    requestBody: { values: [row] }
  });
  invalidateCache(sheetName); // so next GET returns fresh data
  return data;
}

async function updateRow(sheetName, id, data) {
  const sheets = await getSheets();
  // Read via cache to save quota; then find position in the raw sheet for the update range
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:ZZ`
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (rowIndex === -1) return null;
  const headers = rows[0];
  const updatedRow = headers.map((h, i) => {
    const v = data[h];
    if (v === undefined || v === null) return rows[rowIndex][i] || '';
    if (Array.isArray(v)) return v.join(',');
    return String(v);
  });
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updatedRow] }
  });
  invalidateCache(sheetName);
  return data;
}

async function deleteRow(sheetName, id) {
  const sheets = await getSheets();
  // Use A:A only (just the id column) to minimise bytes transferred
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A:A`
  });
  const rows = res.data.values || [];
  const rowIndex = rows.findIndex((r, i) => i > 0 && r[0] === id);
  if (rowIndex === -1) return false;
  const sheetRes = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
  const sheet = sheetRes.data.sheets.find(s => s.properties.title === sheetName);
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId: SPREADSHEET_ID,
    requestBody: {
      requests: [{
        deleteDimension: {
          range: {
            sheetId: sheet.properties.sheetId,
            dimension: 'ROWS',
            startIndex: rowIndex,
            endIndex: rowIndex + 1
          }
        }
      }]
    }
  });
  invalidateCache(sheetName);
  return true;
}

// Generic CRUD factory
function createCRUD(path, sheetName) {
  app.get(`/api/${path}`, async (req, res) => {
    try {
      const data = await readSheet(sheetName);
      res.json({ success: true, data });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post(`/api/${path}`, async (req, res) => {
    try {
      const item = { ...req.body, id: req.body.id || uuidv4() };
      await appendRow(sheetName, item);
      res.json({ success: true, data: item });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.put(`/api/${path}/:id`, async (req, res) => {
    try {
      const result = await updateRow(sheetName, req.params.id, { ...req.body, id: req.params.id });
      if (!result) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete(`/api/${path}/:id`, async (req, res) => {
    try {
      const ok = await deleteRow(sheetName, req.params.id);
      if (!ok) return res.status(404).json({ success: false, error: 'Not found' });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  });
}

// Register all CRUD routes
createCRUD('employees', 'Employees');
createCRUD('attendance', 'Attendance');
createCRUD('leave', 'Leave');
createCRUD('payroll', 'Payroll');
createCRUD('jobs', 'Jobs');
createCRUD('candidates', 'Candidates');
createCRUD('announcements', 'Announcements');
createCRUD('performance', 'Performance');
createCRUD('tasks', 'Tasks');
createCRUD('assets', 'Assets');
createCRUD('expenses', 'Expenses');
createCRUD('tickets', 'Tickets');
createCRUD('leads', 'Leads');
createCRUD('inventory', 'Inventory');
createCRUD('visitors', 'Visitors');
createCRUD('training', 'Training');
createCRUD('biometric', 'Biometrics');

// Verify fingerprint by credential ID → returns employee info (or null if not registered)
app.post('/api/biometric/verify', async (req, res) => {
  try {
    const { credentialId } = req.body;
    if (!credentialId) return res.status(400).json({ success: false, error: 'credentialId required' });
    const rows = await readSheet('Biometrics');
    const found = rows.find(r => r.credentialId === credentialId) || null;
    res.json({ success: true, data: found });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check — tests Google Sheets connectivity
app.get('/api/health', async (req, res) => {
  try {
    const sheets = await getSheets();
    const r = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID });
    const tabNames = r.data.sheets.map(s => s.properties.title);
    res.json({ success: true, spreadsheetId: SPREADSHEET_ID, tabs: tabNames, serviceAccount: process.env.GOOGLE_CLIENT_EMAIL });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, hint: `Share the spreadsheet with ${process.env.GOOGLE_CLIENT_EMAIL} as Editor` });
  }
});

// Dashboard stats endpoint
app.get('/api/dashboard', async (req, res) => {
  try {
    const [employees, attendance, leave, payroll, jobs, candidates, tasks] = await Promise.all([
      readSheet('Employees'), readSheet('Attendance'), readSheet('Leave'),
      readSheet('Payroll'), readSheet('Jobs'), readSheet('Candidates'), readSheet('Tasks')
    ]);
    const today = new Date().toISOString().slice(0, 10);
    res.json({
      success: true,
      data: {
        totalEmployees: employees.length,
        activeEmployees: employees.filter(e => e.status === 'Active').length,
        todayPresent: attendance.filter(a => a.date === today && (a.status === 'Present' || a.status === 'Work From Home')).length,
        pendingLeaves: leave.filter(l => l.status === 'Pending').length,
        openJobs: jobs.filter(j => j.status === 'Open').length,
        totalApplicants: candidates.length,
        pendingTasks: tasks.filter(t => t.status === 'Pending' || t.status === 'In Progress').length,
        monthlyPayroll: payroll.filter(p => p.month === 'June 2026').reduce((s, p) => s + (parseFloat(p.netSalary) || 0), 0),
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Bulk seed endpoint
app.post('/api/seed', async (req, res) => {
  try {
    const { sheet, data } = req.body;
    if (!SHEET_HEADERS[sheet]) return res.status(400).json({ success: false, error: 'Unknown sheet' });
    const sheets = await getSheets();
    await ensureSheet(sheets, sheet);
    const headers = SHEET_HEADERS[sheet];
    const rows = data.map(item => headers.map(h => item[h] !== undefined ? String(item[h]) : ''));
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheet}!A:A`,
      valueInputOption: 'RAW',
      requestBody: { values: rows }
    });
    res.json({ success: true, count: rows.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Run locally; on Vercel the function file imports and exports this app instead
if (!process.env.VERCEL) {
  app.listen(3001, () => console.log('🚀 HR Backend running on http://localhost:3001'));
}

export default app;
