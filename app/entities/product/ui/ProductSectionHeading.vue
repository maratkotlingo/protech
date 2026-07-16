<template>
  <div>
    <p class="text-sm font-medium uppercase tracking-[0.24em] text-emerald-600 ">
      {{ eyebrow }}
    </p>
    <h2 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 ">
      {{ title }}
    </h2>
    <p
      v-if="description"
      class="mt-2 text-base leading-relaxed text-zinc-500 "
    >
      {{ description }}
    </p>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  description?: string;
  eyebrow: string;
  title: string;
}>();
</script>