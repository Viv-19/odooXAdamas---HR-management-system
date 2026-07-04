/* =========================================================================
   HRMS — Front-end mock data store + session/role state.
   Backend is owned by another team; this provides realistic, consistent
   sample data so every screen renders meaningfully and role-based views work.
   Data persists in localStorage and can be reset via HRMS.store.reset().
   ========================================================================= */
(function () {
  const LS_KEY = "hrms_store_v1";
  const SESSION_KEY = "hrms_session_v1";

  // ---- Seed data (single source of truth for IDs, names, formats) --------
  const seed = {
    employees: [
      {
        id: "EMP-2024-001", name: "Alex Mercer", role: "Senior Frontend Developer",
        department: "Engineering", email: "alex.mercer@hrms.com", phone: "+1 (555) 019-8234",
        manager: "Sarah Jenkins", location: "San Francisco HQ", employmentType: "Full-Time",
        joinDate: "2022-03-14", status: "present", access: "employee", avatar: "",
        tag: "Senior Dev",
      },
      {
        id: "EMP-2024-002", name: "Sarah Jenkins", role: "HR Manager",
        department: "Human Resources", email: "sarah.jenkins@hrms.com", phone: "+1 (555) 123-4567",
        manager: "David Chen", location: "New York Office", employmentType: "Full-Time",
        joinDate: "2020-01-06", status: "present", access: "admin", avatar: "",
        tag: "Specialist",
      },
      {
        id: "EMP-2024-003", name: "David Chen", role: "Finance Director",
        department: "Finance", email: "david.chen@hrms.com", phone: "+1 (555) 220-7788",
        manager: "—", location: "New York Office", employmentType: "Full-Time",
        joinDate: "2019-07-22", status: "leave", access: "employee", avatar: "",
        tag: "Director",
      },
      {
        id: "EMP-2024-004", name: "Emily Davis", role: "Marketing Manager",
        department: "Marketing", email: "emily.davis@hrms.com", phone: "+1 (555) 442-1190",
        manager: "David Chen", location: "Austin Office", employmentType: "Full-Time",
        joinDate: "2021-09-30", status: "absent", access: "employee", avatar: "",
        tag: "Manager",
      },
      {
        id: "EMP-2024-005", name: "Michael Kim", role: "Sales Executive",
        department: "Sales", email: "michael.kim@hrms.com", phone: "+1 (555) 771-3345",
        manager: "Emily Davis", location: "Austin Office", employmentType: "Full-Time",
        joinDate: "2023-02-11", status: "present", access: "employee", avatar: "",
        tag: "Executive",
      },
      {
        id: "EMP-2024-006", name: "Jane Smith", role: "Product Designer",
        department: "Design", email: "jane.smith@hrms.com", phone: "+1 (555) 664-2210",
        manager: "Sarah Jenkins", location: "San Francisco HQ", employmentType: "Full-Time",
        joinDate: "2022-11-01", status: "present", access: "employee", avatar: "",
        tag: "Designer",
      },
    ],

    // Attendance for "today" (admin list view)
    attendanceToday: [
      { empId: "EMP-2024-001", checkIn: "10:00", checkOut: "19:00", work: "09:00", extra: "+01:00" },
      { empId: "EMP-2024-006", checkIn: "09:30", checkOut: "18:30", work: "09:00", extra: "00:00" },
      { empId: "EMP-2024-005", checkIn: "11:15", checkOut: "19:00", work: "07:45", extra: "-01:15", late: true },
      { empId: "EMP-2024-004", checkIn: "10:00", checkOut: null, work: null, extra: null },
    ],

    // Leave requests (admin approvals + employee history)
    leaveRequests: [
      { id: "LV-1001", empId: "EMP-2024-006", type: "Paid Time Off", start: "2023-10-28", end: "2023-11-02", duration: 6, status: "Pending", reason: "Family vacation" },
      { id: "LV-1002", empId: "EMP-2024-005", type: "Sick Time Off", start: "2023-11-15", end: "2023-11-15", duration: 1, status: "Pending", reason: "Doctor appointment" },
      { id: "LV-1003", empId: "EMP-2024-004", type: "Unpaid Leave", start: "2023-12-20", end: "2024-01-02", duration: 14, status: "Pending", reason: "Personal travel" },
      { id: "LV-1004", empId: "EMP-2024-001", type: "Paid Time Off", start: "2026-10-15", end: "2026-10-20", duration: 5, status: "Approved", reason: "Family vacation" },
      { id: "LV-1005", empId: "EMP-2024-001", type: "Sick Time Off", start: "2026-11-02", end: "2026-11-02", duration: 1, status: "Pending", reason: "Doctor appointment" },
      { id: "LV-1006", empId: "EMP-2024-001", type: "Unpaid Leave", start: "2026-09-10", end: "2026-09-10", duration: 1, status: "Rejected", reason: "Personal errands" },
    ],

    // Balances
    balances: { paid: 24, sick: 7, unpaid: null },

    // Salary structure for the profiled employee (admin editable)
    salary: {
      monthlyWage: 50000, yearlyWage: 600000, workingDaysPerWeek: 5, breakTime: 1,
      components: [
        { name: "Basic Salary", note: "Base salary; 50% of monthly wage.", pct: 50, amount: 25000 },
        { name: "House Rent Allowance (HRA)", note: "50% of the basic salary.", pct: 50, amount: 12500 },
        { name: "Standard Allowance", note: "Fixed amount provided to the employee.", pct: 16.67, amount: 4167 },
        { name: "Performance Bonus", note: "Variable amount defined by the company.", pct: 8.33, amount: 2092.5 },
        { name: "Leave Travel Allowance", note: "Covers employee travel expenses.", pct: 8.33, amount: 2092.5 },
        { name: "Fixed Allowance", note: "Balancing portion after other components.", pct: 11.67, amount: 2498 },
      ],
      pf: { employeePct: 12, employerPct: 12, employee: 3000, employer: 3000 },
      tax: { professional: 200 },
    },

    // Public holidays for the leave calendar legend
    holidays: [
      { date: "2026-01-14", name: "Kite Festival" },
      { date: "2026-03-06", name: "Republic Day" },
      { date: "2026-08-15", name: "Independence Day" },
      { date: "2026-08-28", name: "Rakhi" },
      { date: "2026-10-02", name: "Gandhi Jayanti" },
      { date: "2026-11-08", name: "Diwali" },
      { date: "2026-11-09", name: "New Year" },
      { date: "2026-11-11", name: "Bhai Duj" },
    ],
  };

  function load() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    save(seed);
    return JSON.parse(JSON.stringify(seed));
  }
  function save(data) {
    try { localStorage.setItem(LS_KEY, JSON.stringify(data)); } catch (_e) {}
  }

  // Coerce an API employee DTO's date to yyyy-mm-dd for the renderers.
  function normalizeEmp(e) {
    if (e && e.joinDate) e.joinDate = String(e.joinDate).slice(0, 10);
    return e;
  }

  const data = load();
  let meCache = null;

  // ---- Session / role ----------------------------------------------------
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) return JSON.parse(raw);
    } catch (_e) {}
    // Default demo session: HR admin so the full app is explorable.
    const s = { role: "admin", empId: "EMP-2024-002" };
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }
  function setSession(patch) {
    const s = Object.assign(getSession(), patch);
    localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    return s;
  }
  function setRole(role) {
    // Switch identity to a representative user for the chosen role.
    const empId = role === "admin" ? "EMP-2024-002" : "EMP-2024-001";
    return setSession({ role, empId });
  }

  // ---- Selectors ---------------------------------------------------------
  const api = {
    seed,
    all: () => data,
    employees: () => data.employees,
    employee: (id) => data.employees.find((e) => e.id === id),
    currentUser: () => {
      if (meCache) return meCache;
      try {
        const u = JSON.parse(localStorage.getItem('hrms_user'));
        if (u) {
          return { id: u.employeeId, name: u.employeeId, department: "N/A", role: u.role };
        }
      } catch (e) {}
      return api.employee(getSession().empId) || data.employees[0];
    },
    isAdmin: () => {
      try {
        const u = JSON.parse(localStorage.getItem('hrms_user'));
        if (u) return u.role === "ADMIN" || u.role === "HR";
      } catch (e) {}
      return getSession().role === "admin";
    },
    role: () => api.isAdmin() ? "admin" : "employee",
    attendanceToday: () => data.attendanceToday,
    leaveRequests: () => data.leaveRequests,
    leaveForEmployee: (id) => data.leaveRequests.filter((l) => l.empId === id),
    balances: () => data.balances,
    salary: () => data.salary,
    holidays: () => data.holidays,

    getSession,
    setSession,
    setRole,
    save: () => save(data),
    reset: () => { localStorage.removeItem(LS_KEY); localStorage.removeItem(SESSION_KEY); location.reload(); },

    // Mutations (in-memory; persisted to localStorage)
    updateLeaveStatus(id, status) {
      const l = data.leaveRequests.find((x) => x.id === id);
      if (l) { l.status = status; save(data); }
      return l;
    },
    addLeave(req) {
      req.id = "LV-" + (1000 + data.leaveRequests.length + 1);
      req.status = "Pending";
      data.leaveRequests.unshift(req);
      save(data);
      return req;
    },
    addEmployee(emp) {
      data.employees.push(emp);
      save(data);
      return emp;
    },
    removeEmployee(id) {
      const i = data.employees.findIndex((e) => e.id === id);
      if (i > -1) {
        data.employees.splice(i, 1);
        // Also drop that employee's leave requests.
        data.leaveRequests = data.leaveRequests.filter((l) => l.empId !== id);
        save(data);
        return true;
      }
      return false;
    },

    // ---- Live API (hybrid: fetch into cache, fall back to seed on failure) ----
    async loadEmployees() {
      try {
        if (!window.HRMS.api) return data.employees;
        const resp = await HRMS.api.get("/employees");
        if (resp.res.ok && Array.isArray(resp.data.data)) {
          data.employees = resp.data.data.map(normalizeEmp);
        }
      } catch (_e) {}
      return data.employees;
    },
    async loadMe() {
      try {
        if (!window.HRMS.api) return api.currentUser();
        const resp = await HRMS.api.get("/employees/me");
        if (resp.res.ok && resp.data.data) { meCache = normalizeEmp(resp.data.data); return meCache; }
      } catch (_e) {}
      return api.currentUser();
    },
    async apiCreateEmployee(payload) {
      const resp = await HRMS.api.post("/employees", payload);
      if (!resp.res.ok) throw new Error((resp.data && resp.data.message) || "Create failed");
      return resp.data.data;
    },
    async apiRemoveEmployee(id) {
      const resp = await HRMS.api.delete("/employees/" + id);
      if (!resp.res.ok) throw new Error((resp.data && resp.data.message) || "Delete failed");
      return true;
    },
    async apiSetRole(id, role) {
      const resp = await HRMS.api.put("/employees/" + id + "/role", { role });
      if (!resp.res.ok) throw new Error((resp.data && resp.data.message) || "Role update failed");
      return resp.data.data;
    },
  };

  window.HRMS = window.HRMS || {};
  window.HRMS.store = api;
})();
