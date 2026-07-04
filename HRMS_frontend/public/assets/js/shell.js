/* =========================================================================
   HRMS — Application shell renderer (sidebar + topbar).
   Usage on any authenticated page:

     <body>
       <div class="app-layout" id="hrms-app">
         <!-- shell injects sidebar + topbar; page content goes in .app-content -->
         <div class="app-main">
           <header class="app-topbar" id="hrms-topbar"></header>
           <main class="app-content"> ...page content... </main>
         </div>
       </div>
       <script>HRMS.shell.mount({ active: 'dashboard' });</script>

   The mount() call reads role from HRMS.store, renders the correct nav,
   wires the avatar menu, role switch, check-in toggle and mobile drawer.
   ========================================================================= */
(function () {
  const H = (window.HRMS = window.HRMS || {});
  const store = H.store;

  // ======================================================================
  //  AUTH SWITCH — set to false to open the whole app WITHOUT signing in
  //  (use for demos), true to require a signed-in session on every page.
  // ======================================================================
  const AUTH_REQUIRED = true;

  const NAV = {
    admin: [
      { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "dashboard.html" },
      { key: "employees", label: "Employees", icon: "groups", href: "employees.html" },
      { key: "attendance", label: "Attendance", icon: "fact_check", href: "attendance.html" },
      { key: "leave", label: "Leave", icon: "event_available", href: "leave.html" },
      { key: "payroll", label: "Payroll", icon: "payments", href: "payroll.html" },
    ],
    employee: [
      { key: "dashboard", label: "Dashboard", icon: "dashboard", href: "dashboard.html" },
      { key: "profile", label: "My Profile", icon: "person", href: "profile.html" },
      { key: "attendance", label: "Attendance", icon: "fact_check", href: "attendance.html" },
      { key: "leave", label: "Leave", icon: "event_available", href: "leave.html" },
      { key: "payroll", label: "Payroll", icon: "payments", href: "payroll.html" },
    ],
  };

  const CHECKIN_KEY = "hrms_checkedin_v1";
  const isCheckedIn = () => localStorage.getItem(CHECKIN_KEY) === "1";
  const setCheckedIn = (v) => localStorage.setItem(CHECKIN_KEY, v ? "1" : "0");

  function avatarHtml(emp, cls) {
    const initials = H.ui.fmt.initials(emp.name);
    if (emp.avatar) {
      return '<img class="avatar ' + cls + '" src="' + emp.avatar + '" alt="' + H.ui.fmt.escape(emp.name) + '">';
    }
    return '<span class="avatar ' + cls + '">' + initials + "</span>";
  }

  function renderSidebar(active) {
    const role = store.role();
    const user = store.currentUser();
    const items = NAV[role] || NAV.employee;

    const nav = items
      .map(
        (it) =>
          '<a class="nav-item ' + (it.key === active ? "active" : "") + '" href="' + it.href + '">' +
          '<span class="material-symbols-outlined">' + it.icon + "</span>" + it.label + "</a>"
      )
      .join("");

    const adminCta = role === "admin"
      ? '<div class="app-sidebar-cta"><a href="employee-add.html" class="btn btn-primary" style="width:100%;">' +
        '<span class="material-symbols-outlined">add</span>Add New Employee</a></div>'
      : "";

    return (
      '<aside class="app-sidebar" id="hrms-sidebar">' +
      '<div class="app-brand">' +
      '<span class="brand-mark"><span class="material-symbols-outlined icon-fill">corporate_fare</span></span>' +
      '<span class="brand-name">HRMS</span>' +
      "</div>" +
      adminCta +
      '<nav class="app-nav">' + nav + "</nav>" +
      '<div class="app-sidebar-footer">' +
      '<a href="profile.html" class="nav-item"><span class="material-symbols-outlined">settings</span>Settings</a>' +
      '<a href="signin.html" class="nav-item" data-logout><span class="material-symbols-outlined">logout</span>Log Out</a>' +
      "</div>" +
      "</aside>"
    );
  }

  function renderTopbar(opts) {
    const user = store.currentUser();
    const role = store.role();
    const checkedIn = isCheckedIn();
    const searchPlaceholder = role === "admin" ? "Search employees, records…" : "Search…";

    return (
      '<button class="topbar-icon-btn sidebar-toggle" id="hrms-drawer-btn" aria-label="Open menu">' +
      '<span class="material-symbols-outlined">menu</span></button>' +
      '<label class="topbar-search"><span class="material-symbols-outlined" style="font-size:20px;">search</span>' +
      '<input type="text" placeholder="' + searchPlaceholder + '" aria-label="Search"></label>' +
      '<div class="topbar-actions">' +
      '<button class="btn btn-primary btn-sm checkin-btn ' + (checkedIn ? "checked-in" : "") + '" id="hrms-checkin">' +
      '<span class="material-symbols-outlined">' + (checkedIn ? "logout" : "login") + "</span>" +
      "<span>" + (checkedIn ? "Check Out" : "Check In") + "</span></button>" +
      '<button class="topbar-icon-btn" aria-label="Help"><span class="material-symbols-outlined">help</span></button>' +
      '<button class="topbar-icon-btn" aria-label="Notifications"><span class="material-symbols-outlined">notifications</span><span class="badge-dot"></span></button>' +
      '<div class="avatar-menu-wrap">' +
      '<button class="topbar-icon-btn" id="hrms-avatar-btn" aria-label="Account" style="width:auto;padding:2px 4px;gap:8px;">' +
      avatarHtml(user, "avatar-md") +
      "</button>" +
      '<div class="avatar-menu" id="hrms-avatar-menu" hidden>' +
      '<div class="avatar-menu-header">' + avatarHtml(user, "avatar-md") +
      '<div style="min-width:0;"><div style="font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">' +
      H.ui.fmt.escape(user.name) + '</div><div class="text-muted" style="font-size:12px;">' +
      H.ui.fmt.escape(user.role) + "</div></div></div>" +
      '<div style="padding:12px 16px;border-bottom:1px solid var(--surface-container-high);">' +
      '<div class="label" style="margin-bottom:6px;">Demo: view as</div>' +
      '<div class="role-switch" id="hrms-role-switch">' +
      '<button data-role="admin" class="' + (role === "admin" ? "active" : "") + '">Admin / HR</button>' +
      '<button data-role="employee" class="' + (role === "employee" ? "active" : "") + '">Employee</button>' +
      "</div></div>" +
      '<a class="avatar-menu-item" href="profile.html"><span class="material-symbols-outlined">person</span>My Profile</a>' +
      '<a class="avatar-menu-item" href="signin.html" data-logout><span class="material-symbols-outlined">logout</span>Log Out</a>' +
      "</div></div></div>"
    );
  }

  function wire(app) {
    // Avatar dropdown
    const avatarBtn = document.getElementById("hrms-avatar-btn");
    const menu = document.getElementById("hrms-avatar-menu");
    if (avatarBtn && menu) {
      avatarBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
      });
      document.addEventListener("click", (e) => {
        if (!menu.hidden && !menu.contains(e.target) && e.target !== avatarBtn) menu.hidden = true;
      });
    }

    // Role switch
    const roleSwitch = document.getElementById("hrms-role-switch");
    if (roleSwitch) {
      roleSwitch.querySelectorAll("button").forEach((b) => {
        b.addEventListener("click", () => {
          store.setRole(b.dataset.role);
          H.ui.toast("Switched to " + (b.dataset.role === "admin" ? "Admin / HR" : "Employee") + " view", "info", 1500);
          setTimeout(() => location.reload(), 400);
        });
      });
    }

    // Check-in / check-out — API-backed with an offline fallback.
    const checkinBtn = document.getElementById("hrms-checkin");
    function paintCheckin(state) {
      if (!checkinBtn) return;
      const label = checkinBtn.querySelector("span:last-child");
      const icon = checkinBtn.querySelector(".material-symbols-outlined");
      checkinBtn.disabled = state === "done";
      checkinBtn.classList.toggle("checked-in", state === "in");
      if (state === "in") { label.textContent = "Check Out"; icon.textContent = "logout"; }
      else if (state === "done") { label.textContent = "Checked out"; icon.textContent = "check"; }
      else { label.textContent = "Check In"; icon.textContent = "login"; }
    }
    const apiReady = () => window.HRMS.api && H.utils && H.utils.isAuthed() && store.apiCheckIn;

    if (checkinBtn) {
      checkinBtn.addEventListener("click", async () => {
        const currentlyIn = isCheckedIn();
        if (apiReady()) {
          try {
            if (!currentlyIn) {
              await store.apiCheckIn(); setCheckedIn(true); paintCheckin("in");
              H.ui.toast("Checked in successfully", "success", 1800);
              document.dispatchEvent(new CustomEvent("hrms:checkin", { detail: { checkedIn: true } }));
            } else {
              await store.apiCheckOut(); setCheckedIn(false); paintCheckin("done");
              H.ui.toast("Checked out successfully", "success", 1800);
              document.dispatchEvent(new CustomEvent("hrms:checkin", { detail: { checkedIn: false } }));
            }
          } catch (err) {
            H.ui.toast(err.message || "Attendance update failed", "error", 2600);
          }
          return;
        }
        // Offline fallback (demo without backend)
        const now = !currentlyIn;
        setCheckedIn(now); paintCheckin(now ? "in" : "out");
        H.ui.toast(now ? "Checked in successfully" : "Checked out successfully", "success", 1800);
        document.dispatchEvent(new CustomEvent("hrms:checkin", { detail: { checkedIn: now } }));
      });

      // Reconcile the button with today's server-side attendance.
      (async function syncCheckin() {
        if (!apiReady() || !store.apiToday) return;
        const rec = await store.apiToday();
        if (rec === undefined) return;             // couldn't reach API — keep local state
        if (rec && rec.checkOut) { setCheckedIn(false); paintCheckin("done"); }
        else if (rec && rec.checkIn) { setCheckedIn(true); paintCheckin("in"); }
        else { setCheckedIn(false); paintCheckin("out"); }
        document.dispatchEvent(new CustomEvent("hrms:checkin", { detail: { checkedIn: isCheckedIn() } }));
      })();
    }

    // Logout links -> clear session + token so the auth guard re-triggers
    document.querySelectorAll("[data-logout]").forEach((el) =>
      el.addEventListener("click", () => {
        try { localStorage.removeItem("hrms_session_v1"); } catch (_e) {}
        if (H.utils) H.utils.clearToken();
      })
    );

    // Mobile drawer
    const drawerBtn = document.getElementById("hrms-drawer-btn");
    const backdrop = document.createElement("div");
    backdrop.className = "sidebar-backdrop";
    app.appendChild(backdrop);
    if (drawerBtn) drawerBtn.addEventListener("click", () => app.classList.add("sidebar-open"));
    backdrop.addEventListener("click", () => app.classList.remove("sidebar-open"));
  }

  function mount(opts = {}) {
    // Auth guard: bounce unauthenticated visitors to sign-in.
    if (AUTH_REQUIRED && H.utils && !H.utils.isAuthed()) {
      location.replace("signin.html");
      return;
    }

    const app = document.getElementById("hrms-app");
    if (!app) return console.error("[HRMS.shell] #hrms-app not found");

    // Inject sidebar as first child
    app.insertAdjacentHTML("afterbegin", renderSidebar(opts.active));

    // Fill topbar
    const topbar = document.getElementById("hrms-topbar");
    if (topbar) topbar.innerHTML = renderTopbar(opts);

    wire(app);
    document.documentElement.classList.add("hrms-ready");
  }

  H.shell = { mount, isCheckedIn, setCheckedIn };
})();
