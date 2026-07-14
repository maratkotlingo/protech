<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <UButton
      color="neutral"
      variant="ghost"
      to="/"
      class="mb-6 rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <ArrowLeft class="size-4" />
      В каталог
    </UButton>

    <div
      v-if="pending"
      class="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]"
    >
      <USkeleton class="aspect-square rounded-[2rem]" />
      <USkeleton class="h-96 rounded-[2rem]" />
    </div>

    <UAlert
      v-else-if="error || !product"
      color="error"
      variant="soft"
      title="Товар не найден"
      :description="getErrorMessage(error, 'Не удалось загрузить карточку товара')"
      class="rounded-3xl"
    />

    <div
      v-else
      class="space-y-10"
    >
      <section class="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]">
        <ProductGallery
          :main-image="product.mainImage"
          :images="product.productImages"
          :alt="product.name"
        />

        <div class="space-y-6">
          <div>
            <div class="mb-3 flex flex-wrap items-center gap-2">
              <UBadge
                color="primary"
                variant="soft"
                class="rounded-full"
              >
                {{ product.category.name }}
              </UBadge>
              <UBadge
                color="neutral"
                variant="soft"
                class="rounded-full"
              >
                Арт. {{ product.article }}
              </UBadge>
            </div>
            <h1 class="text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">
              {{ product.name }}
            </h1>
            <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
              <span class="flex items-center gap-1 text-amber-500">
                <Star class="size-4 fill-current" />
                <span class="font-medium text-zinc-950 dark:text-white">{{ averageRating }}</span>
              </span>
              <span>{{ product.reviews.length }} отзывов</span>
              <span>Обновлено {{ formatDate(product.updatedAt) }}</span>
            </div>
          </div>

          <UCard
            class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
            :ui="{ body: 'p-5 sm:p-6' }"
          >
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-4xl font-semibold text-zinc-950 dark:text-white">
                  {{ formatCurrency(product.currentPrice) }}
                </p>
                <p
                  v-if="product.oldPrice"
                  class="mt-1 text-lg text-zinc-400 line-through"
                >
                  {{ formatCurrency(product.oldPrice) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-zinc-500 dark:text-zinc-400">На складе</p>
                <p class="text-2xl font-semibold text-zinc-950 dark:text-white">
                  {{ stockQuantity }} шт.
                </p>
              </div>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-[minmax(0,210px)_minmax(0,1fr)]">
              <div class="min-w-0">
                <USelect
                  v-model="quantity"
                  :items="quantityOptions"
                  value-key="value"
                  label-key="label"
                  color="neutral"
                  variant="none"
                  size="xl"
                  icon="i-lucide-package-plus"
                  class="h-12 w-full rounded-full bg-[#f9fafb] px-1 shadow-inner shadow-zinc-950/5 dark:bg-zinc-800"
                  :ui="quantitySelectUi"
                  :disabled="stockQuantity <= 0"
                  aria-label="Количество"
                  @change="normalizeQuantity"
                />
                <p class="mt-2 px-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  Итого: <span class="text-zinc-950 dark:text-white">{{ selectedQuantityTotal }}</span>
                </p>
              </div>

              <UButton
                color="primary"
                size="xl"
                block
                class="rounded-full"
                :disabled="stockQuantity <= 0"
                :loading="cart.syncingProductId === product.id"
                @click="addToCart"
              >
                <ShoppingCart class="size-5" />
                Добавить в корзину
              </UButton>
            </div>

            <div class="mt-3 grid gap-3 sm:grid-cols-2">
              <UButton
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="rounded-full"
                :loading="favorites.syncingProductId === product.id"
                @click="toggleFavorite"
              >
                <Heart
                  class="size-5"
                  :class="isFavorite ? 'fill-red-500 text-red-500' : ''"
                />
                {{ isFavorite ? "В избранном" : "В избранное" }}
              </UButton>
              <UButton
                v-if="product.ozonLink"
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="rounded-full"
                :to="product.ozonLink"
                target="_blank"
              >
                <ExternalLink class="size-5" />
                Ozon
              </UButton>
            </div>
          </UCard>

          <UCard
            class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
            :ui="{ body: 'p-5 sm:p-6' }"
          >
            <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Описание</h2>
            <p class="mt-3 whitespace-pre-line text-base leading-8 text-zinc-500 dark:text-zinc-400">
              {{ product.description }}
            </p>
          </UCard>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <UCard
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Характеристики</h2>
          <dl class="mt-5 divide-y divide-zinc-100 dark:divide-zinc-800">
            <div
              v-for="attribute in product.productAttributes"
              :key="attribute.id"
              class="grid gap-2 py-3 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]"
            >
              <dt class="text-sm text-zinc-500 dark:text-zinc-400">
                {{ attribute.attribute.name }}
              </dt>
              <dd class="text-sm font-medium text-zinc-950 dark:text-white">
                {{ attribute.value }} {{ attribute.attribute.unit }}
              </dd>
            </div>
          </dl>
        </UCard>

        <ProductPriceChart :prices="product.productPrices" />
      </section>

      <ProductReviews
        :product-id="product.id"
        :reviews="product.reviews"
        @refresh="refresh()"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft, ExternalLink, Heart, ShoppingCart, Star } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatCurrency, formatDate, getErrorMessage, toNumber } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ProductDetails } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";

