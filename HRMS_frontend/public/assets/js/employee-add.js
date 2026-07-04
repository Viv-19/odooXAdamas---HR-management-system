/* =========================================================================
   HRMS — Add New Employee (admin). Live completion tracker + create.
   Frontend-only: adds the employee to the local store, then returns to the
   directory. Admin-guarded.
   ========================================================================= */
(function () {
  "use strict";
  const store = HRMS.store;
  if (!store.isAdmin()) { location.replace("dashboard.html"); return; }

  document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("add-emp-form");
    if (!form) return;

    const personalFields = ["name", "email"];
    const jobFields = ["empId", "department", "role"];

    function markStep(step, done) {
      const el = document.querySelector('[data-step="' + step + '"]');
      if (!el) return;
      el.classList.toggle("done", done);
      el.querySelector(".material-symbols-outlined").textContent = done ? "check_circle" : "radio_button_unchecked";
    }
    function refresh() {
      markStep("personal", personalFields.every((n) => form[n].value.trim()));
      markStep("job", jobFields.every((n) => form[n].value.trim()));
    }
    form.addEventListener("input", refresh);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      // Basic required validation
      let ok = true;
      [...personalFields, ...jobFields].forEach((n) => {
        const f = form[n];
        if (!f.value.trim()) { f.classList.add("input-error"); ok = false; }
        else f.classList.remove("input-error");
      });
      if (!ok) { HRMS.ui.toast("Please fill all required fields (*)", "error"); return; }

      const payload = {
        id: form.empId.value.trim(),
        name: form.name.value.trim(),
        role: form.role.value.trim(),
        department: form.department.value,
        email: form.email.value.trim(),
        phone: form.phone.value.trim() || undefined,
        manager: form.manager.value.trim() || undefined,
        employmentType: form.employmentType.value,
        joinDate: form.joinDate.value || undefined,
      };

      const submitBtn = document.querySelector('button[form="add-emp-form"]');
      if (submitBtn) submitBtn.disabled = true;
      try {
        await store.apiCreateEmployee(payload);
        HRMS.ui.toast("Employee created successfully", "success", 1400);
        setTimeout(() => (location.href = "employees.html"), 800);
      } catch (err) {
        if (submitBtn) submitBtn.disabled = false;
        HRMS.ui.toast(err.message || "Could not create employee", "error", 3200);
      }
    });
  });
})();
