/* =========================================================================
   HRMS — Shared auth logic for sign-in / sign-up / forgot / reset / verify.
   Frontend-only: validates inputs and routes between pages. The real backend
   is owned by another team; submit handlers simulate success and redirect.
   Wire a page by adding: <body data-auth-page="signin"> (etc.)
   ========================================================================= */
(function () {
  "use strict";

  // ---- Small validators --------------------------------------------------
  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
  const strongPw = (v) => v.length >= 8 && /[^A-Za-z0-9]/.test(v);

  function setError(input, message) {
    const field = input.closest(".field") || input.parentElement;
    if (!field) return;
    input.classList.add("input-error");
    let err = field.querySelector(".field-error");
    if (!err) {
      err = document.createElement("span");
      err.className = "field-error";
      err.innerHTML = '<span class="material-symbols-outlined" style="font-size:14px;">error</span><span></span>';
      field.appendChild(err);
    }
    err.querySelector("span:last-child").textContent = message;
  }
  function clearError(input) {
    input.classList.remove("input-error");
    const field = input.closest(".field") || input.parentElement;
    const err = field && field.querySelector(".field-error");
    if (err) err.remove();
  }

  // ---- Password visibility toggles --------------------------------------
  function wireToggles() {
    document.querySelectorAll("[data-toggle-password]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const input = document.querySelector(btn.getAttribute("data-toggle-password"));
        if (!input) return;
        const show = input.type === "password";
        input.type = show ? "text" : "password";
        const icon = btn.querySelector(".material-symbols-outlined");
        if (icon) icon.textContent = show ? "visibility" : "visibility_off";
      });
    });
  }

  // ---- Live password strength meter -------------------------------------
  function wireStrengthMeter() {
    const pw = document.getElementById("password");
    const meter = document.getElementById("pw-strength");
    if (!pw || !meter) return;
    const bar = meter.querySelector("[data-bar]");
    const label = meter.querySelector("[data-label]");
    pw.addEventListener("input", () => {
      const v = pw.value;
      let score = 0;
      if (v.length >= 8) score++;
      if (/[A-Z]/.test(v)) score++;
      if (/[0-9]/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      const pct = [0, 25, 50, 75, 100][score];
      const colors = ["#cbd5e1", "#ba1a1a", "#d97706", "#0284c7", "#16a34a"];
      const words = ["Too short", "Weak", "Fair", "Good", "Strong"];
      bar.style.width = pct + "%";
      bar.style.background = colors[score];
      label.textContent = v ? words[score] : "";
      label.style.color = colors[score];
    });
  }

  // ---- Page handlers -----------------------------------------------------
  const pages = {
    signin(form) {
      const id = form.loginId, pw = form.password;
      [id, pw].forEach((i) => i && i.addEventListener("input", () => clearError(i)));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        if (!id.value.trim()) { setError(id, "Enter your email"); ok = false; }
        if (!pw.value) { setError(pw, "Enter your password"); ok = false; }
        if (!ok) return;
        // Role is chosen here (mutual decision) — it drives which view you land on.
        const picked = form.querySelector('input[name="role"]:checked');
        const role = picked && picked.value === "hr" ? "admin" : "employee";
        HRMS.utils.setToken("demo-" + Date.now());
        HRMS.store.setRole(role);
        HRMS.ui.toast("Signed in as " + (role === "admin" ? "HR Admin" : "Employee"), "success", 1200);
        setTimeout(() => (location.href = "dashboard.html"), 700);
      });
    },

    signup(form) {
      const fields = ["employeeId", "email", "password", "confirmPassword"].map((n) => form[n]);
      fields.forEach((i) => i && i.addEventListener("input", () => clearError(i)));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const [empId, email, pw, cpw] = fields;
        let ok = true;
        if (!empId.value.trim()) { setError(empId, "Employee ID is required"); ok = false; }
        if (!isEmail(email.value)) { setError(email, "Enter a valid email address"); ok = false; }
        if (!strongPw(pw.value)) { setError(pw, "Min 8 chars incl. a special character"); ok = false; }
        if (cpw.value !== pw.value) { setError(cpw, "Passwords do not match"); ok = false; }
        if (!ok) return;
        HRMS.ui.toast("Account created — verify your email", "success", 1400);
        setTimeout(() => (location.href = "verify.html?email=" + encodeURIComponent(email.value)), 800);
      });
    },

    forgot(form) {
      const email = form.email;
      email.addEventListener("input", () => clearError(email));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        if (!isEmail(email.value)) { setError(email, "Enter a valid email address"); return; }
        HRMS.ui.toast("Reset code sent to your email", "success", 1400);
        setTimeout(() => (location.href = "reset-password.html?email=" + encodeURIComponent(email.value)), 900);
      });
    },

    reset(form) {
      const pw = form.password, cpw = form.confirmPassword;
      [pw, cpw].forEach((i) => i && i.addEventListener("input", () => clearError(i)));
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        let ok = true;
        if (!strongPw(pw.value)) { setError(pw, "Min 8 chars incl. a special character"); ok = false; }
        if (cpw.value !== pw.value) { setError(cpw, "Passwords do not match"); ok = false; }
        if (!ok) return;
        HRMS.ui.toast("Password updated — please sign in", "success", 1400);
        setTimeout(() => (location.href = "signin.html"), 900);
      });
    },
  };

  document.addEventListener("DOMContentLoaded", () => {
    wireToggles();
    wireStrengthMeter();
    const page = document.body.getAttribute("data-auth-page");
    const form = document.querySelector("form");
    if (page && pages[page] && form) pages[page](form);

    // Prefill email from query string where relevant
    const email = new URLSearchParams(location.search).get("email");
    if (email) {
      const emailEl = document.querySelector("[data-email-display]");
      if (emailEl) emailEl.textContent = email;
    }
  });
})();
