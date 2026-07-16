<template>
  <section class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur-xl sm:p-5  ">
    <div class="flex flex-wrap items-start justify-between gap-3">
      <div>
        <UBadge
          color="primary"
          variant="soft"
          class="rounded-full"
        >
          Оформление
        </UBadge>
        <h1 class="mt-2 text-2xl font-semibold tracking-normal text-zinc-950 sm:text-3xl ">
          Проверьте заказ
        </h1>
      </div>
      <div class="rounded-full bg-zinc-950 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-zinc-950/10  ">
        {{ formatCurrency(subtotal) }}
      </div>
    </div>

    <dl class="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
      <div
        v-for="item in facts"
        :key="item.label"
        class="rounded-[1.15rem] bg-[#f9fafb] px-3 py-2.5 "
      >
        <dt class="text-xs font-medium text-zinc-400">{{ item.label }}</dt>
        <dd class="mt-1 truncate text-sm font-semibold text-zinc-950">{{ item.value }}</dd>
      </div>
    </dl>
  </section>
</template>

<script setup lang="ts">
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";

defineProps<{
  facts: Array<{
    label: string;
    value: string;
  }>;
  subtotal: number;
}>();
</script>
