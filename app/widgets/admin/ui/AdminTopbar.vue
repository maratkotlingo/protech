<template>
  <header class="sticky top-0 z-30 flex h-24 items-center justify-between border-b border-[var(--admin-border)] bg-[var(--admin-surface-elevated)]/92 px-6 backdrop-blur xl:px-10">
    <div class="flex min-w-0 items-center gap-5">
      <UButton
        color="neutral"
        variant="ghost"
        class="lg:hidden"
        aria-label="Открыть меню"
        @click="$emit('open-menu')"
      >
        <Menu class="size-5" />
      </UButton>

      <div class="min-w-0">
        <p class="truncate text-xl font-semibold text-[var(--admin-text)]">
          {{ currentTitle }}
        </p>
        <p class="hidden truncate text-sm text-[var(--admin-text-muted)] sm:block">
          {{ subtitle }}
        </p>
      </div>
    </div>

    <div class="flex items-center gap-4">
      <div class="flex items-center gap-5">
        <img
          v-if="user?.image"
          :src="user.image"
          :alt="user.name ?? user.email"
          class="size-14 rounded-full object-cover"
        >
        <div
          v-else
          class="grid size-14 place-items-center rounded-full bg-[var(--admin-accent-soft)] text-lg font-semibold text-[var(--admin-accent)]"
        >
          {{ initials }}
        </div>
        <div class="hidden min-w-0 md:block">
          <p class="truncate text-base font-medium text-[var(--admin-text)]">
            {{ user?.name || "Администратор" }}
          </p>
          <p class="truncate text-sm text-[var(--admin-text-muted)]">
            {{ user?.email }}
          </p>
        </div>
      </div>

      <UTooltip text="Выйти">
        <UButton
          color="neutral"
          variant="ghost"
          square
          :loading="loggingOut"
          aria-label="Выйти"
          @click="logout"
        >
          <LogOut class="size-5" />
        </UButton>
      </UTooltip>
    </div>
  </header>
</template>

<script setup lang="ts">
import { LogOut, Menu } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import type { AdminUser } from "~~/app/shared/types/admin";

const props = defineProps<{
  user: AdminUser | null | undefined;
}>();

defineEmits<{
  "open-menu": [];
}>();

const route = useRoute();
const loggingOut = ref(false);

const pageTitles: Record<string, string> = {
  "/admin": "Аналитика",
  "/admin/products": "Товары",
  "/admin/stock": "Остатки",
  "/admin/catalog": "Справочники",
  "/admin/orders": "Заказы",
  "/admin/reviews": "Отзывы",
  "/admin/faq": "FAQ",
  "/admin/audit": "Аудит"
};

const currentTitle = computed(() => pageTitles[route.path] ?? "Админ-панель");
const subtitle = computed(() => "Операционная панель магазина ProTech");
const initials = computed(() => {
  const source = props.user?.name || props.user?.email || "A";
  return source.slice(0, 2).toUpperCase();
});

async function logout() {
  if (loggingOut.value) {
    return;
  }

  loggingOut.value = true;

  try {
    await adminFetch("/api/admin/auth/logout-audit", { method: "POST" }).catch(() => undefined);
    await $fetch("/api/auth/sign-out", {
      method: "POST",
      credentials: "include",
      body: {}
    });
    clearNuxtData("admin-me");
    toast.success("Вы вышли из админ-панели");
    await navigateTo("/admin/login", { replace: true });
  } catch {
    toast.error("Не удалось завершить сессию");
  } finally {
    loggingOut.value = false;
  }
}
</script>
