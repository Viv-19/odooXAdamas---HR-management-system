/* =========================================================================
   HRMS — Password Reset OTP verification page logic.
   6-box input with auto-advance, paste support, backspace navigation,
   resend countdown, and backend API call for OTP verification.
   On success, stores the reset token and redirects to reset-password.html.
   ========================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const boxes = Array.from(document.querySelectorAll("[data-otp]"));
    const verifyBtn = document.getElementById("verify-btn");
    const resendBtn = document.getElementById("resend-btn");
    const countdownEl = document.getElementById("resend-countdown");
    const errorEl = document.getElementById("error-msg");
    const email = new URLSearchParams(window.location.search).get("email");
    if (!boxes.length) return;

    // Show email on page
    const emailDisplay = document.querySelector("[data-email-display]");
    if (emailDisplay && email) emailDisplay.textContent = email;

    // If no email param, redirect back
    if (!email) {
      window.location.href = "forgot-password";
      return;
    }

    const value = () => boxes.map((b) => b.value).join("");
    const focusNext = (i) => boxes[Math.min(i + 1, boxes.length - 1)].focus();
    const focusPrev = (i) => boxes[Math.max(i - 1, 0)].focus();

    function showError(msg) {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.classList.remove("hidden");
      } else {
        HRMS.ui.toast(msg, "error", 3000);
      }
    }
    function hideError() {
      if (errorEl) errorEl.classList.add("hidden");
    }

    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        if (box.value) focusNext(i);
        updateBtn();
        hideError();
      });
      box.addEventListener("keydown", (e) => {
        if (e.key === "Backspace" && !box.value) focusPrev(i);
        if (e.key === "ArrowLeft") focusPrev(i);
        if (e.key === "ArrowRight") focusNext(i);
      });
      box.addEventListener("paste", (e) => {
        e.preventDefault();
        const digits = (e.clipboardData.getData("text") || "").replace(/\D/g, "").slice(0, boxes.length);
        digits.split("").forEach((d, k) => { if (boxes[k]) boxes[k].value = d; });
        (boxes[digits.length] || boxes[boxes.length - 1]).focus();
        updateBtn();
      });
    });

    function updateBtn() {
      if (verifyBtn) verifyBtn.disabled = value().length !== boxes.length;
    }
    updateBtn();
    boxes[0].focus();

    // Verify OTP
    if (verifyBtn) {
      verifyBtn.addEventListener("click", async () => {
        if (value().length !== boxes.length) return;
        hideError();
        verifyBtn.disabled = true;
        verifyBtn.textContent = "Verifying…";

        try {
          const { res, data } = await HRMS.api.post("/auth/verify-reset-otp", { email, otp: value() });
          if (res.ok) {
            // Store the reset token in sessionStorage (short-lived, tab-scoped)
            sessionStorage.setItem("hrms_reset_token", data.data.resetToken);
            HRMS.ui.toast("OTP verified — set your new password", "success", 1200);
            setTimeout(() => (window.location.href = "reset-password?email=" + encodeURIComponent(email)), 700);
          } else {
            let errorMsg = data.message || "Verification failed";
            if (data.errors && data.errors.length > 0) errorMsg = data.errors[0].replace(/"/g, "");
            showError(errorMsg);
            verifyBtn.disabled = false;
            verifyBtn.textContent = "Verify OTP";
          }
        } catch (err) {
          console.error(err);
          showError("Error connecting to backend");
          verifyBtn.disabled = false;
          verifyBtn.textContent = "Verify OTP";
        }
      });
    }

    // Resend countdown
    if (resendBtn && countdownEl) {
      let t = 30;
      const tick = () => {
        if (t <= 0) {
          resendBtn.disabled = false;
          countdownEl.textContent = "";
          return;
        }
        countdownEl.textContent = " in " + t + "s";
        t--;
        setTimeout(tick, 1000);
      };
      resendBtn.disabled = true;
      tick();
      resendBtn.addEventListener("click", async () => {
        try {
          await HRMS.api.post("/auth/forgot-password", { email });
          HRMS.ui.toast("A new code has been sent", "info", 1400);
        } catch (_e) {
          HRMS.ui.toast("Failed to resend code", "error", 2000);
        }
        t = 30; resendBtn.disabled = true; tick();
      });
    }
  });
})();
