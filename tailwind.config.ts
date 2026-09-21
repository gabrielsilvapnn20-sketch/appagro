import type { Config } from "tailwindcss";

/**
 * Tailwind configurado para usar EXATAMENTE as variáveis de cor, fonte e raio
 * do protótipo sulco.html — não a paleta padrão do Tailwind.
 * As cores apontam para as CSS custom properties definidas em globals.css,
 * então o tema claro/escuro (prefers-color-scheme + [data-theme]) troca sozinho.
 */
const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    // substitui a paleta padrão inteira
    colors: {
      transparent: "transparent",
      current: "currentColor",
      white: "#FFFFFF",
      black: "#000000",
      bg: "var(--bg)",
      surface: "var(--surface)",
      "surface-2": "var(--surface-2)",
      ink: "var(--ink)",
      "ink-soft": "var(--ink-soft)",
      border: "var(--border)",
      primary: "var(--primary)",
      "primary-ink": "var(--primary-ink)",
      "primary-soft": "var(--primary-soft)",
      accent: "var(--accent)",
      "accent-soft": "var(--accent-soft)",
      clay: "var(--clay)",
      "clay-soft": "var(--clay-soft)",
      danger: "var(--danger)",
      "danger-soft": "var(--danger-soft)",
    },
    borderRadius: {
      none: "0",
      sm: "var(--radius-sm)",
      DEFAULT: "var(--radius-md)",
      md: "var(--radius-md)",
      lg: "var(--radius-lg)",
      full: "999px",
    },
    fontFamily: {
      // Space Grotesk para títulos; system-ui stack para o corpo — idêntico ao protótipo
      display: [
        "var(--font-space-grotesk)",
        "-apple-system",
        "BlinkMacSystemFont",
        "sans-serif",
      ],
      sans: [
        "-apple-system",
        "BlinkMacSystemFont",
        "Segoe UI",
        "Roboto",
        "Helvetica",
        "Arial",
        "sans-serif",
      ],
    },
    extend: {
      boxShadow: {
        sulco:
          "0 1px 2px rgba(27,42,31,0.06), 0 4px 14px rgba(27,42,31,0.07)",
      },
    },
  },
  plugins: [],
};

export default config;
