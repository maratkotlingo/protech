<template>
  <header class="sticky top-0 z-40 px-3 py-3 sm:px-4">
    <div class="mx-auto w-full max-w-370">
      <div class="flex min-h-18 items-center gap-3 rounded-[2rem] bg-white/90 p-2 shadow-[0_18px_70px_rgba(15,23,42,0.08)] backdrop-blur-2xl dark:bg-zinc-950/80 dark:shadow-black/30">
        <NuxtLink
          to="/"
          class="group flex shrink-0 items-center gap-3 rounded-[1.5rem] px-2 py-1.5 transition duration-300 hover:scale-[1.01] hover:bg-[#f9fafb] dark:hover:bg-zinc-900"
          aria-label="На главную ProTech"
        >
          <span class="grid size-11 place-items-center rounded-[1.35rem] bg-emerald-600 text-white shadow-xl shadow-emerald-900/20 transition duration-300 group-hover:rotate-3 group-hover:scale-105">
            <UIcon
              name="i-lucide-zap"
              class="size-6"
            />
          </span>
          <span class="hidden leading-tight sm:block">
            <span class="block text-lg font-semibold tracking-normal text-zinc-950 dark:text-white">ProTech</span>
            <span class="block text-xs text-zinc-500 dark:text-zinc-400">Техника и аксессуары</span>
          </span>
        </NuxtLink>

        <nav class="hidden items-center gap-1 rounded-full bg-[#f3f4f6] p-1 lg:flex dark:bg-zinc-900">
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm font-medium transition duration-300 hover:scale-[1.02]"
            :class="isNavActive(item) ? 'bg-white text-zinc-950 shadow-sm shadow-zinc-950/5 dark:bg-zinc-800 dark:text-white' : 'text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-white'"
          >
            <UIcon
              :name="item.icon"
              class="size-4"
            />
            {{ item.label }}
          </NuxtLink>
        </nav>

        <form
          class="hidden min-w-0 flex-1 md:block"
          @submit.prevent="goToCatalog"
        >
          <UInput
            v-model="ui.catalog.search"
            icon="i-lucide-search"
            class="w-full rounded-full bg-[#f3f4f6] shadow-inner shadow-zinc-950/5 dark:bg-zinc-900"
            size="lg"
            variant="none"
            placeholder="Найти товар, бренд или артикул"
            :ui="searchInputUi"
          />
        </form>

        <div class="ml-auto flex items-center gap-1 sm:gap-2">
          <UTooltip :text="themeTooltip">
            <UButton
              color="neutral"
              variant="soft"
              :icon="themeIcon"
              square
              class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105 dark:bg-zinc-900"
              aria-label="Переключить тему"
              @click="ui.toggleTheme"
            />
          </UTooltip>

          <UTooltip text="Избранное">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-heart"
              square
              to="/favorites"
              aria-label="Избранное"
              class="relative rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105 dark:bg-zinc-900"
            >
              <span
                v-if="favorites.count"
                class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[11px] font-semibold text-white shadow-lg shadow-rose-950/20"
              >
                {{ favorites.count }}
              </span>
            </UButton>
          </UTooltip>

          <UTooltip text="Корзина">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-shopping-bag"
              square
              to="/cart"
              aria-label="Корзина"
              class="relative rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105 dark:bg-zinc-900"
            >
              <span
                v-if="cart.totalItems"
                class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-emerald-600 px-1 text-[11px] font-semibold text-white shadow-lg shadow-emerald-950/20"
              >
                {{ cart.totalItems }}
              </span>
            </UButton>
          </UTooltip>

          <div class="hidden items-center gap-2 md:flex">
            <template v-if="auth.user">
              <UButton
                color="neutral"
                variant="soft"
                to="/orders"
                class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-[1.02] dark:bg-zinc-900"
              >
                <span
                  v-if="!auth.user.image"
                  class="grid size-7 place-items-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                >
                  {{ auth.initials }}
                </span>
                <img
                  v-else
                  :src="auth.user.image"
                  :alt="auth.user.name ?? auth.user.email"
                  class="size-7 rounded-full object-cover"
                >
                <span class="max-w-36 truncate">{{ auth.user.name || auth.user.email }}</span>
              </UButton>
              <UTooltip text="Выйти">
                <UButton
                  color="neutral"
                  variant="ghost"
                  icon="i-lucide-log-out"
                  square
                  class="rounded-full transition duration-300 hover:scale-105"
                  :loading="auth.pending"
                  aria-label="Выйти"
                  @click="logout"
                />
              </UTooltip>
            </template>
            <UButton
              v-else
              color="primary"
              variant="solid"
              icon="i-lucide-user-round"
              to="/auth"
              class="rounded-full px-5 shadow-lg shadow-emerald-800/15 transition duration-300 hover:scale-[1.02]"
            >
              Войти
            </UButton>
          </div>

          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-menu"
            square
            class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-105 md:hidden dark:bg-zinc-900"
            aria-label="Открыть меню"
            @click="openMobileMenu"
          />
        </div>
      </div>
    </div>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="mobileOpen"
        class="fixed inset-0 z-50 md:hidden"
      >
        <button
          class="absolute inset-0 bg-zinc-950/45 backdrop-blur-sm"
          aria-label="Закрыть меню"
          @click="closeMobileMenu"
        />

        <aside class="absolute inset-y-3 right-3 flex w-[min(390px,calc(100vw-1.5rem))] flex-col rounded-[2rem] bg-white p-4 shadow-2xl shadow-zinc-950/25 dark:bg-zinc-950">
          <div class="flex items-center justify-between gap-4">
            <NuxtLink
              to="/"
              class="flex items-center gap-3 rounded-3xl"
              aria-label="На главную ProTech"
              @click="closeMobileMenu"
            >
              <span class="grid size-11 place-items-center rounded-[1.35rem] bg-emerald-600 text-white">
                <UIcon
                  name="i-lucide-zap"
                  class="size-6"
                />
              </span>
              <span>
                <span class="block font-semibold text-zinc-950 dark:text-white">ProTech</span>
                <span class="block text-xs text-zinc-500 dark:text-zinc-400">Магазин техники</span>
              </span>
            </NuxtLink>

            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-x"
              square
              class="rounded-full bg-[#f3f4f6] dark:bg-zinc-900"
              aria-label="Закрыть меню"
              @click="closeMobileMenu"
            />
          </div>

          <form
            class="mt-6"
            @submit.prevent="goToCatalog"
          >
            <UInput
              v-model="ui.catalog.search"
              icon="i-lucide-search"
              class="w-full rounded-full bg-[#f3f4f6] dark:bg-zinc-900"
              size="lg"
              variant="none"
              placeholder="Поиск по каталогу"
              :ui="searchInputUi"
            />
          </form>

          <div
            v-auto-animate
            class="mt-6 grid gap-2"
          >
            <NuxtLink
              v-for="item in mobileMenuItems"
              :key="item.to"
              :to="item.to"
              class="flex items-center justify-between gap-3 rounded-[1.35rem] bg-[#f9fafb] px-4 py-3 text-sm font-medium text-zinc-700 transition duration-300 hover:scale-[1.01] hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:bg-zinc-800"
              :class="isNavActive(item) ? 'text-emerald-700 dark:text-emerald-300' : ''"
              @click="closeMobileMenu"
            >
              <span class="flex items-center gap-3">
                <span class="grid size-10 place-items-center rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950 dark:text-zinc-300">
                  <UIcon
                    :name="item.icon"
                    class="size-5"
                  />
                </span>
                {{ item.label }}
              </span>
              <span
                v-if="item.count"
                class="grid min-w-6 place-items-center rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white"
              >
                {{ item.count }}
              </span>
            </NuxtLink>
          </div>

          <div class="mt-6 rounded-[1.75rem] bg-[#f9fafb] p-3 dark:bg-zinc-900">
            <button
              type="button"
              class="flex w-full items-center justify-between gap-4 rounded-[1.35rem] px-3 py-3 text-left transition duration-300 hover:bg-white dark:hover:bg-zinc-950"
              @click="ui.toggleTheme"
            >
              <span class="flex items-center gap-3 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                <span class="grid size-10 place-items-center rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950 dark:text-zinc-300">
                  <UIcon
                    :name="themeIcon"
                    class="size-5"
                  />
                </span>
                {{ themeTooltip }}
              </span>
              <UIcon
                name="i-lucide-chevron-right"
                class="size-4 text-zinc-400"
              />
            </button>
          </div>

          <div class="mt-auto space-y-3 pt-6">
            <div
              v-if="auth.user"
              class="rounded-[1.75rem] bg-[#f9fafb] p-4 dark:bg-zinc-900"
            >
              <p class="text-xs uppercase tracking-[0.2em] text-zinc-400">Аккаунт</p>
              <p class="mt-2 truncate font-semibold text-zinc-950 dark:text-white">
                {{ auth.user.name || auth.user.email }}
              </p>
              <UButton
                color="neutral"
                variant="soft"
                icon="i-lucide-log-out"
                block
                class="mt-4 rounded-full"
                :loading="auth.pending"
                @click="logout"
              >
                Выйти
              </UButton>
            </div>
            <UButton
              v-else
              color="primary"
              icon="i-lucide-user-round"
              block
              to="/auth"
              size="lg"
              class="rounded-full"
              @click="closeMobileMenu"
            >
              Войти или создать аккаунт
            </UButton>
          </div>
        </aside>
      </div>
    </Transition>
  </header>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

