/* =========================================================================
   HRMS — Leave / Time-Off (role-aware).
   Admin/HR: review all requests (Pending/Approved/Rejected) + approve/reject,
             and allocate time off. Employee: balances, month calendar with
             markers, breakdown, recent requests, and Apply-for-Leave.
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt, toast, openModal } = HRMS.ui;

  const LEAVE_TYPES = ["Paid Time Off", "Sick Time Off", "Unpaid Leave"];

  function avatar(emp, cls) {
    return emp.avatar
      ? '<img class="avatar ' + cls + '" src="' + emp.avatar + '" alt="">'
      : '<span class="avatar ' + cls + '">' + fmt.initials(emp.name) + "</span>";
  }
  function typeBadge(type) {
    const cls = type.includes("Sick") ? "badge-error" : type.includes("Unpaid") ? "badge-neutral" : "badge-primary";
    return '<span class="badge ' + cls + '">' + type + "</span>";
  }
  function statusBadge(status) {
    const map = { Pending: ["badge-warning", "pending"], Approved: ["badge-success", "check_circle"], Rejected: ["badge-error", "cancel"] };
    const [cls, icon] = map[status] || ["badge-neutral", "help"];
    return '<span class="badge ' + cls + '"><span class="material-symbols-outlined" style="font-size:14px;">' + icon + "</span>" + status + "</span>";
  }
  function daysInclusive(start, end) {
    const a = new Date(start + "T00:00:00"), b = new Date(end + "T00:00:00");
    return Math.max(1, Math.round((b - a) / 86400000) + 1);
  }

  // ============================ EMPLOYEE ==================================
  let calMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  function renderEmployee(root) {
    const me = store.currentUser();
    const mine = store.leaveForEmployee(me.id);
    const bal = store.balances();
    const used = mine.filter((l) => l.status === "Approved").reduce((s, l) => s + l.duration, 0);
    const pending = mine.filter((l) => l.status === "Pending").length;
    const rejected = mine.filter((l) => l.status === "Rejected").length;

    const stat = (value, label, tone) => `
      <div class="card card-pad text-center">
        <div class="h-xl" style="font-size:30px;color:${tone};">${value}</div>
        <div class="label" style="margin-top:4px;">${label}</div>
      </div>`;

    root.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Leave &amp; Time-Off</h1><p class="page-subtitle">Request and track your time off.</p></div>
        <button class="btn btn-primary" id="apply-btn"><span class="material-symbols-outlined">add</span>New Request</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-5">
        ${stat(bal.paid, "Available (Days)", "var(--primary-hover)")}
        ${stat(used, "Used", "var(--on-surface)")}
        ${stat(pending, "Pending", "var(--warning)")}
        ${stat(rejected, "Rejected", "var(--error)")}
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <!-- Calendar -->
        <div class="lg:col-span-2 card card-pad">
          <div class="flex items-center justify-between mb-4">
            <h3 class="h-md">Leave Calendar</h3>
            <div class="flex items-center gap-2">
              <button class="date-nav-btn" id="cal-prev" style="width:32px;height:32px;border:1px solid var(--outline-variant);border-radius:8px;background:var(--surface);cursor:pointer;"><span class="material-symbols-outlined" style="font-size:18px;">chevron_left</span></button>
              <span id="cal-label" style="font-weight:600;min-width:130px;text-align:center;"></span>
              <button class="date-nav-btn" id="cal-next" style="width:32px;height:32px;border:1px solid var(--outline-variant);border-radius:8px;background:var(--surface);cursor:pointer;"><span class="material-symbols-outlined" style="font-size:18px;">chevron_right</span></button>
            </div>
          </div>
          <div id="cal-grid"></div>
          <div class="flex items-center gap-4 mt-4" style="font-size:12px;color:var(--on-surface-variant);">
            <span class="flex items-center gap-1"><span class="legend-dot" style="background:var(--primary-light);"></span>Paid</span>
            <span class="flex items-center gap-1"><span class="legend-dot" style="background:var(--error-container);"></span>Sick</span>
            <span class="flex items-center gap-1"><span class="legend-dot" style="background:var(--warning-container);"></span>Holiday</span>
            <span class="flex items-center gap-1"><span class="legend-dot" style="border:1px solid var(--primary);"></span>Today</span>
          </div>
        </div>

        <!-- Breakdown + recent -->
        <div class="flex flex-col gap-5">
          <div class="card card-pad">
            <h3 class="h-md mb-3">Leave Breakdown</h3>
            ${breakdownBar("Paid Time Off", used, bal.paid, "var(--primary)")}
            ${breakdownBar("Sick Time Off", 0, bal.sick, "var(--error)")}
          </div>
          <div class="card card-pad">
            <div class="flex items-center justify-between mb-2"><h3 class="h-md">Recent Requests</h3></div>
            <div>${mine.length ? mine.slice(0, 4).map(recentItem).join("") : '<p class="text-muted" style="font-size:13px;padding:8px 0;">No requests yet.</p>'}</div>
          </div>
        </div>
      </div>`;

    document.getElementById("apply-btn").addEventListener("click", () => openApplyModal(root));
    document.getElementById("cal-prev").addEventListener("click", () => { calMonth.setMonth(calMonth.getMonth() - 1); renderCalendar(me); });
    document.getElementById("cal-next").addEventListener("click", () => { calMonth.setMonth(calMonth.getMonth() + 1); renderCalendar(me); });
    renderCalendar(me);
  }

  function breakdownBar(label, used, total, color) {
    const pct = total ? Math.min(100, Math.round((used / total) * 100)) : 0;
    return `<div style="margin-bottom:12px;">
      <div class="flex items-center justify-between" style="font-size:13px;margin-bottom:5px;"><span>${label}</span><span class="text-muted">${used} / ${total} days</span></div>
      <div style="height:8px;border-radius:9999px;background:var(--surface-container-high);overflow:hidden;"><div style="height:100%;width:${pct}%;background:${color};border-radius:9999px;"></div></div>
    </div>`;
  }
  function recentItem(l) {
    const icon = l.type.includes("Sick") ? "medical_services" : l.type.includes("Unpaid") ? "money_off" : "flight_takeoff";
    return `<div class="flex items-center gap-3" style="padding:10px 0;border-bottom:1px solid var(--surface-container-high);">
      <span class="material-symbols-outlined" style="color:var(--primary-hover);">${icon}</span>
      <div style="flex:1;min-width:0;"><div style="font-weight:600;font-size:14px;">${fmt.escape(l.type)}</div>
      <div class="text-muted" style="font-size:12px;">${fmt.date(l.start)} – ${fmt.date(l.end)} · ${l.duration}d</div></div>
      ${statusBadge(l.status)}</div>`;
  }

  function renderCalendar(me) {
    const label = document.getElementById("cal-label");
    const grid = document.getElementById("cal-grid");
    if (!grid) return;
    label.textContent = calMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" });

    // Build marker map for the displayed month
    const y = calMonth.getFullYear(), m = calMonth.getMonth();
    const marks = {};
    store.leaveForEmployee(me.id).filter((l) => l.status !== "Rejected").forEach((l) => {
      let d = new Date(l.start + "T00:00:00"); const end = new Date(l.end + "T00:00:00");
      while (d <= end) {
        if (d.getFullYear() === y && d.getMonth() === m) marks[d.getDate()] = l.type.includes("Sick") ? "sick" : "paid";
        d.setDate(d.getDate() + 1);
      }
    });
    store.holidays().forEach((h) => {
      const d = new Date(h.date + "T00:00:00");
      if (d.getFullYear() === y && d.getMonth() === m && !marks[d.getDate()]) marks[d.getDate()] = "holiday";
    });

    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const now = new Date();
    const isThisMonth = now.getFullYear() === y && now.getMonth() === m;

    let cells = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => '<div class="cal-dow">' + d + "</div>").join("");
    for (let i = 0; i < firstDow; i++) cells += '<div class="cal-cell muted"></div>';
    for (let day = 1; day <= daysInMonth; day++) {
      const cls = [marks[day] || "", isThisMonth && day === now.getDate() ? "today" : ""].filter(Boolean).join(" ");
      cells += '<div class="cal-cell ' + cls + '">' + day + "</div>";
    }
    grid.innerHTML = '<div class="cal-grid">' + cells + "</div>";
  }

  // Apply-for-Leave modal
  function openApplyModal(root) {
    const me = store.currentUser();
    const m = openModal(`
      <div style="padding:0;">
        <div class="flex items-center justify-between" style="padding:20px 24px;border-bottom:1px solid var(--surface-variant);">
          <h3 class="h-md">Apply for Leave</h3>
          <button class="btn-icon" data-close style="background:none;border:none;cursor:pointer;color:var(--on-surface-variant);"><span class="material-symbols-outlined">close</span></button>
        </div>
        <form id="apply-form" style="padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div class="field"><label>Leave Type</label>
            <select class="select" name="type">${LEAVE_TYPES.map((t) => "<option>" + t + "</option>").join("")}</select></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="field"><label>Start Date</label><input class="input" type="date" name="start" required></div>
            <div class="field"><label>End Date</label><input class="input" type="date" name="end" required></div>
          </div>
          <div class="card" style="box-shadow:none;background:var(--info-container);border-color:var(--primary-fixed-dim);padding:12px 14px;">
            <div class="flex items-center gap-2" style="font-size:13px;color:#075985;"><span class="material-symbols-outlined" style="font-size:18px;">info</span>Duration: <strong id="dur">0 Days</strong></div>
          </div>
          <div class="field"><label>Reason / Remarks</label><textarea class="textarea" name="reason" placeholder="Please provide details for your leave request…"></textarea></div>
          <div class="field"><label>Attachment (optional)</label>
            <div style="border:1.5px dashed var(--outline-variant);border-radius:8px;padding:18px;text-align:center;color:var(--on-surface-variant);font-size:13px;">
              <span class="material-symbols-outlined" style="display:block;font-size:24px;margin-bottom:4px;">upload_file</span>Drag &amp; drop or browse · PDF, JPG, PNG (max 5MB)</div>
          </div>
          <div class="flex items-center justify-end gap-3" style="margin-top:4px;">
            <button type="button" class="btn btn-outline" data-close>Cancel</button>
            <button type="submit" class="btn btn-primary">Submit Request</button>
          </div>
        </form>
      </div>`, { size: "lg" });

    const form = m.root.querySelector("#apply-form");
    const dur = m.root.querySelector("#dur");
    const recalc = () => {
      const s = form.start.value, e = form.end.value;
      if (s && e && e >= s) { const d = daysInclusive(s, e); dur.textContent = d + (d === 1 ? " Day" : " Days"); }
      else dur.textContent = "0 Days";
    };
    form.start.addEventListener("change", recalc);
    form.end.addEventListener("change", recalc);
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!form.start.value || !form.end.value || form.end.value < form.start.value) { toast("Please choose a valid date range", "error"); return; }
      if (window.HRMS.api) {
        try {
          await store.apiApplyLeave({ type: form.type.value, start: form.start.value, end: form.end.value, reason: form.reason.value.trim() });
          m.close(); toast("Leave request submitted", "success"); render();
        } catch (err) { toast(err.message || "Could not submit request", "error"); }
      } else {
        store.addLeave({ empId: me.id, type: form.type.value, start: form.start.value, end: form.end.value, duration: daysInclusive(form.start.value, form.end.value), reason: form.reason.value.trim() });
        m.close(); toast("Leave request submitted", "success"); renderEmployee(root);
      }
    });
  }

  // ============================== ADMIN ==================================
  let adminTab = "Pending";

  function renderAdmin(root) {
    const bal = store.balances();
    const leaves = store.leaveRequests();
    const pendingCount = leaves.filter((l) => l.status === "Pending").length;

    const card = (icon, value, label, tone) => `
      <div class="card card-pad">
        <div class="flex items-center gap-3 mb-2">
          <div style="width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;background:${tone.bg};color:${tone.fg};"><span class="material-symbols-outlined icon-fill">${icon}</span></div>
          <span class="label">${label}</span></div>
        <div class="h-xl" style="font-size:30px;">${value}</div></div>`;

    root.innerHTML = `
      <div class="page-header">
        <div><h1 class="page-title">Leave Requests</h1><p class="page-subtitle">Manage and review time-off applications.</p></div>
        <button class="btn btn-primary" id="alloc-btn"><span class="material-symbols-outlined">add</span>New Allocation</button>
      </div>

      <div class="grid grid-cols-2 lg:grid-cols-3 gap-5 mb-5">
        ${card("beach_access", bal.paid, "Paid Time Off (avg)", { bg: "var(--primary-light)", fg: "var(--primary-hover)" })}
        ${card("medical_services", String(bal.sick).padStart(2, "0"), "Sick Time Off (avg)", { bg: "var(--error-container)", fg: "#93000a" })}
        ${card("pending_actions", pendingCount, "Pending Approvals", { bg: "var(--warning-container)", fg: "#92400e" })}
      </div>

      <div class="tabs mb-4" id="leave-tabs">
        ${["Pending", "Approved", "Rejected"].map((t) => `<button class="tab ${t === adminTab ? "tab-active" : ""}" data-tab="${t}">${t} (${leaves.filter((l) => l.status === t).length})</button>`).join("")}
      </div>

      <div class="card overflow-hidden">
        <div style="overflow-x:auto;"><table class="table" style="min-width:820px;">
          <thead><tr><th>Employee</th><th>Start Date</th><th>End Date</th><th>Type</th><th>Duration</th><th>Status</th><th style="text-align:right;">Actions</th></tr></thead>
          <tbody id="leave-body"></tbody>
        </table></div>
      </div>

      <div class="card card-pad mt-5" style="background:var(--surface-container-low);border-style:dashed;">
        <div class="flex items-start gap-3"><span class="material-symbols-outlined text-muted">info</span>
          <div><h4 style="font-weight:600;font-size:14px;">Note for Admins</h4>
          <p class="text-muted" style="font-size:13px;">Employees can only view their own time-off records. As an Admin/HR Officer you can view records across the organization and approve or reject pending requests.</p></div></div>
      </div>`;

    document.getElementById("alloc-btn").addEventListener("click", () => openAllocationModal());
    document.querySelectorAll("#leave-tabs .tab").forEach((btn) =>
      btn.addEventListener("click", () => { adminTab = btn.dataset.tab; renderAdmin(root); }));
    renderAdminRows(root);
  }

  function renderAdminRows(root) {
    const body = document.getElementById("leave-body");
    const list = store.leaveRequests().filter((l) => l.status === adminTab);
    if (!list.length) { body.innerHTML = '<tr><td colspan="7"><div class="text-muted" style="padding:28px;text-align:center;">No ' + adminTab.toLowerCase() + " requests.</div></td></tr>"; return; }
    body.innerHTML = list.map((l) => {
      const e = store.employee(l.empId) || { name: l.empId, department: "" };
      const actions = l.status === "Pending"
        ? `<div class="flex items-center justify-end gap-2">
             <button class="btn-icon" data-reject="${l.id}" title="Reject" style="width:32px;height:32px;background:var(--error-container);color:#93000a;border:none;border-radius:8px;cursor:pointer;"><span class="material-symbols-outlined" style="font-size:18px;">close</span></button>
             <button class="btn-icon" data-approve="${l.id}" title="Approve" style="width:32px;height:32px;background:var(--success-container);color:#14532d;border:none;border-radius:8px;cursor:pointer;"><span class="material-symbols-outlined" style="font-size:18px;">check</span></button>
           </div>`
        : '<span class="text-muted" style="font-size:13px;">—</span>';
      return `<tr>
        <td><div class="flex items-center gap-3">${avatar(e, "avatar-sm")}<div><div style="font-weight:600;">${fmt.escape(e.name)}</div><div class="text-muted" style="font-size:12px;">${fmt.escape(e.department)}</div></div></div></td>
        <td>${fmt.date(l.start)}</td><td>${fmt.date(l.end)}</td>
        <td>${typeBadge(l.type)}</td>
        <td>${l.duration} ${l.duration === 1 ? "Day" : "Days"}</td>
        <td>${statusBadge(l.status)}</td>
        <td style="text-align:right;">${actions}</td>
      </tr>`;
    }).join("");

    const act = async (id, status, tone) => {
      if (window.HRMS.api) {
        try { await store.apiSetLeaveStatus(id, status); } catch (err) { toast(err.message || "Update failed", "error"); return; }
      } else { store.updateLeaveStatus(id, status); }
      toast("Request " + status.toLowerCase(), tone); render();
    };
    body.querySelectorAll("[data-approve]").forEach((b) => b.addEventListener("click", () => act(b.dataset.approve, "Approved", "success")));
    body.querySelectorAll("[data-reject]").forEach((b) => b.addEventListener("click", () => act(b.dataset.reject, "Rejected", "info")));
  }

  // Allocation modal (admin assigns time off)
  function openAllocationModal() {
    const emps = store.employees();
    const m = openModal(`
      <div style="padding:0;">
        <div class="flex items-center justify-between" style="padding:20px 24px;border-bottom:1px solid var(--surface-variant);">
          <h3 class="h-md">Time-Off Allocation</h3>
          <button data-close style="background:none;border:none;cursor:pointer;color:var(--on-surface-variant);"><span class="material-symbols-outlined">close</span></button>
        </div>
        <form id="alloc-form" style="padding:24px;display:flex;flex-direction:column;gap:16px;">
          <div class="field"><label>Employee</label><select class="select" name="emp">${emps.map((e) => '<option value="' + e.id + '">' + fmt.escape(e.name) + " · " + e.id + "</option>").join("")}</select></div>
          <div class="field"><label>Time-Off Type</label><select class="select" name="type">${LEAVE_TYPES.map((t) => "<option>" + t + "</option>").join("")}</select></div>
          <div class="grid grid-cols-2 gap-4">
            <div class="field"><label>Valid From</label><input class="input" type="date" name="from" required></div>
            <div class="field"><label>Valid To</label><input class="input" type="date" name="to" required></div>
          </div>
          <div class="field"><label>Allocation (Days)</label><input class="input" type="number" name="days" min="1" value="1"></div>
          <div class="flex items-center justify-end gap-3"><button type="button" class="btn btn-outline" data-close>Discard</button><button type="submit" class="btn btn-primary">Allocate</button></div>
        </form>
      </div>`, { size: "md" });
    m.root.querySelector("#alloc-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const payload = { empId: f.emp.value, type: f.type.value, days: Number(f.days.value) || 0 };
      if (window.HRMS.api) {
        try { await store.apiAllocate(payload); m.close(); toast("Time-off allocated", "success"); render(); }
        catch (err) { toast(err.message || "Could not allocate", "error"); }
      } else { m.close(); toast("Time-off allocated", "success"); }
    });
  }

  // ------------------------------- Boot ----------------------------------
  async function render() {
    const root = document.getElementById("leave-root");
    if (!root) return;
    await store.loadMe();
    await Promise.all([store.loadLeaves(), store.loadBalance(), store.loadHolidays()]);
    if (store.isAdmin()) renderAdmin(root); else renderEmployee(root);
  }
  document.addEventListener("DOMContentLoaded", render);
})();
