# HRMS — Frontend Status & Backend Integration Guide

> **For:** Backend engineer(s) + team.
> **Purpose:** (1) what the frontend already does, (2) exactly how to wire a backend to it, (3) the data models, API endpoints, and business rules the backend must implement.
> **Frontend stack:** Vanilla **HTML + CSS + JS** with **Tailwind (Play CDN)**. **No build step.** Serve the `HRMS_frontend/public/` folder statically (e.g. Live Server, `python -m http.server`, nginx).

---

## 1. Current status — what's built

**Phases 0–5 are complete.** Every page below is a fully clickable flow in **both Admin/HR and Employee roles**. All data is currently **mocked** in the browser (see §3).

### Auth flow (no app shell — full-screen)
| Page | File | Notes |
|---|---|---|
| Redirect | `index.html` | Instantly redirects to `signin.html` (no landing page) |
| Sign In | `signin.html` | **Role picker (Employee / HR Admin) lives here.** Email + password |
| Sign Up | `signup.html` | Employee ID, email, password + confirm. Password strength meter. **No role here** |
| Verify Email (OTP) | `verify.html` | 6-digit OTP, auto-advance, resend countdown |
| Forgot Password | `forgot-password.html` | Email → send reset code |
| Reset Password | `reset-password.html` | New password + confirm |

### App flows (rendered inside the shared sidebar + topbar shell)
| Module | File(s) | Admin/HR view | Employee view |
|---|---|---|---|
| **Dashboard** | `dashboard.html` + `assets/js/dashboard.js` | Workforce stats, pending leave approvals (approve/reject), today's attendance | Greeting, profile/attendance/leave cards, recent activity |
| **Employees** | `employees.html`, `employee-add.html`, `profile.html` + matching JS | Directory (status dots), **Add** employee, **Delete** employee, view/edit any profile | Redirected to own profile only |
| **Profile** | `profile.html` + `assets/js/profile.js` | Tabs: Resume · Job Details · Private Info · Documents · **Salary Info (admin-only)** · Security | Same tabs **minus Salary Info**; limited edit |
| **Attendance** | `attendance.html` + `assets/js/attendance.js` | Monitor list (Day/Week toggle), work & extra hours | Check-in/out status hero, monthly records, present/leave/total counts |
| **Leave** | `leave.html` + `assets/js/leave.js` | Requests table (Pending/Approved/Rejected tabs), approve/reject, allocation modal | Balances, month calendar w/ markers, breakdown, recent, **Apply-for-Leave** modal |

### Not yet built
- **Payroll** (`payroll.html`) — Phase 6. Sidebar "Payroll" link currently 404s.
- Phase 7 QA/responsive polish.

---

## 2. Frontend architecture (where things live)

```
HRMS_frontend/public/
├── index.html, signin.html, signup.html, verify.html,
│   forgot-password.html, reset-password.html      # auth (no shell)
├── dashboard.html, employees.html, employee-add.html,
│   profile.html, attendance.html, leave.html       # app pages (use shell)
├── assets/
│   ├── css/  global.css (design tokens+components), app.css (shell layout)
│   └── js/
│       ├── theme.js      # Tailwind config (single source; do not fork per page)
│       ├── store.js      # ⭐ MOCK DATA LAYER — replace with real API calls
│       ├── shell.js      # sidebar + topbar; contains the AUTH guard
│       ├── ui.js         # toasts, modals, formatters
│       ├── dashboard.js / employees.js / employee-add.js /
│       │   profile.js / attendance.js / leave.js   # per-page renderers
└── js/
    ├── api.js   # ⭐ EMPTY STUB — put the fetch wrapper here
    ├── auth.js  # sign-in/up/forgot/reset/verify form logic + redirects
    ├── verify.js# OTP box logic
    └── utils.js # token storage (localStorage), redirects, guards
```

