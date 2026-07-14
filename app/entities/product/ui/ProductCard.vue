<template>
  <UCard
    class="group h-full overflow-hidden border border-[var(--shop-border)] bg-[var(--shop-surface)] transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-green-950/10 dark:hover:shadow-black/25"
    :ui="{ body: 'flex h-full flex-col p-0' }"
  >
    <div class="relative overflow-hidden bg-[var(--shop-surface-muted)]">
      <NuxtLink :to="`/product/${product.id}`">
        <img
          :src="product.mainImage"
          :alt="product.name"
          class="aspect-[4/3] w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        >
      </NuxtLink>

      <div class="absolute left-3 top-3 flex flex-wrap gap-2">
        <UBadge
          v-if="discountPercent"
          color="error"
          variant="solid"
        >
          -{{ discountPercent }}%
        </UBadge>
        <UBadge
          v-if="isOutOfStock"
          color="neutral"
          variant="soft"
        >
          Нет в наличии
        </UBadge>
      </div>

      <UTooltip :text="favorite ? 'Убрать из избранного' : 'В избранное'">
        <UButton
          color="neutral"
          variant="soft"
          square
          class="absolute right-3 top-3 bg-[var(--shop-surface)]/90 backdrop-blur"
          :loading="loadingFavorite"
          :aria-label="favorite ? 'Убрать из избранного' : 'Добавить в избранное'"
          @click="$emit('toggle-favorite', product)"
        >
          <Heart
            class="size-5"
            :class="favorite ? 'fill-red-500 text-red-500' : ''"
          />
        </UButton>
      </UTooltip>
    </div>

    <div class="flex flex-1 flex-col p-4">
      <div class="min-h-[8.75rem]">
        <div class="flex flex-wrap items-center gap-2 text-xs text-[var(--shop-text-muted)]">
          <span v-if="product.category">{{ product.category.name }}</span>
          <span v-if="product.article">Арт. {{ product.article }}</span>
        </div>

        <NuxtLink
          :to="`/product/${product.id}`"
          class="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-[var(--shop-text)] transition hover:text-[var(--shop-accent)]"
        >
          {{ product.name }}
        </NuxtLink>

        <p
          v-if="product.description"
          class="mt-2 line-clamp-2 text-sm leading-6 text-[var(--shop-text-muted)]"
        >
          {{ product.description }}
        </p>
      </div>

      <div class="mt-4 flex items-center gap-2">
        <div class="flex items-center gap-1 text-amber-500">
          <Star class="size-4 fill-current" />
          <span class="text-sm font-medium text-[var(--shop-text)]">
            {{ product.averageRating ?? "—" }}
          </span>
        </div>
        <span class="text-sm text-[var(--shop-text-muted)]">
          {{ product.reviewsCount ?? 0 }} отзывов
        </span>
      </div>

      <div class="mt-4 flex items-end justify-between gap-3">
        <div>
          <p class="text-xl font-semibold text-[var(--shop-text)]">
            {{ formatCurrency(product.currentPrice) }}
          </p>
          <p
            v-if="product.oldPrice"
            class="text-sm text-[var(--shop-text-subtle)] line-through"
          >
            {{ formatCurrency(product.oldPrice) }}
          </p>
        </div>
        <p class="text-right text-xs text-[var(--shop-text-muted)]">
          {{ stockLabel }}
        </p>
      </div>

      <UButton
        class="mt-4 justify-center"
        color="primary"
        :disabled="isOutOfStock"
        :loading="loadingCart"
        @click="$emit('add-to-cart', product)"
      >
        <ShoppingCart class="size-4" />
        В корзину
      </UButton>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { Heart, ShoppingCart, Star } from "@lucide/vue";
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { ProductCardItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  product: ProductCardItem;
  favorite?: boolean;
  loadingFavorite?: boolean;
  loadingCart?: boolean;
}>();

defineEmits<{
  "add-to-cart": [product: ProductCardItem];
  "toggle-favorite": [product: ProductCardItem];
}>();

const stockQuantity = computed(() => props.product.stockQuantity);
const isOutOfStock = computed(() => stockQuantity.value !== undefined && stockQuantity.value <= 0);
const stockLabel = computed(() => {
  if (stockQuantity.value === undefined) {
    return "в наличии";
  }

  return stockQuantity.value > 0 ? `${stockQuantity.value} шт.` : "ожидаем";
});
const discountPercent = computed(() => {
  const oldPrice = toNumber(props.product.oldPrice);
  const currentPrice = toNumber(props.product.currentPrice);

  if (oldPrice <= currentPrice || oldPrice <= 0) {
    return 0;
  }

  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
});
</script>
