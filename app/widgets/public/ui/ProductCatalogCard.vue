<template>
  <article class="group overflow-hidden rounded-3xl bg-white p-3 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-zinc-950/10   ">
    <div class="relative overflow-hidden rounded-[1.45rem] bg-zinc-100 ">
      <NuxtLink :to="`/product/${product.id}`">
        <img
          :src="product.mainImage || '/favicon.ico'"
          :alt="product.name"
          class="aspect-[4/5] w-full object-cover transition duration-500 group-hover:scale-105"
          :class="isOutOfStock(product) ? 'opacity-60 grayscale' : ''"
          loading="lazy"
        >
      </NuxtLink>

      <div class="absolute left-4 top-4 flex flex-wrap gap-2">
        <UBadge
          v-if="discountPercent(product)"
          color="error"
          variant="solid"
          class="rounded-full"
        >
          -{{ discountPercent(product) }}%
        </UBadge>
        <UBadge
          v-if="isOutOfStock(product)"
          color="error"
          variant="solid"
          class="rounded-full shadow-sm shadow-red-950/15"
        >
          Нет в наличии
        </UBadge>
      </div>

      <UTooltip :text="favorite ? 'Убрать из избранного' : 'В избранное'">
        <UButton
          color="neutral"
          variant="soft"
          icon="i-lucide-heart"
          size="lg"
          square
          class="absolute right-4 top-4 rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur transition hover:scale-105 "
          :class="favorite ? 'text-red-500' : ''"
          :loading="loadingFavorite"
          :aria-label="favorite ? 'Убрать из избранного' : 'Добавить в избранное'"
          @click="onToggleFavorite"
        />
      </UTooltip>

      <UButton
        :color="inCart ? 'error' : isOutOfStock(product) ? 'neutral' : 'primary'"
        :variant="inCart ? 'soft' : 'solid'"
        :icon="cartButtonIcon"
        size="lg"
        class="absolute inset-x-4 bottom-4 justify-center rounded-full opacity-100 shadow-lg shadow-zinc-950/15 transition duration-300 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-y-0 sm:group-focus-within:opacity-100"
        :class="cartButtonClass"
        :disabled="!inCart && isOutOfStock(product)"
        :loading="loadingCart"
        @click="onToggleCart"
      >
        {{ cartButtonLabel }}
      </UButton>
    </div>

    <div class="px-2 pb-3 pt-4">
      <div class="flex items-center justify-between gap-3">
        <p class="truncate text-xs font-medium uppercase text-zinc-400">
          {{ productBrand(product) }}
        </p>
        <div class="flex items-center gap-1 text-sm text-zinc-500 ">
          <UIcon
            name="i-lucide-star"
            class="size-4"
            :class="product.averageRating ? 'fill-amber-400 text-amber-400' : 'text-zinc-300'"
          />
          {{ product.averageRating ?? "—" }}
        </div>
      </div>

      <NuxtLink
        :to="`/product/${product.id}`"
        class="mt-2 line-clamp-2 min-h-12 text-base font-semibold leading-6 text-zinc-950 transition hover:text-emerald-700  "
      >
        {{ product.name }}
      </NuxtLink>

      <p class="mt-2 line-clamp-2 min-h-11 text-sm leading-6 text-zinc-500 ">
        {{ product.description || product.article || product.category?.name }}
      </p>

      <div class="mt-4 flex items-end justify-between gap-3">
        <div class="flex flex-wrap items-baseline gap-2">
          <span
            class="text-lg font-semibold"
            :class="product.oldPrice ? 'text-red-600' : 'text-zinc-950 '"
          >
            {{ formatCurrency(product.currentPrice) }}
          </span>
          <span
            v-if="product.oldPrice"
            class="text-sm text-zinc-400 line-through"
          >
            {{ formatCurrency(product.oldPrice) }}
          </span>
        </div>

        <div
          v-if="productColorValues(product).length"
          class="flex -space-x-1"
        >
          <span
            v-for="color in productColorValues(product).slice(0, 3)"
            :key="`${product.id}-${color}`"
            class="size-4 rounded-full ring-2 ring-white "
            :style="{ backgroundColor: colorToCss(color) }"
          />
        </div>
      </div>

      <div class="mt-4 flex items-center justify-between gap-3 text-xs text-zinc-400">
        <span v-if="product.article">Арт. {{ product.article }}</span>
        <span class="ml-auto">{{ inCart ? `В корзине ${cartQuantity} шт.` : stockLabel(product) }}</span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import {
  colorToCss,
  discountPercent,
  isOutOfStock,
  productBrand,
  productColorValues,
  stockLabel
} from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { ProductCardItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  favorite?: boolean;
  inCart?: boolean;
  cartQuantity?: number;
  loadingCart?: boolean;
  loadingFavorite?: boolean;
  product: ProductCardItem;
}>();

const emit = defineEmits<{
  toggleCart: [product: ProductCardItem];
  toggleFavorite: [product: ProductCardItem];
}>();

const cartButtonIcon = computed(() => props.inCart ? "i-lucide-trash-2" : "i-lucide-shopping-bag");
const cartButtonLabel = computed(() => {
  if (props.inCart) {
    return "Удалить из корзины";
  }

  return isOutOfStock(props.product) ? "Нет в наличии" : "В корзину";
});
const cartButtonClass = computed(() => {
  if (props.inCart) {
    return "bg-red-50/95 text-red-700 hover:bg-red-100";
  }

  if (isOutOfStock(props.product)) {
    return "bg-white/90 text-zinc-500";
  }

  return "";
});

function onToggleCart() {
  emit("toggleCart", props.product);
}

function onToggleFavorite() {
  emit("toggleFavorite", props.product);
}
</script>
