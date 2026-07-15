<template>
  <section class="rounded-[2rem] bg-[#f9fafb]/90 p-2 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur dark:bg-zinc-950/85 dark:shadow-black/20">
    <div class="grid gap-3 lg:grid-cols-[minmax(260px,1fr)_minmax(220px,280px)_auto] lg:items-center">
      <UInput
        v-model="search"
        icon="i-lucide-search"
        variant="none"
        size="xl"
        placeholder="Найти товар, бренд или описание"
        class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-900"
        :ui="{
          base: 'h-[3.25rem] rounded-full bg-transparent text-zinc-900 placeholder:text-zinc-400 dark:text-white dark:placeholder:text-zinc-500'
        }"
      />

      <USelectMenu
        v-model="categoryId"
        :items="categoryItems"
        value-key="id"
        label-key="name"
        :search-input="false"
        color="neutral"
        variant="none"
        size="lg"
        icon="i-lucide-layout-grid"
        class="min-w-0 rounded-full bg-white px-1 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900"
        :ui="selectUi"
      />

      <div class="flex flex-wrap items-stretch gap-2 lg:justify-end">
        <USelectMenu
          v-model="sort"
          :items="sortOptions"
          value-key="value"
          label-key="label"
          :search-input="false"
          color="neutral"
          variant="none"
          size="lg"
          icon="i-lucide-arrow-up-down"
          class="w-full rounded-full bg-white px-1 shadow-sm shadow-zinc-950/5 sm:w-52 sm:shrink-0 dark:bg-zinc-900"
          :ui="sortUi"
        />

        <div class="flex h-[3.25rem] items-center gap-3 rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900">
          <span class="text-sm font-medium text-zinc-700 dark:text-zinc-200">Со скидкой</span>
          <USwitch
            v-model="discountOnly"
            color="primary"
            checked-icon="i-lucide-badge-percent"
            unchecked-icon="i-lucide-x"
          />
        </div>

        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          icon="i-lucide-sliders-horizontal"
          class="h-[3.25rem] rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
          @click="$emit('openFilters')"
        >
          Прочее
          <span
            v-if="activeFilterCount"
            class="ml-1 grid size-5 place-items-center rounded-full bg-zinc-950 text-xs text-white dark:bg-white dark:text-zinc-950"
          >
            {{ activeFilterCount }}
          </span>
        </UButton>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type {
  ProductCatalogCategoryItem,
  ProductCatalogSort,
  ProductCatalogSortOption
} from "~~/app/shared/lib/catalogProductHelpers";

defineProps<{
  activeFilterCount: number;
  categoryItems: ProductCatalogCategoryItem[];
  sortOptions: ProductCatalogSortOption[];
}>();

defineEmits<{
  openFilters: [];
}>();

const search = defineModel<string>("search", { required: true });
const categoryId = defineModel<number | null>("categoryId", { required: true });
const sort = defineModel<ProductCatalogSort>("sort", { required: true });
const discountOnly = defineModel<boolean>("discountOnly", { required: true });

const selectUi = {
  base: "h-[3.25rem] rounded-full bg-transparent",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 dark:bg-zinc-900",
  viewport: "p-1"
};
const sortUi = {
  base: "h-[3.25rem] rounded-full bg-transparent",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 dark:bg-zinc-900",
  viewport: "p-1"
};
</script>
