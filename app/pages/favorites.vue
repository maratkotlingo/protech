<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="overflow-hidden rounded-4xl bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8  ">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="max-w-3xl">
          <p
            class="inline-flex items-center gap-2 rounded-full bg-rose-50 px-3 py-1.5 text-sm font-semibold text-rose-700  ">
            <UIcon name="i-lucide-heart" class="size-4 fill-current" />
            Подборка
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl ">
            Избранное
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-500 ">
            Сохраняйте товары, сравнивайте варианты и возвращайтесь к покупке, когда удобно.
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row lg:justify-end">
          <UButton color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
            class="rounded-full px-5 transition duration-300 hover:scale-[1.02]">
            В каталог
          </UButton>
          <UButton color="neutral" variant="soft" icon="i-lucide-shopping-bag" to="/cart" size="lg"
            class="rounded-full bg-[#f3f4f6] px-5 transition duration-300 hover:scale-[1.02] ">
            Корзина
          </UButton>
        </div>
      </div>

      <div class="mt-8 grid gap-3 sm:grid-cols-3">
        <div v-for="metric in metrics" :key="metric.label" class="rounded-[1.5rem] bg-[#f9fafb] p-4 ">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-zinc-500">{{ metric.label }}</p>
            <UIcon :name="metric.icon" class="size-5 text-zinc-400" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-zinc-950">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
      <USkeleton v-for="item in 8" :key="item" class="h-130 rounded-3xl" />
    </div>

    <OrderEmptyState v-else-if="!auth.user" class="mt-8" icon="i-lucide-heart" title="Войдите, чтобы открыть избранное"
      description="Мы сохраним подборку в аккаунте и синхронизируем ее между устройствами." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/favorites" />

    <OrderEmptyState v-else-if="!favorites.items.length" class="mt-8" icon="i-lucide-heart-plus" title="Пока ничего нет"
      description="Добавляйте товары сердечком в каталоге или карточке товара — они появятся здесь."
      action-label="Перейти в каталог" action-icon="i-lucide-layout-grid" action-to="/" />

    <div v-else v-auto-animate class="mt-8 grid grid-cols-1 gap-8 md:grid-cols-3 lg:grid-cols-4">
      <ProductCard v-for="favorite in favorites.items" :key="favorite.id" :product="favorite.product" favorite
        :in-cart="Boolean(cartItemByProductId(favorite.product.id))"
        :cart-quantity="cartItemByProductId(favorite.product.id)?.quantity ?? 0"
        :loading-favorite="favorites.syncingProductId === favorite.product.id"
        :loading-cart="cart.syncingProductId === favorite.product.id" @toggle-cart="toggleCart"
        @toggle-favorite="toggleFavorite" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
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
const metrics = computed(() => [
  {
    icon: "i-lucide-heart",
    label: "Сохранено",
    value: `${favorites.count}`
  },
  {
    icon: "i-lucide-badge-russian-ruble",
    label: "На сумму",
    value: formatCurrency(favoritesTotal.value)
  },
  {
    icon: "i-lucide-package-check",
    label: "В наличии",
    value: `${availableFavoritesCount.value}`
  }
]);
const favoritesTotal = computed(() => favorites.items.reduce((sum, item) => sum + Number(item.product.currentPrice ?? 0), 0));
const availableFavoritesCount = computed(() => favorites.items.filter((item) => (item.product.stockQuantity ?? 0) > 0).length);

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites()
    ]);
  }

  loading.value = false;
});

function cartItemByProductId(productId: number) {
  return cart.items.find((item) => item.product.id === productId);
}

async function toggleCart(product: ProductCardItem) {
  try {
    if (cartItemByProductId(product.id)) {
      await cart.remove(product.id);
      toast.success("Товар удален из корзины");
      return;
    }

    await cart.add(product.id);
    toast.success("Товар добавлен в корзину");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить корзину"));
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