const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const quantity = ref(1);
const productId = computed(() => Number(route.params.id));

const { data: product, pending, error, refresh } = await useAsyncData(
  () => `shop-product-${productId.value}`,
  () => shopFetch<ProductDetails>(`/api/public/product/${productId.value}`),
  { watch: [productId] }
);

useSeoMeta({
  title: () => product.value?.name ?? "Товар",
  description: () => product.value?.description?.slice(0, 160) ?? "Карточка товара ProTech",
  ogTitle: () => product.value?.name ?? "Товар ProTech",
  ogDescription: () => product.value?.description?.slice(0, 160) ?? "Карточка товара ProTech",
  ogImage: () => product.value?.mainImage
});

const stockQuantity = computed(() => product.value?.productStocks[0]?.quantity ?? 0);
const maxQuantity = computed(() => Math.max(Math.min(stockQuantity.value, 99), 1));
const quantityOptions = computed(() => Array.from({ length: maxQuantity.value }, (_, index) => {
  const value = index + 1;

  return {
    label: `${value} шт.`,
    value
  };
}));
const selectedQuantityTotal = computed(() => formatCurrency(toNumber(product.value?.currentPrice) * quantity.value));
const isFavorite = computed(() => product.value ? favorites.productIds.includes(product.value.id) : false);
const quantitySelectUi = {
  base: "h-12 rounded-full bg-transparent font-semibold text-zinc-950 dark:text-white",
  value: "truncate",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 dark:bg-zinc-900",
  viewport: "p-1",
  item: "rounded-xl"
};
const averageRating = computed(() => {
  const reviews = product.value?.reviews ?? [];

  if (!reviews.length) {
    return "—";
  }

  const average = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  return average.toFixed(1);
});

watch(stockQuantity, normalizeQuantity);

function normalizeQuantity() {
  quantity.value = Math.min(Math.max(Number(quantity.value) || 1, 1), maxQuantity.value);
}

async function requireAuth() {
  if (auth.user || await auth.fetchMe()) {
    return true;
  }

  toast.info("Войдите, чтобы продолжить покупку");
  await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
  return false;
}

async function addToCart() {
  if (!product.value || !await requireAuth()) {
    return;
  }

  normalizeQuantity();

  try {
    await cart.add(product.value.id);

    if (quantity.value > 1) {
      await cart.updateQuantity(product.value.id, quantity.value);
    }

    toast.success("Товар добавлен в корзину");
  } catch (err) {
    toast.error(getErrorMessage(err, "Не удалось добавить товар в корзину"));
  }
}

async function toggleFavorite() {
  if (!product.value || !await requireAuth()) {
    return;
  }

  try {
    await favorites.toggle(product.value.id);
    toast.success(favorites.isFavorite(product.value.id) ? "Товар в избранном" : "Товар удален из избранного");
  } catch (err) {
    toast.error(getErrorMessage(err, "Не удалось обновить избранное"));
  }
}
</script>
