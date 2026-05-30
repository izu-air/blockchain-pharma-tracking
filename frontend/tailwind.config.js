/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#166534",
        ink: "#17231c"
      },
      screens: {
        xs: "475px"
      },
      keyframes: {
        "fade-in":  { from: { opacity: "0" }, to: { opacity: "1" } },
        "scale-in": {
          from: { opacity: "0", transform: "translateY(8px) scale(.98)" },
          to:   { opacity: "1", transform: "translateY(0)   scale(1)" }
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to:   { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        breathe: {
          "0%, 100%": {
            boxShadow:
              "0 0 0 1px rgba(16,185,129,.35) inset, 0 0 16px rgba(16,185,129,.25), 0 4px 12px rgba(0,0,0,.4)"
          },
          "50%": {
            boxShadow:
              "0 0 0 1px rgba(16,185,129,.55) inset, 0 0 28px rgba(16,185,129,.45), 0 4px 16px rgba(0,0,0,.5)"
          }
        },
        "border-spin": {
          "0%":   { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" }
        }
      },
      animation: {
        "fade-in":     "fade-in 120ms ease-out",
        "scale-in":    "scale-in 160ms cubic-bezier(.2,.7,.3,1)",
        "slide-up":    "slide-up 240ms cubic-bezier(.2,.7,.3,1)",
        shimmer:       "shimmer 1.4s linear infinite",
        breathe:       "breathe 3.5s ease-in-out infinite",
        "border-spin": "border-spin 8s linear infinite"
      }
    }
  },
  plugins: []
};
