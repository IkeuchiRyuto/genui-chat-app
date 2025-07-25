const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#ffffff",
            foreground: "#1a1a1a",
            primary: {
              50: "#f0f9ff",
              100: "#e0f2fe",
              200: "#bae6fd",
              300: "#7dd3fc",
              400: "#38bdf8",
              500: "#0ea5e9",
              600: "#0284c7",
              700: "#0369a1",
              800: "#075985",
              900: "#0c4a6e",
              DEFAULT: "#0ea5e9",
              foreground: "#ffffff",
            },
            secondary: {
              50: "#f8fafc",
              100: "#f1f5f9",
              200: "#e2e8f0",
              300: "#cbd5e1",
              400: "#94a3b8",
              500: "#64748b",
              600: "#475569",
              700: "#334155",
              800: "#1e293b",
              900: "#0f172a",
              DEFAULT: "#64748b",
              foreground: "#ffffff",
            },
            success: {
              50: "#f0fdf4",
              100: "#dcfce7",
              200: "#bbf7d0",
              300: "#86efac",
              400: "#4ade80",
              500: "#22c55e",
              600: "#16a34a",
              700: "#15803d",
              800: "#166534",
              900: "#14532d",
              DEFAULT: "#22c55e",
              foreground: "#ffffff",
            },
            content1: "#ffffff",
            content2: "#fafafa",
            content3: "#f4f4f5",
            content4: "#e4e4e7",
            default: {
              50: "#fafafa",
              100: "#f4f4f5",
              200: "#e4e4e7",
              300: "#d4d4d8",
              400: "#a1a1aa",
              500: "#71717a",
              600: "#52525b",
              700: "#3f3f46",
              800: "#27272a",
              900: "#18181b",
              DEFAULT: "#fafafa",
              foreground: "#18181b",
            },
          },
        },
        dark: {
          colors: {
            background: "#0a0a0a",
            foreground: "#ffffff",
            primary: {
              50: "#0c4a6e",
              100: "#075985",
              200: "#0369a1",
              300: "#0284c7",
              400: "#0ea5e9",
              500: "#38bdf8",
              600: "#7dd3fc",
              700: "#bae6fd",
              800: "#e0f2fe",
              900: "#f0f9ff",
              DEFAULT: "#38bdf8",
              foreground: "#000000",
            },
            secondary: {
              50: "#0f172a",
              100: "#1e293b",
              200: "#334155",
              300: "#475569",
              400: "#64748b",
              500: "#94a3b8",
              600: "#cbd5e1",
              700: "#e2e8f0",
              800: "#f1f5f9",
              900: "#f8fafc",
              DEFAULT: "#94a3b8",
              foreground: "#000000",
            },
            success: {
              50: "#14532d",
              100: "#166534",
              200: "#15803d",
              300: "#16a34a",
              400: "#22c55e",
              500: "#4ade80",
              600: "#86efac",
              700: "#bbf7d0",
              800: "#dcfce7",
              900: "#f0fdf4",
              DEFAULT: "#4ade80",
              foreground: "#000000",
            },
            content1: "#18181b",
            content2: "#27272a",
            content3: "#3f3f46",
            content4: "#52525b",
            default: {
              50: "#18181b",
              100: "#27272a",
              200: "#3f3f46",
              300: "#52525b",
              400: "#71717a",
              500: "#a1a1aa",
              600: "#d4d4d8",
              700: "#e4e4e7",
              800: "#f4f4f5",
              900: "#fafafa",
              DEFAULT: "#27272a",
              foreground: "#fafafa",
            },
          },
        },
      },
    }),
  ],
};
