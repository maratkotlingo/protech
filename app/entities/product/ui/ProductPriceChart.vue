<template>
  <div class="rounded-lg border border-[var(--shop-border)] bg-[var(--shop-surface)] p-5">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-xl font-semibold text-[var(--shop-text)]">Динамика цены</h2>
        <p class="mt-1 text-sm text-[var(--shop-text-muted)]">
          История изменений по данным карточки товара
        </p>
      </div>
      <UBadge
        color="primary"
        variant="soft"
      >
        {{ entries.length }} точек
      </UBadge>
    </div>

    <div
      v-if="entries.length > 1"
      class="mt-6 overflow-hidden rounded-lg bg-[var(--shop-surface-muted)] p-4"
    >
      <svg
        viewBox="0 0 640 220"
        class="h-64 w-full"
        role="img"
        aria-label="График изменения цены"
      >
        <line
          x1="36"
          y1="182"
          x2="612"
          y2="182"
          stroke="var(--shop-border)"
        />
        <line
          x1="36"
          y1="26"
          x2="36"
          y2="182"
          stroke="var(--shop-border)"
        />
        <polyline
          :points="points"
          fill="none"
          stroke="var(--shop-accent)"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="4"
        />
        <circle
          v-for="point in plottedPoints"
          :key="point.key"
          :cx="point.x"
          :cy="point.y"
          r="5"
          fill="var(--shop-surface)"
          stroke="var(--shop-accent)"
          stroke-width="3"
        />
        <text
          x="40"
          y="24"
          fill="var(--shop-text-muted)"
          font-size="13"
        >
          {{ formatCurrency(maxValue) }}
        </text>
        <text
          x="40"
          y="206"
          fill="var(--shop-text-muted)"
          font-size="13"
        >
          {{ formatCurrency(minValue) }}
        </text>
      </svg>

      <div class="mt-4 flex flex-wrap justify-between gap-3 text-sm text-[var(--shop-text-muted)]">
        <span>{{ formatDate(entries[0]?.createdAt) }}</span>
        <span>{{ formatDate(entries[entries.length - 1]?.createdAt) }}</span>
      </div>
    </div>

    <div
      v-else
      class="mt-6 grid min-h-40 place-items-center rounded-lg bg-[var(--shop-surface-muted)] px-6 text-center text-sm text-[var(--shop-text-muted)]"
    >
      Пока недостаточно изменений цены для графика.
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { MoneyLike } from "~~/app/shared/types/shop";

const props = defineProps<{
  prices: Array<{
    id: number;
    value: MoneyLike;
    createdAt: string;
  }>;
}>();

const entries = computed(() =>
  [...props.prices]
    .map((price) => ({
      ...price,
      numericValue: toNumber(price.value)
    }))
    .filter((price) => Number.isFinite(price.numericValue) && price.numericValue > 0)
    .sort((first, second) => new Date(first.createdAt).getTime() - new Date(second.createdAt).getTime())
);

const minValue = computed(() => Math.min(...entries.value.map((entry) => entry.numericValue)));
const maxValue = computed(() => Math.max(...entries.value.map((entry) => entry.numericValue)));
const plottedPoints = computed(() => {
  const width = 576;
  const left = 36;
  const top = 26;
  const height = 156;
  const range = Math.max(maxValue.value - minValue.value, 1);
  const lastIndex = Math.max(entries.value.length - 1, 1);

  return entries.value.map((entry, index) => ({
    key: `${entry.id}-${entry.createdAt}`,
    x: left + (index / lastIndex) * width,
    y: top + height - ((entry.numericValue - minValue.value) / range) * height
  }));
});
const points = computed(() => plottedPoints.value.map((point) => `${point.x},${point.y}`).join(" "));
</script>
