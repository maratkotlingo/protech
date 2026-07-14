<template>
  <ProductCatalogCard
    :product="product"
    :favorite="favorite"
    :loading-cart="loadingCart"
    :loading-favorite="loadingFavorite"
    @add-to-cart="$emit('add-to-cart', $event)"
    @toggle-favorite="$emit('toggle-favorite', $event)"
  />
</template>

<script setup lang="ts">
import type { ProductCardItem } from "~~/app/shared/types/shop";

defineProps<{
  product: ProductCardItem;
  favorite?: boolean;
  loadingFavorite?: boolean;
  loadingCart?: boolean;
}>();

defineEmits<{
  "add-to-cart": [product: ProductCardItem];
  "toggle-favorite": [product: ProductCardItem];
}>();
</script>
