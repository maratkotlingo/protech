<template>
  <div class="grid gap-4 rounded-3xl bg-white p-3 shadow-sm shadow-zinc-950/5 sm:grid-cols-[128px_minmax(0,1fr)_auto] sm:items-center dark:bg-zinc-900 dark:shadow-black/20">
    <NuxtLink
      :to="`/product/${item.product.id}`"
      class="overflow-hidden rounded-[1.45rem] bg-zinc-100 dark:bg-zinc-800"
    >
      <img
        :src="item.product.mainImage || '/favicon.ico'"
        :alt="item.product.name"
        class="aspect-square w-full object-cover transition duration-500 hover:scale-105 sm:size-28"
      >
    </NuxtLink>

    <div class="min-w-0 px-1 sm:px-0">
      <NuxtLink
        :to="`/product/${item.product.id}`"
        class="line-clamp-2 text-lg font-semibold text-zinc-950 transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
      >
        {{ item.product.name }}
      </NuxtLink>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        В наличии {{ item.product.stockQuantity }} шт.
      </p>
      <div class="mt-4 flex flex-wrap items-center gap-3">
        <div class="flex h-11 items-center rounded-full bg-[#f9fafb] shadow-inner shadow-zinc-950/5 dark:bg-zinc-800">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            square
            :disabled="loading || localQuantity <= 1"
            aria-label="Уменьшить количество"
            @click="changeQuantity(localQuantity - 1)"
          >
            <Minus class="size-4" />
          </UButton>
          <input
            v-model.number="localQuantity"
            class="h-full w-14 bg-transparent text-center text-sm font-semibold text-zinc-950 outline-none dark:text-white"
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
            class="rounded-full"
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
          class="rounded-full"
          :loading="loading"
          @click="$emit('remove', item.product.id)"
        >
          <Trash2 class="size-4" />
          Удалить
        </UButton>
      </div>
    </div>

    <div class="text-left sm:min-w-36 sm:text-right">
      <p class="text-xl font-semibold text-zinc-950 dark:text-white">
        {{ formatCurrency(lineTotal) }}
      </p>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
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
