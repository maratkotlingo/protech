<template>
  <div class="space-y-4">
    <div class="relative overflow-hidden rounded-lg border border-[var(--shop-border)] bg-[var(--shop-surface)]">
      <img
        :src="activeImage.url"
        :alt="alt"
        class="aspect-square w-full object-cover md:aspect-[5/4]"
      >

      <div class="absolute bottom-4 right-4 flex gap-2">
        <UTooltip text="Предыдущее фото">
          <UButton
            color="neutral"
            variant="soft"
            square
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
        class="overflow-hidden rounded-lg border bg-[var(--shop-surface)] transition"
        :class="index === selectedIndex ? 'border-[var(--shop-accent)] ring-2 ring-[var(--shop-ring)]' : 'border-[var(--shop-border)] hover:border-[var(--shop-accent)]'"
        type="button"
        :aria-label="`Открыть фото ${index + 1}`"
        @click="selectedIndex = index"
      >
        <img
          :src="image.url"
          :alt="alt"
          class="aspect-square w-full object-cover"
          loading="lazy"
        >
      </button>
    </div>

    <UModal
      v-model:open="zoomOpen"
      title="Фото товара"
      :ui="{ content: 'max-w-6xl', body: 'p-0' }"
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
