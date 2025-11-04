import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Wordle-inspired color palette
        background: "#121213",
        surface: "#1a1a1b",
        border: "#3a3a3c",
        text: {
          primary: "#ffffff",
          secondary: "#818384",
        },
        // Status colors (Wordle-style)
        correct: "#538d4e", // Green
        present: "#b59f3b", // Yellow
        absent: "#3a3a3c", // Gray
        error: "#ff4444",
      },
      fontFamily: {
        sans: ["system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
