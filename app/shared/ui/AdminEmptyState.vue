<template>
  <div class="grid min-h-64 place-items-center rounded-lg border border-dashed border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/70 p-6 text-center sm:p-8">
    <div class="max-w-lg">
      <div class="admin-icon-tile-soft mx-auto size-12">
        <slot name="icon" />
      </div>
      <h3 class="mt-4 text-lg font-semibold text-[var(--admin-text)]">
        {{ title }}
      </h3>
      <p
        v-if="description"
        class="mt-2 text-sm leading-6 text-[var(--admin-text-muted)]"
      >
        {{ description }}
      </p>
      <div
        v-if="$slots.actions"
        class="mt-5 flex justify-center gap-3"
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
