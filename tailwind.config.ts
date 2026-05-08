import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        bg:      "#0B0F1C",
        panel:   "#111827",
        border:  "#1E2D4A",
        accent:  "#C94A00",
        green:   "#3DB87A",
        gold:    "#E8B84B",
        blue:    "#5B9BD5",
        text:    "#E8DFC8",
        muted:   "#7A8FA8",
        dim:     "#3A4A60",
        dark:    "#0D1525",
      },
      fontFamily: {
        serif: ["Georgia", "Times New Roman", "serif"],
        mono:  ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      borderRadius: { card: "8px" },
      minHeight:    { touch: "44px" },
      minWidth:     { touch: "44px" },
      keyframes: {
        "fade-in":    { "0%": { opacity: "0", transform: "translateY(4px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "slide-up":   { "0%": { opacity: "0", transform: "translateY(16px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        "shimmer":    { "0%": { backgroundPosition: "-200% 0" }, "100%": { backgroundPosition: "200% 0" } },
        "spin-slow":  { "0%": { transform: "rotate(0deg)" }, "100%": { transform: "rotate(360deg)" } },
        "drawer-up":  { "0%": { transform: "translateY(100%)" }, "100%": { transform: "translateY(0)" } },
        "drawer-down":{ "0%": { transform: "translateY(0)" },    "100%": { transform: "translateY(100%)" } },
      },
      animation: {
        "fade-in":    "fade-in 0.2s ease-out",
        "slide-up":   "slide-up 0.25s ease-out",
        "shimmer":    "shimmer 1.8s linear infinite",
        "spin-slow":  "spin-slow 1.2s linear infinite",
        "drawer-up":  "drawer-up 0.3s cubic-bezier(0.32, 0.72, 0, 1)",
        "drawer-down":"drawer-down 0.25s ease-in",
      },
      screens: {
        xs: "390px", sm: "640px", md: "768px",
        lg: "1024px", xl: "1280px", "2xl": "1536px",
      },
    },
  },
  plugins: [],
};

export default config;
