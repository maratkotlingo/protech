<template>
  <UCard
    class="admin-card border-l-4 border-l-[var(--admin-accent)]"
    :ui="{ body: 'p-4 sm:p-5' }"
  >
    <div class="flex min-h-30 items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="text-sm font-medium text-[var(--admin-text-muted)]">
          {{ label }}
        </p>
        <div class="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-2">
          <p class="text-2xl font-semibold text-[var(--admin-text)] sm:text-3xl">
            {{ value }}
          </p>
          <span
            v-if="delta"
            :class="[
              'rounded-md px-2 py-1 text-xs font-semibold',
              positive ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
            ]"
          >
            {{ delta }}
          </span>
        </div>
        <p
          v-if="hint"
          class="mt-3 text-xs leading-5 text-[var(--admin-text-muted)]"
        >
          {{ hint }}
        </p>
      </div>

      <div class="admin-icon-tile-soft size-11 shrink-0 sm:size-12">
        <slot name="icon" />
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
defineProps<{
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  positive?: boolean;
}>();
</script>
