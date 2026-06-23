# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

**Run both services (required for full functionality):**
```bash
# Terminal 1 — Express backend (Google Sheets API proxy)
npm run server        # http://localhost:3001

# Terminal 2 — Vite dev server
npm run dev           # http://localhost:5173
```

**Other commands:**
```bash
npm run build         # Production build → /dist
```

There are no tests in this project.

## Architecture

This is a two-process application:

**Frontend** (`src/`) — Vite + React 18 + TypeScript, single-page app.  
**Backend** (`server.js`) — Express.js, runs on port 3001. Its sole purpose is proxying CRUD operations to Google Sheets via the Google Sheets API v4 with a hardcoded service account.

### Data Flow

```
React page → api.get/post/put/delete (src/api/client.ts, BASE=localhost:3001/api)
           → Express CRUD route (server.js)
           → Google Sheets (Spreadsheet ID: 1vOvCDAJcKkQfnf_ccJ274uyAzaQxFbnIINeKC3rHOaE)
```

Each of the 16 data entities (Employees, Attendance, Leave, Payroll, Jobs, Candidates, Announcements, Performance, Tasks, Assets, Expenses, Tickets, Leads, Inventory, Visitors, Training) maps to one Sheet tab. Sheets are auto-created with headers if missing via `ensureSheet()`.

**Offline/fallback:** `AppContext` (`src/context/AppContext.tsx`) attempts to load Employees, Leave, and Attendance from the API on mount. If the backend is unreachable it silently falls back to the small `MOCK_*` arrays defined at the top of that file, and sets `apiOnline = false`. Many individual pages also have their own local mock data for demo purposes when the API returns nothing.

### Frontend Structure

- **`src/App.tsx`** — BrowserRouter + AppProvider + all route declarations
- **`src/context/AppContext.tsx`** — Global state (employees, leave, attendance, payroll, announcements, sidebar open/closed, current user). Source of truth for shared data.
- **`src/api/client.ts`** — Thin `api` object wrapping `fetch` with typed `get/post/put/delete/seed`. Throws on `!json.success`.
- **`src/types/index.ts`** — All shared TypeScript interfaces: `Employee`, `LeaveRequest`, `AttendanceRecord`, `PayrollRecord`, `Announcement`, `JobPosting`, `Candidate`, `PerformanceReview`, etc.
- **`src/components/Layout/`** — `Layout.tsx` (Outlet wrapper + app-bg), `Sidebar.tsx` (NavLink nav, 260 px), `Header.tsx` (search, notifications, profile dropdown).
- **`src/pages/`** — One file per module. Pages fetch from the API independently; they do not re-use AppContext for their own entity lists unless sharing is required (e.g., employee dropdowns pull from AppContext).

### Backend Structure (`server.js`)

A generic `createCRUD(path, sheetName)` factory registers all four REST verbs for every entity. Custom endpoints: `GET /api/dashboard` (aggregated stats across 7 sheets) and `POST /api/seed` (bulk insert).

Sheet row helpers: `readSheet`, `appendRow`, `updateRow`, `deleteRow`, `ensureSheet` — all `async`, operate on the hardcoded `SPREADSHEET_ID`.

## Design System

All visual styling is custom CSS in `src/index.css` (not Tailwind component classes). Tailwind is used only for spacing/sizing utilities. Key CSS classes:

| Class | Purpose |
|---|---|
| `glass-card` | Primary card surface (blur + dark glass) |
| `stat-card stat-{blue\|green\|purple\|orange\|pink\|cyan}` | KPI card with colored bottom glow on hover |
| `icon-box icon-{blue\|green\|orange\|purple\|pink\|cyan\|yellow\|red}` | 48×48 gradient icon container |
| `badge badge-{blue\|green\|red\|yellow\|purple\|gray\|orange\|cyan\|pink}` | Pill status label |
| `btn btn-{primary\|ghost\|danger\|success}` | Styled buttons |
| `premium-table` | Dark table with glass-hover rows |
| `input` | Dark glass `<input>` / `<select>` |
| `modal-overlay` + `modal-box` | Full-screen modal backdrop + container |
| `tab-bar` + `tab-item [.active]` | Horizontal tab navigation |
| `search-box` | Glass search input wrapper |
| `fade-up stagger-{1-6}` | Entry animation with staggered delay |
| `gradient-text` | Blue→purple→cyan gradient text |
| `chat-bubble-{user\|ai}` | Chat message bubbles (AI Assistant page) |
| `kanban-col` + `kanban-card` | Kanban board columns and cards |

Background: fixed `div.app-bg` (rendered in `Layout.tsx`) — dark navy with radial gradients and a CSS grid overlay. Design tokens are CSS custom properties on `:root` (`--bg-deep`, `--glass`, `--neon-blue`, `--text-primary`, `--sidebar-w`, etc.).

## Key Conventions

- **Routing:** Import from `'react-router'`, not `'react-router-dom'`. Use `NavLink` in Sidebar, `useLocation` in Header.
- **Icons:** Always from `lucide-react`.
- **Charts:** `recharts` with a dark theme — transparent axes, `rgba` grid lines, custom `<Tooltip>` component with dark glass background.
- **IDs:** New records created on the frontend use `String(Date.now())`; the backend assigns a UUID via `uuidv4()` if none is provided on POST.
- **INR formatting:** Use `.toLocaleString('en-IN')` for currency display.
- **TypeScript:** Strict mode on. Use `import type` for type-only imports.
- **No test framework** is configured.
