<template>
  <section class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
    <div class="max-w-3xl">
      <p class="text-sm font-medium uppercase text-emerald-700 dark:text-emerald-300">
        Каталог ProTech
      </p>
      <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">
        Живой каталог из вашей базы.
      </h1>
    </div>

    <div class="flex items-center gap-3 rounded-full bg-white px-4 py-3 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900">
      <span class="text-sm text-zinc-500 dark:text-zinc-400">В корзине</span>
      <span class="grid size-8 place-items-center rounded-full bg-zinc-950 text-sm font-semibold text-white dark:bg-white dark:text-zinc-950">
        {{ cartTotal }}
      </span>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  cartTotal: number;
}>();
</script>
