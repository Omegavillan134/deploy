import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        forest: { 950: "#0d3311", 900: "#1b5e20", 800: "#2e7d32", 700: "#388e3c", 600: "#43a047" },
        mint:   { 50: "#e8f5e9", 100: "#c8e6c9", 200: "#a5d6a7", 300: "#81c784" },
        ink:    { DEFAULT: "#1f2933", soft: "#5f6b76" },
      },
      fontFamily: { sans: ["var(--font-inter)", "system-ui", "sans-serif"] },
      boxShadow: {
        card: "0 8px 30px rgba(27, 94, 32, 0.08)",
        float: "0 20px 60px rgba(27, 94, 32, 0.14)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
};
export default config;
