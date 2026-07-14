<template>
  <UDrawer
    v-model:open="open"
    direction="right"
    :handle="false"
    :handle-only="true"
    :ui="drawerUi"
  >
    <template #header>
      <div class="flex items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium uppercase text-zinc-400">Расширенные</p>
          <h2 class="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-white">
            Фильтры
          </h2>
        </div>

        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-x"
          size="lg"
          square
          class="rounded-full bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
          aria-label="Закрыть фильтры"
          @click="closeDrawer"
        />
      </div>
    </template>

    <template #body>
      <div class="space-y-8">
        <section class="rounded-3xl bg-[#f9fafb] p-5 dark:bg-zinc-800/60">
          <div class="flex items-center justify-between gap-4">
            <div>
              <h3 class="font-semibold text-zinc-950 dark:text-white">Цена</h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {{ formatCurrency(priceMin) }} - {{ formatCurrency(priceMax) }}
              </p>
            </div>
            <UIcon
              name="i-lucide-badge-russian-ruble"
              class="size-5 text-zinc-400"
            />
          </div>

          <USlider
            v-model="priceRange"
            class="mt-6"
            :min="PRODUCT_CATALOG_PRICE_MIN"
            :max="PRODUCT_CATALOG_PRICE_MAX"
            :step="500"
            :min-steps-between-thumbs="2"
            color="primary"
          />

          <div class="mt-4 flex items-center justify-between text-xs font-medium text-zinc-400">
            <span>{{ formatCurrency(PRODUCT_CATALOG_PRICE_MIN) }}</span>
            <span>{{ formatCurrency(PRODUCT_CATALOG_PRICE_MAX) }}</span>
          </div>

          <div class="mt-5 grid grid-cols-2 gap-3">
            <UFormField label="От">
              <UInput
                :model-value="priceMin"
                type="number"
                min="0"
                :max="priceMax"
                variant="none"
                class="rounded-2xl bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-900"
                :ui="{ base: 'h-11 rounded-2xl bg-transparent' }"
                @update:model-value="$emit('setMinPrice', $event)"
              />
            </UFormField>
            <UFormField label="До">
              <UInput
                :model-value="priceMax"
                type="number"
                :min="priceMin"
                :max="PRODUCT_CATALOG_PRICE_MAX"
                variant="none"
                class="rounded-2xl bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-900"
                :ui="{ base: 'h-11 rounded-2xl bg-transparent' }"
                @update:model-value="$emit('setMaxPrice', $event)"
              />
            </UFormField>
          </div>
        </section>

        <div
          v-if="attributesPending"
          class="space-y-3"
        >
          <USkeleton
            v-for="item in 4"
            :key="item"
            class="h-16 rounded-3xl"
          />
        </div>

        <template v-else>
          <section
            v-for="attribute in attributes"
            :key="attribute.id"
          >
            <h3 class="font-semibold text-zinc-950 dark:text-white">
              {{ attribute.name }}<span v-if="attribute.unit" class="text-zinc-400">, {{ attribute.unit }}</span>
            </h3>
            <div
              v-auto-animate
              class="mt-4 grid gap-3"
            >
              <UCheckbox
                v-for="option in visibleAttributeValues(attribute)"
                :key="`${attribute.id}-${option.value}`"
                :label="option.value"
                :model-value="isAttributeSelected(attribute.id, option.value)"
                color="primary"
                class="rounded-2xl bg-[#f9fafb] p-4 dark:bg-zinc-800/60"
                @update:model-value="$emit('toggleAttribute', attribute.id, option.value)"
              >
                <template #label>
                  <span class="flex w-full items-center justify-between gap-3">
                    <span class="flex min-w-0 items-center gap-2">
                      <span
                        v-if="isColorAttribute(attribute)"
                        class="size-4 shrink-0 rounded-full ring-2 ring-white dark:ring-zinc-900"
                        :style="{ backgroundColor: colorToCss(option.value) }"
                      />
                      <span class="truncate">{{ option.value }}</span>
                    </span>
                    <span class="shrink-0 text-xs text-zinc-400">{{ option.count }}</span>
                  </span>
                </template>
              </UCheckbox>
            </div>

            <UButton
              v-if="attribute.values.length > PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS"
              color="neutral"
              variant="ghost"
              size="sm"
              class="mt-3 rounded-full px-3 text-zinc-500"
              :icon="isAttributeExpanded(attribute.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
              @click="toggleAttributeExpanded(attribute.id)"
            >
              {{ isAttributeExpanded(attribute.id) ? "Свернуть" : `Показать все (${attribute.values.length})` }}
            </UButton>
          </section>

          <p
            v-if="!attributes.length"
            class="rounded-3xl bg-[#f9fafb] p-5 text-sm leading-6 text-zinc-500 dark:bg-zinc-800/60 dark:text-zinc-400"
          >
            Для текущей категории пока нет дополнительных характеристик.
          </p>
        </template>
      </div>
    </template>

    <template #footer>
      <div class="flex items-center gap-3">
        <UButton
          color="neutral"
          variant="link"
          size="lg"
          class="shrink-0 rounded-full px-0 text-zinc-500 whitespace-nowrap"
          @click="$emit('clear')"
        >
          Очистить
        </UButton>
        <UButton
          color="neutral"
          variant="solid"
          size="lg"
          icon="i-lucide-check"
          block
          class="rounded-full"
          @click="closeDrawer"
        >
          Применить
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>

