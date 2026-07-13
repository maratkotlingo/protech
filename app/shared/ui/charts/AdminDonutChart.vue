<template>
  <div class="min-h-[24rem] rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-6">
    <div class="mb-6">
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

    <div class="grid gap-7 sm:grid-cols-[240px_1fr] sm:items-center">
      <svg
        viewBox="0 0 180 180"
        class="mx-auto size-60"
        role="img"
        :aria-label="title"
      >
        <circle
          cx="90"
          cy="90"
          r="62"
          fill="none"
          stroke="var(--admin-surface-muted)"
          stroke-width="22"
        />
        <circle
          v-for="slice in slices"
          :key="slice.label"
          cx="90"
          cy="90"
          r="62"
          fill="none"
          stroke-linecap="round"
          stroke-width="22"
          :stroke="slice.color"
          :stroke-dasharray="`${slice.length} ${circumference - slice.length}`"
          :stroke-dashoffset="-slice.offset"
          transform="rotate(-90 90 90)"
        />
        <text
          x="90"
          y="84"
          text-anchor="middle"
          class="fill-[var(--admin-text)] text-2xl font-semibold"
        >
          {{ total }}
        </text>
        <text
          x="90"
          y="106"
          text-anchor="middle"
          class="fill-[var(--admin-text-muted)] text-sm"
        >
          {{ centerLabel }}
        </text>
      </svg>

      <div class="space-y-4">
        <div
          v-for="slice in slices"
          :key="slice.label"
          class="flex items-center justify-between gap-4"
        >
          <div class="flex min-w-0 items-center gap-2">
            <span
              class="size-3.5 shrink-0 rounded-full"
              :style="{ backgroundColor: slice.color }"
            />
            <p class="truncate text-base text-[var(--admin-text)]">
              {{ slice.label }}
            </p>
          </div>
          <p class="whitespace-nowrap text-base font-medium text-[var(--admin-text)]">
            {{ slice.value }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  title: string;
  description?: string;
  centerLabel?: string;
  items: Array<{
    label: string;
    value: number;
    color?: string;
  }>;
}>(), {
  description: undefined,
  centerLabel: "всего"
});

const palette = [
  "var(--admin-chart-green)",
  "var(--admin-chart-blue)",
  "var(--admin-chart-amber)",
  "var(--admin-chart-red)",
  "var(--admin-chart-violet)"
];
const circumference = 2 * Math.PI * 62;
const total = computed(() => props.items.reduce((sum, item) => sum + item.value, 0));
const slices = computed(() => {
  let offset = 0;
  const safeTotal = Math.max(1, total.value);

  return props.items.map((item, index) => {
    const length = (item.value / safeTotal) * circumference;
    const slice = {
      ...item,
      color: item.color ?? palette[index % palette.length],
      length,
      offset
    };

    offset += length;
    return slice;
  });
});
</script>
