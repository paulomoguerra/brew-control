import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        espresso: "#4B2C20",
        mocha: "#6E4F3E",
        cocoa: "#8B5B3F",
        caramel: "#D8A078",
        oat: "#BFA78A",
        cream: "#F9F1E4",
      },
    },
  },
  plugins: [],
};
export default config;
