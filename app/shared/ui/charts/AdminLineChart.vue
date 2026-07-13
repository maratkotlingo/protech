<template>
  <div class="h-full min-h-[30rem] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <p class="text-xl font-semibold text-[var(--admin-text)]">
          {{ title }}
        </p>
        <p
          v-if="description"
          class="mt-1 text-base leading-6 text-[var(--admin-text-muted)]"
        >
          {{ description }}
        </p>
      </div>
      <div class="flex items-center gap-4 text-sm text-[var(--admin-text-muted)]">
        <span class="inline-flex items-center gap-1.5">
          <span class="size-3 rounded-full bg-[var(--admin-chart-green)]" />
          {{ valueLabel }}
        </span>
        <span
          v-if="secondaryLabel"
          class="inline-flex items-center gap-1.5"
        >
          <span class="size-3 rounded-full bg-[var(--admin-chart-blue)]" />
          {{ secondaryLabel }}
        </span>
      </div>
    </div>

    <svg
      :viewBox="`0 0 ${width} ${height}`"
      class="h-96 w-full overflow-visible"
      role="img"
      :aria-label="title"
    >
      <g class="text-[var(--admin-border)]">
        <line
          v-for="tick in ticks"
          :key="tick"
          :x1="padding"
          :x2="width - padding"
          :y1="tick"
          :y2="tick"
          stroke="currentColor"
          stroke-width="1"
        />
      </g>

      <path
        v-if="areaPath"
        :d="areaPath"
        fill="url(#line-area)"
        opacity="0.26"
      />
      <path
        v-if="linePath"
        :d="linePath"
        fill="none"
        stroke="var(--admin-chart-green)"
        stroke-linecap="round"
        stroke-linejoin="round"
          stroke-width="4"
      />
      <path
        v-if="secondaryPath"
        :d="secondaryPath"
        fill="none"
        stroke="var(--admin-chart-blue)"
        stroke-dasharray="6 6"
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="4"
      />

      <g>
        <circle
          v-for="point in primaryPoints"
          :key="`${point.x}-${point.y}`"
          :cx="point.x"
          :cy="point.y"
          r="4"
          fill="var(--admin-chart-green)"
        />
      </g>

      <g class="text-xs fill-[var(--admin-text-muted)]">
        <text
          v-for="label in visibleLabels"
          :key="label.text"
          :x="label.x"
          :y="height - 8"
          text-anchor="middle"
        >
          {{ label.text }}
        </text>
      </g>

      <defs>
        <linearGradient
          id="line-area"
          x1="0"
          x2="0"
          y1="0"
          y2="1"
        >
          <stop
            offset="0%"
            stop-color="var(--admin-chart-green)"
          />
          <stop
            offset="100%"
            stop-color="var(--admin-chart-green)"
            stop-opacity="0"
          />
        </linearGradient>
      </defs>
    </svg>
  </div>
</template>

<script setup lang="ts">
export type AdminLinePoint = {
  label: string;
  value: number;
  secondary?: number;
};

const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  valueLabel?: string;
  secondaryLabel?: string;
  items: AdminLinePoint[];
}>(), {
  description: undefined,
  secondaryLabel: undefined,
  valueLabel: "Значение"
});

const width = 760;
const height = 280;
const padding = 32;
const chartWidth = width - padding * 2;
const chartHeight = height - padding * 2;

const ticks = computed(() => [padding, padding + chartHeight / 3, padding + chartHeight / 1.5, padding + chartHeight]);

const maxValue = computed(() => Math.max(
  1,
  ...props.items.flatMap((item) => [item.value, item.secondary ?? 0])
));

function createPoints(values: number[]) {
  if (!values.length) {
    return [];
  }

  return values.map((value, index) => {
    const x = padding + (values.length === 1 ? chartWidth / 2 : (chartWidth / (values.length - 1)) * index);
    const y = padding + chartHeight - (value / maxValue.value) * chartHeight;

    return { x, y };
  });
}

function createPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) {
    return "";
  }

  return points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
}

const primaryPoints = computed(() => createPoints(props.items.map((item) => item.value)));
const secondaryPoints = computed(() => createPoints(props.items.map((item) => item.secondary ?? 0)));
const linePath = computed(() => createPath(primaryPoints.value));
const secondaryPath = computed(() => props.items.some((item) => item.secondary !== undefined) ? createPath(secondaryPoints.value) : "");
const areaPath = computed(() => {
  if (!primaryPoints.value.length) {
    return "";
  }

  const first = primaryPoints.value[0]!;
  const last = primaryPoints.value[primaryPoints.value.length - 1]!;

  return `${createPath(primaryPoints.value)} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;
});
const visibleLabels = computed(() => {
  const step = Math.max(1, Math.ceil(props.items.length / 6));

  return props.items
    .map((item, index) => ({
      text: item.label,
      x: primaryPoints.value[index]?.x ?? padding
    }))
    .filter((_, index) => index % step === 0 || index === props.items.length - 1);
});
</script>
