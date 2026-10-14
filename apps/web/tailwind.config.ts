import type { Config } from "tailwindcss";

/**
 * Aangan — "Stamp Paper & Registry" world.
 * Colours live as CSS variables in globals.css so every surface reads one source.
 */
const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: "rgb(var(--paper) / <alpha-value>)",
          sheet: "rgb(var(--sheet) / <alpha-value>)",
          deep: "rgb(var(--paper-deep) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--ink) / <alpha-value>)",
          soft: "rgb(var(--ink-soft) / <alpha-value>)",
          faint: "rgb(var(--ink-faint) / <alpha-value>)",
        },
        stamp: {
          // guilloche / structural green
          DEFAULT: "rgb(var(--stamp) / <alpha-value>)",
          light: "rgb(var(--stamp-light) / <alpha-value>)",
          dark: "rgb(var(--stamp-dark) / <alpha-value>)",
        },
        seal: {
          // registry violet: seals and the primary action
          DEFAULT: "rgb(var(--seal) / <alpha-value>)",
          dark: "rgb(var(--seal-dark) / <alpha-value>)",
          wash: "rgb(var(--seal-wash) / <alpha-value>)",
        },
        rule: "rgb(var(--rule) / <alpha-value>)",
        danger: "rgb(var(--danger) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-hind)", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-rozha)", "Georgia", "serif"],
        typed: ["var(--font-typed)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        sheet: "0 1px 0 rgb(var(--rule)), 0 18px 40px -24px rgb(var(--ink) / 0.35)",
        lift: "0 2px 0 rgb(var(--rule)), 0 22px 44px -22px rgb(var(--ink) / 0.4)",
      },
      borderRadius: {
        sheet: "3px",
      },
      keyframes: {
        stampIn: {
          "0%": { opacity: "0", transform: "scale(1.35) rotate(var(--seal-tilt, -8deg))", filter: "blur(2px)" },
          "60%": { opacity: "1", transform: "scale(0.96) rotate(var(--seal-tilt, -8deg))", filter: "blur(0)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(var(--seal-tilt, -8deg))" },
        },
        rise: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        "stamp-in": "stampIn 520ms cubic-bezier(0.16, 1, 0.3, 1) both",
        rise: "rise 360ms cubic-bezier(0.16, 1, 0.3, 1) both",
        shimmer: "shimmer 1.8s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
