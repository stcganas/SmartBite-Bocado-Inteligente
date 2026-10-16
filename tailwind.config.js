/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#FF8A00",
          container: "#4A2A00",
        },
        secondary: {
          DEFAULT: "#FFB347",
          container: "#82541C",
        },
        tertiary: {
          DEFAULT: "#FFC857",
          container: "#886716",
        },
        error: {
          DEFAULT: "#FF5449",
          container: "#93000A",
        },
        surface: {
          DEFAULT: "var(--surface)",
          base: "var(--surface-base)",
          variant: "var(--surface-variant)",
          light: "var(--surface-light)",
        },
        'on-surface': {
          DEFAULT: "var(--on-surface)",
          variant: "var(--on-surface-variant)",
          muted: "var(--on-surface-muted)",
        },
        outline: {
          DEFAULT: "var(--outline)",
          variant: "var(--outline-variant)",
        },
        gold: {
          DEFAULT: "#FFD700",
          light: "#FFAA33",
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        roboto: ["Roboto", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 1.5s infinite",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [
    require("@tailwindcss/typography"),
  ],
}
