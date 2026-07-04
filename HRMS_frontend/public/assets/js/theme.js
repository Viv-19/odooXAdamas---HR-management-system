/* =========================================================================
   HRMS — Single source of truth for the Tailwind (Play CDN) theme.
   Load order on every page:
     1. <script src="https://cdn.tailwindcss.com?plugins=forms"></script>
     2. <script src="assets/js/theme.js"></script>
   This replaces the per-page inline configs that previously drifted apart.
   Palette: Sky Blue.  Fonts: Hanken Grotesk (headings) + Inter (body).
   ========================================================================= */
(function () {
  if (typeof window === "undefined" || !window.tailwind) return;

  window.tailwind.config = {
    darkMode: "class",
    theme: {
      extend: {
        colors: {
          // Brand
          primary: "#0ea5e9",
          "primary-hover": "#0284c7",
          "primary-container": "#0284c7",
          "primary-fixed-dim": "#7dd3fc",
          "primary-light": "#e0f2fe",
          "on-primary": "#ffffff",

          secondary: "#0058be",
          "secondary-container": "#2170e4",
          "on-secondary": "#ffffff",

          // Semantic
          success: "#16a34a",
          "success-container": "#dcfce7",
          "on-success": "#ffffff",
          warning: "#d97706",
          "warning-container": "#fef3c7",
          error: "#ba1a1a",
          "error-container": "#ffdad6",
          "on-error": "#ffffff",
          info: "#0284c7",
          "info-container": "#e0f2fe",

          // Surfaces & text
          background: "#f8f9ff",
          surface: "#ffffff",
          "surface-container-lowest": "#ffffff",
          "surface-container-low": "#f4f7ff",
          "surface-container": "#eff4ff",
          "surface-container-high": "#e5eeff",
          "surface-variant": "#d3e4fe",
          "on-surface": "#0b1c30",
          "on-surface-variant": "#494454",
          "inverse-surface": "#213145",
          "inverse-on-surface": "#eaf1ff",

          outline: "#7b7486",
          "outline-variant": "#cbd5e1",
        },
        fontFamily: {
          heading: ["Hanken Grotesk", "system-ui", "sans-serif"],
          body: ["Inter", "system-ui", "sans-serif"],
        },
        borderRadius: {
          DEFAULT: "0.25rem",
          lg: "0.5rem",
          xl: "0.75rem",
          "2xl": "1rem",
          full: "9999px",
        },
        spacing: {
          xs: "8px",
          sm: "16px",
          md: "24px",
          lg: "32px",
          xl: "48px",
        },
        boxShadow: {
          card: "0px 4px 20px rgba(11,28,48,0.05)",
          "card-hover": "0px 8px 28px rgba(11,28,48,0.10)",
          nav: "0px 4px 20px rgba(11,28,48,0.05)",
        },
        maxWidth: {
          content: "1440px",
        },
        keyframes: {
          "fade-in": {
            "0%": { opacity: "0", transform: "translateY(4px)" },
            "100%": { opacity: "1", transform: "translateY(0)" },
          },
          "slide-in": {
            "0%": { opacity: "0", transform: "translateX(16px)" },
            "100%": { opacity: "1", transform: "translateX(0)" },
          },
        },
        animation: {
          "fade-in": "fade-in 0.25s ease-out both",
          "slide-in": "slide-in 0.25s ease-out both",
        },
      },
    },
  };
})();
