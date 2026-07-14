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

export const SHOP_THEME_COLORS = {
  accent: "#16a34a",
  accentSoft: "#dcfce7",
  accentMuted: "#bbf7d0",
  accentStrong: "#15803d",
  surface: "#ffffff",
  surfaceMuted: "#f4f7f5",
  surfaceElevated: "#ffffff",
  border: "#dce7e0",
  text: "#102018",
  textMuted: "#617269",
  textSubtle: "#839189",
  danger: "#dc2626",
  warning: "#d97706",
  info: "#0284c7",
  success: "#16a34a",
  ring: "#86efac",
  dark: {
    accent: "#22c55e",
    accentSoft: "#052e16",
    accentMuted: "#14532d",
    accentStrong: "#86efac",
    surface: "#0f1713",
    surfaceMuted: "#0a100d",
    surfaceElevated: "#141e19",
    border: "#26352c",
    text: "#ecfdf3",
    textMuted: "#a7b8ae",
    textSubtle: "#78887f",
    danger: "#f87171",
    warning: "#fbbf24",
    info: "#38bdf8",
    success: "#22c55e",
    ring: "#14532d"
  }
} as const;

export type ShopThemeColor = typeof SHOP_THEME_COLORS;
