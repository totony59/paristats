import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: "#0f1420",
          raised: "#161d2e",
          border: "#232b3d",
        },
        profit: "#22c55e",
        loss: "#ef4444",
        pending: "#f59e0b",
        accent: "#6366f1",
      },
    },
  },
  plugins: [],
} satisfies Config;
