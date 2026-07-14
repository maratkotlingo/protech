import { SHOP_THEME_COLORS } from "~~/app/shared/config/colors";
import { watch } from "vue";

export default defineNuxtPlugin(() => {
  const root = document.documentElement;
  const colorMode = useColorMode();

  const applyColors = () => {
    const palette = colorMode.value === "dark" ? SHOP_THEME_COLORS.dark : SHOP_THEME_COLORS;

    root.style.setProperty("--shop-accent", palette.accent);
    root.style.setProperty("--shop-accent-soft", palette.accentSoft);
    root.style.setProperty("--shop-accent-muted", palette.accentMuted);
    root.style.setProperty("--shop-accent-strong", palette.accentStrong);
    root.style.setProperty("--shop-surface", palette.surface);
    root.style.setProperty("--shop-surface-muted", palette.surfaceMuted);
    root.style.setProperty("--shop-surface-elevated", palette.surfaceElevated);
    root.style.setProperty("--shop-border", palette.border);
    root.style.setProperty("--shop-text", palette.text);
    root.style.setProperty("--shop-text-muted", palette.textMuted);
    root.style.setProperty("--shop-text-subtle", palette.textSubtle);
    root.style.setProperty("--shop-danger", palette.danger);
    root.style.setProperty("--shop-warning", palette.warning);
    root.style.setProperty("--shop-info", palette.info);
    root.style.setProperty("--shop-success", palette.success);
    root.style.setProperty("--shop-ring", palette.ring);
  };

  watch(() => colorMode.value, applyColors, { immediate: true });
});
