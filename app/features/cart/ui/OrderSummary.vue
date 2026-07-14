<template>
  <UCard
    class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
    :ui="{ body: 'p-5 sm:p-6' }"
  >
    <div class="flex items-center justify-between gap-3">
      <h2 class="text-xl font-semibold text-[var(--shop-text)]">{{ title }}</h2>
      <UBadge
        color="primary"
        variant="soft"
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
        class="flex gap-3"
      >
        <img
          :src="item.product.mainImage"
          :alt="item.product.name"
          class="size-14 rounded-lg object-cover"
        >
        <div class="min-w-0 flex-1">
          <p class="line-clamp-2 text-sm font-medium text-[var(--shop-text)]">
            {{ item.product.name }}
          </p>
          <p class="mt-1 text-xs text-[var(--shop-text-muted)]">
            {{ item.quantity }} × {{ formatCurrency(item.product.currentPrice) }}
          </p>
        </div>
        <p class="text-sm font-semibold text-[var(--shop-text)]">
          {{ formatCurrency(toNumber(item.product.currentPrice) * item.quantity) }}
        </p>
      </div>
    </div>

    <div class="mt-6 space-y-3 border-t border-[var(--shop-border)] pt-5 text-sm">
      <div class="flex justify-between gap-4 text-[var(--shop-text-muted)]">
        <span>Товары</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
      <div class="flex justify-between gap-4 text-[var(--shop-text-muted)]">
        <span>Доставка</span>
        <span>{{ deliveryLabel }}</span>
      </div>
      <div class="flex justify-between gap-4 text-lg font-semibold text-[var(--shop-text)]">
        <span>Итого</span>
        <span>{{ formatCurrency(subtotal) }}</span>
      </div>
    </div>

    <slot name="actions" />
  </UCard>
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