**The two integration points you care about:**
1. `public/js/api.js` — currently empty. **Put the HTTP client here.**
2. `public/assets/js/store.js` — currently reads/writes mock data in `localStorage`. **Swap its methods to call `api.js`.** Every page reads data through `window.HRMS.store.*`, so if you change `store.js`, every page gets real data with **zero changes to the page renderers.**

---

## 3. How the frontend currently fakes the backend

- `store.js` seeds sample employees/attendance/leave/salary/holidays into `localStorage` (key `hrms_store_v1`) and exposes selectors + mutations on `window.HRMS.store`.
- Session/role is in `localStorage` key `hrms_session_v1` = `{ role: "admin"|"employee", empId }`.
- Auth token is in `localStorage` key `hrms_token_v1` (set on sign-in by `js/auth.js`).
- **Auth guard:** `assets/js/shell.js` has `const AUTH_REQUIRED = true;` at the top. When true, any app page with no token redirects to `signin.html`. Set it to `false` for open demos.

> **Demo role switch:** the topbar avatar menu has a "view as Admin / Employee" toggle. That's a frontend-only convenience — **the real app must derive role from the authenticated user/token**, not this switch. Keep it or remove it before production.

---

## 4. Data models (match these field names)

These mirror `store.js` today. Keep the same JSON keys so the frontend needs no remapping.

### Employee
```jsonc
{
  "id": "EMP-2024-001",            // string, unique, canonical format EMP-YYYY-NNN
  "name": "Alex Mercer",
  "role": "Senior Frontend Developer",
  "department": "Engineering",
  "email": "alex.mercer@hrms.com",
  "phone": "+1 (555) 019-8234",
  "manager": "Sarah Jenkins",       // or "—"
  "location": "San Francisco HQ",
  "employmentType": "Full-Time",    // Full-Time | Part-Time | Contract | Intern
  "joinDate": "2022-03-14",         // ISO date
  "status": "present",              // present | leave | absent  (live presence)
  "access": "employee",             // employee | admin  (role/permissions)
  "avatar": "",                     // URL or empty (empty => initials shown)
  "tag": "Senior Dev"               // short label shown on directory card
}
```

### Attendance record
```jsonc
{
  "empId": "EMP-2024-001",
  "date": "2025-10-22",             // ISO date
  "checkIn": "10:00",               // "HH:MM" or null
  "checkOut": "19:00",              // "HH:MM" or null
  "work": "09:00",                  // computed worked duration or null
  "extra": "+01:00",                // overtime; "+HH:MM" | "-HH:MM" | "00:00" | "--:--"
  "late": false
}
```

### Leave request
```jsonc
{
  "id": "LV-1001",
  "empId": "EMP-2024-006",
  "type": "Paid Time Off",          // Paid Time Off | Sick Time Off | Unpaid Leave
  "start": "2023-10-28",
  "end": "2023-11-02",
  "duration": 6,                    // inclusive day count
  "status": "Pending",              // Pending | Approved | Rejected
  "reason": "Family vacation",
  "attachment": null                // optional file ref (sick-leave certificate etc.)
}
```

### Leave balance
```jsonc
{ "paid": 24, "sick": 7, "unpaid": null }
```

### Salary structure (per employee)
```jsonc
{
  "monthlyWage": 50000, "yearlyWage": 600000,
  "workingDaysPerWeek": 5, "breakTime": 1,
  "components": [
    { "name": "Basic Salary", "note": "...", "pct": 50, "amount": 25000 }
    // House Rent Allowance, Standard Allowance, Performance Bonus,
    // Leave Travel Allowance, Fixed Allowance ...
  ],
  "pf":  { "employeePct": 12, "employerPct": 12, "employee": 3000, "employer": 3000 },
  "tax": { "professional": 200 }
}
```

### Holiday
```jsonc
{ "date": "2026-11-08", "name": "Diwali" }
```

### Auth/session response (what sign-in / verify should return)
```jsonc
{ "token": "JWT...", "user": { /* Employee */ , "access": "admin" } }
```

---

## 5. Suggested REST API

