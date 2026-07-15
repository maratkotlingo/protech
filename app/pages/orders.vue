<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="rounded-[2rem] bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8 dark:bg-zinc-950/80 dark:shadow-black/25">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="max-w-3xl">
          <p class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
            <UIcon
              name="i-lucide-package-check"
              class="size-4"
            />
            История
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl dark:text-white">
            Мои заказы
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Статусы, оплата, получение и состав заказов собраны в одном спокойном интерфейсе.
          </p>
        </div>

        <UButton
          color="primary"
          icon="i-lucide-layout-grid"
          to="/"
          size="lg"
          class="rounded-full px-5 transition duration-300 hover:scale-[1.02]"
        >
          В каталог
        </UButton>
      </div>

      <div class="mt-8 grid gap-3 md:grid-cols-4">
        <div
          v-for="metric in orderMetrics"
          :key="metric.label"
          class="rounded-[1.5rem] bg-[#f9fafb] p-4 dark:bg-zinc-900/80"
        >
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ metric.label }}</p>
            <UIcon
              :name="metric.icon"
              class="size-5 text-zinc-400"
            />
          </div>
          <p class="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <div
      v-if="loading"
      class="mt-8 space-y-4"
    >
      <USkeleton
        v-for="item in 3"
        :key="item"
        class="h-56 rounded-[2rem]"
      />
    </div>

    <OrderEmptyState
      v-else-if="!auth.user"
      class="mt-8"
      icon="i-lucide-package-check"
      title="Войдите, чтобы увидеть заказы"
      description="После входа здесь появятся статусы, оплата и состав ваших заказов."
      action-label="Войти"
      action-icon="i-lucide-user-round"
      action-to="/auth?redirect=/orders"
    />

    <OrderEmptyState
      v-else-if="!orders.length"
      class="mt-8"
      icon="i-lucide-shopping-bag"
      title="Заказов пока нет"
      description="Начните с каталога: добавьте товары в корзину и оформите первый заказ."
      action-label="Начать покупки"
      action-icon="i-lucide-layout-grid"
      action-to="/"
    />

    <div
      v-else
      v-auto-animate
      class="mt-8 space-y-4"
    >
      <OrderCard
        v-for="order in orders"
        :key="order.id"
        :order="order"
        @open-details="openOrderDetails"
      />
    </div>

    <OrderDetailsModal
      v-model:open="detailsOpen"
      :order="selectedOrder"
    />
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
const activeOrdersCount = computed(() => orders.value.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.orderStatus)).length);
const completedOrdersCount = computed(() => orders.value.filter((order) => order.orderStatus === "COMPLETED").length);
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
</script>
