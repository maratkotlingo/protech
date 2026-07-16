<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="rounded-4xl bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8  ">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="max-w-3xl">
          <p
            class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700  ">
            <UIcon name="i-lucide-package-check" class="size-4" />
            История
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl ">
            Мои заказы
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-500 ">
            Статусы, оплата, получение и состав заказов собраны в одном спокойном интерфейсе.
          </p>
        </div>

        <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
          class="rounded-full px-5 transition duration-300 hover:scale-[1.02]">
          В каталог
        </UButton>
      </div>

      <div class="mt-8 grid gap-3 md:grid-cols-4">
        <div v-for="metric in orderMetrics" :key="metric.label" class="rounded-[1.5rem] bg-[#f9fafb] p-4 ">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-zinc-500">{{ metric.label }}</p>
            <UIcon :name="metric.icon" class="size-5 text-zinc-400" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-zinc-950">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-8 space-y-4">
      <USkeleton v-for="item in 3" :key="item" class="h-56 rounded-4xl" />
    </div>

    <OrderEmptyState v-else-if="!auth.user" class="mt-8" icon="i-lucide-package-check"
      title="Войдите, чтобы увидеть заказы"
      description="После входа здесь появятся статусы, оплата и состав ваших заказов." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/orders" />

    <OrderEmptyState v-else-if="!orders.length" class="mt-8" icon="i-lucide-shopping-bag" title="Заказов пока нет"
      description="Начните с каталога: добавьте товары в корзину и оформите первый заказ." action-label="Начать покупки"
      action-icon="i-lucide-layout-grid" action-to="/" />

    <div v-else class="mt-8 space-y-4">
      <div
        v-if="historicalOrdersCount"
        class="flex flex-col gap-3 rounded-[1.5rem] bg-white/85 p-4 shadow-sm shadow-zinc-950/5 sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <p class="font-semibold text-zinc-950">
            Текущие заказы
          </p>
          <p class="mt-1 text-sm leading-6 text-zinc-500">
            {{ showAllOrders ? "Показываем активные и завершенные заказы." : "Завершенные и отмененные заказы скрыты." }}
          </p>
        </div>
        <UButton
          color="neutral"
          variant="soft"
          :icon="showAllOrders ? 'i-lucide-eye-off' : 'i-lucide-list'"
          class="rounded-full"
          @click="toggleShowAllOrders"
        >
          {{ showAllOrders ? "Скрыть завершенные" : "Показать все заказы" }}
        </UButton>
      </div>

      <OrderEmptyState
        v-if="!visibleOrders.length"
        class="mt-4"
        icon="i-lucide-circle-check"
        title="Текущих заказов нет"
        description="Все ваши заказы сейчас завершены или отменены. Нажмите «Показать все заказы», чтобы открыть историю."
      />

      <div
        v-else
        v-auto-animate
        class="space-y-4"
      >
        <OrderCard
          v-for="order in visibleOrders"
          :key="order.id"
          :order="order"
          :class="getOrderCardClass(order)"
          @open-details="openOrderDetails"
        />
      </div>
    </div>

    <OrderDetailsModal v-model:open="detailsOpen" :order="selectedOrder" />
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

useSeoMeta({
  title: "Мои заказы",
  description: "История заказов покупателя ProTech."
});

const auth = useAuthStore();
const orders = ref<ShopOrder[]>([]);
const loading = ref(true);
const selectedOrder = ref<ShopOrder | null>(null);
const detailsOpen = ref(false);
const showAllOrders = ref(false);
const terminalOrderStatuses = new Set<ShopOrder["orderStatus"]>(["COMPLETED", "CANCELLED"]);
const orderMetrics = computed(() => [
  {
    icon: "i-lucide-package-check",
    label: "Всего",
    value: `${orders.value.length}`
  },
  {
    icon: "i-lucide-loader-circle",
    label: "В работе",
    value: `${activeOrdersCount.value}`
  },
  {
    icon: "i-lucide-circle-check",
    label: "Завершено",
    value: `${completedOrdersCount.value}`
  },
  {
    icon: "i-lucide-badge-russian-ruble",
    label: "Сумма",
    value: formatCurrency(ordersTotal.value)
  }
]);
const activeOrders = computed(() => orders.value.filter(isActiveOrder));
const historicalOrders = computed(() => orders.value.filter((order) => !isActiveOrder(order)));
const visibleOrders = computed(() => showAllOrders.value ? orders.value : activeOrders.value);
const activeOrdersCount = computed(() => activeOrders.value.length);
const completedOrdersCount = computed(() => orders.value.filter((order) => order.orderStatus === "COMPLETED").length);
const historicalOrdersCount = computed(() => historicalOrders.value.length);
const ordersTotal = computed(() => orders.value.reduce((sum, order) => sum + Number(order.payment?.amount ?? 0), 0));

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    loading.value = false;
    return;
  }

  try {
    orders.value = await shopFetch<ShopOrder[]>("/api/public/orders");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить заказы"));
  } finally {
    loading.value = false;
  }
});

function openOrderDetails(order: ShopOrder) {
  selectedOrder.value = order;
  detailsOpen.value = true;
}

function toggleShowAllOrders() {
  showAllOrders.value = !showAllOrders.value;
}

function isActiveOrder(order: ShopOrder) {
  return !terminalOrderStatuses.has(order.orderStatus);
}

function getOrderCardClass(order: ShopOrder) {
  return isActiveOrder(order)
    ? "!bg-emerald-50/80 ring-1 ring-emerald-200 shadow-lg shadow-emerald-950/10"
    : "!bg-white/70 opacity-70 grayscale-[0.15]";
}
</script>
