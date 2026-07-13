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

    <div class="space-y-5">
      <div
        v-for="item in normalizedItems"
        :key="item.label"
        class="grid grid-cols-[minmax(140px,240px)_1fr_auto] items-center gap-5"
      >
        <p class="truncate text-base text-[var(--admin-text)]">
          {{ item.label }}
        </p>
        <div class="h-4 overflow-hidden rounded-full bg-[var(--admin-surface-muted)]">
          <div
            class="h-full rounded-full bg-[var(--admin-accent)]"
            :style="{ width: `${item.percent}%` }"
          />
        </div>
        <p class="text-base font-medium text-[var(--admin-text)]">
          {{ item.formatted }}
        </p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatNumber } from "~~/app/shared/lib/adminFormatters";

const props = defineProps<{
  title: string;
  description?: string;
  items: Array<{
    label: string;
    value: number;
    formatted?: string;
  }>;
}>();

const normalizedItems = computed(() => {
  const max = Math.max(1, ...props.items.map((item) => item.value));

  return props.items.map((item) => ({
    ...item,
    percent: Math.max(3, (item.value / max) * 100),
    formatted: item.formatted ?? formatNumber(item.value)
  }));
});
</script>
