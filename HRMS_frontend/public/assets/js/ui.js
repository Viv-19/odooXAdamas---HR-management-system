/* =========================================================================
   HRMS — Small UI helper library shared by every page.
   Toasts, modal dialogs, and formatting utilities. No dependencies.
   ========================================================================= */
(function () {
  const H = (window.HRMS = window.HRMS || {});

  // ------------------------------ Formatting -----------------------------
  const fmt = {
    initials(name) {
      return (name || "")
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0].toUpperCase())
        .join("");
    },
    money(n) {
      if (n == null || isNaN(n)) return "—";
      return "₹ " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    },
    date(iso, opts) {
      if (!iso) return "—";
      const d = new Date(iso + (iso.length === 10 ? "T00:00:00" : ""));
      if (isNaN(d)) return iso;
      return d.toLocaleDateString("en-GB", opts || { day: "2-digit", month: "short", year: "numeric" });
    },
    escape(str) {
      const div = document.createElement("div");
      div.textContent = str == null ? "" : String(str);
      return div.innerHTML;
    },
  };

  // ------------------------------ Toasts ---------------------------------
  function ensureToastRoot() {
    let root = document.getElementById("hrms-toast-root");
    if (!root) {
      root = document.createElement("div");
      root.id = "hrms-toast-root";
      root.style.cssText =
        "position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:10px;max-width:360px;";
      document.body.appendChild(root);
    }
    return root;
  }

  function toast(message, type = "success", timeout = 3200) {
    const icons = { success: "check_circle", error: "error", info: "info", warning: "warning" };
    const colors = {
      success: "var(--success)", error: "var(--error)", info: "var(--info)", warning: "var(--warning)",
    };
    const el = document.createElement("div");
    el.setAttribute("role", "status");
    el.style.cssText =
      "display:flex;align-items:flex-start;gap:10px;background:#fff;border:1px solid var(--surface-variant);" +
      "border-left:4px solid " + colors[type] + ";border-radius:.5rem;padding:12px 14px;box-shadow:var(--shadow-card-hover);" +
      "font-size:14px;color:var(--on-surface);animation:fade-in .2s ease-out both;";
    el.innerHTML =
      '<span class="material-symbols-outlined icon-fill" style="color:' + colors[type] + ';font-size:20px;">' +
      icons[type] + "</span><span style='flex:1;'>" + fmt.escape(message) + "</span>";
    ensureToastRoot().appendChild(el);
    setTimeout(() => {
      el.style.transition = "opacity .2s, transform .2s";
      el.style.opacity = "0";
      el.style.transform = "translateX(12px)";
      setTimeout(() => el.remove(), 220);
    }, timeout);
  }

  // ------------------------------ Modal ----------------------------------
  // openModal(htmlString | HTMLElement, { size }) -> returns { close, root }
  function openModal(content, opts = {}) {
    const overlay = document.createElement("div");
    overlay.className = "hrms-modal-overlay";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9998;background:rgba(11,28,48,.45);backdrop-filter:blur(2px);" +
      "display:flex;align-items:center;justify-content:center;padding:16px;animation:fade-in .18s ease-out both;";
    const panel = document.createElement("div");
    const maxW = opts.size === "lg" ? "760px" : opts.size === "sm" ? "420px" : "560px";
    panel.style.cssText =
      "background:#fff;border-radius:1rem;box-shadow:var(--shadow-card-hover);width:100%;max-width:" + maxW +
      ";max-height:92vh;overflow:auto;animation:fade-in .22s ease-out both;";
    if (typeof content === "string") panel.innerHTML = content;
    else panel.appendChild(content);
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    document.body.style.overflow = "hidden";

    function close() {
      overlay.style.opacity = "0";
      overlay.style.transition = "opacity .18s";
      setTimeout(() => { overlay.remove(); document.body.style.overflow = ""; }, 180);
      document.removeEventListener("keydown", onKey);
    }
    function onKey(e) { if (e.key === "Escape") close(); }
    overlay.addEventListener("mousedown", (e) => { if (e.target === overlay) close(); });
    document.addEventListener("keydown", onKey);
    // Wire any [data-close] elements inside.
    panel.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
    return { close, root: panel, overlay };
  }

  // Confirm dialog -> Promise<boolean>
  function confirmDialog({ title, message, confirmLabel = "Confirm", danger = false } = {}) {
    return new Promise((resolve) => {
      const m = openModal(
        '<div style="padding:24px;">' +
          '<h3 class="h-md" style="margin-bottom:8px;">' + fmt.escape(title || "Are you sure?") + "</h3>" +
          '<p class="text-muted" style="font-size:14px;margin-bottom:20px;">' + fmt.escape(message || "") + "</p>" +
          '<div style="display:flex;justify-content:flex-end;gap:10px;">' +
          '<button class="btn btn-outline btn-sm" data-cancel>Cancel</button>' +
          '<button class="btn ' + (danger ? "btn-danger" : "btn-primary") + ' btn-sm" data-ok>' +
          fmt.escape(confirmLabel) + "</button></div></div>",
        { size: "sm" }
      );
      m.root.querySelector("[data-cancel]").addEventListener("click", () => { m.close(); resolve(false); });
      m.root.querySelector("[data-ok]").addEventListener("click", () => { m.close(); resolve(true); });
    });
  }

  H.ui = { toast, openModal, confirmDialog, fmt };
})();
