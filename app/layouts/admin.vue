<template>
  <div class="min-h-screen bg-[var(--admin-surface-muted)]">
    <div
      v-if="pending"
      class="grid min-h-screen place-items-center p-6"
    >
      <UCard class="w-full max-w-md border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div class="flex items-center gap-4">
          <div class="grid size-12 place-items-center rounded-lg bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]">
            <LoaderCircle class="size-6 animate-spin" />
          </div>
          <div>
            <p class="font-semibold text-[var(--admin-text)]">
              Загружаю админ-панель
            </p>
            <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
              Проверяю сессию администратора.
            </p>
          </div>
        </div>
      </UCard>
    </div>

    <div
      v-else-if="error"
      class="grid min-h-screen place-items-center p-6"
    >
      <UCard class="w-full max-w-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
        <div class="space-y-5 text-center">
          <div class="mx-auto grid size-14 place-items-center rounded-lg bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300">
            <LockKeyhole class="size-7" />
          </div>
          <div>
            <h1 class="text-xl font-semibold text-[var(--admin-text)]">
              Доступ к админ-панели закрыт
            </h1>
            <p class="mt-2 text-sm leading-6 text-[var(--admin-text-muted)]">
              Нужна активная сессия пользователя с ролью ADMIN. Backend уже защищает все admin endpoints, поэтому интерфейс не показывает данные без разрешения.
            </p>
          </div>
          <UButton
            color="primary"
            variant="solid"
            @click="refresh()"
          >
            Повторить проверку
          </UButton>
        </div>
      </UCard>
    </div>

    <div
      v-else
      class="flex min-h-screen"
    >
      <div class="hidden shrink-0 lg:block">
        <AdminSidebar :collapsed="ui.sidebarCollapsed" />
      </div>

      <div
        v-if="mobileMenuOpen"
        class="fixed inset-0 z-40 lg:hidden"
      >
        <button
          class="absolute inset-0 bg-black/40"
          aria-label="Закрыть меню"
          @click="mobileMenuOpen = false"
        />
        <div class="relative h-full w-[21rem] shadow-2xl">
          <AdminSidebar @navigate="mobileMenuOpen = false" />
        </div>
      </div>

      <div class="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          :user="data?.user"
          @open-menu="mobileMenuOpen = true"
        />
        <main class="flex-1 overflow-x-hidden bg-[var(--admin-surface-muted)] px-5 py-8 sm:px-8 lg:px-10 xl:px-12 2xl:px-14">
          <div class="mx-auto w-full max-w-[1840px]">
            <slot />
          </div>
        </main>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { LoaderCircle, LockKeyhole } from "@lucide/vue";
import { useAdminUiStore } from "~~/app/stores/adminUi";
import type { AdminUser } from "~~/app/shared/types/admin";

const ui = useAdminUiStore();
const mobileMenuOpen = ref(false);

const { data, pending, error, refresh } = await useAsyncData("admin-me", () => $fetch<{ user: AdminUser }>("/api/admin/me"));

onMounted(() => {
  ui.hydrateColorMode();
});
</script>
