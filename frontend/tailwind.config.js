/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "ds-bg-primary": "var(--ds-bg-primary)",
        "ds-bg-secondary": "var(--ds-bg-secondary)",
        "ds-bg-tertiary": "var(--ds-bg-tertiary)",
        "ds-bg-surface": "var(--ds-bg-surface)",
        "ds-bg-inverse": "var(--ds-bg-inverse)",
        "ds-text-primary": "var(--ds-text-primary)",
        "ds-text-secondary": "var(--ds-text-secondary)",
        "ds-text-muted": "var(--ds-text-muted)",
        "ds-text-accent": "var(--ds-text-accent)",
        "ds-text-inverse": "var(--ds-text-inverse)",
        "ds-accent-primary": "var(--ds-accent-primary)",
        "ds-accent-secondary": "var(--ds-accent-secondary)",
        "ds-border-default": "var(--ds-border-default)",
        "ds-border-strong": "var(--ds-border-strong)",
        "ds-border-accent": "var(--ds-border-accent)",
        "ds-feedback-success": "var(--ds-feedback-success)",
        "ds-feedback-error": "var(--ds-feedback-error)",
        "ds-feedback-warning": "var(--ds-feedback-warning)",
      },
      borderRadius: {
        ds: "var(--radius)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "slide-up": "slideUp 0.5s ease-out",
        "fade-in": "fadeIn 0.5s ease-out",
        "typing": "typing 1.5s steps(3) infinite",
        "graph-pulse": "graphPulse 3s ease-in-out infinite",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(5, 150, 105, 0.5), 0 0 20px rgba(5, 150, 105, 0.2)" },
          "100%": { boxShadow: "0 0 20px rgba(5, 150, 105, 0.8), 0 0 60px rgba(5, 150, 105, 0.4)" },
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        typing: {
          "0%": { content: "''" },
          "33%": { content: "'.'" },
          "66%": { content: "'..'" },
          "100%": { content: "'...'" },
        },
        graphPulse: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "ds-gradient": "linear-gradient(135deg, var(--ds-accent-primary), var(--ds-accent-secondary))",
      },
    },
  },
  plugins: [],
};