Base URL example: `http://localhost:8000/api`. Send `Authorization: Bearer <token>` on all authenticated requests. Return JSON. Use standard status codes (401 unauth, 403 forbidden, 422 validation).

### Auth
| Method | Path | Body | Returns |
|---|---|---|---|
| POST | `/auth/signup` | `{ employeeId, email, password }` | `{ message }` (sends OTP email) |
| POST | `/auth/verify` | `{ email, otp }` | `{ token, user }` |
| POST | `/auth/signin` | `{ email, password, role }` | `{ token, user }` |
| POST | `/auth/forgot` | `{ email }` | `{ message }` (sends reset code) |
| POST | `/auth/reset` | `{ email, code, password }` | `{ message }` |
| POST | `/auth/logout` | — | `{ message }` |
| GET  | `/auth/me` | — | `{ user }` (validate token on app load) |

### Employees  *(admin-only except GET own)*
| Method | Path | Returns |
|---|---|---|
| GET | `/employees` | `[Employee]` (admin) |
| POST | `/employees` | created `Employee` (admin) |
| GET | `/employees/:id` | `Employee` (admin any; employee only self) |
| PATCH | `/employees/:id` | updated `Employee` (admin: all fields; employee: address/phone/avatar only) |
| DELETE | `/employees/:id` | `{ message }` (admin; also cascade-delete their leave) |
| GET | `/employees/:id/documents` | `[Document]` |
| POST | `/employees/:id/documents` | upload (multipart) |

### Attendance
| Method | Path | Returns |
|---|---|---|
| POST | `/attendance/check-in` | `{ time, location }` |
| POST | `/attendance/check-out` | `{ time, work }` |
| GET | `/attendance?date=YYYY-MM-DD` | `[Attendance]` (admin: all; employee: self) |
| GET | `/attendance/me?month=YYYY-MM` | `{ records:[Attendance], summary:{ present, leaves, totalWorking } }` |
| GET | `/attendance/week?start=YYYY-MM-DD` | matrix of `[{ empId, days:[status] }]` (admin) |

### Leave
| Method | Path | Returns |
|---|---|---|
| GET | `/leave?status=Pending` | `[Leave]` (admin: all; employee: self) |
| POST | `/leave` | created `Leave` (employee applies; status=Pending) |
| PATCH | `/leave/:id` | `{ status: "Approved"\|"Rejected" }` → updated `Leave` (admin) |
| GET | `/leave/balance` | `{ paid, sick, unpaid }` (current user) |
| POST | `/leave/allocate` | `{ empId, type, from, to, days }` (admin) |
| GET | `/holidays?year=YYYY` | `[Holiday]` |

### Payroll  *(Phase 6 on the frontend, but plan the API now)*
| Method | Path | Returns |
|---|---|---|
| GET | `/payroll/me` | `Salary` (employee — **read-only**) |
| GET | `/payroll/:employeeId` | `Salary` (admin) |
| PATCH | `/payroll/:employeeId` | updated `Salary` (admin) |

---

## 6. How to wire it (step by step)

1. **Implement the HTTP client in `public/js/api.js`:**
   ```js
   // public/js/api.js
   (function () {
     const BASE = "http://localhost:8000/api"; // <-- your backend
     async function request(path, { method = "GET", body, auth = true } = {}) {
       const headers = { "Content-Type": "application/json" };
       if (auth && window.HRMS?.utils?.getToken()) headers.Authorization = "Bearer " + HRMS.utils.getToken();
       const res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
       if (res.status === 401) { location.href = "signin.html"; return; }
       if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
       return res.status === 204 ? null : res.json();
     }
     window.HRMS = window.HRMS || {};
     window.HRMS.api = {
       signin: (b) => request("/auth/signin", { method: "POST", body: b, auth: false }),
       signup: (b) => request("/auth/signup", { method: "POST", body: b, auth: false }),
       verify: (b) => request("/auth/verify", { method: "POST", body: b, auth: false }),
       me: () => request("/auth/me"),
       employees: () => request("/employees"),
       employee: (id) => request("/employees/" + id),
       createEmployee: (b) => request("/employees", { method: "POST", body: b }),
       deleteEmployee: (id) => request("/employees/" + id, { method: "DELETE" }),
       attendance: (date) => request("/attendance?date=" + date),
       myAttendance: (month) => request("/attendance/me?month=" + month),
       leave: (status) => request("/leave" + (status ? "?status=" + status : "")),
       applyLeave: (b) => request("/leave", { method: "POST", body: b }),
       setLeaveStatus: (id, status) => request("/leave/" + id, { method: "PATCH", body: { status } }),
       balance: () => request("/leave/balance"),
       holidays: (year) => request("/holidays?year=" + year),
       payrollMe: () => request("/payroll/me"),
     };
   })();
   ```
   Add `<script src="js/api.js"></script>` to each page (before the page renderer).