type NavItem = {
  count?: number;
  icon: string;
  label: string;
  match: (path: string) => boolean;
  to: string;
};

const route = useRoute();
const colorMode = useColorMode();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const ui = useShopUiStore();
const mobileOpen = ref(false);
const searchInputUi = {
  base: "h-11 rounded-full bg-transparent"
};
const navItems: NavItem[] = [
  {
    icon: "i-lucide-layout-grid",
    label: "Каталог",
    match: (path) => path === "/" || path.startsWith("/product"),
    to: "/"
  },
  {
    icon: "i-lucide-package-check",
    label: "Заказы",
    match: (path) => path.startsWith("/orders"),
    to: "/orders"
  }
];
const mobileMenuItems = computed<NavItem[]>(() => [
  ...navItems,
  {
    count: favorites.count,
    icon: "i-lucide-heart",
    label: "Избранное",
    match: (path) => path.startsWith("/favorites"),
    to: "/favorites"
  },
  {
    count: cart.totalItems,
    icon: "i-lucide-shopping-bag",
    label: "Корзина",
    match: (path) => path.startsWith("/cart") || path.startsWith("/checkout"),
    to: "/cart"
  }
]);
const themeIcon = computed(() => colorMode.value === "dark" ? "i-lucide-sun" : "i-lucide-moon");
const themeTooltip = computed(() => colorMode.value === "dark" ? "Светлая тема" : "Темная тема");

watch(
  () => route.fullPath,
  () => {
    mobileOpen.value = false;
  }
);

watch(mobileOpen, (open) => {
  if (import.meta.client) {
    document.documentElement.style.overflow = open ? "hidden" : "";
  }
});

onBeforeUnmount(() => {
  if (import.meta.client) {
    document.documentElement.style.overflow = "";
  }
});

async function goToCatalog() {
  mobileOpen.value = false;

  if (route.path !== "/") {
    await navigateTo("/");
  }
}

async function logout() {
  try {
    await auth.logout();
    cart.items = [];
    favorites.clearLocal();
    toast.success("Вы вышли из аккаунта");
    mobileOpen.value = false;

    if (["/cart", "/checkout", "/favorites"].includes(route.path) || route.path.startsWith("/orders")) {
      await navigateTo("/");
    }
  } catch {
    toast.error("Не удалось завершить сессию");
  }
}

function isNavActive(item: NavItem) {
  return item.match(route.path);
}

function openMobileMenu() {
  mobileOpen.value = true;
}

function closeMobileMenu() {
  mobileOpen.value = false;
}
</script>
