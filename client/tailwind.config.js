export default {
  content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        canvas: "var(--canvas)",
        paper: "var(--paper)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        primary: "var(--primary)",
        accent: "var(--accent)",
        signal: "var(--signal)",
        error: "var(--error)",
        lens: "var(--lens)",
        blush: "var(--blush)",
        orange: "var(--orange)",
        white: "var(--white)",
      },
      borderRadius: {
        chip: "12px",
        card: "20px",
        sheet: "28px",
      },
      boxShadow: {
        sticker: "3px 4px 0 var(--ink)",
      },
      fontFamily: {
        display: ["Grandstander", "sans-serif"],
        body: ["Atkinson Hyperlegible", "sans-serif"],
        language: ["Noto Sans", "Noto Sans SC", "sans-serif"],
      },
    },
  },
  plugins: [],
}