<template>
  <section class="rounded-[2rem] bg-white p-5 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20">
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">{{ title }}</h2>
      <UBadge
        color="primary"
        variant="soft"
        class="rounded-full"
      >
        {{ totalItems }} шт.
      </UBadge>
    </div>

    <div
      v-if="items.length"
      class="mt-5 space-y-4"
    >
      <div
        v-for="item in items"
        :key="item.id"
        class="flex gap-3 rounded-3xl bg-[#f9fafb] p-3 dark:bg-zinc-800/60"
      >
        <img
          :src="item.product.mainImage || '/favicon.ico'"
          :alt="item.product.name"
          class="size-14 rounded-2xl object-cover"
        >
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium text-zinc-950 dark:text-white">
            {{ item.product.name }}
          </p>
          <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
            {{ item.quantity }} × {{ formatCurrency(item.product.currentPrice) }}
          </p>
        </div>
        <p class="text-sm font-semibold text-zinc-950 dark:text-white">
          {{ formatCurrency(toNumber(item.product.currentPrice) * item.quantity) }}
        </p>
      </div>
    </div>

    <div class="mt-6 space-y-3 rounded-3xl bg-[#f9fafb] p-4 text-sm dark:bg-zinc-800/60">
      <div class="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
        <span>Товары</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
      <div class="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
        <span>Доставка</span>
        <span>{{ deliveryLabel }}</span>
      </div>
      <div class="flex justify-between gap-4 pt-2 text-lg font-semibold text-zinc-950 dark:text-white">
        <span>Итого</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
    </div>

    <slot name="actions" />
  </section>
</template>

<script setup lang="ts">
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { CartItem } from "~~/app/shared/types/shop";

const props = withDefaults(defineProps<{
  title?: string;
  items: CartItem[];
  subtotal: number;
  deliveryLabel?: string;
}>(), {
  title: "Ваш заказ",
  deliveryLabel: "по тарифу"
});

const totalItems = computed(() => props.items.reduce((sum, item) => sum + item.quantity, 0));
</script>
