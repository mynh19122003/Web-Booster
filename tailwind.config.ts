import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        heading: ["var(--font-heading)", "Rajdhani", "sans-serif"],
        body: ["var(--font-body)", "Plus Jakarta Sans", "sans-serif"],
        sans: ["var(--font-body)", "Plus Jakarta Sans", "sans-serif"],
      },
      colors: {
        "prime-gold": "#FF9F3C",
        "burnt-orange": "#D97706",
        charcoal: "#0F0F10",
        "slate-card": "#1F1F23",
        "metallic-gold": "#F5D7A1",
      },
    },
  },
  plugins: [],
};

export default config;
