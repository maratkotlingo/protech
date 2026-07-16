<template>
  <article class="group grid grid-cols-[96px_minmax(0,1fr)] gap-4 rounded-[2rem] bg-white/90 p-4 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10 sm:grid-cols-[112px_minmax(0,1fr)] xl:grid-cols-[120px_minmax(0,1fr)_160px]   ">
    <NuxtLink
      :to="`/product/${item.product.id}`"
      class="relative block size-24 overflow-hidden rounded-[1.5rem] bg-[#f3f4f6] sm:size-28 xl:size-30 "
    >
      <img
        :src="item.product.mainImage || '/favicon.ico'"
        :alt="item.product.name"
        class="size-full object-contain p-2 transition duration-500 group-hover:scale-105"
      >
      <span
        v-if="discountPercent"
        class="absolute left-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-emerald-700 shadow-sm shadow-zinc-950/10 backdrop-blur  "
      >
        -{{ discountPercent }}%
      </span>
    </NuxtLink>

    <div class="min-w-0">
      <div class="flex flex-wrap gap-2">
        <span
          v-if="item.product.category?.name"
          class="rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-medium text-zinc-500  "
        >
          {{ item.product.category.name }}
        </span>
        <span
          v-if="item.product.article"
          class="rounded-full bg-[#f3f4f6] px-3 py-1.5 text-xs font-medium text-zinc-500  "
        >
          Арт. {{ item.product.article }}
        </span>
        <span
          class="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold"
          :class="stockMeta.class"
        >
          <span
            class="size-2 rounded-full"
            :class="stockMeta.dotClass"
          />
          {{ stockMeta.label }}
        </span>
      </div>

      <NuxtLink
        :to="`/product/${item.product.id}`"
        class="mt-3 block line-clamp-2 text-xl font-semibold tracking-normal text-zinc-950 transition hover:text-emerald-700  "
      >
        {{ item.product.name }}
      </NuxtLink>
      <p
        v-if="item.product.description"
        class="mt-2 line-clamp-2 max-w-2xl text-sm leading-6 text-zinc-500 "
      >
        {{ item.product.description }}
      </p>

      <div class="mt-5 flex flex-wrap items-center gap-3">
        <div class="inline-flex items-center gap-2 rounded-[1.35rem] bg-[#f3f4f6] p-1.5 shadow-sm shadow-zinc-950/5 ">
          <button
            type="button"
            class="grid size-10 place-items-center rounded-2xl bg-white text-zinc-700 shadow-sm shadow-zinc-950/5 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:text-emerald-700 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:bg-zinc-100 disabled:text-zinc-300    "
            :disabled="loading || normalizedLocalQuantity <= 1"
            aria-label="Уменьшить количество"
            @click="changeQuantity(normalizedLocalQuantity - 1)"
          >
            <UIcon
              name="i-lucide-minus"
              class="size-4"
            />
          </button>

          <div class="grid min-w-14 place-items-center px-1">
            <input
              v-model="localQuantity"
              class="h-6 w-12 bg-transparent text-center text-base font-semibold text-zinc-950 outline-none "
              type="text"
              inputmode="numeric"
              pattern="[0-9]*"
              aria-label="Количество"
              @blur="commitQuantity"
              @keydown.enter.prevent="commitQuantity"
            >
            <span class="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-400">шт</span>
          </div>

          <button
            type="button"
            class="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-950/15 transition duration-200 hover:-translate-y-0.5 hover:scale-105 hover:bg-emerald-500 active:scale-95 disabled:pointer-events-none disabled:translate-y-0 disabled:scale-100 disabled:bg-zinc-200 disabled:text-zinc-400  "
            :disabled="loading || normalizedLocalQuantity >= maxQuantity"
            aria-label="Увеличить количество"
            @click="changeQuantity(normalizedLocalQuantity + 1)"
          >
            <UIcon
              name="i-lucide-plus"
              class="size-4"
            />
          </button>
        </div>

        <UButton
          color="error"
          variant="soft"
          icon="i-lucide-trash-2"
          class="rounded-full bg-red-50/80 transition duration-300 hover:scale-[1.02] "
          :loading="loading"
          @click="$emit('remove', item.product.id)"
        >
          Удалить
        </UButton>
      </div>
    </div>

    <div class="col-span-2 flex items-center justify-between gap-4 rounded-[1.25rem] bg-[#f9fafb] px-4 py-3 sm:col-span-1 sm:col-start-2 xl:col-auto xl:flex-col xl:items-end xl:justify-start xl:bg-transparent xl:px-0 xl:py-1 xl:text-right  ">
      <div>
        <p class="text-xs uppercase tracking-[0.16em] text-zinc-400">Сумма</p>
        <p class="mt-1 text-xl font-semibold text-zinc-950 ">
          {{ formatCurrency(lineTotal) }}
        </p>
        <p
          v-if="originalLineTotal > lineTotal"
          class="mt-0.5 text-xs text-zinc-400 line-through"
        >
          {{ formatCurrency(originalLineTotal) }}
        </p>
      </div>
      <p class="shrink-0 text-sm text-zinc-500 ">
        {{ formatCurrency(item.product.currentPrice) }} за шт.
      </p>
    </div>
  </article>
</template>

<script setup lang="ts">
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

const localQuantity = ref<number | string>(props.item.quantity);
const maxQuantity = computed(() => Math.max(props.item.product.stockQuantity, 1));
const normalizedLocalQuantity = computed(() => normalizeQuantity(localQuantity.value));
const lineTotal = computed(() => toNumber(props.item.product.currentPrice) * props.item.quantity);
const originalLineTotal = computed(() => {
  const oldPrice = toNumber(props.item.product.oldPrice);

  return oldPrice > toNumber(props.item.product.currentPrice)
    ? oldPrice * props.item.quantity
    : lineTotal.value;
});
const discountPercent = computed(() => {
  const oldPrice = toNumber(props.item.product.oldPrice);
  const currentPrice = toNumber(props.item.product.currentPrice);

  if (oldPrice <= currentPrice) {
    return 0;
  }

  return Math.round(((oldPrice - currentPrice) / oldPrice) * 100);
});
const stockMeta = computed(() => {
  if (!props.item.product.isActive || props.item.product.stockQuantity <= 0) {
    return {
      class: "bg-red-50 text-red-700  ",
      dotClass: "bg-red-500",
      label: "Нет в наличии"
    };
  }

  if (props.item.quantity > props.item.product.stockQuantity) {
    return {
      class: "bg-amber-50 text-amber-700  ",
      dotClass: "bg-amber-500",
      label: `Доступно ${props.item.product.stockQuantity} шт.`
    };
  }

  return {
    class: "bg-emerald-50 text-emerald-700  ",
    dotClass: "bg-emerald-500",
    label: `В наличии ${props.item.product.stockQuantity} шт.`
  };
});

watch(
  () => props.item.quantity,
  (quantity) => {
    localQuantity.value = quantity;
  }
);

function normalizeQuantity(value: number | string) {
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