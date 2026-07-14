<template>
  <div
    class="rounded-[1.75rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/70 dark:shadow-black/20"
    :class="interactive ? 'transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10 dark:hover:bg-zinc-900' : ''"
  >
    <p class="text-sm leading-6 text-zinc-500 dark:text-zinc-400">
      {{ label }}
    </p>
    <p
      class="mt-2 font-semibold text-zinc-950 dark:text-white"
      :class="large ? 'text-lg' : 'text-base'"
    >
      {{ value }}
    </p>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  interactive?: boolean;
  label: string;
  large?: boolean;
  value: string;
}>(), {
  interactive: false,
  large: false
});
</script>
