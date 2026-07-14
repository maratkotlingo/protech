<template>
  <section class="space-y-8">
    <ProductSectionHeading
      eyebrow="Детали"
      title="Все важное без лишнего шума"
    />

    <div
      v-if="highlightAttributes.length"
      v-auto-animate
      class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      <ProductAttributeCard
        v-for="attribute in highlightAttributes"
        :key="attribute.id"
        :label="attribute.attribute.name"
        :value="formatProductAttribute(attribute)"
        large
      />
    </div>

    <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(360px,0.72fr)]">
      <div class="rounded-[2rem] bg-[#f9fafb] p-6 shadow-sm shadow-zinc-950/5 sm:p-8 dark:bg-zinc-900/70 dark:shadow-black/20">
        <p class="text-sm font-semibold uppercase tracking-[0.24em] text-zinc-400">Описание</p>
        <h2 class="mt-3 text-3xl font-semibold tracking-normal text-zinc-950 dark:text-white">
          История продукта
        </h2>
        <p class="mt-5 whitespace-pre-line text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">
          {{ product.description }}
        </p>
      </div>

      <div
        v-auto-animate
        class="space-y-3"
      >
        <div
          v-for="section in infoSections"
          :key="section.id"
          class="overflow-hidden rounded-[1.75rem] bg-[#f9fafb] shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/70 dark:shadow-black/20"
        >
          <button
            type="button"
            class="flex w-full items-center justify-between gap-4 p-5 text-left transition duration-300 hover:bg-white/70 dark:hover:bg-zinc-950/40"
            @click="toggleInfoSection(section.id)"
          >
            <span class="flex items-center gap-3">
              <span class="grid size-10 place-items-center rounded-full bg-white text-emerald-600 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70 dark:text-emerald-300">
                <UIcon
                  :name="section.icon"
                  class="size-5"
                />
              </span>
              <span class="font-semibold text-zinc-950 dark:text-white">{{ section.title }}</span>
            </span>
            <UIcon
              name="i-lucide-chevron-down"
              class="size-5 text-zinc-400 transition duration-300"
              :class="isInfoSectionOpen(section.id) ? 'rotate-180' : ''"
            />
          </button>

          <div
            v-if="isInfoSectionOpen(section.id)"
            class="px-5 pb-5 text-sm leading-7 text-zinc-600 dark:text-zinc-300"
          >
            {{ section.body }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import {
  findProductAttributeValue,
  formatProductAttribute
} from "~~/app/entities/product/lib/productDetails";
import type { ProductDetails } from "~~/app/shared/types/shop";

const props = defineProps<{
  product: ProductDetails;
}>();

const openInfoSectionIds = ref(["delivery", "specs"]);
const highlightAttributes = computed(() => props.product.productAttributes.slice(0, 4));
const materialValue = computed(() => findProductAttributeValue(props.product.productAttributes, ["материал", "material"]));
const infoSections = computed(() => [
  {
    id: "materials",
    icon: "i-lucide-sparkles",
    title: "Материалы и уход",
    body: materialValue.value
      ? `Материал: ${materialValue.value}. Для стабильного внешнего вида и ресурса следуйте рекомендациям производителя и избегайте агрессивной химии, если она не указана в инструкции.`
      : "Храните товар в сухом месте, избегайте перегрева и используйте его согласно назначению. Для расходников и аксессуаров ориентируйтесь на рекомендации производителя."
  },
  {
    id: "delivery",
    icon: "i-lucide-truck",
    title: "Доставка и возврат",
    body: "Доступны самовывоз и доставка. Перед оплатой проверьте количество, адрес и способ получения в корзине. Возврат оформляется по правилам магазина и зависит от состояния товара."
  },
  {
    id: "specs",
    icon: "i-lucide-list-checks",
    title: "Технические характеристики",
    body: props.product.productAttributes.length
      ? "Ключевые параметры собраны в блоке характеристик ниже. Значения подтягиваются из карточки товара и обновляются вместе с каталогом."
      : "Для этого товара пока нет расширенных характеристик."
  }
]);

function isInfoSectionOpen(id: string) {
  return openInfoSectionIds.value.includes(id);
}

function toggleInfoSection(id: string) {
  openInfoSectionIds.value = isInfoSectionOpen(id)
    ? openInfoSectionIds.value.filter((sectionId) => sectionId !== id)
    : [...openInfoSectionIds.value, id];
}
</script>
