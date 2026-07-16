<template>
  <div class="flex flex-col gap-3 border-t border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/70 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-sm text-[var(--admin-text-muted)]">
      Страница {{ pagination.page }} из {{ Math.max(pagination.pages, 1) }} · всего {{ pagination.total }}
    </p>

    <div class="flex items-center gap-2">
      <UButton
        color="neutral"
        variant="soft"
        icon="i-lucide-arrow-left"
        class="rounded-md bg-white"
        :disabled="pagination.page <= 1 || loading"
        @click="$emit('update:page', pagination.page - 1)"
      >
        Назад
      </UButton>
      <UButton
        color="neutral"
        variant="soft"
        trailing-icon="i-lucide-arrow-right"
        class="rounded-md bg-white"
        :disabled="pagination.page >= pagination.pages || loading || pagination.pages === 0"
        @click="$emit('update:page', pagination.page + 1)"
      >
        Вперёд
      </UButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Pagination } from "~~/app/shared/types/admin";

defineProps<{
  pagination: Pagination;
  loading?: boolean;
}>();

defineEmits<{
  "update:page": [page: number];
}>();
</script>
