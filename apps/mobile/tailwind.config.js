/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        cosmo: {
          void: "#020617",
          primary: "#6366f1",
          primaryDeep: "#4f46e5",
          blue: "#3b82f6",
          surface: "rgba(15, 23, 42, 0.65)",
          card: "#0f172a",
          muted: "#94a3b8",
          success: "#10b981",
          warning: "#f59e0b",
          danger: "#ef4444",
        },
      },
    },
  },
  plugins: [],
};
