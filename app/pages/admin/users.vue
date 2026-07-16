<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Пользователи"
      kicker="Access"
      description="Роли зарегистрированных аккаунтов, активность покупателей и быстрый доступ к правам администратора."
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
      <div class="grid gap-4 lg:grid-cols-[1fr_260px]">
        <UFormField label="Поиск">
          <UInput
            v-model="search"
            class="w-full"
            size="lg"
            placeholder="Имя или email"
          >
            <template #leading>
              <Search class="size-4 text-[var(--admin-text-muted)]" />
            </template>
          </UInput>
        </UFormField>
        <UFormField label="Роль">
          <USelect
            v-model="role"
            class="w-full"
            size="lg"
            :items="roleFilterItems"
          />
        </UFormField>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить пользователей"
      :description="getErrorMessage(error)"
    />

    <UCard
      class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-0' }"
    >
      <div
        v-if="users.length"
        class="overflow-x-auto"
      >
        <table class="w-full min-w-[980px] divide-y divide-[var(--admin-border)] text-sm">
          <thead class="bg-[var(--admin-surface-muted)]">
            <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
              <th class="px-4 py-3 font-medium">Пользователь</th>
              <th class="px-4 py-3 font-medium">Роль</th>
              <th class="px-4 py-3 font-medium">Подтверждение</th>
              <th class="px-4 py-3 font-medium">Активность</th>
              <th class="px-4 py-3 font-medium">Создан</th>
              <th class="px-4 py-3 font-medium">Обновлен</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--admin-border)]">
            <tr
              v-for="user in users"
              :key="user.id"
              class="align-top transition hover:bg-[var(--admin-surface-muted)]"
            >
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <img
                    v-if="user.image"
                    :src="user.image"
                    alt=""
                    class="size-11 rounded-lg object-cover"
                  >
                  <div
                    v-else
                    class="grid size-11 shrink-0 place-items-center rounded-lg bg-[var(--admin-surface-muted)] text-sm font-semibold text-[var(--admin-text)]"
                  >
                    {{ getInitials(user.name || user.email) }}
                  </div>
                  <div class="min-w-0">
                    <p class="truncate font-semibold text-[var(--admin-text)]">
                      {{ user.name || "Без имени" }}
                    </p>
                    <p class="mt-1 truncate text-sm text-[var(--admin-text-muted)]">
                      {{ user.email }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4">
                <div class="flex flex-wrap items-center gap-2">
                  <UBadge
                    :color="roleColor(user.role)"
                    variant="soft"
                  >
                    {{ roleLabels[user.role] }}
                  </UBadge>
                  <USelect
                    :model-value="user.role"
                    class="w-48"
                    size="md"
                    :items="roleItems"
                    :disabled="savingUserId === user.id"
                    @update:model-value="(value) => updateRole(user, value)"
                  />
                </div>
              </td>
              <td class="px-4 py-4">
                <AdminStatusBadge
                  type="boolean"
                  :value="user.emailVerified"
                  true-label="Подтвержден"
                  false-label="Не подтвержден"
                />
              </td>
              <td class="px-4 py-4 text-[var(--admin-text-muted)]">
                <p>{{ user._count.orders }} заказов</p>
                <p>{{ user._count.message }} сообщений</p>
                <p>{{ user._count.reviews }} отзывов</p>
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-[var(--admin-text-muted)]">
                {{ formatDate(user.createdAt) }}
              </td>
              <td class="whitespace-nowrap px-4 py-4 text-[var(--admin-text-muted)]">
                {{ formatDate(user.updatedAt) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminEmptyState
        v-if="!users.length && !pending"
        title="Пользователи не найдены"
        description="Измените фильтры или поисковый запрос."
      >
        <template #icon>
          <Users class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination
        v-if="usersData?.pagination"
        :pagination="usersData.pagination"
        :loading="pending"
        @update:page="page = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { RefreshCw, Search, Users } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { buildQuery, formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { getZodFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { AdminUserListItem, PaginatedResponse, UserRole } from "~~/app/shared/types/admin";
import { updateUserRoleSchema } from "~~/shared/schemas/admin/users/updateUserRole";

definePageMeta({
  layout: "admin"
});

type RoleFilter = UserRole | "all";

const roleLabels: Record<UserRole, string> = {
  USER: "Пользователь",
  ADMIN: "Администратор"
};

const page = ref(1);
const search = ref("");
const debouncedSearch = ref("");
const role = ref<RoleFilter>("all");
const savingUserId = ref<string | null>(null);

watchDebounced(search, (value) => {
  debouncedSearch.value = value;
  page.value = 1;
}, { debounce: 350, maxWait: 1000 });

watch(role, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  role: role.value === "all" ? null : role.value
}));

const { data: usersData, pending, error, refresh } = await useAsyncData(
  "admin-users-list",
  () => adminFetch<PaginatedResponse<AdminUserListItem>>(`/api/admin/users${query.value}`),
  { watch: [query] }
);

const users = computed(() => usersData.value?.items ?? []);
const roleItems = Object.entries(roleLabels).map(([value, label]) => ({ value, label }));
const roleFilterItems = [
  { value: "all", label: "Все" },
  ...roleItems
];

function roleColor(userRole: UserRole) {
  return userRole === "ADMIN" ? "primary" : "neutral";
}

function getInitials(value: string) {
  return value
    .split(/\s|@/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

async function updateRole(user: AdminUserListItem, value: unknown) {
  const roleValue = value as UserRole;

  if (!roleValue || roleValue === user.role) {
    return;
  }

  const parsed = updateUserRoleSchema.safeParse({ role: roleValue });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).role ?? "Проверьте роль пользователя");
    return;
  }

  savingUserId.value = user.id;

  try {
    await adminFetch(`/api/admin/users/${user.id}/role`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Роль пользователя обновлена");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить роль пользователя"));
  } finally {
    savingUserId.value = null;
  }
}
</script>
