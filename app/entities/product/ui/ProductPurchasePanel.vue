<template>
  <aside class="lg:sticky lg:top-8">
    <div
      class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-6  ">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div
class="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium"
          :class="stockStatus.shellClass">
          <span class="relative flex size-2.5">
            <span
v-if="stockQuantity > 0"
              class="absolute inline-flex h-full w-full animate-ping rounded-full opacity-60"
              :class="stockStatus.pulseClass" />
            <span class="relative inline-flex size-2.5 rounded-full" :class="stockStatus.dotClass" />
          </span>
          {{ stockStatus.label }}
        </div>

        <UBadge
color="neutral" variant="soft"
          class="rounded-full bg-white px-3 py-1.5 text-zinc-500 shadow-sm shadow-zinc-950/5  ">
          Арт. {{ product.article }}
        </UBadge>
      </div>

      <div class="mt-8">
        <div class="flex flex-wrap items-center gap-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-emerald-600 ">
            {{ brandName }}
          </p>
          <span class="size-1 rounded-full bg-zinc-300 " />
          <p class="text-sm text-zinc-400">
            {{ product.category.name }}
          </p>
        </div>

        <h1 class="mt-3 text-4xl font-semibold leading-tight tracking-normal text-zinc-950 sm:text-5xl ">
          {{ product.name }}
        </h1>

        <div class="mt-5 flex flex-wrap items-center gap-4 text-sm text-zinc-500 ">
          <span
            class="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 shadow-sm shadow-zinc-950/5 ">
            <UIcon name="i-lucide-star" class="size-4 text-amber-400" :class="averageRating ? 'fill-amber-400' : ''" />
            <span class="font-semibold text-zinc-950 ">{{ averageRatingLabel }}</span>
          </span>
          <span>{{ product.reviews.length }} отзывов</span>
          <span>Обновлено {{ formatDate(product.updatedAt) }}</span>
        </div>
      </div>

      <div class="mt-8 rounded-[1.75rem] bg-white p-5 shadow-sm shadow-zinc-950/5 ">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-zinc-400">Цена</p>
            <div class="mt-1 flex flex-wrap items-end gap-3">
              <p
class="text-4xl font-semibold tracking-normal"
                :class="discountValue ? 'text-red-600 ' : 'text-zinc-950 '">
                {{ formatCurrency(product.currentPrice) }}
              </p>
              <p v-if="product.oldPrice" class="pb-1 text-lg text-zinc-400 line-through">
                {{ formatCurrency(product.oldPrice) }}
              </p>
            </div>
          </div>

          <UBadge v-if="discountValue" color="error" variant="soft" class="rounded-full px-3 py-1.5">
            -{{ discountValue }}%
          </UBadge>
        </div>

        <div class="mt-5 grid gap-3 text-sm text-zinc-500 sm:grid-cols-3 ">
          <div class="rounded-2xl bg-[#f9fafb] p-4 ">
            <p class="font-medium text-zinc-950 ">{{ stockQuantity }} шт.</p>
            <p class="mt-1">На складе</p>
          </div>
          <div class="rounded-2xl bg-[#f9fafb] p-4 ">
            <p class="font-medium text-zinc-950 ">Самовывоз</p>
            <p class="mt-1">или доставка</p>
          </div>
          <div class="rounded-2xl bg-[#f9fafb] p-4 ">
            <p class="font-medium text-zinc-950 ">{{ selectedQuantityTotal }}</p>
            <p class="mt-1">Итого</p>
          </div>
        </div>
      </div>

      <div
        v-if="isInCart"
        class="mt-8 space-y-7"
      >
        <div>
          <div class="mb-3 flex items-center justify-between gap-3">
            <p class="text-sm font-semibold text-zinc-950 ">Количество</p>
            <p class="text-sm text-zinc-400">
              В корзине {{ quantity }} шт.
            </p>
          </div>
          <div
            class="flex items-center justify-between gap-3 rounded-full bg-white p-2 shadow-sm shadow-zinc-950/5 ">
            <UButton
