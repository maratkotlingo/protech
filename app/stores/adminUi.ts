export type AdminThemePreference = "light" | "dark" | "system";

export const useAdminUiStore = defineStore("admin-ui", {
  state: () => ({
    sidebarCollapsed: false,
    themePreference: "system" as AdminThemePreference
  }),
  actions: {
    toggleSidebar() {
      this.sidebarCollapsed = !this.sidebarCollapsed;
    },
    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value;
    },
    setThemePreference(value: AdminThemePreference) {
      this.themePreference = value;

      const colorMode = useColorMode();
      colorMode.preference = value;
    },
    hydrateColorMode() {
      const colorMode = useColorMode();
      colorMode.preference = this.themePreference;
    }
  },
  persist: {
    storage: piniaPluginPersistedstate.localStorage()
  }
});
