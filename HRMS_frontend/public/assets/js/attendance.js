/* =========================================================================
   HRMS — Attendance (role-aware).
   Admin/HR: monitor everyone's check-in/out for a day, with work & extra hours.
   Employee: own check-in/out status + monthly records + present/leave/working
   day counts (attendance is the source of truth for payable days — per spec).
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt, toast } = HRMS.ui;

  function avatar(emp, cls) {
    return emp.avatar
      ? '<img class="avatar ' + cls + '" src="' + emp.avatar + '" alt="">'
      : '<span class="avatar ' + cls + '">' + fmt.initials(emp.name) + "</span>";
  }
  function extraPill(extra) {
    if (!extra || extra === "--:--") return '<span class="hours-pill" style="background:var(--surface-container-high);color:var(--on-surface-variant);">--:--</span>';
    if (extra.startsWith("+")) return '<span class="hours-pill" style="background:var(--success-container);color:#14532d;">' + extra + "</span>";
    if (extra.startsWith("-")) return '<span class="hours-pill" style="background:var(--error-container);color:#93000a;">' + extra + "</span>";
    return '<span class="hours-pill" style="background:var(--surface-container-high);color:var(--on-surface-variant);">' + extra + "</span>";
  }

  // ------------------------------ Admin ----------------------------------
  let attView = "day"; // "day" | "week"

  function weekDates() {
    // Monday–Friday of the week containing today.
    const now = new Date();
    const monday = new Date(now);
    const diff = (now.getDay() + 6) % 7; // days since Monday
    monday.setDate(now.getDate() - diff);
    return Array.from({ length: 5 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
  }
  function weekCell(emp, dayIdx) {
    const seed = (emp.id.charCodeAt(emp.id.length - 1) + dayIdx * 7) % 10;
    if (seed === 0) return { status: "leave" };
    if (seed === 1) return { status: "absent" };
    return { status: "present", work: seed % 3 === 0 ? "08:30" : "09:00" };
  }
  function weekCellHtml(c) {
    if (c.status === "leave") return '<span class="badge badge-info" title="On leave">Leave</span>';
    if (c.status === "absent") return '<span class="badge badge-warning" title="Absent">Absent</span>';
    return '<span class="badge badge-success" title="Present">' + c.work + "</span>";
  }

  function renderAdmin(root) {
    root.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Attendance</h1><p class="page-subtitle">Monitor employee check-ins and working hours.</p></div>
        <label class="topbar-search" style="height:44px;max-width:260px;"><span class="material-symbols-outlined" style="font-size:20px;">search</span>
          <input id="att-search" type="text" placeholder="Search employee…"></label>
      </div>

      <div class="card card-pad mb-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <button class="date-nav-btn" id="prev-day"><span class="material-symbols-outlined" style="font-size:20px;">chevron_left</span></button>
          <div class="flex items-center gap-2 px-3" style="font-weight:600;"><span class="material-symbols-outlined" style="color:var(--primary-hover);">calendar_month</span><span id="att-date"></span></div>
          <button class="date-nav-btn" id="next-day"><span class="material-symbols-outlined" style="font-size:20px;">chevron_right</span></button>
        </div>
        <div class="flex items-center gap-2">
          <div class="role-switch" id="att-view-switch">
            <button data-view="day" class="${attView === "day" ? "active" : ""}">Day</button>
            <button data-view="week" class="${attView === "week" ? "active" : ""}">Week</button>
          </div>
          <button class="btn btn-outline btn-sm" id="today-btn">Today</button>
        </div>
      </div>

      <div class="card overflow-hidden"><div style="overflow-x:auto;" id="att-table-wrap"></div></div>

      <div class="card card-pad mt-5" style="background:var(--surface-container-low);border-style:dashed;">
        <div class="flex items-start gap-3"><span class="material-symbols-outlined text-muted">info</span>
          <p class="text-muted" style="font-size:13px;">An employee's working source is based on the assigned attendance. Any unpaid leave or missing attendance day automatically reduces the number of payable days during payroll computation.</p></div>
      </div>`;

    document.querySelectorAll("#att-view-switch button").forEach((b) =>
      b.addEventListener("click", () => { attView = b.dataset.view; renderAdmin(root); }));
    const today = document.getElementById("today-btn");
    if (today) today.addEventListener("click", () => toast("Showing sample data for the current " + attView, "info", 1400));

    renderAdminTable();
    wireAdminSearch();
  }

  function renderAdminTable() {
    const wrap = document.getElementById("att-table-wrap");
    const dateLabel = document.getElementById("att-date");

    if (attView === "day") {
      dateLabel.textContent = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      let rows;
      if (Array.isArray(adminAtt)) {
        rows = adminAtt.length
          ? adminAtt.map((a) => {
              const e = { name: a.employeeName, department: a.department };
              const ci = fmtTime(a.checkIn), co = fmtTime(a.checkOut);
              return `<tr>
                <td><div class="flex items-center gap-3">${avatar(e, "avatar-sm")}
                  <div><div style="font-weight:600;">${fmt.escape(a.employeeName)}</div>
                  <div class="text-muted" style="font-size:12px;">${fmt.escape(a.department)}</div></div></div></td>
                <td>${ci ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:16px;color:var(--success);">login</span>' + ci + "</span>" : "—"}</td>
                <td>${co ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:16px;color:var(--error);">logout</span>' + co + "</span>" : '<span class="text-muted">--:--</span>'}</td>
                <td>${a.workHours || '<span class="text-muted">--:--</span>'}</td>
                <td>${extraPill(a.extraHours)}</td>
              </tr>`;
            }).join("")
          : '<tr><td colspan="5"><div class="text-muted" style="padding:28px;text-align:center;">No attendance recorded yet for today.</div></td></tr>';
      } else {
        rows = store.attendanceToday().map((a) => {
          const e = store.employee(a.empId) || { name: a.empId, department: "" };
          const late = a.late ? ' <span class="material-symbols-outlined" title="Late" style="font-size:16px;color:var(--warning);vertical-align:middle;">warning</span>' : "";
          return `<tr>
            <td><div class="flex items-center gap-3">${avatar(e, "avatar-sm")}
              <div><div style="font-weight:600;">${fmt.escape(e.name)}</div>
              <div class="text-muted" style="font-size:12px;">${fmt.escape(e.department)}</div></div></div></td>
            <td>${a.checkIn ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:16px;color:var(--success);">login</span>' + a.checkIn + late + "</span>" : "—"}</td>
            <td>${a.checkOut ? '<span class="flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:16px;color:var(--error);">logout</span>' + a.checkOut + "</span>" : '<span class="text-muted">--:--</span>'}</td>
            <td>${a.work || '<span class="text-muted">--:--</span>'}</td>
            <td>${extraPill(a.extra)}</td>
          </tr>`;
        }).join("");
      }
      wrap.innerHTML = `<table class="table" style="min-width:720px;">
        <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th></tr></thead>
        <tbody id="att-body">${rows}</tbody></table>`;
    } else {
      const days = weekDates();
      dateLabel.textContent = days[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" }) + " – " +
        days[4].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
      const head = days.map((d) => "<th style='text-align:center;'>" + d.toLocaleDateString("en-US", { weekday: "short" }) + " " + d.getDate() + "</th>").join("");
      const rows = store.employees().map((e) => {
        const cells = days.map((_, i) => "<td style='text-align:center;'>" + weekCellHtml(weekCell(e, i)) + "</td>").join("");
        return `<tr>
          <td><div class="flex items-center gap-3">${avatar(e, "avatar-sm")}
            <div><div style="font-weight:600;">${fmt.escape(e.name)}</div>
            <div class="text-muted" style="font-size:12px;">${fmt.escape(e.department)}</div></div></div></td>${cells}</tr>`;
      }).join("");
      wrap.innerHTML = `<table class="table" style="min-width:760px;">
        <thead><tr><th>Employee</th>${head}</tr></thead>
        <tbody id="att-body">${rows}</tbody></table>`;
    }
  }

  function wireAdminSearch() {
    const search = document.getElementById("att-search");
    if (search) search.addEventListener("input", HRMS.utils.debounce((e) => {
      const f = e.target.value.trim().toLowerCase();
      document.querySelectorAll("#att-body tr").forEach((tr) => {
        tr.style.display = !f || tr.textContent.toLowerCase().includes(f) ? "" : "none";
      });
    }, 150));
  }

  // ------------------------------ Employee -------------------------------
  function synthRecords() {
    // Recent working days for the current employee (frontend sample).
    const out = [];
    const d = new Date();
    let added = 0, i = 0;
    while (added < 12) {
      const day = new Date(d); day.setDate(d.getDate() - i); i++;
      const dow = day.getDay();
      if (dow === 0 || dow === 6) continue; // skip weekends
      const iso = day.toISOString().slice(0, 10);
      const leave = added === 3;   // one leave day
      const absent = added === 7;  // one absent day
      out.push({
        date: iso,
        status: leave ? "leave" : absent ? "absent" : "present",
        checkIn: leave || absent ? null : "10:00",
        checkOut: leave || absent ? null : (added === 1 ? null : "19:00"),
        work: leave || absent ? null : (added === 1 ? null : "09:00"),
        extra: leave || absent ? "--:--" : (added % 4 === 0 ? "+01:00" : added === 5 ? "-00:45" : "00:00"),
      });
      added++;
    }
    return out;
  }

  function renderEmployee(root) {
    const rec = todayRec;
    const state = rec && rec.checkOut ? "done" : rec && rec.checkIn ? "in" : "out";
    const checkedIn = state === "in";
    const ciTime = rec && rec.checkIn ? fmtTime(rec.checkIn) : null;
    const coTime = rec && rec.checkOut ? fmtTime(rec.checkOut) : null;
    const hist = empHistory;
    const records = hist ? mapApiRecords(hist) : synthRecords();
    const present = hist ? hist.summary.present : records.filter((r) => r.status === "present").length;
    const leaves = hist ? hist.summary.leaves : records.filter((r) => r.status === "leave").length;
    const totalWorking = hist ? hist.summary.totalWorking : records.length;

    const statusBadge = (s) => s === "present"
      ? '<span class="badge badge-success">Present</span>'
      : s === "leave" ? '<span class="badge badge-info">Leave</span>' : '<span class="badge badge-warning">Absent</span>';

    const rows = records.length
      ? records.map((r) => `
      <tr>
        <td style="font-weight:600;">${fmt.date(r.date)}</td>
        <td>${r.checkIn || '<span class="text-muted">--:--</span>'}</td>
        <td>${r.checkOut || '<span class="text-muted">--:--</span>'}</td>
        <td>${r.work || '<span class="text-muted">--:--</span>'}</td>
        <td>${extraPill(r.extra)}</td>
        <td>${statusBadge(r.status)}</td>
      </tr>`).join("")
      : '<tr><td colspan="6"><div class="text-muted" style="padding:24px;text-align:center;">No attendance records this month yet — use Check In to record today.</div></td></tr>';

    const stat = (icon, value, label, tone) => `
      <div class="card card-pad">
        <div class="flex items-center gap-3 mb-2">
          <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${tone.bg};color:${tone.fg};">
            <span class="material-symbols-outlined icon-fill">${icon}</span></div>
          <span class="label">${label}</span></div>
        <div class="h-xl" style="font-size:30px;">${value}</div>
      </div>`;

    root.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">My Attendance</h1><p class="page-subtitle">Track your check-ins, working hours and monthly summary.</p></div>
      </div>

      <!-- Check-in status hero -->
      <div class="card mb-5 overflow-hidden">
        <div style="height:6px;background:linear-gradient(90deg,var(--primary-container),var(--primary),var(--primary-fixed-dim));"></div>
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-0">
          <div class="lg:col-span-2 flex flex-col items-center text-center" style="padding:32px;">
            <div class="flex items-center justify-center mb-3" style="width:80px;height:80px;border-radius:9999px;background:${state === "out" ? "var(--surface-container)" : "var(--success-container)"};">
              <span class="material-symbols-outlined icon-fill" style="font-size:40px;color:${state === "out" ? "var(--on-surface-variant)" : "var(--success)"};">${state === "out" ? "schedule" : "how_to_reg"}</span>
            </div>
            <h2 class="h-lg mb-1">${state === "in" ? "Checked In" : state === "done" ? "Checked Out" : "Not Checked In"}</h2>
            <p class="text-muted mb-4" style="font-size:14px;">${state === "in" ? "You're checked in for today." : state === "done" ? "Your attendance for today is complete." : "Check in to record today's attendance."}</p>
            <div class="card" style="padding:14px 28px;box-shadow:none;background:var(--surface-container-low);margin-bottom:18px;">
              <div class="label" style="text-align:center;">Current Time</div>
              <div class="h-xl" style="font-size:32px;color:var(--primary-hover);text-align:center;" id="att-clock">--:--</div>
              <div class="flex items-center justify-center gap-1 text-muted" style="font-size:12px;"><span class="material-symbols-outlined" style="font-size:14px;">location_on</span>Head Office · Building A</div>
            </div>
            <button id="att-checkin" class="btn ${state === "in" ? "btn-outline" : "btn-primary"}" ${state === "done" ? "disabled" : ""}>
              <span class="material-symbols-outlined">${state === "in" ? "logout" : state === "done" ? "check" : "login"}</span>${state === "in" ? "Check Out Now" : state === "done" ? "Completed for Today" : "Check In Now"}
            </button>
          </div>
          <div style="padding:24px;border-left:1px solid var(--surface-variant);background:var(--surface-container-low);">
            <div class="subcard-title" style="font-family:var(--font-heading);font-weight:600;font-size:14px;margin-bottom:14px;">Today's Timeline</div>
            <div class="flex flex-col gap-4" style="font-size:13px;">
              <div class="flex items-center gap-3" style="opacity:${ciTime ? 1 : 0.4};"><span class="material-symbols-outlined ${ciTime ? "icon-fill" : ""}" style="color:${ciTime ? "var(--success)" : "var(--outline-variant)"};">${ciTime ? "check_circle" : "radio_button_unchecked"}</span><div><div style="font-weight:600;">Check-In</div><div class="text-muted">${ciTime || "Pending"}</div></div></div>
              <div class="flex items-center gap-3" style="opacity:${state === "in" ? 1 : 0.4};"><span class="material-symbols-outlined" style="color:var(--primary-hover);">radio_button_checked</span><div><div style="font-weight:600;">At Work</div><div class="text-muted">${state === "in" ? "In progress" : state === "done" ? "Ended" : "—"}</div></div></div>
              <div class="flex items-center gap-3" style="opacity:${coTime ? 1 : 0.4};"><span class="material-symbols-outlined ${coTime ? "icon-fill" : ""}" style="color:${coTime ? "var(--error)" : "var(--outline-variant)"};">${coTime ? "check_circle" : "radio_button_unchecked"}</span><div><div style="font-weight:600;">Check-Out</div><div class="text-muted">${coTime || "Pending"}</div></div></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly summary -->
      <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-5">
        ${stat("event_available", present, "Days Present", { bg: "var(--success-container)", fg: "#14532d" })}
        ${stat("flight_takeoff", leaves, "Leaves Taken", { bg: "var(--info-container)", fg: "#075985" })}
        ${stat("calendar_month", totalWorking, "Total Working Days", { bg: "var(--primary-light)", fg: "var(--primary-hover)" })}
      </div>

      <!-- Records -->
      <div class="card overflow-hidden">
        <div class="flex items-center justify-between" style="padding:16px 20px;border-bottom:1px solid var(--surface-variant);background:var(--surface-container-low);">
          <h3 class="h-md">My Records</h3>
          <span class="text-muted" style="font-size:13px;">${new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}</span>
        </div>
        <div style="overflow-x:auto;">
          <table class="table" style="min-width:640px;">
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Work Hours</th><th>Extra Hours</th><th>Status</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>`;

    // Live clock
    const clock = document.getElementById("att-clock");
    const tick = () => {
      const n = new Date();
      let h = n.getHours(); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12;
      clock.textContent = h + ":" + String(n.getMinutes()).padStart(2, "0") + " " + ap;
    };
    tick(); setInterval(tick, 30000);

    const btn = document.getElementById("att-checkin");
    if (btn) btn.addEventListener("click", async () => {
      if (state === "done") return;
      btn.disabled = true;
      try {
        if (state === "in") { await store.apiCheckOut(); HRMS.shell.setCheckedIn(false); toast("Checked out successfully", "success", 1600); }
        else { await store.apiCheckIn(); HRMS.shell.setCheckedIn(true); toast("Checked in successfully", "success", 1600); }
        await render();
      } catch (err) { btn.disabled = false; toast(err.message || "Attendance update failed", "error", 2500); }
    });
  }

  let adminAtt = null;   // /attendance/all DTO array (admin day view)
  let empHistory = null; // /attendance/me { records, summary } (employee)
  let todayRec = null;   // /attendance/today record (employee hero + timeline)
  const fmtTime = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    if (isNaN(d)) return null;
    return String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  };
  function mapApiRecords(hist) {
    return hist.records.map((r) => ({
      date: String(r.date).slice(0, 10),
      status: r.status === "PRESENT" || r.status === "HALF_DAY" ? "present" : r.status === "LEAVE" ? "leave" : "absent",
      checkIn: fmtTime(r.checkIn),
      checkOut: fmtTime(r.checkOut),
      work: r.workHours && r.workHours !== "--:--" ? r.workHours : null,
      extra: r.extraHours || "--:--",
    }));
  }

  async function render() {
    const root = document.getElementById("att-root");
    if (!root) return;
    if (store.isAdmin()) {
      adminAtt = await store.apiAllAttendance();
      renderAdmin(root);
    } else {
      const [h, t] = await Promise.all([store.apiMyAttendance(), store.apiToday()]);
      empHistory = h;
      todayRec = t && typeof t === "object" ? t : null;
      renderEmployee(root);
    }
  }

  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("hrms:checkin", render);
})();
