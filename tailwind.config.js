/** @type {import('tailwindcss').Config} */

function withOpacity(variable) {
  return ({ opacityValue }) =>
    opacityValue === undefined
      ? `hsl(var(${variable}))`
      : `hsl(var(${variable}) / ${opacityValue})`;
}

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        base: withOpacity("--bg-base"),
        elevated: withOpacity("--bg-elevated"),
        sunken: withOpacity("--bg-sunken"),
        border: withOpacity("--border"),
        "border-strong": withOpacity("--border-strong"),
        primary: withOpacity("--text-primary"),
        secondary: withOpacity("--text-secondary"),
        muted: withOpacity("--text-muted"),
        accent: withOpacity("--accent"),
        "accent-soft": withOpacity("--accent-soft"),
        "accent-contrast": withOpacity("--accent-contrast"),
        dim: {
          currency: withOpacity("--dim-currency"),
          language: withOpacity("--dim-language"),
          religion: withOpacity("--dim-religion"),
          government: withOpacity("--dim-government"),
          holiday: withOpacity("--dim-holiday"),
          capital: withOpacity("--dim-capital"),
        },
      },
      fontFamily: {
        display: ['"Fraunces"', '"Noto Serif SC"', "Georgia", "serif"],
        sans: ['"Manrope"', '"Noto Sans SC"', "system-ui", "sans-serif"],
      },
      boxShadow: {
        sm: "var(--shadow-sm)",
        md: "var(--shadow-md)",
        lg: "var(--shadow-lg)",
      },
      backgroundColor: {
        glass: "hsl(var(--surface-glass))",
      },
      keyframes: {
        "float-in": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "float-in": "float-in 0.5s ease both",
      },
    },
  },
  plugins: [],
};
