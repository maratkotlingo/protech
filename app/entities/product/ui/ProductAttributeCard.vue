<template>
  <div
    class="rounded-[1.75rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5  "
    :class="interactive ? 'transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10' : ''"
  >
    <p class="text-sm leading-6 text-zinc-500 ">
      {{ label }}
    </p>
    <p
      class="mt-2 font-semibold text-zinc-950 "
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