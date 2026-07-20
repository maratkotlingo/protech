<template>
  <div class="bg-white text-zinc-950">
    <div class="mx-auto w-full max-w-370 px-4 py-4 sm:px-6 lg:px-8 lg:py-6">
      <UButton
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        to="/"
        size="sm"
        class="mb-4 rounded-full bg-[#f9fafb] px-3 text-zinc-600 shadow-sm shadow-zinc-950/5 transition duration-300 hover:scale-[1.02] hover:bg-zinc-100"
      >
        В каталог
      </UButton>

      <div
        v-if="pending"
        class="grid items-start gap-5 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] xl:gap-7"
      >
        <USkeleton class="aspect-[3/4] rounded-2xl" />
        <div class="space-y-3">
          <USkeleton class="h-[34rem] rounded-2xl" />
          <USkeleton class="h-52 rounded-2xl" />
        </div>
      </div>

      <UAlert
        v-else-if="error || !product"
        color="error"
        variant="soft"
        title="Товар не найден"
        :description="productErrorDescription"
        class="rounded-2xl"
      />

      <div
        v-else
        class="space-y-8 lg:space-y-10"
      >
        <section class="grid items-start gap-5 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)] xl:gap-7">
          <ProductGallery
            :main-image="product.mainImage"
            :images="product.productImages"
            :alt="product.name"
          />

          <div class="space-y-3">
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

            <ProductDetailsContent :product="product" />
          </div>
        </section>

        <ProductSpecsGrid :attributes="product.productAttributes" />

        <ProductPriceChart v-if="product.productPrices.length" :prices="product.productPrices" />

        <ProductReviews :product-id="product.id" :reviews="product.reviews" @refresh="refresh()" />
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
