/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: "#09090F",
          secondary: "#11111B",
          sidebar: "#161126",
        },
        card: "rgba(255,255,255,0.06)",
        "glass-border": "rgba(255,255,255,0.12)",
        primary: "#B84DFF",
        secondary: "#8B5CF6",
        accent: "#D946EF",
        success: "#22C55E",
        warning: "#F59E0B",
        danger: "#EF4444",
        "text-primary": "#FFFFFF",
        "text-secondary": "#A1A1AA",
      },
      borderColor: {
        DEFAULT: "rgba(255,255,255,0.12)",
        glass: "rgba(255,255,255,0.12)",
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        glow: "0 0 20px rgba(184,77,255,0.15)",
        "glow-lg": "0 0 40px rgba(184,77,255,0.25)",
        "glow-sm": "0 0 10px rgba(184,77,255,0.1)",
        glass: "0 8px 32px rgba(0,0,0,0.37)",
        "card-hover": "0 8px 32px rgba(184,77,255,0.15)",
      },
      animation: {
        "shimmer": "shimmer 2s infinite",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        "float": "float 6s ease-in-out infinite",
        "slide-up": "slide-up 0.5s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 20px rgba(184,77,255,0.1)" },
          "50%": { boxShadow: "0 0 40px rgba(184,77,255,0.3)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
