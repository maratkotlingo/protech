<template>
  <div class="flex flex-col gap-4 border-t border-[var(--admin-border)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
    <p class="text-base text-[var(--admin-text-muted)]">
      Страница {{ pagination.page }} из {{ Math.max(pagination.pages, 1) }} · всего {{ pagination.total }}
    </p>

    <div class="flex items-center gap-3">
      <UButton
        color="neutral"
        variant="outline"
        :disabled="pagination.page <= 1 || loading"
        @click="$emit('update:page', pagination.page - 1)"
      >
        Назад
      </UButton>
      <UButton
        color="neutral"
        variant="outline"
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
