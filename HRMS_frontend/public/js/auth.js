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
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let ok = true;
        if (!id.value.trim()) { setError(id, "Enter your email"); ok = false; }
        if (!pw.value) { setError(pw, "Enter your password"); ok = false; }
        if (!ok) return;

        try {
          const { res, data } = await HRMS.api.post('/auth/signin', { email: id.value, password: pw.value });
          if (res.ok) {
            if (window.HRMS && window.HRMS.utils) window.HRMS.utils.setToken(data.data.token);
            else localStorage.setItem('hrms_token_v1', data.data.token);
            
            localStorage.setItem('hrms_user', JSON.stringify(data.data.user));
            HRMS.store.setRole(data.data.user.role.toLowerCase());
            HRMS.ui.toast("Signed in successfully", "success", 1200);
            setTimeout(() => (location.href = "dashboard.html"), 700);
          } else {
            let errorMsg = data.message || "Login failed";
            if (data.errors && data.errors.length > 0) errorMsg = data.errors[0].replace(/"/g, '');
            setError(pw, errorMsg);
            if (window.HRMS && window.HRMS.ui) window.HRMS.ui.toast(errorMsg, "error", 3000);
          }
        } catch (err) {
          console.error("Signin Exception:", err);
          setError(pw, "Network error connecting to backend.");
          if (window.HRMS && window.HRMS.ui) window.HRMS.ui.toast("Network error. Please try again.", "error", 3000);
        }
      });
    },

    signup(form) {
      const fields = ["employeeId", "email", "password", "confirmPassword"].map((n) => form[n]);
      fields.forEach((i) => i && i.addEventListener("input", () => clearError(i)));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const [empId, email, pw, cpw] = fields;
        let ok = true;
        if (!empId.value.trim()) { setError(empId, "Employee ID is required"); ok = false; }
        if (!isEmail(email.value)) { setError(email, "Enter a valid email address"); ok = false; }
        if (!strongPw(pw.value)) { setError(pw, "Min 8 chars incl. a special character"); ok = false; }
        if (cpw.value !== pw.value) { setError(cpw, "Passwords do not match"); ok = false; }
        if (!ok) return;

        const rolePicked = form.querySelector('input[name="role"]:checked');
        const role = rolePicked && rolePicked.value === "hr" ? "ADMIN" : "EMPLOYEE";

        try {
          const { res, data } = await HRMS.api.post('/auth/signup', { 
            employeeId: empId.value, 
            email: email.value, 
            password: pw.value, 
            confirmPassword: cpw.value, 
            role 
          });
          if (res.ok) {
            HRMS.ui.toast("Account created — verify your email", "success", 1400);
            setTimeout(() => (location.href = "verify.html?email=" + encodeURIComponent(email.value)), 800);
          } else {
            let errorMsg = data.message || "Signup failed";
            if (data.errors && data.errors.length > 0) errorMsg = data.errors[0].replace(/"/g, '');
            setError(email, errorMsg);
          }
        } catch (err) {
          setError(email, "Network error connecting to backend.");
        }
      });
    },

    forgot(form) {
      const email = form.email;
      email.addEventListener("input", () => clearError(email));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!isEmail(email.value)) { setError(email, "Enter a valid email address"); return; }

        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Sending…"; }

        try {
          const { res, data } = await HRMS.api.post('/auth/forgot-password', { email: email.value });
          if (res.ok) {
            HRMS.ui.toast("Reset code sent to your email", "success", 1400);
            setTimeout(() => (location.href = "verify-reset-otp?email=" + encodeURIComponent(email.value)), 900);
          } else {
            let errorMsg = data.message || "Failed to send reset code";
            if (data.errors && data.errors.length > 0) errorMsg = data.errors[0].replace(/"/g, '');
            setError(email, errorMsg);
            if (btn) { btn.disabled = false; btn.textContent = "Send Reset Code"; }
          }
        } catch (err) {
          console.error(err);
          setError(email, "Network error connecting to backend.");
          if (btn) { btn.disabled = false; btn.textContent = "Send Reset Code"; }
        }
      });
    },

    reset(form) {
      const pw = form.password, cpw = form.confirmPassword;
      const email = new URLSearchParams(location.search).get("email");
      const resetToken = sessionStorage.getItem("hrms_reset_token");

      // Guard: if no reset token, user hasn't verified OTP
      if (!resetToken || !email) {
        HRMS.ui.toast("Please verify your identity first", "error", 2000);
        setTimeout(() => (location.href = "forgot-password"), 1000);
        return;
      }

      [pw, cpw].forEach((i) => i && i.addEventListener("input", () => clearError(i)));
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        let ok = true;
        if (!strongPw(pw.value)) { setError(pw, "Min 8 chars incl. a special character"); ok = false; }
        if (cpw.value !== pw.value) { setError(cpw, "Passwords do not match"); ok = false; }
        if (!ok) return;

        const btn = form.querySelector('button[type="submit"]');
        if (btn) { btn.disabled = true; btn.textContent = "Updating…"; }

        try {
          const { res, data } = await HRMS.api.post('/auth/reset-password', {
            email,
            resetToken,
            password: pw.value,
            confirmPassword: cpw.value,
          });
          if (res.ok) {
            sessionStorage.removeItem("hrms_reset_token");
            HRMS.ui.toast("Password updated — please sign in", "success", 1400);
            setTimeout(() => (location.href = "signin.html"), 900);
          } else {
            let errorMsg = data.message || "Password reset failed";
            if (data.errors && data.errors.length > 0) errorMsg = data.errors[0].replace(/"/g, '');
            setError(pw, errorMsg);
            if (btn) { btn.disabled = false; btn.textContent = "Update Password"; }
          }
        } catch (err) {
          console.error(err);
          setError(pw, "Network error connecting to backend.");
          if (btn) { btn.disabled = false; btn.textContent = "Update Password"; }
        }
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
