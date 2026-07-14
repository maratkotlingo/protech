<template>
  <div class="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
      <div>
        <UBadge
          color="primary"
          variant="soft"
          class="mb-4"
        >
          Онлайн-каталог
        </UBadge>
        <h1 class="max-w-4xl text-4xl font-semibold tracking-normal text-[var(--shop-text)] sm:text-5xl">
          Товары ProTech
        </h1>
        <p class="mt-4 max-w-3xl text-base leading-7 text-[var(--shop-text-muted)] sm:text-lg">
          Выбирайте технику, аксессуары и комплектующие, сравнивайте цены, сохраняйте избранное и оформляйте заказ с доставкой.
        </p>
      </div>

      <UCard
        class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
        :ui="{ body: 'p-5' }"
      >
        <div class="grid grid-cols-3 gap-3 text-center">
          <div>
            <p class="text-2xl font-semibold text-[var(--shop-text)]">{{ products.length }}</p>
            <p class="text-xs text-[var(--shop-text-muted)]">на странице</p>
          </div>
          <div>
            <p class="text-2xl font-semibold text-[var(--shop-text)]">{{ categories.length }}</p>
            <p class="text-xs text-[var(--shop-text-muted)]">категорий</p>
          </div>
          <div>
            <p class="text-2xl font-semibold text-[var(--shop-text)]">{{ favorites.count }}</p>
            <p class="text-xs text-[var(--shop-text-muted)]">избранных</p>
          </div>
        </div>
      </UCard>
    </section>

    <section class="mt-8 grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
      <aside class="lg:sticky lg:top-24 lg:self-start">
        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'space-y-5 p-5' }"
        >
          <div class="flex items-center justify-between gap-3">
            <h2 class="text-lg font-semibold text-[var(--shop-text)]">Фильтры</h2>
            <UButton
              color="neutral"
              variant="ghost"
              size="sm"
              @click="resetFilters"
            >
              Сбросить
            </UButton>
          </div>

          <UFormField label="Поиск">
            <UInput
              v-model="ui.catalog.search"
              class="w-full"
              size="lg"
              placeholder="Название или описание"
            >
              <template #leading>
                <Search class="size-4 text-[var(--shop-text-muted)]" />
              </template>
            </UInput>
          </UFormField>

          <UFormField label="Категория">
            <USelect
              v-model="ui.catalog.categoryId"
              class="w-full"
              size="lg"
              :items="categoryItems"
              placeholder="Все категории"
            />
          </UFormField>

          <UFormField label="Сортировка">
            <USelect
              v-model="ui.catalog.sort"
              class="w-full"
              size="lg"
              :items="sortItems"
            />
          </UFormField>

          <div class="grid grid-cols-2 gap-3">
            <UFormField label="Цена от">
              <UInput
                v-model.number="ui.catalog.minPrice"
                class="w-full"
                size="lg"
                type="number"
                min="0"
                placeholder="0"
              />
            </UFormField>
            <UFormField label="Цена до">
              <UInput
                v-model.number="ui.catalog.maxPrice"
                class="w-full"
                size="lg"
                type="number"
                min="0"
                placeholder="50000"
              />
            </UFormField>
          </div>

          <USwitch
            v-model="ui.catalog.discountOnly"
            label="Только со скидкой"
          />
        </UCard>
      </aside>

      <div class="min-w-0 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm text-[var(--shop-text-muted)]">
              Страница {{ page }}
            </p>
            <h2 class="text-2xl font-semibold text-[var(--shop-text)]">Карточки товаров</h2>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="refresh()"
          >
            <RefreshCw class="size-4" />
            Обновить
          </UButton>
        </div>

        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Не удалось загрузить товары"
          :description="getErrorMessage(error)"
        />

        <div
          v-if="pending && !products.length"
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <USkeleton
            v-for="item in 6"
            :key="item"
            class="h-[430px] rounded-lg"
          />
        </div>

        <div
          v-else-if="products.length"
          v-auto-animate
          class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3"
        >
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
            :favorite="favoriteProductIds.includes(product.id)"
            :loading-favorite="favorites.syncingProductId === product.id"
            :loading-cart="cart.syncingProductId === product.id"
            @add-to-cart="addToCart"
            @toggle-favorite="toggleFavorite"
          />
        </div>

        <div
          v-else
          class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
        >
          <div>
            <PackageSearch class="mx-auto size-12 text-[var(--shop-text-muted)]" />
            <h3 class="mt-4 text-xl font-semibold text-[var(--shop-text)]">Товары не найдены</h3>
            <p class="mt-2 text-sm text-[var(--shop-text-muted)]">
              Попробуйте изменить фильтры или поисковый запрос.
            </p>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <UButton
            color="neutral"
            variant="outline"
            :disabled="page <= 1 || pending"
            @click="previousPage"
          >
            <ChevronLeft class="size-4" />
            Назад
          </UButton>
          <UButton
            color="primary"
            variant="soft"
            :disabled="!canGoNext || pending"
            @click="nextPage"
          >
            Вперед
            <ChevronRight class="size-4" />
          </UButton>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ChevronLeft, ChevronRight, PackageSearch, RefreshCw, Search } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import { buildQuery, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { Category, ProductCardItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

useSeoMeta({
  title: "Каталог товаров",
  description: "Каталог товаров ProTech с фильтрами, избранным, корзиной и быстрым оформлением заказа.",
  ogTitle: "Каталог товаров ProTech",
  ogDescription: "Выбирайте технику, аксессуары и комплектующие в каталоге ProTech."
});

const route = useRoute();
const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const ui = useShopUiStore();
const page = ref(1);
const debouncedSearch = ref(ui.catalog.search);

watchDebounced(
  () => ui.catalog.search,
  (value) => {
    debouncedSearch.value = value;
    page.value = 1;
  },
  { debounce: 350, maxWait: 1000 }
);

watch(
  () => [
    ui.catalog.categoryId,
    ui.catalog.sort,
    ui.catalog.minPrice,
    ui.catalog.maxPrice,
    ui.catalog.discountOnly
  ],
  () => {
    page.value = 1;
  }
);

const productQuery = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  categoryId: ui.catalog.categoryId,
  sort: ui.catalog.sort,
  minPrice: ui.catalog.minPrice,
  maxPrice: ui.catalog.maxPrice,
  discountOnly: ui.catalog.discountOnly ? 1 : null
}));

