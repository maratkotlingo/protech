<template>
  <div class="space-y-5">
    <div class="group relative overflow-hidden rounded-4xl bg-[#f9fafb] p-2 shadow-[0_24px_80px_rgba(15,23,42,0.07)]">
      <div class="relative overflow-hidden rounded-[1.65rem] bg-white">
        <Transition
          mode="out-in"
          enter-active-class="transition duration-300 ease-out"
          enter-from-class="opacity-0 scale-[1.015]"
          enter-to-class="opacity-100 scale-100"
          leave-active-class="transition duration-200 ease-in"
          leave-from-class="opacity-100 scale-100"
          leave-to-class="opacity-0 scale-[0.985]"
        >
          <img
            :key="activeImage.url"
            :src="activeImage.url"
            :alt="alt"
            class="aspect-square w-full bg-zinc-100 object-cover md:aspect-4/4"
          >
        </Transition>

        <div class="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-zinc-950/20 to-transparent" />

        <div class="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-600 shadow-lg shadow-zinc-950/10 backdrop-blur-xl">
          {{ selectedIndex + 1 }} / {{ imageItems.length }}
        </div>

        <UTooltip text="Открыть полноэкранно">
          <UButton
            color="neutral"
            variant="soft"
            icon="i-lucide-expand"
            size="lg"
            square
            class="absolute right-4 top-4 rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
            aria-label="Открыть фото полноэкранно"
            @click="openZoom"
          />
        </UTooltip>

        <div
          v-if="imageItems.length > 1"
          class="absolute bottom-4 right-4 flex gap-2"
        >
          <UTooltip text="Предыдущее фото">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-chevron-left"
              size="lg"
              square
              class="rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
              aria-label="Предыдущее фото"
              @click="previous"
            />
          </UTooltip>

          <UTooltip text="Следующее фото">
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-chevron-right"
              size="lg"
              square
              class="rounded-full bg-white/90 shadow-lg shadow-zinc-950/10 backdrop-blur-xl transition duration-300 hover:scale-105"
              aria-label="Следующее фото"
              @click="next"
            />
          </UTooltip>
        </div>
      </div>
    </div>

    <div
      v-if="imageItems.length > 1"
      v-auto-animate
      class="flex gap-3 overflow-x-auto px-1 pb-2"
    >
      <button
        v-for="(image, index) in imageItems"
        :key="image.url"
        class="shrink-0 rounded-2xl bg-[#f9fafb] p-1.5 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10"
        :class="index === selectedIndex ? 'scale-[1.04] bg-emerald-50 ring-4 ring-emerald-100' : 'ring-4 ring-transparent'"
        type="button"
        :aria-label="`Открыть фото ${index + 1}`"
        @click="selectedIndex = index"
      >
        <img
          :src="image.url"
          :alt="alt"
          class="size-20 rounded-xl object-cover sm:size-24"
          loading="lazy"
        >
      </button>
    </div>

    <UModal
      v-model:open="zoomOpen"
      title="Фото товара"
      :ui="modalUi"
    >
      <template #body>
        <div class="relative bg-zinc-950">
          <img
            :src="activeImage.url"
            :alt="alt"
            class="max-h-[84dvh] w-full object-contain"
          >
          <div
            v-if="imageItems.length > 1"
            class="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4"
          >
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-chevron-left"
              size="xl"
              square
              class="rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Предыдущее фото"
              @click="previous"
            />
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-chevron-right"
              size="xl"
              square
              class="rounded-full bg-white/90 shadow-xl shadow-black/20 backdrop-blur-xl transition hover:scale-105"
              aria-label="Следующее фото"
              @click="next"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  alt: string;
  images: Array<{ id?: number; url: string }>;
  mainImage: string;
}>();

const selectedIndex = ref(0);
const zoomOpen = ref(false);
const fallbackImage = "/favicon.ico";

const imageItems = computed(() => {
  const seen = new Set<string>();

  return [
    { url: props.mainImage || fallbackImage },
    ...props.images
  ].filter((image) => {
    if (!image.url || seen.has(image.url)) {
      return false;
    }

    seen.add(image.url);
    return true;
  });
});

const activeImage = computed(() => imageItems.value[selectedIndex.value] ?? imageItems.value[0] ?? { url: fallbackImage });
const imageSignature = computed(() => imageItems.value.map((image) => image.url).join("|"));
const modalUi = {
  overlay: "bg-zinc-950/70 backdrop-blur-sm",
  content: "max-w-6xl overflow-hidden rounded-[2rem] bg-zinc-950 shadow-2xl shadow-black/30 ring-0",
  body: "p-0"
};

watch(imageSignature, () => {
  selectedIndex.value = 0;
});

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
