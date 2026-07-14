<template>
  <div class="space-y-4">
    <div class="relative overflow-hidden rounded-[2rem] bg-white p-3 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20">
      <img
        :src="activeImage.url"
        :alt="alt"
        class="aspect-square w-full rounded-[1.45rem] bg-zinc-100 object-cover dark:bg-zinc-800 md:aspect-[5/4]"
      >

      <div class="absolute bottom-4 right-4 flex gap-2">
        <UTooltip text="Предыдущее фото">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur dark:bg-zinc-900/85"
            :disabled="imageItems.length < 2"
            aria-label="Предыдущее фото"
            @click="previous"
          >
            <ChevronLeft class="size-5" />
          </UButton>
        </UTooltip>
        <UTooltip text="Увеличить">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur dark:bg-zinc-900/85"
            aria-label="Увеличить фото"
            @click="openZoom"
          >
            <ZoomIn class="size-5" />
          </UButton>
        </UTooltip>
        <UTooltip text="Следующее фото">
          <UButton
            color="neutral"
            variant="soft"
            square
            class="rounded-full bg-white/90 shadow-sm shadow-zinc-950/10 backdrop-blur dark:bg-zinc-900/85"
            :disabled="imageItems.length < 2"
            aria-label="Следующее фото"
            @click="next"
          >
            <ChevronRight class="size-5" />
          </UButton>
        </UTooltip>
      </div>
    </div>

    <div
      v-if="imageItems.length > 1"
      v-auto-animate
      class="grid grid-cols-5 gap-3 sm:grid-cols-6"
    >
      <button
        v-for="(image, index) in imageItems"
        :key="image.url"
        class="overflow-hidden rounded-2xl bg-white p-1 shadow-sm shadow-zinc-950/5 transition dark:bg-zinc-900"
        :class="index === selectedIndex ? 'ring-2 ring-emerald-500' : 'hover:ring-2 hover:ring-emerald-200 dark:hover:ring-emerald-800'"
        type="button"
        :aria-label="`Открыть фото ${index + 1}`"
        @click="selectedIndex = index"
      >
        <img
          :src="image.url"
          :alt="alt"
          class="aspect-square w-full rounded-xl object-cover"
          loading="lazy"
        >
      </button>
    </div>

    <UModal
      v-model:open="zoomOpen"
      title="Фото товара"
      :ui="{ content: 'max-w-6xl rounded-[2rem] overflow-hidden', body: 'p-0' }"
    >
      <template #body>
        <div class="bg-black">
          <img
            :src="activeImage.url"
            :alt="alt"
            class="max-h-[82dvh] w-full object-contain"
          >
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, ZoomIn } from "@lucide/vue";

const props = defineProps<{
  mainImage: string;
  images: Array<{ id?: number; url: string }>;
  alt: string;
}>();

const selectedIndex = ref(0);
const zoomOpen = ref(false);

const imageItems = computed(() => {
  const seen = new Set<string>();

  return [
    { url: props.mainImage },
    ...props.images
  ].filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
});

const activeImage = computed(() => imageItems.value[selectedIndex.value] ?? imageItems.value[0] ?? { url: props.mainImage });

watch(
  () => imageItems.value.length,
  () => {
    selectedIndex.value = 0;
  }
);

function previous() {
  selectedIndex.value = selectedIndex.value === 0 ? imageItems.value.length - 1 : selectedIndex.value - 1;
}

function next() {
  selectedIndex.value = selectedIndex.value === imageItems.value.length - 1 ? 0 : selectedIndex.value + 1;
}

function openZoom() {
  zoomOpen.value = true;
}
</script>
