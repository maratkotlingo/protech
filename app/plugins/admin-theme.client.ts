import { ADMIN_THEME_COLORS } from "~~/app/shared/config/colors";
import { watch } from "vue";

export default defineNuxtPlugin(() => {
  const root = document.documentElement;
  const colorMode = useColorMode();

  const applyColors = () => {
    const palette = colorMode.value === "dark" ? ADMIN_THEME_COLORS.dark : ADMIN_THEME_COLORS;

    root.style.setProperty("--admin-accent", palette.accent);
    root.style.setProperty("--admin-accent-soft", palette.accentSoft);
    root.style.setProperty("--admin-accent-strong", palette.accentStrong);
    root.style.setProperty("--admin-surface", palette.surface);
    root.style.setProperty("--admin-surface-muted", palette.surfaceMuted);
    root.style.setProperty("--admin-border", palette.border);
    root.style.setProperty("--admin-text", palette.text);
    root.style.setProperty("--admin-text-muted", palette.textMuted);
    root.style.setProperty("--admin-danger", palette.danger);
    root.style.setProperty("--admin-warning", palette.warning);
    root.style.setProperty("--admin-info", palette.info);
    root.style.setProperty("--admin-chart-green", palette.chart.green);
    root.style.setProperty("--admin-chart-blue", palette.chart.blue);
    root.style.setProperty("--admin-chart-amber", palette.chart.amber);
    root.style.setProperty("--admin-chart-red", palette.chart.red);
    root.style.setProperty("--admin-chart-violet", palette.chart.violet);
  };

  watch(() => colorMode.value, applyColors, { immediate: true });
});