const { data: categoriesData } = await useAsyncData(
  "shop-categories",
  () => shopFetch<Category[]>("/api/public/product/categories"),
  { default: () => [] }
);

const { data: productsData, pending, error, refresh } = await useAsyncData(
  "shop-products",
  () => shopFetch<ProductCardItem[]>(`/api/public/product${productQuery.value}`),
  {
    watch: [productQuery],
    default: () => []
  }
);

const categories = computed(() => categoriesData.value ?? []);
const products = computed(() => productsData.value ?? []);
const canGoNext = computed(() => products.value.length === 20);
const favoriteProductIds = computed(() => favorites.productIds);
const categoryItems = computed(() => [
  { label: "Все категории", value: null },
  ...categories.value.map((category) => ({
    label: category.name,
    value: category.id
  }))
]);
const sortItems = [
  { label: "Сначала новые", value: "newest" },
  { label: "Сначала дешевле", value: "price_asc" },
  { label: "Сначала дороже", value: "price_desc" },
  { label: "Сначала старые", value: "oldest" }
];

async function requireAuth() {
  if (auth.user || await auth.fetchMe()) {
    return true;
  }

  toast.info("Войдите, чтобы сохранить товар или добавить его в корзину");
  await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
  return false;
}

async function addToCart(product: ProductCardItem) {
  if (!await requireAuth()) {
    return;
  }

  try {
    await cart.add(product.id);
    toast.success("Товар добавлен в корзину");
  } catch (err) {
    toast.error(getErrorMessage(err, "Не удалось добавить товар в корзину"));
  }
}

async function toggleFavorite(product: ProductCardItem) {
  if (!await requireAuth()) {
    return;
  }

  try {
    await favorites.toggle(product.id);
    toast.success(favorites.isFavorite(product.id) ? "Товар в избранном" : "Товар удален из избранного");
  } catch (err) {
    toast.error(getErrorMessage(err, "Не удалось обновить избранное"));
  }
}

function resetFilters() {
  ui.resetCatalogFilters();
  page.value = 1;
}

function previousPage() {
  page.value -= 1;
}

function nextPage() {
  page.value += 1;
}
</script>
