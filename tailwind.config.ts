import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          DEFAULT: "#0B3D2E",
          deep: "#072A20",
          light: "#10513D",
        },
        punch: {
          DEFAULT: "#FF3E9D",
          dark: "#D61E7C",
        },
        gold: {
          DEFAULT: "#FFC53D",
          dark: "#E8A800",
        },
        cream: {
          DEFAULT: "#F6EFE0",
          dark: "#E6D8BE",
        },
        teal: "#2EC4B6",
      },
      fontFamily: {
        display: ["Anton", "Impact", "sans-serif"],
        label: ["'Space Mono'", "monospace"],
        script: ["Caveat", "cursive"],
      },
    },
  },
  plugins: [],
};

export default config;
