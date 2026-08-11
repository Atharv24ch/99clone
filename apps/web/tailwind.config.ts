import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "hsl(24, 100%, 97%)",
          100: "hsl(24, 96%, 93%)",
          200: "hsl(24, 94%, 85%)",
          300: "hsl(24, 94%, 73%)",
          400: "hsl(24, 94%, 60%)",
          500: "hsl(24, 92%, 51%)",
          600: "hsl(24, 90%, 44%)",
          700: "hsl(24, 88%, 36%)",
          800: "hsl(24, 84%, 30%)",
          900: "hsl(24, 80%, 25%)",
          950: "hsl(24, 78%, 14%)",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui"],
        display: ["Outfit", "ui-sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.08), 0 4px 16px -2px rgb(0 0 0 / 0.06)",
        "card-hover": "0 4px 12px 0 rgb(0 0 0 / 0.12), 0 16px 40px -4px rgb(0 0 0 / 0.1)",
        glass: "0 8px 32px 0 rgb(0 0 0 / 0.20), inset 0 0 0 1px rgb(255 255 255 / 0.08)",
      },
      backgroundImage: {
        "gradient-brand": "linear-gradient(135deg, hsl(24, 92%, 51%) 0%, hsl(14, 90%, 48%) 100%)",
        "gradient-hero": "linear-gradient(135deg, hsl(217, 40%, 8%) 0%, hsl(217, 32%, 15%) 60%, hsl(24, 60%, 15%) 100%)",
      },
      animation: {
        "fade-in": "fadeIn 0.4s ease-out forwards",
        "slide-up": "slideUp 0.4s ease-out forwards",
        "slide-down": "slideDown 0.3s ease-out forwards",
        shimmer: "shimmer 1.8s infinite",
        "pulse-soft": "pulseSoft 4s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideDown: {
          "0%": { opacity: "0", transform: "translateY(-8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        pulseSoft: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.4" },
        },
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;
