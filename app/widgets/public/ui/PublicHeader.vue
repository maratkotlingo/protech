<template>
  <header class="sticky top-0 z-40 border-b border-[var(--shop-border)] bg-[var(--shop-surface-elevated)]/92 backdrop-blur-xl">
    <div class="mx-auto flex h-20 w-full max-w-[1480px] items-center gap-4 px-4 sm:px-6 xl:px-8">
      <NuxtLink
        to="/"
        class="flex shrink-0 items-center gap-3"
        aria-label="На главную ProTech"
      >
        <span class="grid size-11 place-items-center rounded-lg bg-[var(--shop-accent)] text-white shadow-lg shadow-green-900/15">
          <Zap class="size-6" />
        </span>
        <span class="hidden leading-tight sm:block">
          <span class="block text-lg font-semibold tracking-normal text-[var(--shop-text)]">ProTech</span>
          <span class="block text-xs text-[var(--shop-text-muted)]">Техника и аксессуары</span>
        </span>
      </NuxtLink>

      <nav class="hidden items-center gap-1 lg:flex">
        <UButton
          color="neutral"
          variant="ghost"
          to="/"
        >
          Каталог
        </UButton>
        <UButton
          color="neutral"
          variant="ghost"
          to="/orders"
        >
          Заказы
        </UButton>
      </nav>

      <form
        class="hidden w-full max-w-md min-w-0 md:block xl:max-w-lg"
        @submit.prevent="goToCatalog"
      >
        <UInput
          v-model="ui.catalog.search"
          class="w-full"
          size="lg"
          placeholder="Найти товар, бренд или артикул"
        >
          <template #leading>
            <Search class="size-4 text-[var(--shop-text-muted)]" />
          </template>
        </UInput>
      </form>

      <div class="ml-auto flex items-center gap-1 sm:gap-2">
        <UTooltip :text="colorMode.value === 'dark' ? 'Светлая тема' : 'Темная тема'">
          <UButton
            color="neutral"
            variant="ghost"
            square
            aria-label="Переключить тему"
            @click="ui.toggleTheme"
          >
            <ClientOnly>
              <Sun
                v-if="colorMode.value === 'dark'"
                class="size-5"
              />
              <Moon
                v-else
                class="size-5"
              />
            </ClientOnly>
          </UButton>
        </UTooltip>

        <UTooltip text="Избранное">
          <UButton
            color="neutral"
            variant="ghost"
            square
            to="/favorites"
            aria-label="Избранное"
            class="relative"
          >
            <Heart class="size-5" />
            <span
              v-if="favorites.count"
              class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--shop-accent)] px-1 text-[11px] font-semibold text-white"
            >
              {{ favorites.count }}
            </span>
          </UButton>
        </UTooltip>

        <UTooltip text="Корзина">
          <UButton
            color="neutral"
            variant="ghost"
            square
            to="/cart"
            aria-label="Корзина"
            class="relative"
          >
            <ShoppingCart class="size-5" />
            <span
              v-if="cart.totalItems"
              class="absolute -right-1 -top-1 grid min-w-5 place-items-center rounded-full bg-[var(--shop-accent)] px-1 text-[11px] font-semibold text-white"
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
            >
              <span
                v-if="!auth.user.image"
                class="grid size-6 place-items-center rounded-full bg-[var(--shop-accent-soft)] text-xs font-semibold text-[var(--shop-accent)]"
              >
                {{ auth.initials }}
              </span>
              <img
                v-else
                :src="auth.user.image"
                :alt="auth.user.name ?? auth.user.email"
                class="size-6 rounded-full object-cover"
              >
              {{ auth.user.name || auth.user.email }}
            </UButton>
            <UTooltip text="Выйти">
              <UButton
                color="neutral"
                variant="ghost"
                square
                :loading="auth.pending"
                aria-label="Выйти"
                @click="logout"
              >
                <LogOut class="size-5" />
              </UButton>
            </UTooltip>
          </template>
          <UButton
            v-else
            color="primary"
            variant="solid"
            to="/auth"
          >
            <UserRound class="size-4" />
            Войти
          </UButton>
        </div>

        <UButton
          color="neutral"
          variant="ghost"
          square
          class="md:hidden"
          aria-label="Открыть меню"
          @click="openMobileMenu"
        >
          <Menu class="size-5" />
        </UButton>
      </div>
    </div>

    <div
      v-if="mobileOpen"
      class="fixed inset-0 z-50 md:hidden"
    >
      <button
        class="absolute inset-0 bg-black/45"
        aria-label="Закрыть меню"
        @click="closeMobileMenu"
      />
      <aside class="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col border-l border-[var(--shop-border)] bg-[var(--shop-surface)] p-5 shadow-2xl">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="grid size-10 place-items-center rounded-lg bg-[var(--shop-accent)] text-white">
              <Zap class="size-5" />
            </span>
            <span class="font-semibold">ProTech</span>
          </div>
          <UButton
            color="neutral"
            variant="ghost"
            square
            aria-label="Закрыть меню"
            @click="closeMobileMenu"
          >
            <X class="size-5" />
          </UButton>
        </div>

        <form
          class="mt-6"
          @submit.prevent="goToCatalog"
        >
          <UInput
            v-model="ui.catalog.search"
            class="w-full"
            size="lg"
            placeholder="Поиск по каталогу"
          >
            <template #leading>
              <Search class="size-4 text-[var(--shop-text-muted)]" />
            </template>
          </UInput>
        </form>

        <div class="mt-6 grid gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            to="/"
            class="justify-start"
            @click="closeMobileMenu"
          >
            <PackageSearch class="size-5" />
            Каталог
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            to="/favorites"
            class="justify-start"
            @click="closeMobileMenu"
          >
            <Heart class="size-5" />
            Избранное
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            to="/cart"
            class="justify-start"
            @click="closeMobileMenu"
          >
            <ShoppingCart class="size-5" />
            Корзина
          </UButton>
          <UButton
            color="neutral"
            variant="ghost"
            to="/orders"
            class="justify-start"
            @click="closeMobileMenu"
          >
            <PackageCheck class="size-5" />
            Заказы
          </UButton>
        </div>

        <div class="mt-auto space-y-3 border-t border-[var(--shop-border)] pt-5">
          <UButton
            v-if="auth.user"
            color="neutral"
            variant="outline"
            block
            :loading="auth.pending"
            @click="logout"
          >
            <LogOut class="size-4" />
            Выйти
          </UButton>
          <UButton
            v-else
            color="primary"
            block
            to="/auth"
            @click="closeMobileMenu"
          >
            <UserRound class="size-4" />
            Войти или создать аккаунт
          </UButton>
        </div>
      </aside>
    </div>
  </header>
</template>

<script setup lang="ts">
import { Heart, LogOut, Menu, Moon, PackageCheck, PackageSearch, Search, ShoppingCart, Sun, UserRound, X, Zap } from "@lucide/vue";
import { toast } from "vue-sonner";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

const route = useRoute();
const colorMode = useColorMode();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const ui = useShopUiStore();
const mobileOpen = ref(false);

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

function openMobileMenu() {
  mobileOpen.value = true;
}

function closeMobileMenu() {
  mobileOpen.value = false;
}
</script>