<script setup lang="ts">
import {
  PRODUCT_CATALOG_PRICE_MAX,
  PRODUCT_CATALOG_PRICE_MIN,
  PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS,
  colorToCss,
  isColorAttribute
} from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency } from "~~/app/shared/lib/shopFormatters";
import type { AttributeFilter } from "~~/app/shared/types/shop";
import type { ShopCatalogAttributeFilter } from "~~/app/stores/shopUi";

const props = defineProps<{
  attributes: AttributeFilter[];
  attributesPending: boolean;
  priceMax: number;
  priceMin: number;
  selectedAttributes: ShopCatalogAttributeFilter[];
}>();

defineEmits<{
  clear: [];
  setMaxPrice: [value: string | number | null | undefined];
  setMinPrice: [value: string | number | null | undefined];
  toggleAttribute: [attributeId: number, value: string];
}>();

const open = defineModel<boolean>("open", { required: true });
const priceRange = defineModel<number[]>("priceRange", { required: true });
const expandedAttributeIds = ref<number[]>([]);

const drawerUi = {
  overlay: "bg-zinc-950/25 backdrop-blur-sm",
  content: "w-[min(440px,calc(100vw-1rem))] max-w-none rounded-l-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0 dark:bg-zinc-900",
  container: "h-full gap-0 overflow-hidden p-0",
  header: "px-6 pb-4 pt-6",
  body: "min-h-0 flex-1 overflow-y-auto px-6 pb-8",
  footer: "bg-white/95 px-6 py-5 shadow-[0_-18px_40px_rgba(24,24,27,0.06)] backdrop-blur dark:bg-zinc-900/95"
};

function visibleAttributeValues(attribute: AttributeFilter) {
  return isAttributeExpanded(attribute.id)
    ? attribute.values
    : attribute.values.slice(0, PRODUCT_CATALOG_VISIBLE_FILTER_OPTIONS);
}

function isAttributeExpanded(attributeId: number) {
  return expandedAttributeIds.value.includes(attributeId);
}

function toggleAttributeExpanded(attributeId: number) {
  expandedAttributeIds.value = isAttributeExpanded(attributeId)
    ? expandedAttributeIds.value.filter((id) => id !== attributeId)
    : [...expandedAttributeIds.value, attributeId];
}

function isAttributeSelected(attributeId: number, value: string) {
  return props.selectedAttributes.some((item) =>
    item.attributeId === attributeId && item.value === value
  );
}

function closeDrawer() {
  open.value = false;
}
</script>
