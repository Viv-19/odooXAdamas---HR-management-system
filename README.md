<div align="center">

# 🧑‍💼 HRMS — Human Resource Management System

### _Every workday, perfectly aligned._

A full-stack HR platform that digitizes and streamlines core HR operations — onboarding, profile management, attendance, leave & time-off, payroll, and approval workflows — with clean **role-based access** for Admins/HR and Employees.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

</div>

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Key Features](#-key-features)
3. [Tech Stack](#-tech-stack)
4. [Architecture & Project Structure](#-architecture--project-structure)
5. [Getting Started](#-getting-started)
6. [API Reference](#-api-reference)
7. [Data Models](#-data-models)
8. [Role-Based Access](#-role-based-access)
9. [Business Rules](#-business-rules)
10. [Team](#-team)

---

## 🌟 Overview

HRMS is a **monorepo** with a decoupled architecture:

- **Backend** — a RESTful API (Node + Express + Prisma + PostgreSQL) with JWT auth, email OTP verification, and layered `routes → controllers → services → Prisma` structure.
- **Frontend** — a fast, dependency-light SPA-style app (vanilla HTML/CSS/JS + Tailwind via CDN) built on a single shared **design system** and an app **shell** (sidebar + topbar) that every authenticated page reuses.

Two user classes are supported throughout:

| Role | Capabilities |
| ---- | ------------ |
| **Admin / HR Officer** | Manage employees, approve/reject leave, monitor attendance, configure payroll, promote employees to HR |
| **Employee** | View own profile & documents, check in/out, apply for leave, view read-only payroll |

---

## ✨ Key Features

### 🔐 Authentication & Authorization
- Sign up with **Employee ID + Email + Password** and mandatory **email OTP verification**.
- Sign in with a **role selector** (Employee / HR Admin), JWT sessions, and password strength enforcement.
- Forgot / reset password with OTP.
- Route-level **RBAC** — HR-only endpoints return `403` for employees.

### 📊 Dashboards (role-aware)
- **Employee:** profile, live attendance, leave-balance quick cards + recent activity.
- **Admin/HR:** workforce stats (total / present / on-leave / pending), pending leave approvals, and today's attendance snapshot.

### 👥 Employee Management
- Employee **directory** with live presence status (present / on-leave / absent).
- **Add**, **edit**, and **delete** employees.
- Rich tabbed **profile** — Resume · Job Details · Private Info · Documents · **Salary Info (admin-only)** · Security.
- **Promote an employee to HR** (or revert) — role management from the profile.

### 🕒 Attendance
- One-click **Check-In / Check-Out** with work-hours & overtime calculation.
- **Admin:** monitor everyone (Day / Week views).
- **Employee:** monthly history + summary (days present / leaves / total working days).
- Attendance is the **source of truth for payable days**.

### 🌴 Leave & Time-Off
- Apply on a **calendar** with paid/sick/holiday markers, live balances and breakdown.
- **Admin:** Pending / Approved / Rejected tabs with one-click **approve / reject** and **time-off allocation**.
- Leave types: Paid, Sick, Unpaid.

### 💰 Payroll
- **Admin editor:** pick an employee, set the monthly wage — **components, PF, tax and net pay auto-recalculate live** — then save the structure.
- **Employee:** read-only salary structure & net-pay view.

---

## 🛠️ Tech Stack

<table>
<tr><td><b>Frontend</b></td><td>

- HTML5 · CSS3 (design tokens + component classes)
- Vanilla JavaScript (ES6+, no framework/build step)
- Tailwind CSS (Play CDN) · Material Symbols · Hanken Grotesk + Inter

</td></tr>
<tr><td><b>Backend</b></td><td>

- Node.js · Express.js
- Prisma ORM · PostgreSQL
- JWT (`jsonwebtoken`) · `bcryptjs` · `joi` validation
- `nodemailer` (OTP email) · `helmet` · `cors` · `morgan`

</td></tr>
</table>

---

## 🗂️ Architecture & Project Structure

```
odooXAdamas---HR-management-system/
├── HRMS_backend/
│   ├── prisma/
│   │   ├── schema.prisma          # User, Profile, Department, Attendance,
│   │   │                          #   LeaveRequest, Payroll, Holiday …
│   │   └── seed.js                # admin + 6 employees + departments + holidays
│   ├── src/
│   │   ├── clients/               # prisma client singleton
│   │   ├── config/                # env & mail config
│   │   ├── constants/             # roles, HTTP status codes
│   │   ├── controllers/           # auth, user, attendance, leave, payroll
│   │   ├── middlewares/           # authenticate, authorize, validate, error
│   │   ├── routes/                # /auth /employees /attendance /leave /payroll
│   │   ├── services/              # business logic (+ mail)
│   │   ├── utils/                 # apiResponse, hash, token
│   │   └── validators/            # joi schemas
│   ├── app.js · server.js · package.json
│
└── HRMS_frontend/
    └── public/
        ├── assets/
        │   ├── css/  global.css (design tokens+components) · app.css (shell)
        │   └── js/   theme · store · ui · shell · dashboard · employees ·
        │             employee-add · profile · attendance · leave · payroll
        ├── js/       api · auth · verify · utils
        ├── signin · signup · verify · forgot-password · reset-password
        └── dashboard · employees · employee-add · profile · attendance ·
            leave · payroll · index
```

**Design system:** every page loads one shared Tailwind theme (`theme.js`) + tokens/components (`global.css`). Authenticated pages render a common **shell** (`shell.js` → sidebar + topbar) and read data through a **hybrid store** (`store.js`) that fetches from the live API and falls back to sample data offline.

**Response envelope (all endpoints):**
```json
{ "success": true,  "message": "…", "data": { } }
{ "success": false, "message": "…", "errors": [ ] }
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18 and **npm**
- **PostgreSQL** running locally (or a connection string to one)

### 1️⃣ Backend

```bash
cd HRMS_backend

# configure environment
cp .env.example .env
#   → set DATABASE_URL to your local PostgreSQL
#   → set JWT_SECRET, EMAIL_USER, EMAIL_PASS (Gmail App Password)

npm install
npx prisma generate
npx prisma db push        # sync schema to your DB (no migrations needed)
node prisma/seed.js       # seed departments, admin & sample employees

npm run dev               # http://localhost:5000  (nodemon, hot-reload)
```

### 2️⃣ Frontend

```bash
cd HRMS_frontend/public

# Option A: VS Code "Live Server" → open signin.html
# Option B: any static server, e.g.
python -m http.server 5500
```
Then open **http://localhost:5500/signin.html**.

> The frontend talks to the API at `http://localhost:5000/api/v1` (configured in `public/js/api.js`). CORS is enabled on the backend.

### `.env` template
```ini
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/HRMS_database?schema=public"
JWT_SECRET="change-me-to-a-long-random-secret"
JWT_EXPIRES_IN="24h"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-gmail-app-password"
CLIENT_URL="http://localhost:3000/"
```

---

## 📡 API Reference

> Base URL: `http://localhost:5000/api/v1` · Send `Authorization: Bearer <token>` on protected routes.

<details>
<summary><b>Auth</b></summary>

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/auth/signup` | Public | Register + send OTP |
| POST | `/auth/verify-otp` | Public | Verify email with OTP |
| POST | `/auth/signin` | Public | Login → JWT |
| GET  | `/auth/me` | Auth | Current token's user |
</details>

<details>
<summary><b>Employees</b></summary>

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | `/employees` | HR/Admin | List all employees (+ live status) |
| POST | `/employees` | HR/Admin | Create employee |
| GET | `/employees/me` | Auth | Own employee record |
| GET | `/employees/:id` | HR/Admin | Get one |
| PUT / PATCH | `/employees/:id` | HR/Admin | Update |
| PUT | `/employees/:id/role` | HR/Admin | **Promote/demote** (HR ⇄ Employee) |
| DELETE | `/employees/:id` | HR/Admin | Remove (cascade) |
</details>

<details>
<summary><b>Attendance</b></summary>

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| POST | `/attendance/check-in` | Auth | Check in |
| PUT | `/attendance/check-out` | Auth | Check out |
| GET | `/attendance/today` | Auth | Today's own status |
| GET | `/attendance/me?month=YYYY-MM` | Auth | Own history + summary |
| GET | `/attendance/all?date=YYYY-MM-DD` | HR/Admin | Everyone's day |
</details>

<details>
<summary><b>Leave</b></summary>

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | `/leave` | Auth | Employee: own · HR: all |
| POST | `/leave` | Auth | Apply for leave |
| PUT / PATCH | `/leave/:id/status` | HR/Admin | Approve / reject |
| GET | `/leave/balance` | Auth | Own balances |
| POST | `/leave/allocate` | HR/Admin | Allocate time-off |
| GET | `/leave/holidays` | Auth | Public holidays |
</details>

<details>
<summary><b>Payroll</b></summary>

| Method | Endpoint | Access | Description |
| ------ | -------- | ------ | ----------- |
| GET | `/payroll/me` | Auth | Own salary (read-only) |
| GET | `/payroll` | HR/Admin | Net-pay overview |
| GET | `/payroll/:id` | HR/Admin | Employee salary structure |
| PUT | `/payroll/:id` | HR/Admin | Update salary structure |
</details>

---

## 🧬 Data Models

Core Prisma models (see `HRMS_backend/prisma/schema.prisma`):

- **User** — `employeeId`, `email`, `password`, `role` (EMPLOYEE / HR / ADMIN), `isVerified`
- **Profile** — personal, job & bank details, `documents[]`, `salaryStructure` (JSON), leave balances → `Department`
- **Department** — named departments (relation to profiles)
- **Attendance** — one record per user per day (`checkIn`, `checkOut`, `status`)
- **LeaveRequest** — type, date range, status, remarks, reviewer
- **Payroll** — monthly payslip (basic / allowances / deductions / net)
- **Holiday**, **EmailVerification**, **PasswordResetOtp**

---

## 🛡️ Role-Based Access

- Employees see **only their own** profile, attendance, leave and payroll.
- **Salary Info** is visible to **Admin/HR only** — never returned in an employee's own view.
- Employees may edit **limited** profile fields (contact details).
- HR-only routes are enforced by `authorize()` middleware → `403 Forbidden` otherwise.

---

## 📐 Business Rules

- **Passwords:** ≥ 8 chars, incl. upper/lower/number/special character.
- **Email verification** required before first sign-in (6-digit OTP, 10-min expiry).
- **Attendance drives payroll:** missing days / unpaid leave reduce payable days.
- **Salary auto-calculation:** `Basic = 50% of wage`, `HRA = 50% of Basic`, allowances split so components total the wage; `PF = 12% of Basic`; `Professional Tax = ₹200`; `Net = wage − PF(employee) − Professional Tax`.
- **Leave flow:** requests start `PENDING`; only HR/Admin can approve/reject.

---

## 👨‍👩‍👧 Team

Built for the **Odoo Hackathon** by **Team Adamas**.

| Area | Scope |
| ---- | ----- |
| Frontend | Design system, all UI pages, hybrid API wiring |
| Backend | Express + Prisma API, auth, RBAC, business logic |
| Database | PostgreSQL schema & seed |

---

<div align="center">

**HRMS** · _Every workday, perfectly aligned._

</div>
