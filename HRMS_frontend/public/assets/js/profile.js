/* =========================================================================
   HRMS — Employee Profile with tabs: Resume | Private Info | Salary Info | Security.
   Role rules (from the spec/wireframes):
     • Employees view only their OWN profile; the Salary Info tab is hidden.
     • Admin/HR can open any employee (?id=EMP-…) and see Salary Info + edit all.
     • Employees may edit limited fields (address, phone, photo) via Edit mode.
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt, toast } = HRMS.ui;

  const isAdmin = store.isAdmin();
  const wantId = HRMS.utils.query("id");
  const canSalary = isAdmin;                 // Salary Info tab visibility
  const canEditAll = isAdmin;                // full edit vs limited
  let me, target, isOwn;                      // resolved from the API in init()

  // Derived private-info sample values (stable per employee id).
  function priv(emp) {
    return {
      dob: "1992-06-14", nationality: "Indian", personalEmail: emp.email.replace("@hrms.com", "@gmail.com"),
      gender: "—", marital: "—", account: "XXXX XXXX 4821", bank: "HDFC Bank",
      ifsc: "HDFC0001234", pan: "ABCDE1234F", uan: "100234567890", empCode: emp.id,
    };
  }

  function avatar(emp, cls) {
    return emp.avatar
      ? '<img class="avatar ' + cls + '" src="' + emp.avatar + '" alt="">'
      : '<span class="avatar ' + cls + '">' + fmt.initials(emp.name) + "</span>";
  }
  function statusBadge(s) {
    const map = { present: ["badge-success", "Active"], leave: ["badge-info", "On Leave"], absent: ["badge-warning", "Absent"] };
    const [c, l] = map[s] || ["badge-neutral", s];
    return '<span class="badge ' + c + '">' + l + "</span>";
  }
  const row = (k, v) => `<div class="info-row"><span class="k">${k}</span><span class="v">${fmt.escape(v)}</span></div>`;

  // ------------------------------- Tabs ----------------------------------
  function resumeTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 card card-pad">
          <div class="subcard-title">About</div>
          <p class="text-muted" style="font-size:14px;line-height:22px;margin-bottom:18px;">
            ${fmt.escape(target.name.split(" ")[0])} is a ${fmt.escape(target.role.toLowerCase())} on the ${fmt.escape(target.department)} team,
            focused on shipping reliable, well-crafted work and collaborating closely across the organization.</p>
          <div class="subcard-title">What I love about my job</div>
          <p class="text-muted" style="font-size:14px;line-height:22px;margin-bottom:18px;">Solving real problems for real people and turning ambiguous ideas into polished, dependable outcomes.</p>
          <div class="subcard-title">Interests &amp; hobbies</div>
          <p class="text-muted" style="font-size:14px;line-height:22px;">Reading, design systems, hiking and the occasional game of chess.</p>
        </div>
        <div class="flex flex-col gap-5">
          <div class="card card-pad">
            <div class="subcard-title">Skills</div>
            <div class="flex flex-wrap gap-2">
              ${["Communication", "Teamwork", "Problem Solving", "Ownership", "Attention to Detail"].map((s) => '<span class="badge badge-primary">' + s + "</span>").join("")}
            </div>
          </div>
          <div class="card card-pad">
            <div class="subcard-title">Certifications</div>
            <ul style="list-style:none;padding:0;margin:0;font-size:14px;">
              <li class="flex items-center gap-2" style="padding:6px 0;"><span class="material-symbols-outlined" style="color:var(--primary-hover);font-size:20px;">workspace_premium</span>Professional Certification</li>
              <li class="flex items-center gap-2" style="padding:6px 0;"><span class="material-symbols-outlined" style="color:var(--primary-hover);font-size:20px;">workspace_premium</span>Advanced Training Program</li>
            </ul>
          </div>
        </div>
      </div>`;
  }

  function privateTab() {
    const p = priv(target);
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card card-pad">
          <div class="subcard-title">Personal Information</div>
          ${row("Date of Birth", fmt.date(p.dob))}
          ${row("Residing Address", target.location)}
          ${row("Nationality", p.nationality)}
          ${row("Personal Email", p.personalEmail)}
          ${row("Gender", p.gender)}
          ${row("Marital Status", p.marital)}
          ${row("Date of Joining", fmt.date(target.joinDate))}
        </div>
        <div class="card card-pad">
          <div class="subcard-title">Bank Details</div>
          ${row("Account Number", p.account)}
          ${row("Bank Name", p.bank)}
          ${row("IFSC Code", p.ifsc)}
          ${row("PAN No", p.pan)}
          ${row("UAN No", p.uan)}
          ${row("Employee Code", p.empCode)}
        </div>
      </div>`;
  }

  function jobTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card card-pad">
          <div class="subcard-title">Employment</div>
          ${row("Position / Role", target.role)}
          ${row("Department", target.department)}
          ${row("Employment Type", target.employmentType)}
          ${row("Date of Joining", fmt.date(target.joinDate))}
        </div>
        <div class="card card-pad">
          <div class="subcard-title">Reporting &amp; Location</div>
          ${row("Employee ID", target.id)}
          ${row("Reporting Manager", target.manager)}
          ${row("Office Location", target.location)}
          ${row("Work Email", target.email)}
        </div>
      </div>`;
  }

  function documentsTab() {
    const docs = [
      { name: "Offer Letter", type: "PDF", size: "248 KB", date: target.joinDate, icon: "description" },
      { name: "Employment Contract", type: "PDF", size: "512 KB", date: target.joinDate, icon: "contract" },
      { name: "ID Proof", type: "JPG", size: "1.2 MB", date: target.joinDate, icon: "badge" },
      { name: "Resume / CV", type: "PDF", size: "196 KB", date: target.joinDate, icon: "article" },
    ];
    const docRow = (d) => `
      <div class="flex items-center gap-3" style="padding:12px 0;border-bottom:1px solid var(--surface-container-high);">
        <span class="material-symbols-outlined" style="color:var(--primary-hover);">${d.icon}</span>
        <div style="flex:1;min-width:0;">
          <div style="font-weight:600;font-size:14px;">${fmt.escape(d.name)}</div>
          <div class="text-muted" style="font-size:12px;">${d.type} · ${d.size} · Uploaded ${fmt.date(d.date)}</div>
        </div>
        <button class="btn-icon" title="View" style="width:34px;height:34px;background:var(--surface-container);border:none;border-radius:8px;cursor:pointer;color:var(--on-surface-variant);"><span class="material-symbols-outlined" style="font-size:18px;">visibility</span></button>
        <button class="btn-icon" title="Download" style="width:34px;height:34px;background:var(--surface-container);border:none;border-radius:8px;cursor:pointer;color:var(--on-surface-variant);"><span class="material-symbols-outlined" style="font-size:18px;">download</span></button>
      </div>`;
    return `
      <div class="card card-pad">
        <div class="flex items-center justify-between mb-1">
          <div class="subcard-title" style="margin-bottom:0;border:none;padding:0;">Documents</div>
          ${canEditAll ? '<button class="btn btn-outline btn-sm" data-upload-doc><span class="material-symbols-outlined">upload</span>Upload</button>' : ""}
        </div>
        <div style="margin-top:8px;">${docs.map(docRow).join("")}</div>
      </div>`;
  }

  function salaryTab() {
    const s = (target && target.salaryStructure) || store.salary();
    const net = s.monthlyWage - s.pf.employee - s.tax.professional;
    return `
      <div class="card card-pad" style="background:var(--info-container);border-color:var(--primary-fixed-dim);margin-bottom:20px;">
        <div class="flex items-start gap-3">
          <span class="material-symbols-outlined" style="color:var(--primary-hover);">lock</span>
          <p style="font-size:13px;color:#075985;">Salary information is confidential and visible to Admin / HR only. Full structure editing is available in the Payroll module.</p>
        </div>
      </div>
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="lg:col-span-2 card card-pad">
          <div class="subcard-title">Salary Components</div>
          <table class="table"><thead><tr><th>Component</th><th style="text-align:right;">Amount / month</th><th style="text-align:right;">% of wage</th></tr></thead>
            <tbody>${s.components.map((c) => `<tr><td>${fmt.escape(c.name)}</td><td style="text-align:right;">${fmt.money(c.amount)}</td><td style="text-align:right;">${c.pct}%</td></tr>`).join("")}</tbody>
          </table>
        </div>
        <div class="flex flex-col gap-5">
          <div class="card card-pad">
            <div class="subcard-title">Core Wage</div>
            ${row("Monthly Wage", fmt.money(s.monthlyWage))}
            ${row("Yearly Wage", fmt.money(s.yearlyWage))}
            ${row("Working Days / Week", s.workingDaysPerWeek + " Days")}
          </div>
          <div class="card card-pad">
            <div class="subcard-title">Deductions</div>
            ${row("PF (Employee)", fmt.money(s.pf.employee))}
            ${row("Professional Tax", fmt.money(s.tax.professional))}
            <div class="info-row" style="border-top:2px solid var(--surface-variant);margin-top:6px;"><span class="k" style="font-weight:700;color:var(--on-surface);">Net Pay Estimate</span><span class="v" style="color:var(--success);">${fmt.money(net)}</span></div>
          </div>
        </div>
      </div>`;
  }

  function securityTab() {
    return `
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div class="card card-pad">
          <div class="subcard-title">Change Password</div>
          <div class="flex flex-col gap-4">
            <div class="field"><label>Current Password</label><input class="input" type="password" placeholder="••••••••"></div>
            <div class="field"><label>New Password</label><input class="input" type="password" placeholder="New password"></div>
            <div class="field"><label>Confirm New Password</label><input class="input" type="password" placeholder="Re-enter new password"></div>
            <button class="btn btn-primary" style="align-self:flex-start;" data-save-security>Update Password</button>
          </div>
        </div>
        <div class="card card-pad">
          <div class="subcard-title">Account Security</div>
          <div class="info-row"><span class="k">Two-Factor Authentication</span><span class="v"><span class="badge badge-neutral">Disabled</span></span></div>
          <div class="info-row"><span class="k">Last Login</span><span class="v">Today, 08:45 AM</span></div>
          <div class="info-row"><span class="k">Active Sessions</span><span class="v">1 device</span></div>
        </div>
      </div>`;
  }

  const TABS = [
    { key: "resume", label: "Resume", render: resumeTab },
    { key: "job", label: "Job Details", render: jobTab },
    { key: "private", label: "Private Info", render: privateTab },
    { key: "documents", label: "Documents", render: documentsTab },
    ...(canSalary ? [{ key: "salary", label: "Salary Info", render: salaryTab }] : []),
    { key: "security", label: "Security", render: securityTab },
  ];

  function render() {
    const root = document.getElementById("profile-root");

    const crumb = isAdmin
      ? `<a href="employees.html" class="link" style="font-size:13px;">Employees</a>
         <span class="text-muted" style="font-size:13px;"> / ${fmt.escape(target.department)} / ${fmt.escape(target.name)}</span>`
      : `<span class="text-muted" style="font-size:13px;">My Profile</span>`;

    root.innerHTML = `
      <div class="page-header">
        <div>
          <div class="mb-1">${crumb}</div>
          <h1 class="page-title">${isOwn ? "My Profile" : "Employee Profile"}</h1>
        </div>
        <div class="flex items-center gap-3">
          ${isAdmin && !isOwn && target.accessRole === "EMPLOYEE" ? '<button class="btn btn-outline" id="role-btn" data-to="HR"><span class="material-symbols-outlined">upgrade</span>Promote to HR</button>' : ""}
          ${isAdmin && !isOwn && target.accessRole === "HR" ? '<button class="btn btn-outline" id="role-btn" data-to="EMPLOYEE"><span class="material-symbols-outlined">arrow_downward</span>Revert to Employee</button>' : ""}
          ${isAdmin && !isOwn ? '<button class="btn btn-danger" id="remove-btn"><span class="material-symbols-outlined">delete</span>Remove</button>' : ""}
          <button class="btn btn-outline" id="edit-toggle"><span class="material-symbols-outlined">edit</span>Edit</button>
          <button class="btn btn-primary" id="save-btn" style="display:none;"><span class="material-symbols-outlined">save</span>Save Changes</button>
        </div>
      </div>

      <!-- Identity header -->
      <div class="card card-pad mb-5">
        <div class="flex flex-col md:flex-row md:items-center gap-5">
          <div class="flex items-center gap-4">
            ${avatar(target, "avatar-xl")}
            <div>
              <div class="flex items-center gap-2 mb-1"><h2 class="h-lg">${fmt.escape(target.name)}</h2>${statusBadge(target.status)}</div>
              <p class="text-muted" style="font-size:14px;">${fmt.escape(target.role)} · ${fmt.escape(target.id)}</p>
            </div>
          </div>
          <div class="md:ml-auto grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div class="contact-chip"><span class="material-symbols-outlined">mail</span>${fmt.escape(target.email)}</div>
            <div class="contact-chip"><span class="material-symbols-outlined">call</span>${fmt.escape(target.phone)}</div>
            <div class="contact-chip"><span class="material-symbols-outlined">apartment</span>${fmt.escape(target.department)}</div>
            <div class="contact-chip"><span class="material-symbols-outlined">location_on</span>${fmt.escape(target.location)}</div>
            <div class="contact-chip"><span class="material-symbols-outlined">supervisor_account</span>Manager: ${fmt.escape(target.manager)}</div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="tabs mb-5" id="profile-tabs">
        ${TABS.map((t, i) => `<button class="tab ${i === 0 ? "tab-active" : ""}" data-tab="${t.key}">${t.label}</button>`).join("")}
      </div>
      <div id="tab-body">${TABS[0].render()}</div>`;

    // Tab switching
    const body = document.getElementById("tab-body");
    document.querySelectorAll("#profile-tabs .tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        document.querySelectorAll("#profile-tabs .tab").forEach((b) => b.classList.remove("tab-active"));
        btn.classList.add("tab-active");
        const tab = TABS.find((t) => t.key === btn.dataset.tab);
        body.innerHTML = tab.render();
        body.classList.remove("animate-in"); void body.offsetWidth; body.classList.add("animate-in");
        wireInline();
      });
    });

    // Edit mode (visual only in the frontend demo)
    const editBtn = document.getElementById("edit-toggle");
    const saveBtn = document.getElementById("save-btn");
    let editing = false;
    editBtn.addEventListener("click", () => {
      editing = !editing;
      editBtn.innerHTML = editing ? '<span class="material-symbols-outlined">close</span>Cancel' : '<span class="material-symbols-outlined">edit</span>Edit';
      saveBtn.style.display = editing ? "" : "none";
      if (editing) toast(canEditAll ? "Editing all fields" : "You can edit contact details only", "info", 1600);
    });
    saveBtn.addEventListener("click", () => {
      editing = false; saveBtn.style.display = "none";
      editBtn.innerHTML = '<span class="material-symbols-outlined">edit</span>Edit';
      toast("Profile updated", "success");
    });

    // Promote to HR / revert to Employee (admin viewing someone else)
    const roleBtn = document.getElementById("role-btn");
    if (roleBtn) roleBtn.addEventListener("click", async () => {
      const to = roleBtn.dataset.to;
      const ok = await HRMS.ui.confirmDialog({
        title: to === "HR" ? "Promote to HR?" : "Revert to Employee?",
        message: to === "HR"
          ? "Grant " + target.name + " HR/management access across the organization."
          : "Remove HR access from " + target.name + " and set them back to Employee.",
        confirmLabel: to === "HR" ? "Promote" : "Revert",
      });
      if (!ok) return;
      try {
        await store.apiSetRole(target.id, to);
        target.accessRole = to;
        target.access = to === "EMPLOYEE" ? "employee" : "admin";
        toast(to === "HR" ? target.name + " is now HR" : target.name + " reverted to Employee", "success");
        render();
      } catch (err) { toast(err.message || "Could not update role", "error"); }
    });

    // Remove employee (admin viewing someone else)
    const removeBtn = document.getElementById("remove-btn");
    if (removeBtn) removeBtn.addEventListener("click", async () => {
      const ok = await HRMS.ui.confirmDialog({
        title: "Remove employee?",
        message: "This will permanently remove " + target.name + " and their leave records.",
        confirmLabel: "Remove", danger: true,
      });
      if (!ok) return;
      try { await store.apiRemoveEmployee(target.id); } catch (_e) { store.removeEmployee(target.id); }
      toast("Employee removed", "info");
      setTimeout(() => (location.href = "employees.html"), 600);
    });

    wireInline();
  }

  function wireInline() {
    const s = document.querySelector("[data-save-security]");
    if (s) s.addEventListener("click", () => toast("Password updated", "success"));
    const up = document.querySelector("[data-upload-doc]");
    if (up) up.addEventListener("click", () => toast("Document uploaded", "success"));
  }

  async function init() {
    me = await store.loadMe();
    if (isAdmin && wantId) {
      await store.loadEmployees();
      target = store.employee(wantId) || me;
    } else {
      target = me;
    }
    isOwn = target.id === me.id;
    render();
  }
  document.addEventListener("DOMContentLoaded", init);
})();
