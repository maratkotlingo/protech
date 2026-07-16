<template>
  <section class="space-y-6">
    <ProductSectionHeading
      eyebrow="Описание"
      title="Описание товара"
    />

    <div class="rounded-[2rem] bg-[#f9fafb] p-6 shadow-sm shadow-zinc-950/5 sm:p-8">
      <p class="whitespace-pre-line text-lg leading-relaxed text-zinc-600">
        {{ product.description }}
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { ProductDetails } from "~~/app/shared/types/shop";

defineProps<{
  product: ProductDetails;
}>();
</script>
