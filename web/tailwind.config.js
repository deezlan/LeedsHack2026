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
      boxShadow: {
        'clay-card': '8px 8px 16px 0px rgba(10, 35, 60, 0.1), -8px -8px 16px 0px rgba(255, 255, 255, 0.8)',
        'clay-card-hover': '12px 12px 20px 0px rgba(10, 35, 60, 0.15), -8px -8px 16px 0px rgba(255, 255, 255, 0.9)',
        'clay-btn': '6px 6px 12px 0px rgba(10, 35, 60, 0.15), -4px -4px 10px 0px rgba(255, 255, 255, 0.5)',
        'clay-btn-active': 'inset 4px 4px 8px 0px rgba(10, 35, 60, 0.1), inset -4px -4px 8px 0px rgba(255, 255, 255, 0.5)',
        'clay-icon': '5px 5px 10px rgba(166, 180, 200, 0.2), -5px -5px 10px rgba(255, 255, 255, 0.9)',
      },
      backgroundImage: {
        'clay-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.0) 100%)',
      }
    },
  },
  plugins: [],
};
