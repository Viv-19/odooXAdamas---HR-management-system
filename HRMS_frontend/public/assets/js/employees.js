/* =========================================================================
   HRMS — Employee Directory (admin). Cards with presence status.
   Clicking a card opens the profile in view mode. Employees are redirected
   to their own profile (they can't browse the directory).
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  const { fmt } = HRMS.ui;

  // Non-admins don't get the directory.
  if (!store.isAdmin()) { location.replace("profile.html"); return; }

  function avatar(emp) {
    return emp.avatar
      ? '<img class="avatar avatar-lg" src="' + emp.avatar + '" alt="">'
      : '<span class="avatar avatar-lg">' + fmt.initials(emp.name) + "</span>";
  }

  function statusMark(status) {
    if (status === "leave")
      return '<span class="material-symbols-outlined" title="On leave" style="font-size:18px;color:var(--info);">flight</span>';
    const cls = status === "present" ? "dot-present" : "dot-absent";
    const title = status === "present" ? "Present" : "Absent";
    return '<span class="dot ' + cls + '" title="' + title + '"></span>';
  }

  function card(emp) {
    return `
      <a href="profile.html?id=${encodeURIComponent(emp.id)}" class="card card-hover card-pad" style="display:flex;flex-direction:column;position:relative;">
        <button data-delete="${fmt.escape(emp.id)}" title="Remove employee"
          style="position:absolute;top:12px;right:12px;width:30px;height:30px;border-radius:8px;border:none;background:transparent;color:var(--outline);cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s;">
          <span class="material-symbols-outlined" style="font-size:18px;">delete</span>
        </button>
        <div class="flex items-start justify-between mb-4">
          ${avatar(emp)}
          <span class="flex items-center justify-center" style="width:26px;height:26px;border-radius:9999px;background:var(--surface);box-shadow:var(--shadow-card);border:1px solid var(--surface-variant);margin-right:34px;">
            ${statusMark(emp.status)}
          </span>
        </div>
        <h3 class="h-sm" style="font-size:15px;">${fmt.escape(emp.name)}</h3>
        <p class="text-muted" style="font-size:13px;margin-top:2px;">${fmt.escape(emp.department)}</p>
        <div class="flex items-center justify-between" style="margin-top:14px;padding-top:12px;border-top:1px solid var(--surface-container-high);">
          <span class="text-muted" style="font-size:12px;">ID: ${fmt.escape(emp.id)}</span>
          <span class="badge badge-neutral">${fmt.escape(emp.tag || emp.role)}</span>
        </div>
      </a>`;
  }

  const grid = document.getElementById("emp-grid");
  const empty = document.getElementById("emp-empty");
  const search = document.getElementById("emp-search");

  function render(filter = "") {
    const f = filter.trim().toLowerCase();
    const list = store.employees().filter((e) =>
      !f || [e.name, e.department, e.id, e.role].some((v) => (v || "").toLowerCase().includes(f))
    );
    grid.innerHTML = list.map(card).join("");
    empty.style.display = list.length ? "none" : "block";

    grid.querySelectorAll("[data-delete]").forEach((btn) => {
      btn.addEventListener("mouseenter", () => { btn.style.background = "var(--error-container)"; btn.style.color = "#93000a"; });
      btn.addEventListener("mouseleave", () => { btn.style.background = "transparent"; btn.style.color = "var(--outline)"; });
      btn.addEventListener("click", async (e) => {
        e.preventDefault(); e.stopPropagation();
        const id = btn.getAttribute("data-delete");
        const emp = store.employee(id);
        const ok = await HRMS.ui.confirmDialog({
          title: "Remove employee?",
          message: "This will permanently remove " + (emp ? emp.name : id) + " and their leave records from the directory.",
          confirmLabel: "Remove", danger: true,
        });
        if (!ok) return;
        try { await store.apiRemoveEmployee(id); } catch (_err) { store.removeEmployee(id); }
        await store.loadEmployees();
        HRMS.ui.toast("Employee removed", "info");
        render(search ? search.value : "");
      });
    });
  }

  document.addEventListener("DOMContentLoaded", async () => {
    await store.loadEmployees();
    render();
    if (search) search.addEventListener("input", HRMS.utils.debounce((e) => render(e.target.value), 180));
  });
})();
