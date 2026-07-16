<template>
  <header class="admin-topbar">
    <div class="admin-container px-3 sm:px-4 lg:px-6 2xl:px-8">
      <div class="flex min-h-16 items-center justify-between gap-3">
        <div class="flex min-w-0 items-center gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            icon="i-lucide-menu"
            square
            class="rounded-md lg:hidden"
            aria-label="Открыть навигацию"
            @click="$emit('open-menu')"
          />

          <div class="hidden size-9 shrink-0 place-items-center rounded-md bg-[var(--admin-accent-soft)] text-[var(--admin-accent-strong)] sm:grid">
            <component
              :is="currentIcon"
              class="size-5"
            />
          </div>

          <div class="min-w-0">
            <div class="flex items-center gap-2">
              <p class="truncate text-base font-semibold tracking-normal text-[var(--admin-text)] sm:text-lg">
                {{ currentTitle }}
              </p>
              <span class="hidden rounded-md border border-[var(--admin-border)] bg-white px-2 py-0.5 text-[0.68rem] font-semibold uppercase text-[var(--admin-text-muted)] md:inline-flex">
                ProTech
              </span>
            </div>
            <p class="hidden truncate text-xs text-[var(--admin-text-muted)] sm:block">
              {{ subtitle }}
            </p>
          </div>
        </div>

        <div class="flex shrink-0 items-center gap-2">
          <div class="hidden items-center gap-2 rounded-md border border-[var(--admin-border)] bg-white px-3 py-2 text-xs text-[var(--admin-text-muted)] xl:flex">
            <CalendarDays class="size-4" />
            {{ todayLabel }}
          </div>

          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-store"
            to="/"
            class="hidden rounded-md bg-white md:inline-flex"
          >
            Магазин
          </UButton>

          <div class="flex items-center gap-2 rounded-md border border-[var(--admin-border)] bg-white py-1 pl-1 pr-2">
            <img
              v-if="user?.image"
              :src="user.image"
              :alt="user.name ?? user.email"
              class="size-9 rounded-md object-cover"
            >
            <div
              v-else
              class="admin-avatar size-9 text-xs"
            >
              {{ initials }}
            </div>
            <div class="hidden min-w-0 md:block">
              <p class="max-w-40 truncate text-xs font-semibold text-[var(--admin-text)]">
                {{ user?.name || "Администратор" }}
              </p>
              <p class="max-w-40 truncate text-[0.68rem] text-[var(--admin-text-muted)]">
                {{ user?.email }}
              </p>
            </div>
          </div>

          <UTooltip text="Выйти">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-log-out"
              square
              class="rounded-md"
              :loading="loggingOut"
              aria-label="Выйти"
              @click="logout"
            />
          </UTooltip>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import {
  BarChart3,
  CalendarDays,
  ClipboardList,
  HelpCircle,
  Layers3,
  MessageSquareText,
  MessagesSquare,
  PackageSearch,
  ScrollText,
  Users,
  Warehouse
} from "@lucide/vue";
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

const pageMeta = {
  "/admin": {
    icon: BarChart3,
    title: "Аналитика",
    subtitle: "Финансы, заказы и складские сигналы"
  },
  "/admin/products": {
    icon: PackageSearch,
    title: "Товары",
    subtitle: "Карточки, цены, медиа и видимость"
  },
  "/admin/stock": {
    icon: Warehouse,
    title: "Остатки",
    subtitle: "Доступность и приходы на склад"
  },
  "/admin/catalog": {
    icon: Layers3,
    title: "Справочники",
    subtitle: "Категории и характеристики каталога"
  },
  "/admin/orders": {
    icon: ClipboardList,
    title: "Заказы",
    subtitle: "Статусы, оплата и доставка"
  },
  "/admin/messages": {
    icon: MessagesSquare,
    title: "Сообщения",
    subtitle: "Диалоги с пользователями"
  },
  "/admin/users": {
    icon: Users,
    title: "Пользователи",
    subtitle: "Аккаунты и роли"
  },
  "/admin/reviews": {
    icon: MessageSquareText,
    title: "Отзывы",
    subtitle: "Модерация и ответы"
  },
  "/admin/faq": {
    icon: HelpCircle,
    title: "FAQ",
    subtitle: "Вопросы покупателей"
  },
  "/admin/audit": {
    icon: ScrollText,
    title: "Аудит",
    subtitle: "История административных действий"
  }
};

const currentMeta = computed(() => {
  const entries = Object.entries(pageMeta);
  const match = entries.find(([path]) => (path === "/admin" ? route.path === path : route.path.startsWith(path)));

  return match?.[1] ?? {
    icon: BarChart3,
    title: "Админ-панель",
    subtitle: "Операционная панель магазина ProTech"
  };
});
const currentIcon = computed(() => currentMeta.value.icon);
const currentTitle = computed(() => currentMeta.value.title);
const subtitle = computed(() => currentMeta.value.subtitle);
const todayLabel = computed(() => new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "long",
  year: "numeric"
}).format(new Date()));
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
