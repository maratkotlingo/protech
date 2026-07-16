<template>
  <section class="admin-page-header">
    <div class="max-w-5xl">
      <p
        v-if="kicker"
        class="text-xs font-semibold uppercase text-[var(--admin-accent-strong)]"
      >
        {{ kicker }}
      </p>
      <div>
        <h1 class="mt-1 text-2xl font-semibold tracking-normal text-[var(--admin-text)] sm:text-3xl">
          {{ title }}
        </h1>
        <p
          v-if="description"
          class="mt-2 max-w-4xl text-sm leading-6 text-[var(--admin-text-muted)]"
        >
          {{ description }}
        </p>
      </div>
    </div>

    <div
      v-if="$slots.actions"
      class="flex flex-wrap items-center gap-2"
    >
      <slot name="actions" />
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
  kicker?: string;
}>();
</script>
