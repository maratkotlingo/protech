<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Аудит"
      kicker="Security"
      description="Журнал входов, изменений контента, массовых операций и складских корректировок."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-4" />
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <UCard
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="grid gap-4 lg:grid-cols-[1fr_280px_260px]">
        <UFormField label="Поиск">
          <UInput
            v-model="search"
            class="w-full"
            size="lg"
            placeholder="Действие, сущность, email"
          >
            <template #leading>
              <Search class="size-4 text-[var(--admin-text-muted)]" />
            </template>
          </UInput>
        </UFormField>
        <UFormField label="Действие">
          <USelect
            v-model="action"
            class="w-full"
            size="lg"
            :items="actionItems"
          />
        </UFormField>
        <UFormField label="Сущность">
          <USelect
            v-model="entityType"
            class="w-full"
            size="lg"
            :items="entityTypeItems"
          />
        </UFormField>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить аудит"
      :description="getErrorMessage(error)"
    />

    <UCard
      class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-0' }"
    >
      <div class="overflow-x-auto">
        <table class="w-full min-w-[920px] divide-y divide-[var(--admin-border)] text-sm">
          <thead class="bg-[var(--admin-surface-muted)]">
            <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
              <th class="px-4 py-3 font-medium">Время</th>
              <th class="px-4 py-3 font-medium">Админ</th>
              <th class="px-4 py-3 font-medium">Действие</th>
              <th class="px-4 py-3 font-medium">Сущность</th>
              <th class="px-4 py-3 font-medium">Описание</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--admin-border)]">
            <tr
              v-for="log in logs"
              :key="log.id"
              class="align-top transition hover:bg-[var(--admin-surface-muted)]"
            >
              <td class="whitespace-nowrap px-4 py-4 text-[var(--admin-text-muted)]">
                {{ formatDate(log.createdAt) }}
              </td>
              <td class="px-4 py-4">
                <p class="font-medium text-[var(--admin-text)]">
                  {{ log.admin?.name || log.admin?.email || "System" }}
                </p>
                <p class="text-xs text-[var(--admin-text-muted)]">
                  {{ log.admin?.email || log.adminId || "—" }}
                </p>
              </td>
              <td class="px-4 py-4">
                <UBadge
                  :color="actionColor(log.action)"
                  variant="soft"
                >
                  {{ actionLabels[log.action] ?? log.action }}
                </UBadge>
              </td>
              <td class="px-4 py-4">
                <p class="font-medium text-[var(--admin-text)]">
                  {{ log.entityType }}
                </p>
                <p class="text-xs text-[var(--admin-text-muted)]">
                  {{ log.entityId || "—" }}
                </p>
              </td>
              <td class="px-4 py-4">
                <p class="text-[var(--admin-text)]">
                  {{ log.summary }}
                </p>
                <pre
                  v-if="log.metadata"
                  class="mt-3 max-w-4xl overflow-x-auto rounded-lg bg-[var(--admin-surface-muted)] p-4 text-sm text-[var(--admin-text-muted)]"
                >{{ formatMetadata(log.metadata) }}</pre>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminEmptyState
        v-if="!logs.length && !pending"
        title="Журнал пуст"
        description="Здесь появятся действия администраторов."
      >
        <template #icon>
          <ScrollText class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination
        v-if="auditData?.pagination"
        :pagination="auditData.pagination"
        :loading="pending"
        @update:page="page = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, ScrollText, Search } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { buildQuery, formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import type { AuditAction, AuditLogItem, PaginatedResponse } from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

type AuditResponse = PaginatedResponse<AuditLogItem> & {
  filters: {
    actions: AuditAction[];
    entityTypes: string[];
  };
};

const actionLabels: Record<AuditAction, string> = {
  CREATE: "Создание",
  UPDATE: "Изменение",
  DELETE: "Удаление",
  BULK_UPDATE: "Массовое изменение",
  BULK_DELETE: "Массовое удаление",
  STOCK_ADJUSTMENT: "Склад",
  ANSWER: "Ответ",
  ORDER_STATUS: "Заказ",
  PAYMENT_STATUS: "Оплата",
  LOGIN: "Вход",
  LOGOUT: "Выход"
};

const page = ref(1);
const search = ref("");
const debouncedSearch = ref("");
const action = ref<AuditAction | "all">("all");
const entityType = ref<string | null>(null);

watchDebounced(search, (value) => {
  debouncedSearch.value = value;
  page.value = 1;
}, { debounce: 350, maxWait: 1000 });

watch([action, entityType], () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  action: action.value === "all" ? null : action.value,
  entityType: entityType.value
}));

const { data: auditData, pending, error, refresh } = await useAsyncData(
  "admin-audit-list",
  () => $fetch<AuditResponse>(`/api/admin/audit${query.value}`),
  { watch: [query] }
);

const logs = computed(() => auditData.value?.items ?? []);
const actionItems = computed(() => [
  { label: "Все", value: "all" },
  ...((auditData.value?.filters.actions ?? []) as AuditAction[]).map((item) => ({
    label: actionLabels[item] ?? item,
    value: item
  }))
]);
const entityTypeItems = computed(() => [
  { label: "Все", value: null },
  ...(auditData.value?.filters.entityTypes ?? []).map((item) => ({ label: item, value: item }))
]);

function actionColor(action: AuditAction) {
  if (action === "DELETE" || action === "BULK_DELETE") return "error";
  if (action === "CREATE" || action === "LOGIN") return "success";
  if (action === "STOCK_ADJUSTMENT") return "warning";
  return "primary";
}

function formatMetadata(metadata: unknown) {
  return JSON.stringify(metadata, null, 2);
}
</script>
