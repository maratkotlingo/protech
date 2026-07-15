<template>
  <article class="group rounded-[2rem] bg-white/90 p-4 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10 sm:p-5 dark:bg-zinc-950/80 dark:shadow-black/20 dark:hover:bg-zinc-950">
    <div class="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-2">
          <OrderStatusPill
            type="order"
            :value="order.orderStatus"
          />
          <OrderStatusPill
            v-if="order.payment"
            type="payment"
            :value="order.payment.paymentStatus"
          />
        </div>

        <NuxtLink
          :to="`/orders/${order.id}`"
          class="mt-4 block text-2xl font-semibold tracking-normal text-zinc-950 transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
        >
          Заказ №{{ order.id }}
        </NuxtLink>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {{ formatDateTime(order.createdAt) }}
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-5 lg:justify-end">
        <div class="flex -space-x-3">
          <img
            v-for="item in order.orderItems.slice(0, 4)"
            :key="item.id"
            :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'"
            :alt="item.productName"
            class="size-13 rounded-2xl object-cover ring-4 ring-white dark:ring-zinc-950"
          >
          <span
            v-if="hiddenItemsCount > 0"
            class="grid size-13 place-items-center rounded-2xl bg-[#f3f4f6] text-sm font-semibold text-zinc-500 ring-4 ring-white dark:bg-zinc-900 dark:text-zinc-300 dark:ring-zinc-950"
          >
            +{{ hiddenItemsCount }}
          </span>
        </div>

        <div class="min-w-32 lg:text-right">
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ order.orderItems.length }} позиций</p>
          <p class="mt-1 text-2xl font-semibold text-zinc-950 dark:text-white">
            {{ formatCurrency(order.payment?.amount) }}
          </p>
        </div>

        <UTooltip text="Открыть детали">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-arrow-up-right"
            square
            class="rounded-full bg-[#f3f4f6] transition duration-300 group-hover:scale-105 dark:bg-zinc-900"
            aria-label="Открыть детали заказа"
            @click="emit('openDetails', order)"
          />
        </UTooltip>
      </div>
    </div>

    <div class="mt-5 grid gap-3 sm:grid-cols-3">
      <div
        v-for="metric in metrics"
        :key="metric.label"
        class="rounded-[1.35rem] bg-[#f9fafb] p-4 dark:bg-zinc-900/80"
      >
        <p class="text-xs uppercase tracking-[0.18em] text-zinc-400">{{ metric.label }}</p>
        <p class="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">{{ metric.value }}</p>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { formatCurrency, formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { ShopOrder } from "~~/app/shared/types/shop";

const props = defineProps<{
  order: ShopOrder;
}>();

const emit = defineEmits<{
  openDetails: [order: ShopOrder];
}>();

const hiddenItemsCount = computed(() => Math.max(props.order.orderItems.length - 4, 0));
const metrics = computed(() => [
  {
    label: "Получение",
    value: props.order.obtainingMethod === "DELIVERY" ? "Доставка" : "Самовывоз"
  },
  {
    label: "Оплата",
    value: props.order.paymentMethod === "ONLINE" ? "Онлайн" : "При получении"
  },
  {
    label: "Обновлен",
    value: formatDateTime(props.order.updatedAt)
  }
]);
</script>
