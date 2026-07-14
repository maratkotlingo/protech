<template>
  <div class="grid gap-4 rounded-lg border border-[var(--shop-border)] bg-[var(--shop-surface)] p-4 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
    <NuxtLink :to="`/product/${item.product.id}`">
      <img
        :src="item.product.mainImage"
        :alt="item.product.name"
        class="aspect-square w-full rounded-lg object-cover sm:size-28"
      >
    </NuxtLink>

    <div class="min-w-0">
      <NuxtLink
        :to="`/product/${item.product.id}`"
        class="line-clamp-2 text-lg font-semibold text-[var(--shop-text)] transition hover:text-[var(--shop-accent)]"
      >
        {{ item.product.name }}
      </NuxtLink>
      <p class="mt-1 text-sm text-[var(--shop-text-muted)]">
        В наличии {{ item.product.stockQuantity }} шт.
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="flex h-11 items-center rounded-lg border border-[var(--shop-border)]">
          <UButton
            color="neutral"
            variant="ghost"
            square
            :disabled="loading || localQuantity <= 1"
            aria-label="Уменьшить количество"
            @click="changeQuantity(localQuantity - 1)"
          >
            <Minus class="size-4" />
          </UButton>
          <input
            v-model.number="localQuantity"
            class="h-full w-14 bg-transparent text-center text-sm font-semibold outline-none"
            type="number"
            min="1"
            :max="maxQuantity"
            aria-label="Количество"
            @blur="commitQuantity"
            @keydown.enter.prevent="commitQuantity"
          >
          <UButton
            color="neutral"
            variant="ghost"
            square
            :disabled="loading || localQuantity >= maxQuantity"
            aria-label="Увеличить количество"
            @click="changeQuantity(localQuantity + 1)"
          >
            <Plus class="size-4" />
          </UButton>
        </div>

        <UButton
          color="error"
          variant="ghost"
          :loading="loading"
          @click="$emit('remove', item.product.id)"
        >
          <Trash2 class="size-4" />
          Удалить
        </UButton>
      </div>
    </div>

    <div class="text-left sm:min-w-36 sm:text-right">
      <p class="text-xl font-semibold text-[var(--shop-text)]">
        {{ formatCurrency(lineTotal) }}
      </p>
      <p class="mt-1 text-sm text-[var(--shop-text-muted)]">
        {{ formatCurrency(item.product.currentPrice) }} за шт.
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Minus, Plus, Trash2 } from "@lucide/vue";
import { formatCurrency, toNumber } from "~~/app/shared/lib/shopFormatters";
import type { CartItem } from "~~/app/shared/types/shop";

const props = defineProps<{
  item: CartItem;
  loading?: boolean;
}>();

const emit = defineEmits<{
  update: [productId: number, quantity: number];
  remove: [productId: number];
}>();

const localQuantity = ref(props.item.quantity);
const maxQuantity = computed(() => Math.max(props.item.product.stockQuantity, 1));
const lineTotal = computed(() => toNumber(props.item.product.currentPrice) * props.item.quantity);

watch(
  () => props.item.quantity,
  (quantity) => {
    localQuantity.value = quantity;
  }
);

function normalizeQuantity(value: number) {
  return Math.min(Math.max(Number(value) || 1, 1), maxQuantity.value, 99);
}

function changeQuantity(quantity: number) {
  localQuantity.value = normalizeQuantity(quantity);
  commitQuantity();
}

function commitQuantity() {
  const nextQuantity = normalizeQuantity(localQuantity.value);
  localQuantity.value = nextQuantity;

  if (nextQuantity !== props.item.quantity) {
    emit("update", props.item.product.id, nextQuantity);
  }
}
</script>
