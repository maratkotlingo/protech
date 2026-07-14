<template>
  <div class="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <UBadge
          color="primary"
          variant="soft"
          class="mb-4"
        >
          Подборка
        </UBadge>
        <h1 class="text-4xl font-semibold tracking-normal text-[var(--shop-text)]">Избранное</h1>
        <p class="mt-3 text-[var(--shop-text-muted)]">
          Сохраненные товары для быстрого возвращения к покупке.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        to="/"
      >
        В каталог
      </UButton>
    </div>

    <div
      v-if="loading"
      class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <USkeleton
        v-for="item in 4"
        :key="item"
        class="h-[430px] rounded-lg"
      />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <Heart class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Войдите, чтобы открыть избранное</h2>
        <UButton
          class="mt-5"
          color="primary"
          to="/auth?redirect=/favorites"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!favorites.items.length"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <Heart class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Пока ничего нет</h2>
        <p class="mt-2 text-sm text-[var(--shop-text-muted)]">Добавляйте товары сердечком в каталоге или карточке товара.</p>
      </div>
    </div>

    <div
      v-else
      v-auto-animate
      class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
    >
      <ProductCard
        v-for="favorite in favorites.items"
        :key="favorite.id"
        :product="favorite.product"
        favorite
        :loading-favorite="favorites.syncingProductId === favorite.product.id"
        :loading-cart="cart.syncingProductId === favorite.product.id"
        @add-to-cart="addToCart"
        @toggle-favorite="toggleFavorite"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { Heart } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import type { ProductCardItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";

useSeoMeta({
  title: "Избранное",
  description: "Избранные товары покупателя ProTech."
});

const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const loading = ref(true);

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await favorites.fetchFavorites();
  }

  loading.value = false;
});

async function addToCart(product: ProductCardItem) {
  try {
    await cart.add(product.id);
    toast.success("Товар добавлен в корзину");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось добавить товар"));
  }
}

async function toggleFavorite(product: ProductCardItem) {
  try {
    await favorites.toggle(product.id);
    toast.success("Товар удален из избранного");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить избранное"));
  }
}
</script>