color="neutral" variant="soft" icon="i-lucide-minus" size="lg" square
              class="rounded-full transition hover:scale-105" :disabled="quantity <= 1"
              aria-label="Уменьшить количество" @click="decrementQuantity" />
            <div v-auto-animate class="min-w-20 text-center text-xl font-semibold">
              {{ quantity }}
            </div>
            <UButton
color="neutral" variant="soft" icon="i-lucide-plus" size="lg" square
              class="rounded-full transition hover:scale-105" :disabled="quantity >= maxQuantity || stockQuantity <= 0"
              aria-label="Увеличить количество" @click="incrementQuantity" />
          </div>
        </div>
      </div>

      <div v-auto-animate class="mt-8 grid grid-cols-[auto_minmax(0,1fr)] gap-3">
        <UTooltip :text="isFavorite ? 'Убрать из избранного' : 'В избранное'">
          <UButton
color="neutral" variant="soft" size="xl" square
            class="inline-flex size-14 items-center justify-center rounded-full bg-white p-0 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-105  [&>span]:mx-auto [&>span]:flex [&>span]:items-center [&>span]:justify-center"
            :class="isFavorite ? 'scale-[1.03] text-red-500' : 'text-zinc-700 '"
            :loading="favoriteSyncing" :aria-label="isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'"
            @click="$emit('toggleFavorite')">
            <UIcon
name="i-lucide-heart" class="mx-auto block size-5 transition duration-300"
              :class="isFavorite ? 'scale-110 fill-red-500 text-red-500' : ''" />
          </UButton>
        </UTooltip>

        <UButton
          :color="isInCart ? 'error' : 'primary'"
size="xl" block :icon="cartButtonIcon"
          class="min-h-14 rounded-full shadow-xl shadow-emerald-700/20 transition duration-300 hover:scale-[1.01]"
          :class="isInCart ? 'bg-red-600 text-white shadow-red-700/15 hover:bg-red-600' : ''" :disabled="!isInCart && stockQuantity <= 0"
          :loading="cartSyncing" @click="$emit('addToCart')">
          {{ cartButtonLabel }}
        </UButton>
      </div>

      <UButton
v-if="product.ozonLink" color="neutral" variant="ghost" icon="i-lucide-external-link" size="lg" block
        class="mt-3 rounded-full text-zinc-500 transition duration-300 hover:scale-[1.01] hover:bg-white  "
        :to="product.ozonLink" target="_blank">
        Посмотреть на Ozon
      </UButton>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { formatCurrency, formatDate } from "~~/app/shared/lib/shopFormatters";
import type { ProductDetails } from "~~/app/shared/types/shop";
import type { ProductSizeOption } from "~~/app/entities/product/lib/productDetails";
import type { ProductStockStatus } from "~~/app/entities/product/model/useProductPdp";

const props = defineProps<{
  averageRating: number | null;
  averageRatingLabel: string;
  brandName: string;
  cartButtonIcon: string;
  cartButtonLabel: string;
  cartSyncing: boolean;
  colorOptions: string[];
  discountValue: number;
  favoriteSyncing: boolean;
  isFavorite: boolean;
  isInCart: boolean;
  maxQuantity: number;
  product: ProductDetails;
  selectedQuantityTotal: string;
  selectedSizeLabel: string;
  sizeOptions: ProductSizeOption[];
  stockQuantity: number;
  stockStatus: ProductStockStatus;
}>();

const emit = defineEmits<{
  addToCart: [];
  toggleFavorite: [];
  "update-cart-quantity": [quantity: number];
}>();

const quantity = defineModel<number>("quantity", { required: true });

function decrementQuantity() {
  const nextQuantity = Math.max(quantity.value - 1, 1);
  quantity.value = nextQuantity;

  if (props.isInCart) {
    emit("update-cart-quantity", nextQuantity);
  }
}

function incrementQuantity() {
  const nextQuantity = Math.min(quantity.value + 1, props.maxQuantity);
  quantity.value = nextQuantity;

  if (props.isInCart) {
    emit("update-cart-quantity", nextQuantity);
  }
}
</script>
