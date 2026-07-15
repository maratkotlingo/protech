<template>
  <div class="bg-white text-zinc-950 dark:bg-zinc-950 dark:text-white">
    <div class="mx-auto w-full max-w-[1480px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        to="/"
        class="mb-8 rounded-full bg-[#f9fafb] px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-[1.02] hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        В каталог
      </UButton>

      <div
        v-if="pending"
        class="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.82fr)]"
      >
        <USkeleton class="aspect-square rounded-[2rem] md:aspect-[5/4]" />
        <USkeleton class="h-[42rem] rounded-[2rem]" />
      </div>

      <UAlert
        v-else-if="error || !product"
        color="error"
        variant="soft"
        title="Товар не найден"
        :description="productErrorDescription"
        class="rounded-3xl"
      />

      <div
        v-else
        class="space-y-16 lg:space-y-24"
      >
        <section class="grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(400px,0.82fr)] xl:gap-14">
          <ProductGallery
            :main-image="product.mainImage"
            :images="product.productImages"
            :alt="product.name"
          />

          <ProductPurchasePanel
            v-model:quantity="quantity"
            v-model:selected-size="selectedSize"
            v-model:selected-color="selectedColor"
            :product="product"
            :stock-quantity="stockQuantity"
            :stock-status="stockStatus"
            :brand-name="brandName"
            :average-rating="averageRating"
            :average-rating-label="averageRatingLabel"
            :discount-value="discountValue"
            :selected-quantity-total="selectedQuantityTotal"
            :size-options="sizeOptions"
            :selected-size-label="selectedSizeLabel"
            :color-options="colorOptions"
            :max-quantity="maxQuantity"
            :is-favorite="isFavorite"
            :is-in-cart="isInCart"
            :cart-syncing="cartSyncing"
            :favorite-syncing="favoriteSyncing"
            :cart-button-icon="cartButtonIcon"
            :cart-button-label="cartButtonLabel"
            @add-to-cart="addToCart"
            @toggle-favorite="toggleFavorite"
            @update-cart-quantity="updateCartQuantity"
          />
        </section>

        <ProductDetailsContent :product="product" />

        <ProductSpecsGrid :attributes="product.productAttributes" />

        <ProductPriceChart
          v-if="product.productPrices.length"
          :prices="product.productPrices"
        />

        <ProductReviews
          :product-id="product.id"
          :reviews="product.reviews"
          @refresh="refresh()"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useProductPdp } from "~~/app/entities/product/model/useProductPdp";

const {
  addToCart,
  averageRating,
  averageRatingLabel,
  brandName,
  cartButtonIcon,
  cartButtonLabel,
  cartSyncing,
  colorOptions,
  discountValue,
  error,
  favoriteSyncing,
  isFavorite,
  isInCart,
  maxQuantity,
  pending,
  product,
  productErrorDescription,
  quantity,
  refresh,
  selectedColor,
  selectedQuantityTotal,
  selectedSize,
  selectedSizeLabel,
  sizeOptions,
  stockQuantity,
  stockStatus,
  toggleFavorite,
  updateCartQuantity
} = useProductPdp();
</script>
