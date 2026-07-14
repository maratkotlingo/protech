export type ShopThemePreference = "light" | "dark" | "system";

export const useShopUiStore = defineStore("shop-ui", {
  state: () => ({
    themePreference: "system" as ShopThemePreference,
    catalog: {
      search: "",
      categoryId: null as number | null,
      sort: "newest" as "newest" | "price_asc" | "price_desc" | "oldest",
      minPrice: null as number | null,
      maxPrice: null as number | null,
      discountOnly: false
    }
  }),
  actions: {
    setThemePreference(value: ShopThemePreference) {
      this.themePreference = value;

      const colorMode = useColorMode();
      colorMode.preference = value;
    },
    toggleTheme() {
      const colorMode = useColorMode();
      const next = colorMode.value === "dark" ? "light" : "dark";
      this.setThemePreference(next);
    },
    hydrateColorMode() {
      const colorMode = useColorMode();
      colorMode.preference = this.themePreference;
    },
    resetCatalogFilters() {
      this.catalog.search = "";
      this.catalog.categoryId = null;
      this.catalog.sort = "newest";
      this.catalog.minPrice = null;
      this.catalog.maxPrice = null;
      this.catalog.discountOnly = false;
    }
  },
  persist: {
    storage: piniaPluginPersistedstate.localStorage()
  }
});
