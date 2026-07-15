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
  </section>
</template>

<script setup lang="ts">
defineProps<{
  cartTotal: number;
}>();
</script>
