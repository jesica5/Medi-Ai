/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/shared/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        acuity: {
          critical: "#E53E3E", // Priority 1 Red
          high: "#ED8936",     // Priority 2 Orange
          moderate: "#ECC94B", // Priority 3 Yellow
          low: "#38A169",      // Priority 4 Green
        },
        navy: {
          50: "#f0f6fe",
          100: "#e0edfe",
          500: "#0284c7",
          800: "#0f172a",
          900: "#090d16",
        },
        teal: {
          700: "#0f766e",
          800: "#115e59",
        }
      },
    },
  },
  plugins: [],
};
