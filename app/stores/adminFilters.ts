import { shiftDateKey, todayDateKey } from "~~/app/shared/lib/adminFormatters";
import type { OrderStatus } from "~~/app/shared/types/admin";

export const useAdminFiltersStore = defineStore("admin-filters", {
  state: () => ({
    analytics: {
      preset: "30",
      startDate: shiftDateKey(-29),
      endDate: todayDateKey(),
      granularity: "day" as "day" | "week" | "month",
      productId: null as number | null,
      categoryId: null as number | null,
      sortBy: "revenue" as "revenue" | "quantity" | "orders" | "profit",
      limit: 12
    },
    products: {
      search: "",
      categoryId: null as number | null,
      isActive: "all" as "all" | "true" | "false"
    },
    orders: {
      status: "all" as OrderStatus | "all"
    },
    reviews: {
      pendingOnly: true
    },
    faq: {
      pendingOnly: true
    }
  }),
  actions: {
    setAnalyticsPreset(value: "7" | "30" | "90" | "custom") {
      this.analytics.preset = value;

      if (value !== "custom") {
        const days = Number(value);
        this.analytics.endDate = todayDateKey();
        this.analytics.startDate = shiftDateKey(-(days - 1));
      }
    },
    resetAnalyticsFilters() {
      this.analytics.preset = "30";
      this.analytics.startDate = shiftDateKey(-29);
      this.analytics.endDate = todayDateKey();
      this.analytics.granularity = "day";
      this.analytics.productId = null;
      this.analytics.categoryId = null;
      this.analytics.sortBy = "revenue";
      this.analytics.limit = 12;
    }
  },
  persist: {
    storage: piniaPluginPersistedstate.localStorage()
  }
});