2. **Update `js/auth.js`** so `signin`/`signup`/`verify` call `HRMS.api.*`, store the returned token via `HRMS.utils.setToken(token)`, and set role from `user.access` (instead of the radio) — or keep the radio as a hint the backend validates.

3. **Swap `assets/js/store.js`** to fetch real data. Two clean options:
   - **A (recommended, least churn):** on each app page load, `await` the relevant `HRMS.api.*` call, populate the store cache, then render. Keep the store's synchronous selectors so **page renderers don't change**.
   - **B:** make store selectors async and `await` them in renderers.
   The mutations (`addEmployee`, `removeEmployee`, `addLeave`, `updateLeaveStatus`) should call the matching `HRMS.api.*` endpoint and then update the cache.

4. **Turn the auth guard on** (`AUTH_REQUIRED = true` in `shell.js`) and have it validate the token via `/auth/me` on load (optional hardening).

5. **CORS:** enable CORS on the backend for the static origin (or serve the frontend from the same origin).

---

## 7. Business rules the backend must enforce (from the spec)

- **Passwords:** min 8 chars **and** at least one special character.
- **Email verification** required after signup (6-digit OTP).
- **Role-based access:**
  - Employees see **only their own** profile, attendance, leave, payroll.
  - Admin/HR can view/manage **all** employees and approve/reject leave.
  - **Salary Info is admin/HR-only** — never return salary in an employee's own profile payload.
  - Employees may edit **limited** profile fields only (address, phone, avatar).
- **Attendance is the source of truth for payable days.** Unpaid leave or a missing attendance day **reduces payable days** in payroll computation.
- **Leave:** new requests start `Pending`; only admin can move to `Approved`/`Rejected`. `duration` is inclusive of both start & end dates.
- **Salary auto-calculation** (component values auto-update when wage changes; total of components must not exceed the defined wage):
  - `Basic = 50% of monthly wage`
  - `HRA = 50% of Basic`
  - `Standard Allowance ≈ 16.67% of wage`, `Performance Bonus ≈ 8.33%`, `Leave Travel Allowance ≈ 8.33%`, `Fixed Allowance = balancing remainder`
  - `PF (employee) = 12% of Basic`, `PF (employer) = 12% of Basic`
  - `Professional Tax = ₹200 (fixed)`
  - `Net Pay ≈ monthlyWage − PF(employee) − Professional Tax`
- **Attendance status types:** Present, Absent, Half-day, Leave.

---

## 8. Notes & assumptions

- Dates are ISO `YYYY-MM-DD`; times are `HH:MM` (24h). The UI formats them for display.
- IDs: employees `EMP-YYYY-NNN`, leave `LV-####`. Keep formats consistent.
- The frontend gracefully shows **initials** when `avatar` is empty — avatars are optional.
- The "view as Admin/Employee" topbar switch and all seed data in `store.js` are **frontend-only** and should be removed/ignored once real auth + API are in place.
- Money is rendered as `₹` (INR) — adjust currency in `ui.js` (`fmt.money`) if needed.

---

_Questions on any field name or endpoint shape? The canonical source for current field names is `HRMS_frontend/public/assets/js/store.js` (the `seed` object)._
