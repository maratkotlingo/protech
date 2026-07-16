<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Аналитика и статистика"
      kicker="Admin overview"
      description="Финансы, продажи, маржинальность, популярные товары, структура заказов и складские сигналы в одном рабочем экране."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-4" />
          Обновить
        </UButton>
        <UButton
          color="primary"
          variant="solid"
          @click="filters.resetAnalyticsFilters()"
        >
          <RotateCcw class="size-4" />
          Сбросить
        </UButton>
      </template>
    </AdminPageHeader>

    <UCard
      class="admin-filter-card"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div class="grid gap-6 2xl:grid-cols-[minmax(300px,420px)_1fr] 2xl:items-end">
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="period in periodOptions"
            :key="period.value"
            :color="filters.analytics.preset === period.value ? 'primary' : 'neutral'"
            :variant="filters.analytics.preset === period.value ? 'solid' : 'outline'"
            @click="filters.setAnalyticsPreset(period.value)"
          >
            {{ period.label }}
          </UButton>
        </div>

        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
          <UFormField label="С даты">
            <UInput
              v-model="filters.analytics.startDate"
              class="w-full"
              size="lg"
              type="date"
              @update:model-value="filters.analytics.preset = 'custom'"
            />
          </UFormField>
          <UFormField label="По дату">
            <UInput
              v-model="filters.analytics.endDate"
              class="w-full"
              size="lg"
              type="date"
              @update:model-value="filters.analytics.preset = 'custom'"
            />
          </UFormField>
          <UFormField label="Шаг">
            <USelect
              v-model="filters.analytics.granularity"
              class="w-full"
              size="lg"
              :items="granularityItems"
            />
          </UFormField>
          <UFormField label="Товар">
            <USelect
              v-model="filters.analytics.productId"
              class="w-full"
              size="lg"
              :items="productItems"
              placeholder="Все товары"
            />
          </UFormField>
          <UFormField label="Категория">
            <USelect
              v-model="filters.analytics.categoryId"
              class="w-full"
              size="lg"
              :items="categoryItems"
              placeholder="Все категории"
            />
          </UFormField>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить аналитику"
      :description="getErrorMessage(error, 'Проверьте соединение и права доступа администратора.')"
    />

    <div class="grid gap-6 sm:grid-cols-2 2xl:grid-cols-4">
      <AdminMetricCard
        label="Выручка за период"
        :value="formatCurrency(salesTotals.revenue)"
        :hint="`Оплаченные заказы: ${formatNumber(salesTotals.orders)}`"
        :positive="salesTotals.revenue > 0"
      >
        <template #icon>
          <Banknote class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Валовая прибыль"
        :value="formatCurrency(salesTotals.grossProfit)"
        :delta="formatPercent(salesTotals.grossMargin)"
        :positive="salesTotals.grossProfit >= 0"
        hint="Маржа считается по себестоимости из order items."
      >
        <template #icon>
          <TrendingUp class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Продано товаров"
        :value="formatNumber(salesTotals.quantity)"
        :hint="`Средний чек: ${formatCurrency(salesTotals.averageOrderValue)}`"
        positive
      >
        <template #icon>
          <ShoppingCart class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Складские риски"
        :value="formatNumber(dashboardStats.lowStock)"
        :hint="`${formatNumber(dashboardStats.reviewsPending + dashboardStats.faqPending)} обращений ждут ответа`"
        :positive="dashboardStats.lowStock === 0"
      >
        <template #icon>
          <PackageX class="size-7" />
        </template>
      </AdminMetricCard>
    </div>

    <div class="grid gap-6 2xl:grid-cols-[1.65fr_0.9fr]">
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

    <div class="grid gap-6 xl:grid-cols-2">
      <AdminBarChart
        title="Топ товаров по выручке"
        description="Сортировка управляется фильтром ниже"
        :items="topProductBars"
      />

      <UCard
        class="admin-card"
        :ui="{ body: 'p-6' }"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xl font-semibold text-[var(--admin-text)]">
              Детализация товаров
            </p>
            <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
              Маржа, средняя цена и текущий остаток.
            </p>
          </div>
          <USelect
            v-model="filters.analytics.sortBy"
            :items="sortItems"
            class="w-full sm:w-64"
            size="lg"
          />
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-[var(--admin-border)] text-sm">
            <thead>
              <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
                <th class="px-3 py-3 font-medium">Товар</th>
                <th class="px-3 py-3 font-medium">Продано</th>
                <th class="px-3 py-3 font-medium">Выручка</th>
                <th class="px-3 py-3 font-medium">Маржа</th>
                <th class="px-3 py-3 font-medium">Остаток</th>
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
                      class="size-14 rounded-md object-cover"
                    >
                    <div
                      v-else
                      class="grid size-14 place-items-center rounded-md bg-[#f9fafb]"
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
                <td class="px-3 py-3">
                  <AdminStatusBadge
                    type="stock"
                    :value="product.currentStock"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </UCard>
    </div>

    <div class="grid gap-6 2xl:grid-cols-[0.95fr_0.95fr_1.2fr]">
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

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard
        class="admin-card"
        :ui="{ body: 'p-6' }"
      >
        <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p class="text-xl font-semibold text-[var(--admin-text)]">
              Низкие остатки
            </p>
            <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
              Товары с количеством 5 или меньше.
            </p>
          </div>
          <UButton
            to="/admin/stock"
            color="neutral"
            variant="outline"
          >
            К остаткам
          </UButton>
        </div>

        <div class="space-y-3">
          <div
            v-for="item in lowStockItems"
            :key="item.productId"
            class="flex items-center justify-between gap-4 rounded-md bg-[#f9fafb] p-4"
          >
            <div class="flex min-w-0 items-center gap-4">
              <img
                :src="item.mainImage"
                alt=""
                class="size-14 rounded-md object-cover"
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
        :ui="{ body: 'p-6' }"
      >
        <div class="mb-6">
          <p class="text-xl font-semibold text-[var(--admin-text)]">
            Последние заказы
          </p>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Быстрый контекст для операционного контроля.
          </p>
        </div>

        <div class="space-y-3">
          <div
            v-for="order in recentOrders"
            :key="order.id"
            class="grid gap-4 rounded-md bg-[#f9fafb] p-4 sm:grid-cols-[1fr_auto] sm:items-center"
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
  RefreshCw,
  RotateCcw,
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

const analyticsQuery = computed(() => buildQuery({
  startDate: filters.analytics.startDate,
  endDate: filters.analytics.endDate,
  granularity: filters.analytics.granularity,
  productId: filters.analytics.productId,
  categoryId: filters.analytics.categoryId,
  sortBy: filters.analytics.sortBy,
  limit: filters.analytics.limit
}));

const dashboardQuery = computed(() => buildQuery({
  period: filters.analytics.preset,
  startDate: filters.analytics.startDate,
  endDate: filters.analytics.endDate,
  productId: filters.analytics.productId,
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
const productItems = computed(() => [
  { label: "Все товары", value: null },
  ...(data.value?.sales.productOptions ?? []).map((product) => ({
    label: `${product.name} · ${product.article}`,
    value: product.id
  }))
]);
const categoryItems = computed(() => [
  { label: "Все категории", value: null },
  ...(data.value?.sales.categoryOptions ?? []).map((category) => ({
    label: category.name,
    value: category.id
  }))
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
</script>
