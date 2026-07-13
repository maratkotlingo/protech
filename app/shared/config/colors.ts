export const ADMIN_THEME_COLORS = {
  accent: "#16a34a",
  accentSoft: "#dcfce7",
  accentStrong: "#15803d",
  surface: "#ffffff",
  surfaceMuted: "#f6f8f7",
  border: "#dfe7e2",
  text: "#102018",
  textMuted: "#65756c",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#0284c7",
  chart: {
    green: "#16a34a",
    blue: "#0ea5e9",
    amber: "#f59e0b",
    red: "#ef4444",
    violet: "#8b5cf6"
  },
  dark: {
    accent: "#22c55e",
    accentSoft: "#052e16",
    accentStrong: "#86efac",
    surface: "#101613",
    surfaceMuted: "#0b110e",
    border: "#243229",
    text: "#ecfdf3",
    textMuted: "#9db0a4",
    danger: "#f87171",
    warning: "#fbbf24",
    info: "#38bdf8",
    chart: {
      green: "#22c55e",
      blue: "#38bdf8",
      amber: "#fbbf24",
      red: "#f87171",
      violet: "#a78bfa"
    }
  }
} as const;

export type AdminThemeColor = typeof ADMIN_THEME_COLORS;
