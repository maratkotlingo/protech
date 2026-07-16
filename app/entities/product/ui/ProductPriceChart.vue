<template>
  <section class="rounded-[2rem] bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6">
    <div class="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold tracking-normal text-zinc-950">Динамика цены</h2>
        <p class="mt-1 text-sm text-zinc-500">
          Изменения цены по истории карточки товара
        </p>
      </div>
      <UBadge
        :color="trendMeta.color"
        variant="soft"
        class="rounded-full px-3 py-1.5"
      >
        {{ trendMeta.label }}
      </UBadge>
    </div>

    <div class="mt-6 grid gap-3 sm:grid-cols-4">
      <div class="rounded-[1.5rem] bg-[#f9fafb] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Сейчас</p>
        <p class="mt-2 text-2xl font-semibold text-zinc-950">{{ formatCurrency(currentValue) }}</p>
      </div>
      <div class="rounded-[1.5rem] bg-[#f9fafb] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Минимум</p>
        <p class="mt-2 text-2xl font-semibold text-zinc-950">{{ formatCurrency(minValue) }}</p>
      </div>
      <div class="rounded-[1.5rem] bg-[#f9fafb] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">Максимум</p>
        <p class="mt-2 text-2xl font-semibold text-zinc-950">{{ formatCurrency(maxValue) }}</p>
      </div>
      <div class="rounded-[1.5rem] bg-[#f9fafb] p-4">
        <p class="text-xs font-semibold uppercase tracking-[0.16em] text-zinc-400">За период</p>
        <p
          class="mt-2 text-2xl font-semibold"
          :class="trendMeta.textClass"
        >
          {{ signedCurrency(changeAmount) }}
        </p>
        <p class="mt-1 text-sm text-zinc-500">{{ signedPercent(changePercent) }}</p>
      </div>
    </div>

    <div
      v-if="entries.length > 1"
      class="mt-6 overflow-hidden rounded-[1.75rem] bg-[#f9fafb] p-4"
    >
      <svg
        viewBox="0 0 760 320"
        class="h-80 w-full"
        role="img"
        aria-label="График изменения цены"
      >
        <defs>
          <linearGradient
            id="price-area-gradient"
            x1="0"
            x2="0"
            y1="0"
            y2="1"
          >
            <stop
              offset="0%"
              :stop-color="trendMeta.stroke"
              stop-opacity="0.22"
            />
            <stop
              offset="100%"
              :stop-color="trendMeta.stroke"
              stop-opacity="0"
            />
          </linearGradient>
        </defs>

        <g>
          <line
            v-for="line in gridLines"
            :key="line.key"
            x1="72"
            x2="724"
            :y1="line.y"
            :y2="line.y"
            stroke="#e4e4e7"
            stroke-dasharray="4 8"
          />
          <text
            v-for="line in gridLines"
            :key="`${line.key}-label`"
            x="18"
            :y="line.y + 5"
            fill="#71717a"
            font-size="13"
          >
            {{ compactCurrency(line.value) }}
          </text>
        </g>

        <path
          :d="areaPath"
          fill="url(#price-area-gradient)"
        />
        <polyline
          :points="linePoints"
          fill="none"
          :stroke="trendMeta.stroke"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="5"
        />

        <g
          v-for="point in plottedPoints"
          :key="point.key"
        >
          <circle
            :cx="point.x"
            :cy="point.y"
            r="6"
            fill="white"
            :stroke="trendMeta.stroke"
            stroke-width="4"
          />
          <text
            v-if="point.showValue"
            :x="point.x"
            :y="point.y - 14"
            text-anchor="middle"
            fill="#18181b"
            font-size="13"
            font-weight="600"
          >
            {{ compactCurrency(point.value) }}
          </text>
        </g>

        <g>
          <text
            v-for="label in xAxisLabels"
            :key="label.key"
            :x="label.x"
            y="300"
            text-anchor="middle"
            fill="#71717a"
            font-size="13"
          >
            {{ label.label }}
          </text>
        </g>
      </svg>
    </div>

    <div
      v-else
      class="mt-6 grid min-h-36 place-items-center rounded-[1.75rem] bg-[#f9fafb] px-6 text-center text-sm text-zinc-500"
    >
      Пока есть только текущая цена. График появится после следующего изменения.
    </div>
  </section>
