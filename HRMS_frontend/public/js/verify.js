/* =========================================================================
   HRMS — Email verification (OTP) page logic.
   6-box input with auto-advance, paste support, backspace navigation,
   a resend countdown, and simulated verification (frontend-only).
   ========================================================================= */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    const boxes = Array.from(document.querySelectorAll("[data-otp]"));
    const verifyBtn = document.getElementById("verify-btn");
    const resendBtn = document.getElementById("resend-btn");
    const countdownEl = document.getElementById("resend-countdown");
    if (!boxes.length) return;

    const value = () => boxes.map((b) => b.value).join("");
    const focusNext = (i) => boxes[Math.min(i + 1, boxes.length - 1)].focus();
    const focusPrev = (i) => boxes[Math.max(i - 1, 0)].focus();

    boxes.forEach((box, i) => {
      box.addEventListener("input", () => {
        box.value = box.value.replace(/\D/g, "").slice(0, 1);
        if (box.value) focusNext(i);
        updateBtn();
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

    if (verifyBtn) {
      verifyBtn.addEventListener("click", () => {
        if (value().length !== boxes.length) return;
        HRMS.ui.toast("Email verified successfully", "success", 1200);
        setTimeout(() => (location.href = "dashboard.html"), 800);
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
      resendBtn.addEventListener("click", () => {
        HRMS.ui.toast("A new code has been sent", "info", 1400);
        t = 30; resendBtn.disabled = true; tick();
      });
    }
  });
})();
