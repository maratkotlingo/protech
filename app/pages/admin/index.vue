<template>
  <div class="analytics-shop-page space-y-5">
    <section class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-4xl">
        <p class="text-sm font-medium uppercase text-emerald-700">
          Аналитика
        </p>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl">
          Аналитика и статистика
        </h1>
        <p class="mt-3 max-w-3xl text-sm leading-6 text-zinc-500 sm:text-base">
          Финансы, продажи, маржинальность, популярные товары и складские сигналы в одном рабочем экране.
        </p>
      </div>

      <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending"
          @click="refresh()"
        >
          Обновить
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          icon="i-lucide-rotate-ccw"
          size="lg"
          class="h-12 justify-center rounded-full px-4 shadow-lg shadow-emerald-950/10"
          @click="filters.resetAnalyticsFilters()"
        >
          Сбросить
        </UButton>
      </div>
    </section>

    <section class="rounded-[2rem] bg-[#f9fafb]/90 p-2 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur">
      <div class="grid gap-3 2xl:grid-cols-[minmax(280px,420px)_minmax(0,1fr)] 2xl:items-end">
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-4 2xl:grid-cols-2">
          <UButton
            v-for="period in periodOptions"
            :key="period.value"
            :color="filters.analytics.preset === period.value ? 'primary' : 'neutral'"
            :variant="filters.analytics.preset === period.value ? 'solid' : 'ghost'"
            size="lg"
            class="h-12 min-w-0 justify-center rounded-full px-3 text-sm font-medium"
            :class="filters.analytics.preset === period.value ? 'shadow-lg shadow-emerald-950/10' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950'"
            @click="filters.setAnalyticsPreset(period.value)"
          >
            {{ period.label }}
          </UButton>
        </div>

        <div class="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label class="block min-w-0">
            <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">С даты</span>
            <UInput
              v-model="filters.analytics.startDate"
              class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
              size="lg"
              type="date"
              variant="none"
              :ui="analyticsInputUi"
              @update:model-value="filters.analytics.preset = 'custom'"
            />
          </label>
          <label class="block min-w-0">
            <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">По дату</span>
            <UInput
              v-model="filters.analytics.endDate"
              class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
              size="lg"
              type="date"
              variant="none"
              :ui="analyticsInputUi"
              @update:model-value="filters.analytics.preset = 'custom'"
            />
          </label>
          <label class="block min-w-0">
            <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Шаг</span>
            <USelect
              v-model="filters.analytics.granularity"
              class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
              size="lg"
              color="neutral"
              variant="none"
              icon="i-lucide-calendar-days"
              :content="analyticsSelectContent"
              :items="granularityItems"
              :ui="analyticsSelectUi"
            />
          </label>
          <label class="block min-w-0">
            <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Категория</span>
            <USelect
              v-model="filters.analytics.categoryId"
              class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5"
              size="lg"
              color="neutral"
              variant="none"
              icon="i-lucide-layout-grid"
              :content="analyticsSelectContent"
              :items="categoryItems"
              :ui="analyticsSelectUi"
              placeholder="Все категории"
            />
          </label>
        </div>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ analyticsStatusText }}
      </p>

      <div
        v-auto-animate
        class="flex flex-wrap gap-2"
      >
        <UButton
          v-if="hasAnyAnalyticsFilter"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          class="rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="filters.resetAnalyticsFilters()"
        >
          Сбросить
        </UButton>
        <UBadge
          v-if="selectedCategoryLabel"
          color="primary"
          variant="soft"
          class="max-w-full rounded-full px-3 py-1"
        >
          <span class="truncate">{{ selectedCategoryLabel }}</span>
        </UBadge>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full px-3 py-1"
        >
          {{ selectedSortLabel }}
        </UBadge>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить аналитику"
      :description="getErrorMessage(error, 'Проверьте соединение и права доступа администратора.')"
      class="rounded-2xl"
    />

    <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
      <article
        v-for="metric in metricTiles"
        :key="metric.key"
        class="rounded-2xl bg-white p-4 shadow-sm shadow-zinc-950/5 sm:p-5"
      >
        <div class="flex min-h-32 items-start justify-between gap-4">
          <div class="min-w-0">
            <p class="text-sm font-medium text-zinc-500">
              {{ metric.label }}
            </p>
            <div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <p class="text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl">
                {{ metric.value }}
              </p>
              <span
                v-if="metric.delta"
                class="rounded-full px-2.5 py-1 text-xs font-semibold"
                :class="metric.positive ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'"
              >
                {{ metric.delta }}
              </span>
            </div>
            <p class="mt-3 text-xs leading-5 text-zinc-500">
              {{ metric.hint }}
            </p>
          </div>

          <div
            class="grid size-12 shrink-0 place-items-center rounded-2xl"
            :class="metric.iconClass"
          >
            <component
              :is="metric.icon"
              class="size-6"
            />
          </div>
        </div>
      </article>
    </div>

    <div class="grid gap-4 2xl:grid-cols-[1.65fr_0.9fr]">
      <AdminLineChart
        title="Динамика выручки и прибыли"
        description="Оплаченные заказы без отменённых позиций"
        value-label="Выручка"
        secondary-label="Прибыль"
        :items="salesLineItems"
      />
      <AdminDonutChart
        title="Статусы заказов"
        description="Распределение заказов по статусам за выбранный период"
        center-label="заказов"
        :items="orderStatusSlices"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <UCard
        class="admin-card"
        :ui="{ body: '!p-5' }"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xl font-semibold text-zinc-950">
              Детализация товаров
            </p>
            <p class="mt-1 text-sm text-zinc-500">
              Продажи, выручка и маржинальность по товарам.
            </p>
          </div>
          <USelect
            v-model="filters.analytics.sortBy"
            :items="sortItems"
            :content="analyticsSelectContent"
            color="neutral"
            variant="none"
            icon="i-lucide-arrow-up-down"
            class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5 sm:w-64"
            size="lg"
            :ui="analyticsSelectUi"
          />
        </div>

        <div class="overflow-x-auto rounded-2xl bg-[#f9fafb]">
          <table class="min-w-full divide-y divide-[var(--admin-border)] text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
                <th class="px-3 py-3 font-medium">Товар</th>
                <th class="px-3 py-3 font-medium">Продано</th>
                <th class="px-3 py-3 font-medium">Выручка</th>
                <th class="px-3 py-3 font-medium">Маржа</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--admin-border)]">
              <tr
                v-for="product in productAnalytics"
                :key="product.productId"
                class="align-top"
              >
                <td class="px-3 py-3">
                  <div class="flex items-center gap-4">
                    <img
                      v-if="product.mainImage"
                      :src="product.mainImage"
                      alt=""
                      class="size-14 rounded-xl object-cover"
                    >
                    <div
                      v-else
                      class="grid size-14 place-items-center rounded-xl bg-white"
                    >
                      <Package class="size-6 text-[var(--admin-text-muted)]" />
                    </div>
                    <div class="min-w-0">
                      <p class="truncate font-medium text-[var(--admin-text)]">
                        {{ product.name }}
                      </p>
                      <p class="truncate text-xs text-[var(--admin-text-muted)]">
                        {{ product.article }} · {{ product.categoryName || "Без категории" }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-3 text-[var(--admin-text)]">
                  {{ formatNumber(product.quantity) }}
                </td>
                <td class="px-3 py-3 text-[var(--admin-text)]">
                  {{ formatCurrency(product.revenue) }}
                </td>
                <td class="px-3 py-3 text-[var(--admin-text)]">
                  {{ formatPercent(product.grossMargin) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>

      <AdminBarChart
        title="Топ товаров по выручке"
        description="Сортировка управляется детализацией товаров"
        :items="topProductBars"
      />
    </div>

    <div class="grid gap-4 2xl:grid-cols-[0.95fr_0.95fr_1.2fr]">
      <AdminDonutChart
        title="Методы оплаты"
        description="Сколько заказов и какая выручка пришли по каждому методу"
        center-label="заказов"
        :items="paymentMethodSlices"
      />
      <AdminDonutChart
        title="Получение"
        description="Доставка и самовывоз"
        center-label="заказов"
        :items="obtainingMethodSlices"
      />
      <AdminBarChart
        title="Категории по выручке"
        description="Категории, которые формируют оборот"
        :items="categoryBars"
      />
    </div>

    <div class="grid gap-4 xl:grid-cols-2">
      <UCard
        class="admin-card"
        :ui="{ body: 'p-5 sm:p-6' }"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xl font-semibold text-zinc-950">
              Низкие остатки
            </p>
            <p class="mt-1 text-sm text-zinc-500">
              Товары с количеством 5 или меньше.
            </p>
          </div>
          <UButton
            to="/admin/stock"
            color="neutral"
            variant="ghost"
            icon="i-lucide-warehouse"
            class="rounded-full bg-white text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          >
            К остаткам
          </UButton>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in lowStockItems"
            :key="item.productId"
            class="grid gap-3 rounded-2xl bg-[#f9fafb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div class="flex min-w-0 items-center gap-4">
              <img
                :src="item.mainImage"
                alt=""
                class="size-14 shrink-0 rounded-xl object-cover"
              >
              <div class="min-w-0">
                <p class="truncate text-base font-medium text-[var(--admin-text)]">
                  {{ item.name }}
                </p>
                <p class="truncate text-xs text-[var(--admin-text-muted)]">
                  {{ item.article }} · {{ item.category.name }}
                </p>
              </div>
            </div>
            <AdminStatusBadge
              type="stock"
              :value="item.quantity"
              class="justify-self-start sm:justify-self-end"
            />
          </div>

          <AdminEmptyState
            v-if="!lowStockItems.length && !pending"
            title="Склад в порядке"
            description="Нет товаров с критически низким остатком."
          >
            <template #icon>
              <CheckCircle2 class="size-6" />
            </template>
          </AdminEmptyState>
        </div>
      </UCard>

      <UCard
        class="admin-card"
        :ui="{ body: 'p-5 sm:p-6' }"
      >
        <div class="mb-6">
          <p class="text-xl font-semibold text-zinc-950">
            Последние заказы
          </p>
          <p class="mt-1 text-sm text-zinc-500">
            Быстрый контекст для операционного контроля.
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="grid gap-4 rounded-2xl bg-[#f9fafb] p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
          >
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <p class="font-medium text-[var(--admin-text)]">
                  Заказ #{{ order.id }}
                </p>
                <AdminStatusBadge
                  type="order"
                  :value="order.orderStatus"
                />
                <AdminStatusBadge
                  v-if="order.payment"
                  type="payment"
                  :value="order.payment.paymentStatus"
                />
              </div>
              <p class="mt-1 truncate text-sm text-[var(--admin-text-muted)]">
                {{ order.user?.email || "Гость" }} · {{ formatDate(order.createdAt) }}
              </p>
              <p class="mt-1 truncate text-sm font-medium text-[var(--admin-text)]">
                {{ order.customerPhone || "Телефон не указан" }}
              </p>
            </div>
            <p class="font-semibold text-[var(--admin-text)]">
              {{ formatCurrency(order.payment?.amount) }}
            </p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  Banknote,
  CheckCircle2,
  Package,
  PackageX,
  ShoppingCart,
  TrendingUp
} from "@lucide/vue";
import {
  buildQuery,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
  formatShortDate,
  getErrorMessage,
  obtainingMethodLabels,
  orderStatusLabels,
  paymentMethodLabels
} from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type {
  CategoryAnalyticsResponse,
  DashboardStats,
  DashboardStatsResponse,
  InventoryAnalyticsResponse,
  ProductAnalyticsResponse,
  SalesAnalyticsResponse
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();

const periodOptions = [
  { label: "7 дней", value: "7" as const },
  { label: "30 дней", value: "30" as const },
  { label: "90 дней", value: "90" as const },
  { label: "Произвольно", value: "custom" as const }
];
const granularityItems = [
  { label: "День", value: "day" },
  { label: "Неделя", value: "week" },
  { label: "Месяц", value: "month" }
];
const sortItems = [
  { label: "Выручка", value: "revenue" },
  { label: "Продажи", value: "quantity" },
  { label: "Заказы", value: "orders" },
  { label: "Прибыль", value: "profit" }
];

const analyticsSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const analyticsSelectUi = {
  base: "h-12 rounded-full bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const analyticsInputUi = {
  base: "h-12 rounded-full bg-transparent font-medium text-zinc-700"
};

const analyticsQuery = computed(() => buildQuery({
  startDate: filters.analytics.startDate,
  endDate: filters.analytics.endDate,
  granularity: filters.analytics.granularity,
  categoryId: filters.analytics.categoryId,
  sortBy: filters.analytics.sortBy,
  limit: filters.analytics.limit
}));

const dashboardQuery = computed(() => buildQuery({
  period: filters.analytics.preset,
  startDate: filters.analytics.startDate,
  endDate: filters.analytics.endDate,
  sortBy: filters.analytics.sortBy
}));

const { data, pending, error, refresh } = await useAsyncData("admin-analytics-bundle", async () => {
  const [dashboard, sales, products, inventory, categories] = await Promise.all([
    adminFetch<DashboardStatsResponse>(`/api/admin/dashboard/stats${dashboardQuery.value}`),
    adminFetch<SalesAnalyticsResponse>(`/api/admin/analytics/sales${analyticsQuery.value}`),
    adminFetch<ProductAnalyticsResponse>(`/api/admin/analytics/products${analyticsQuery.value}`),
    adminFetch<InventoryAnalyticsResponse>(`/api/admin/analytics/inventory${analyticsQuery.value}`),
    adminFetch<CategoryAnalyticsResponse>(`/api/admin/analytics/categories${analyticsQuery.value}`)
  ]);

  return {
    dashboard,
    sales,
    products,
    inventory,
    categories
  };
}, {
  watch: [analyticsQuery, dashboardQuery]
});

const emptyStats: DashboardStats = {
  productsTotal: 0,
  productsActive: 0,
  ordersTotal: 0,
  ordersNew: 0,
  reviewsPending: 0,
  faqPending: 0,
  lowStock: 0,
  revenuePaid: 0
};

const dashboardStats = computed(() => data.value?.dashboard.stats ?? emptyStats);
const salesTotals = computed(() => data.value?.sales.totals ?? {
  orders: 0,
  quantity: 0,
  revenue: 0,
  cost: 0,
  grossProfit: 0,
  averageOrderValue: 0,
  grossMargin: 0
});
const salesLineItems = computed(() => (data.value?.sales.salesByPeriod ?? []).map((item) => ({
  label: formatShortDate(item.date),
  value: item.revenue,
  secondary: item.grossProfit
})));
const categoryItems = computed(() => [
  { label: "Все категории", value: null },
  ...(data.value?.sales.categoryOptions ?? []).map((category) => ({
    label: category.name,
    value: category.id
  }))
]);
const selectedCategoryLabel = computed(() => {
  if (!filters.analytics.categoryId) {
    return "";
  }

  return categoryItems.value.find((item) => item.value === filters.analytics.categoryId)?.label ?? "";
});
const selectedSortLabel = computed(() =>
  sortItems.find((item) => item.value === filters.analytics.sortBy)?.label ?? "Выручка"
);
const selectedGranularityLabel = computed(() =>
  granularityItems.find((item) => item.value === filters.analytics.granularity)?.label ?? "День"
);
const analyticsStatusText = computed(() =>
  `Период: ${formatDateKey(filters.analytics.startDate)} - ${formatDateKey(filters.analytics.endDate)} · шаг: ${selectedGranularityLabel.value.toLowerCase()}`
);
const hasAnyAnalyticsFilter = computed(() =>
  filters.analytics.preset !== "30" ||
  filters.analytics.granularity !== "day" ||
  filters.analytics.categoryId !== null ||
  filters.analytics.sortBy !== "revenue"
);
const metricTiles = computed(() => [
  {
    key: "revenue",
    label: "Выручка за период",
    value: formatCurrency(salesTotals.value.revenue),
    hint: `Оплаченные заказы: ${formatNumber(salesTotals.value.orders)}`,
    positive: salesTotals.value.revenue > 0,
    icon: Banknote,
    iconClass: "bg-emerald-100 text-emerald-700"
  },
  {
    key: "profit",
    label: "Валовая прибыль",
    value: formatCurrency(salesTotals.value.grossProfit),
    delta: formatPercent(salesTotals.value.grossMargin),
    hint: "Маржа считается по себестоимости из заказов.",
    positive: salesTotals.value.grossProfit >= 0,
    icon: TrendingUp,
    iconClass: "bg-sky-100 text-sky-700"
  },
  {
    key: "quantity",
    label: "Продано товаров",
    value: formatNumber(salesTotals.value.quantity),
    hint: `Средний чек: ${formatCurrency(salesTotals.value.averageOrderValue)}`,
    positive: true,
    icon: ShoppingCart,
    iconClass: "bg-amber-100 text-amber-700"
  },
  {
    key: "stock",
    label: "Складские риски",
    value: formatNumber(dashboardStats.value.lowStock),
    hint: `${formatNumber(dashboardStats.value.reviewsPending)} отзывов ждут ответа`,
    positive: dashboardStats.value.lowStock === 0,
    icon: PackageX,
    iconClass: dashboardStats.value.lowStock === 0 ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
  }
]);
const productAnalytics = computed(() => data.value?.products.items ?? []);
const topProductBars = computed(() => productAnalytics.value.slice(0, 8).map((product) => ({
  label: product.name,
  value: product.revenue,
  formatted: formatCurrency(product.revenue)
})));
const categoryBars = computed(() => (data.value?.categories.items ?? []).map((category) => ({
  label: category.categoryName,
  value: category.revenue,
  formatted: formatCurrency(category.revenue)
})));
const orderStatusSlices = computed(() => (data.value?.sales.breakdowns.orderStatus ?? []).map((item) => ({
  label: orderStatusLabels[item.status] ?? item.status,
  value: item.orders
})));
const paymentMethodSlices = computed(() => (data.value?.sales.breakdowns.paymentMethod ?? []).map((item) => ({
  label: `${paymentMethodLabels[item.paymentMethod] ?? item.paymentMethod} · ${formatCurrency(item.revenue)}`,
  value: item.orders
})));
const obtainingMethodSlices = computed(() => (data.value?.sales.breakdowns.obtainingMethod ?? []).map((item) => ({
  label: obtainingMethodLabels[item.obtainingMethod] ?? item.obtainingMethod,
  value: item.orders
})));
const lowStockItems = computed(() => data.value?.inventory.lowStockItems ?? []);
const recentOrders = computed(() => data.value?.dashboard.recentOrders ?? []);

function formatDateKey(value: string) {
  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}
</script>

<style scoped>
.analytics-shop-page :deep(.admin-card) {
  border: 0;
  border-radius: 1rem;
  background: #ffffff;
  box-shadow: 0 1px 3px rgb(24 24 27 / 5%);
}

.analytics-shop-page :deep(.admin-section-heading) {
  color: #18181b;
  font-size: 1.25rem;
  font-weight: 600;
  line-height: 1.75rem;
}

.analytics-shop-page :deep(.admin-section-copy) {
  color: #71717a;
  line-height: 1.5rem;
}

.analytics-shop-page :deep(.admin-card table thead) {
  background: #ffffff;
}

.analytics-shop-page :deep(.admin-card table tbody tr:hover) {
  background: #ffffff;
}

.analytics-shop-page :deep(.admin-card svg:not(.admin-line-chart-svg)) {
  max-width: 100%;
}

@media (min-width: 640px) {
  .analytics-shop-page :deep(.admin-card) {
    border-radius: 1.5rem;
  }
}
</style>
