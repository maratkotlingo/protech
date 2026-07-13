<template>
  <div class="flex flex-col gap-6 border-b border-[var(--admin-border)] pb-6 lg:flex-row lg:items-end lg:justify-between 2xl:pb-8">
    <div class="space-y-3">
      <p
        v-if="kicker"
        class="text-sm font-semibold uppercase text-[var(--admin-accent)]"
      >
        {{ kicker }}
      </p>
      <div>
        <h1 class="text-4xl font-semibold text-[var(--admin-text)] sm:text-5xl">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-4 max-w-5xl text-lg leading-8 text-[var(--admin-text-muted)]"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap items-center gap-3"
    >
      <slot name="actions" />
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  kicker?: string;
}>();
</script>
