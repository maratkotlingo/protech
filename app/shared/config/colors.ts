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
  ring: "#86efac"
} as const;

export type ShopThemeColor = typeof SHOP_THEME_COLORS;