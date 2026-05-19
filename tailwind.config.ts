import type { Config } from "tailwindcss";
import forms from "@tailwindcss/forms";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./services/**/*.{js,ts,jsx,tsx,mdx}",
    "./utils/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#111113",
        paper: "#fbfaf8",
        line: "rgb(38 38 38 / 0.12)",
        mint: "#1fbf75",
        coral: "#ff6b5f",
        steel: "#46708a"
      },
      boxShadow: {
        glow: "0 18px 70px rgb(31 191 117 / 0.18)",
        soft: "0 18px 60px rgb(17 17 19 / 0.10)"
      }
    }
  },
  plugins: [forms]
};

export default config;
