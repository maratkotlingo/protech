<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <UBadge
          color="primary"
          variant="soft"
          class="rounded-full"
        >
          Подборка
        </UBadge>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">Избранное</h1>
        <p class="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">
          Сохраненные товары для быстрого возвращения к покупке.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        to="/"
        class="rounded-full bg-white px-5 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        В каталог
      </UButton>
    </section>

    <div
      v-if="loading"
      class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4"
    >
      <USkeleton
        v-for="item in 8"
        :key="item"
        class="h-[520px] rounded-3xl"
      />
    </div>

    <div
      v-else-if="!auth.user"
      class="mt-8 grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <Heart class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Войдите, чтобы открыть избранное</h2>
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/auth?redirect=/favorites"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!favorites.items.length"
      class="mt-8 grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <Heart class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Пока ничего нет</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Добавляйте товары сердечком в каталоге или карточке товара.</p>
      </div>
    </div>

    <div
      v-else
      v-auto-animate
      class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4"
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
