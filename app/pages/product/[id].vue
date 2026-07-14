<template>
  <div class="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <UButton
      color="neutral"
      variant="ghost"
      to="/"
      class="mb-6"
    >
      <ArrowLeft class="size-4" />
      В каталог
    </UButton>

    <div
      v-if="pending"
      class="grid gap-8 lg:grid-cols-[minmax(0,0.95fr)_minmax(420px,1fr)]"
    >
      <USkeleton class="aspect-square rounded-lg" />
      <USkeleton class="h-96 rounded-lg" />
    </div>

    <UAlert
      v-else-if="error || !product"
      color="error"
      variant="soft"
      title="Товар не найден"
      :description="getErrorMessage(error, 'Не удалось загрузить карточку товара')"
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
              >
                {{ product.category.name }}
              </UBadge>
              <UBadge
                color="neutral"
                variant="soft"
              >
                Арт. {{ product.article }}
              </UBadge>
            </div>
            <h1 class="text-3xl font-semibold tracking-normal text-[var(--shop-text)] sm:text-4xl">
              {{ product.name }}
            </h1>
            <div class="mt-4 flex flex-wrap items-center gap-4 text-sm text-[var(--shop-text-muted)]">
              <span class="flex items-center gap-1 text-amber-500">
                <Star class="size-4 fill-current" />
                <span class="font-medium text-[var(--shop-text)]">{{ averageRating }}</span>
              </span>
              <span>{{ product.reviews.length }} отзывов</span>
              <span>Обновлено {{ formatDate(product.updatedAt) }}</span>
            </div>
          </div>

          <UCard
            class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
            :ui="{ body: 'p-5 sm:p-6' }"
          >
            <div class="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p class="text-4xl font-semibold text-[var(--shop-text)]">
                  {{ formatCurrency(product.currentPrice) }}
                </p>
                <p
                  v-if="product.oldPrice"
                  class="mt-1 text-lg text-[var(--shop-text-subtle)] line-through"
                >
                  {{ formatCurrency(product.oldPrice) }}
                </p>
              </div>
              <div class="text-right">
                <p class="text-sm text-[var(--shop-text-muted)]">На складе</p>
                <p class="text-2xl font-semibold text-[var(--shop-text)]">
                  {{ stockQuantity }} шт.
                </p>
              </div>
            </div>

            <div class="mt-6 grid gap-3 sm:grid-cols-[160px_minmax(0,1fr)]">
              <div class="flex h-12 items-center rounded-lg border border-[var(--shop-border)]">
                <UButton
                  color="neutral"
                  variant="ghost"
                  square
                  :disabled="quantity <= 1"
                  aria-label="Уменьшить количество"
                  @click="decreaseQuantity"
                >
                  <Minus class="size-4" />
                </UButton>
                <input
                  v-model.number="quantity"
                  class="h-full w-full bg-transparent text-center font-semibold outline-none"
                  type="number"
                  min="1"
                  :max="maxQuantity"
                  aria-label="Количество"
                  @blur="normalizeQuantity"
                >
                <UButton
                  color="neutral"
                  variant="ghost"
                  square
                  :disabled="quantity >= maxQuantity"
                  aria-label="Увеличить количество"
                  @click="increaseQuantity"
                >
                  <Plus class="size-4" />
                </UButton>
              </div>

              <UButton
                color="primary"
                size="xl"
                block
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
                :to="product.ozonLink"
                target="_blank"
              >
                <ExternalLink class="size-5" />
                Ozon
              </UButton>
            </div>
          </UCard>

          <UCard
            class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
            :ui="{ body: 'p-5 sm:p-6' }"
          >
            <h2 class="text-xl font-semibold text-[var(--shop-text)]">Описание</h2>
            <p class="mt-3 whitespace-pre-line text-base leading-8 text-[var(--shop-text-muted)]">
              {{ product.description }}
            </p>
          </UCard>
        </div>
      </section>

      <section class="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1fr)]">
        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-[var(--shop-text)]">Характеристики</h2>
          <dl class="mt-5 divide-y divide-[var(--shop-border)]">
            <div
              v-for="attribute in product.productAttributes"
              :key="attribute.id"
              class="grid gap-2 py-3 sm:grid-cols-[minmax(0,0.75fr)_minmax(0,1fr)]"
            >
              <dt class="text-sm text-[var(--shop-text-muted)]">
                {{ attribute.attribute.name }}
              </dt>
              <dd class="text-sm font-medium text-[var(--shop-text)]">
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
import { ArrowLeft, ExternalLink, Heart, Minus, Plus, ShoppingCart, Star } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatCurrency, formatDate, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
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
const isFavorite = computed(() => product.value ? favorites.productIds.includes(product.value.id) : false);
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

function decreaseQuantity() {
  quantity.value = Math.max(quantity.value - 1, 1);
}

function increaseQuantity() {
  quantity.value = Math.min(quantity.value + 1, maxQuantity.value);
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
