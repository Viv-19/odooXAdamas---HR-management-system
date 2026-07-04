/* =========================================================================
   HRMS — Dashboard renderer (role-aware).
   Employee: profile / attendance / leave quick cards + recent activity.
   Admin/HR: workforce stats + pending approvals + today's attendance.
   Reads from HRMS.store; re-renders when the check-in state changes.
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt, toast, confirmDialog } = HRMS.ui;

  function greeting() {
    const h = new Date().getHours();
    return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  }
  const today = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

  function avatar(emp, cls) {
    return emp.avatar
      ? '<img class="avatar ' + cls + '" src="' + emp.avatar + '" alt="">'
      : '<span class="avatar ' + cls + '">' + fmt.initials(emp.name) + "</span>";
  }
  function statusBadge(status) {
    const map = {
      present: ['badge-success', "Present"], leave: ['badge-info', "On Leave"], absent: ['badge-warning', "Absent"],
    };
    const [cls, label] = map[status] || ["badge-neutral", status];
    return '<span class="badge ' + cls + '">' + label + "</span>";
  }

  // ------------------------------ Employee -------------------------------
  async function renderEmployee(root) {
    await store.loadMe();
    await store.loadBalance();
    const user = store.currentUser();
    const checkedIn = HRMS.shell.isCheckedIn();
    const bal = store.balances();
    const firstName = (user.name || "").split(" ")[0];

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${greeting()}, ${fmt.escape(firstName)}.</h1>
          <p class="page-subtitle">Here's what's happening today.</p>
        </div>
        <span class="badge badge-neutral" style="height:32px;">${today}</span>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <!-- Profile -->
        <div class="card card-pad card-hover flex flex-col justify-between">
          <div class="flex items-start justify-between mb-6">
            <div class="feature-icon" style="width:48px;height:48px;border-radius:12px;background:var(--primary-light);color:var(--primary-hover);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined icon-fill">person</span>
            </div>
            <a href="profile.html" class="link" style="font-size:13px;">View</a>
          </div>
          <div>
            <h3 class="h-md">Your Profile</h3>
            <p class="text-muted" style="font-size:14px;margin-top:4px;">${fmt.escape(user.role)} • ${fmt.escape(user.department)}</p>
          </div>
        </div>

        <!-- Attendance -->
        <div class="card card-pad card-hover flex flex-col justify-between">
          <div class="flex items-start justify-between mb-6">
            <div class="feature-icon" style="width:48px;height:48px;border-radius:12px;background:var(--primary-light);color:var(--primary-hover);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined icon-fill">schedule</span>
            </div>
            <span class="badge ${checkedIn ? "badge-success" : "badge-neutral"}">${checkedIn ? "Checked In" : "Checked Out"}</span>
          </div>
          <div>
            <h3 class="h-md">Attendance</h3>
            <p class="text-muted" style="font-size:14px;margin-top:4px;">${checkedIn ? "Since 08:45 AM • Today" : "Not checked in yet"}</p>
            <button id="dash-checkin" class="btn ${checkedIn ? "btn-outline" : "btn-primary"}" style="width:100%;margin-top:16px;">
              <span class="material-symbols-outlined">${checkedIn ? "logout" : "login"}</span>${checkedIn ? "Check Out" : "Check In"}
            </button>
          </div>
        </div>

        <!-- Leave balance -->
        <div class="card card-pad card-hover flex flex-col justify-between">
          <div class="flex items-start justify-between mb-6">
            <div class="feature-icon" style="width:48px;height:48px;border-radius:12px;background:var(--primary-light);color:var(--primary-hover);display:flex;align-items:center;justify-content:center;">
              <span class="material-symbols-outlined icon-fill">flight_takeoff</span>
            </div>
          </div>
          <div>
            <h3 class="h-lg" style="font-size:28px;">${bal.paid} Days</h3>
            <p class="text-muted" style="font-size:14px;margin-top:4px;">Paid leave balance</p>
            <a href="leave.html" class="btn btn-outline" style="width:100%;margin-top:16px;">Request Leave</a>
          </div>
        </div>
      </div>

      <!-- Recent activity -->
      <div class="card overflow-hidden">
        <div style="padding:16px 24px;border-bottom:1px solid var(--surface-variant);background:var(--surface-container-low);">
          <h3 class="h-md">Recent Activity</h3>
        </div>
        <div style="padding:24px;">
          <ul style="list-style:none;margin:0;padding:0;position:relative;">
            <div style="position:absolute;left:5px;top:6px;bottom:6px;width:2px;background:var(--surface-variant);"></div>
            ${[
              ["event_available", "Leave Request Approved", "2 hrs ago", "Your Annual Leave from Oct 26 – Oct 28 was approved by your manager.", "var(--success)"],
              ["login", "Check-in Successful", "Today, 08:45 AM", "Location verified: Head Office, Building A.", "var(--primary)"],
              ["payments", "Payroll Processed", "Oct 15", "Your October mid-month payroll was processed successfully.", "var(--outline-variant)"],
            ].map(([icon, title, time, desc, dot]) => `
              <li style="position:relative;padding-left:28px;margin-bottom:16px;">
                <span style="position:absolute;left:0;top:4px;width:12px;height:12px;border-radius:9999px;background:${dot};box-shadow:0 0 0 4px var(--surface);"></span>
                <div class="card" style="padding:14px 16px;box-shadow:none;background:var(--background);">
                  <div class="flex items-start justify-between mb-1">
                    <h4 style="font-weight:600;font-size:14px;">${title}</h4>
                    <span class="text-muted" style="font-size:12px;white-space:nowrap;">${time}</span>
                  </div>
                  <p class="text-muted" style="font-size:13px;">${desc}</p>
                </div>
              </li>`).join("")}
          </ul>
        </div>
      </div>`;

    const btn = document.getElementById("dash-checkin");
    if (btn) btn.addEventListener("click", () => {
      const t = document.getElementById("hrms-checkin");
      if (t) t.click(); // reuse shell handler (toast + state + event)
    });
  }

  // ------------------------------- Admin ---------------------------------
  async function renderAdmin(root) {
    await store.loadMe();
    await Promise.all([store.loadEmployees(), store.loadLeaves()]);
    const user = store.currentUser();
    const emps = store.employees();

    let att = await store.apiAllAttendance();
    if (!Array.isArray(att)) att = [];

    const leaves = store.leaveRequests();
    const pending = leaves.filter((l) => l.status === "Pending");
    const presentCount = emps.filter((e) => e.status === "present").length;
    const onLeaveCount = emps.filter((e) => e.status === "leave").length;

    const stat = (icon, value, label, tone) => `
      <div class="card card-pad card-hover">
        <div class="flex items-center gap-3 mb-3">
          <div style="width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${tone.bg};color:${tone.fg};">
            <span class="material-symbols-outlined icon-fill">${icon}</span>
          </div>
          <span class="label">${label}</span>
        </div>
        <div class="h-xl" style="font-size:34px;">${value}</div>
      </div>`;

    root.innerHTML = `
      <div class="page-header">
        <div>
          <h1 class="page-title">${greeting()}, ${fmt.escape(user.name.split(" ")[0])}.</h1>
          <p class="page-subtitle">Here's your team overview for today.</p>
        </div>
        <span class="badge badge-neutral" style="height:32px;">${today}</span>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
        ${stat("groups", emps.length, "Total Employees", { bg: "var(--primary-light)", fg: "var(--primary-hover)" })}
        ${stat("how_to_reg", presentCount, "Present Today", { bg: "var(--success-container)", fg: "#14532d" })}
        ${stat("flight_takeoff", onLeaveCount, "On Leave", { bg: "var(--info-container)", fg: "#075985" })}
        ${stat("pending_actions", pending.length, "Pending Approvals", { bg: "var(--warning-container)", fg: "#92400e" })}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <!-- Pending approvals -->
        <div class="card overflow-hidden">
          <div class="flex items-center justify-between" style="padding:16px 20px;border-bottom:1px solid var(--surface-variant);background:var(--surface-container-low);">
            <h3 class="h-md">Pending Leave Approvals</h3>
            <a href="leave.html" class="link" style="font-size:13px;">View all</a>
          </div>
          <div id="approvals-list">
            ${pending.length ? pending.slice(0, 4).map((l) => approvalRow(l)).join("") : emptyRow("No pending approvals")}
          </div>
        </div>

        <!-- Today's attendance -->
        <div class="card overflow-hidden">
          <div class="flex items-center justify-between" style="padding:16px 20px;border-bottom:1px solid var(--surface-variant);background:var(--surface-container-low);">
            <h3 class="h-md">Today's Attendance</h3>
            <a href="attendance.html" class="link" style="font-size:13px;">Open</a>
          </div>
          <div>
            ${att.length ? att.map((a) => {
              const e = { name: a.employeeName, department: a.department };
              const ci = a.checkIn ? new Date(a.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
              const co = a.checkOut ? new Date(a.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "—";
              return `<div class="flex items-center justify-between" style="padding:14px 20px;border-bottom:1px solid var(--surface-container-high);">
                <div class="flex items-center gap-3">${avatar(e, "avatar-sm")}
                  <div><div style="font-weight:600;font-size:14px;">${fmt.escape(a.employeeName)}</div>
                  <div class="text-muted" style="font-size:12px;">${fmt.escape(a.department)}</div></div>
                </div>
                <div class="flex items-center gap-4" style="font-size:13px;">
                  <span class="text-muted">${ci} – ${co}</span>
                  ${statusBadge((a.status || "").toLowerCase())}
                </div>
              </div>`;
            }).join("") : emptyRow("No attendance recorded yet today")}
          </div>
        </div>
      </div>`;

    wireApprovals(root);
  }

  function approvalRow(l) {
    const e = store.employee(l.empId) || { name: l.empId, department: "" };
    const typeBadge = l.type.includes("Sick") ? "badge-error" : l.type.includes("Unpaid") ? "badge-neutral" : "badge-primary";
    return `<div class="flex items-center justify-between" data-row="${l.id}" style="padding:14px 20px;border-bottom:1px solid var(--surface-container-high);">
      <div class="flex items-center gap-3">${avatar(e, "avatar-sm")}
        <div><div style="font-weight:600;font-size:14px;">${fmt.escape(e.name)}</div>
          <div class="text-muted" style="font-size:12px;">${fmt.date(l.start)} – ${fmt.date(l.end)} · ${l.duration}d</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="badge ${typeBadge}">${l.type.replace(" Time Off", "").replace(" Leave", "")}</span>
        <button class="btn-icon" data-reject title="Reject" style="width:32px;height:32px;background:var(--error-container);color:#93000a;border:none;border-radius:8px;cursor:pointer;">
          <span class="material-symbols-outlined" style="font-size:18px;">close</span></button>
        <button class="btn-icon" data-approve title="Approve" style="width:32px;height:32px;background:var(--success-container);color:#14532d;border:none;border-radius:8px;cursor:pointer;">
          <span class="material-symbols-outlined" style="font-size:18px;">check</span></button>
      </div>
    </div>`;
  }
  function emptyRow(text) {
    return `<div class="text-muted" style="padding:32px;text-align:center;font-size:14px;">${text}</div>`;
  }

  function wireApprovals(root) {
    root.querySelectorAll("[data-row]").forEach((row) => {
      const id = row.getAttribute("data-row");
      const act = (status) => {
        store.updateLeaveStatus(id, status);
        toast("Request " + status.toLowerCase(), status === "Approved" ? "success" : "info", 1600);
        row.style.transition = "opacity .2s, transform .2s";
        row.style.opacity = "0";
        row.style.transform = "translateX(8px)";
        setTimeout(() => render(), 260);
      };
      row.querySelector("[data-approve]").addEventListener("click", () => act("Approved"));
      row.querySelector("[data-reject]").addEventListener("click", () => act("Rejected"));
    });
  }

  // ------------------------------- Boot ----------------------------------
  async function render() {
    const root = document.getElementById("dash-root");
    if (!root) return;

    // Check actual attendance status from backend for UI consistency
    if (!store.isAdmin()) {
        try {
            const resp = await HRMS.api.get('/attendance/today');
            if (resp.res.ok && resp.data.data && resp.data.data.checkIn) {
                HRMS.shell.setCheckedIn(true);
            } else {
                HRMS.shell.setCheckedIn(false);
            }
        } catch(e) { console.error(e); }
    }

    if (store.isAdmin()) await renderAdmin(root);
    else await renderEmployee(root);
  }

  document.addEventListener("DOMContentLoaded", render);
  // shell.js owns the check-in/out API call + dispatches this event; just re-render.
  document.addEventListener("hrms:checkin", render);
})();
