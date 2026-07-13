<template>
  <UCard
    class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
    :ui="{ body: 'p-7 sm:p-8' }"
  >
    <div class="flex min-h-40 items-start justify-between gap-6">
      <div class="min-w-0">
        <p class="text-base font-medium text-[var(--admin-text-muted)]">
          {{ label }}
        </p>
        <div class="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-2">
          <p class="text-4xl font-semibold text-[var(--admin-text)]">
            {{ value }}
          </p>
          <span
            v-if="delta"
            :class="[
              'rounded-full px-3 py-1 text-sm font-medium',
              positive ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
            ]"
          >
            {{ delta }}
          </span>
        </div>
        <p
          v-if="hint"
          class="mt-5 text-sm leading-6 text-[var(--admin-text-muted)]"
        >
          {{ hint }}
        </p>
      </div>

      <div class="grid size-16 shrink-0 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
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