</template>

<script setup lang="ts">
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { MoneyLike } from "~~/app/shared/types/shop";

type TrendColor = "neutral" | "success" | "error";

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
const values = computed(() => entries.value.map((entry) => entry.numericValue));
const firstValue = computed(() => values.value[0] ?? 0);
const currentValue = computed(() => values.value.at(-1) ?? 0);
const minValue = computed(() => values.value.length ? Math.min(...values.value) : 0);
const maxValue = computed(() => values.value.length ? Math.max(...values.value) : 0);
const changeAmount = computed(() => currentValue.value - firstValue.value);
const changePercent = computed(() => firstValue.value > 0 ? (changeAmount.value / firstValue.value) * 100 : 0);
const trendMeta = computed<{
  color: TrendColor;
  label: string;
  stroke: string;
  textClass: string;
}>(() => {
  if (changeAmount.value > 0) {
    return {
      color: "error",
      label: "Цена выросла",
      stroke: "#ef4444",
      textClass: "text-red-600"
    };
  }

  if (changeAmount.value < 0) {
    return {
      color: "success",
      label: "Цена снизилась",
      stroke: "#10b981",
      textClass: "text-emerald-600"
    };
  }

  return {
    color: "neutral",
    label: "Без изменений",
    stroke: "#71717a",
    textClass: "text-zinc-950"
  };
});

const chartBounds = {
  bottom: 260,
  height: 210,
  left: 72,
  top: 36,
  width: 652
};
const plottedPoints = computed(() => {
  const range = Math.max(maxValue.value - minValue.value, 1);
  const lastIndex = Math.max(entries.value.length - 1, 1);

  return entries.value.map((entry, index) => ({
    key: `${entry.id}-${entry.createdAt}`,
    showValue: index === 0 || index === entries.value.length - 1 || entry.numericValue === minValue.value || entry.numericValue === maxValue.value,
    value: entry.numericValue,
    x: chartBounds.left + (index / lastIndex) * chartBounds.width,
    y: chartBounds.top + chartBounds.height - ((entry.numericValue - minValue.value) / range) * chartBounds.height,
    createdAt: entry.createdAt
  }));
});
const linePoints = computed(() => plottedPoints.value.map((point) => `${point.x},${point.y}`).join(" "));
const areaPath = computed(() => {
  if (!plottedPoints.value.length) {
    return "";
  }

  const first = plottedPoints.value[0]!;
  const last = plottedPoints.value[plottedPoints.value.length - 1]!;
  const line = plottedPoints.value.map((point) => `${point.x},${point.y}`).join(" L ");

  return `M ${first.x},${chartBounds.bottom} L ${line} L ${last.x},${chartBounds.bottom} Z`;
});
const gridLines = computed(() => {
  const steps = 4;
  const range = Math.max(maxValue.value - minValue.value, 1);

  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps;
    const value = maxValue.value - range * ratio;

    return {
      key: `grid-${index}`,
      value,
      y: chartBounds.top + chartBounds.height * ratio
    };
  });
});
const xAxisLabels = computed(() => {
  if (!plottedPoints.value.length) {
    return [];
  }

  const indexes = [...new Set([
    0,
    Math.floor((plottedPoints.value.length - 1) / 2),
    plottedPoints.value.length - 1
  ])];

  return indexes.map((index) => {
    const point = plottedPoints.value[index]!;

    return {
      key: `x-${index}`,
      label: shortDate(point.createdAt),
      x: point.x
    };
  });
});

function compactCurrency(value: number) {
  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: 0,
    notation: value >= 100000 ? "compact" : "standard",
    style: "currency",
    currency: "RUB"
  }).format(value);
}

function signedCurrency(value: number) {
  if (value === 0) {
    return "0 ₽";
  }

  return `${value > 0 ? "+" : "−"}${formatCurrency(Math.abs(value))}`;
}

function signedPercent(value: number) {
  if (Math.abs(value) < 0.05) {
    return "0%";
  }

  return `${value > 0 ? "+" : "−"}${Math.abs(value).toFixed(1)}%`;
}

function shortDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "short"
  }).format(date);
}
</script>
