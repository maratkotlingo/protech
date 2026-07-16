<template>
  <div class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-10 text-center">
    <div class="max-w-lg">
      <div class="mx-auto grid size-16 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
        <slot name="icon" />
      </div>
      <h3 class="mt-6 text-2xl font-semibold text-[var(--admin-text)]">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="mt-3 text-base leading-7 text-[var(--admin-text-muted)]"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.actions"
        class="mt-7 flex justify-center gap-3"
      >
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  description?: string;
}>();
</script>