/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Leeds tokens (as utilities like bg-leeds-teal)
        "leeds-teal": "rgb(var(--leeds-teal) / <alpha-value>)",
        "leeds-teal-dark": "rgb(var(--leeds-teal-dark) / <alpha-value>)",
        "leeds-blue": "rgb(var(--leeds-blue) / <alpha-value>)",
        "leeds-blue-dark": "rgb(var(--leeds-blue-dark) / <alpha-value>)",
        "leeds-bright": "rgb(var(--leeds-bright) / <alpha-value>)",
        "leeds-cream": "rgb(var(--leeds-cream) / <alpha-value>)",
        "leeds-surface": "rgb(var(--leeds-surface) / <alpha-value>)",
        "leeds-border": "rgb(var(--leeds-border) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)"],
      },
    },
  },
  plugins: [],
};