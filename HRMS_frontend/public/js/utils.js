/* =========================================================================
   HRMS — Common helpers (token storage, redirects, query params).
   Kept dependency-free so it can load first on any page.
   ========================================================================= */
(function () {
  "use strict";
  const TOKEN_KEY = "hrms_token_v1";

  const utils = {
    setToken(t) { try { localStorage.setItem(TOKEN_KEY, t); } catch (_e) {} },
    getToken() { try { return localStorage.getItem(TOKEN_KEY); } catch (_e) { return null; } },
    clearToken() { try { localStorage.removeItem(TOKEN_KEY); } catch (_e) {} },
    isAuthed() { return !!utils.getToken(); },

    query(name) { return new URLSearchParams(location.search).get(name); },
    redirect(url) { location.href = url; },

    // Guard a page: send unauthenticated users to sign-in.
    // (Opt-in — the demo intentionally leaves the app open for judges.)
    requireAuth() { if (!utils.isAuthed()) location.href = "signin.html"; },

    debounce(fn, ms = 250) {
      let id;
      return function () {
        clearTimeout(id);
        const a = arguments, ctx = this;
        id = setTimeout(() => fn.apply(ctx, a), ms);
      };
    },
  };

  window.HRMS = window.HRMS || {};
  window.HRMS.utils = utils;
})();
