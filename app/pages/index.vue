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
            <p class="text-xs text-[var(--shop-text-muted)]">загружено</p>
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

          <div class="space-y-4 border-t border-[var(--shop-border)] pt-5">
            <div class="flex items-center justify-between gap-3">
              <h3 class="text-sm font-semibold text-[var(--shop-text)]">
                Характеристики
              </h3>
              <UButton
                v-if="ui.catalog.attributes.length"
                color="neutral"
                variant="ghost"
                size="xs"
                @click="ui.clearCatalogAttributeFilters"
              >
                Очистить
              </UButton>
            </div>

            <div
              v-if="attributesPending"
              class="space-y-3"
            >
              <USkeleton
                v-for="item in 3"
                :key="item"
                class="h-20 rounded-lg"
              />
            </div>

            <div
              v-else-if="attributes.length"
              class="space-y-5"
            >
              <div
                v-for="attribute in attributes"
                :key="attribute.id"
                class="space-y-2"
              >
                <p class="text-sm font-medium text-[var(--shop-text)]">
                  {{ attribute.name }}<span v-if="attribute.unit">, {{ attribute.unit }}</span>
                </p>
                <div class="flex flex-wrap gap-2">
                  <UButton
                    v-for="option in attribute.values"
                    :key="`${attribute.id}-${option.value}`"
                    size="xs"
                    :color="ui.isCatalogAttributeSelected(attribute.id, option.value) ? 'primary' : 'neutral'"
                    :variant="ui.isCatalogAttributeSelected(attribute.id, option.value) ? 'soft' : 'outline'"
                    @click="toggleAttribute(attribute.id, option.value)"
                  >
                    {{ option.value }}
                    <span class="text-[11px] opacity-70">{{ option.count }}</span>
                  </UButton>
                </div>
              </div>
            </div>

            <p
              v-else
              class="text-sm leading-6 text-[var(--shop-text-muted)]"
            >
              Для текущего набора товаров нет дополнительных характеристик.
            </p>
          </div>
        </UCard>
      </aside>

      <div class="min-w-0 space-y-5">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p class="text-sm text-[var(--shop-text-muted)]">
              Загружено {{ products.length }} товаров
            </p>
            <h2 class="text-2xl font-semibold text-[var(--shop-text)]">Карточки товаров</h2>
          </div>
          <UButton
            color="neutral"
            variant="outline"
            :loading="pending"
            @click="reloadProducts"
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

        <div
          ref="loadMoreTarget"
          class="grid min-h-24 place-items-center py-4"
        >
          <div
            v-if="loadingMore"
            class="flex items-center gap-3 text-sm text-[var(--shop-text-muted)]"
          >
            <LoaderCircle class="size-5 animate-spin text-[var(--shop-accent)]" />
            Подгружаю еще товары
          </div>
          <p
            v-else-if="products.length && reachedEnd"
            class="text-sm text-[var(--shop-text-muted)]"
          >
            Все подходящие товары уже показаны
          </p>
          <p
            v-else-if="products.length"
            class="text-sm text-[var(--shop-text-muted)]"
          >
            Прокрутите ниже, чтобы увидеть больше
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { LoaderCircle, PackageSearch, RefreshCw, Search } from "@lucide/vue";
import { useIntersectionObserver, watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import { buildQuery, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { AttributeFilter, Category, ProductCardItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

const PRODUCT_PAGE_SIZE = 20;

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
const products = ref<ProductCardItem[]>([]);
const pending = ref(false);
const loadingMore = ref(false);
const reachedEnd = ref(false);
const error = shallowRef<unknown>(null);
const loadMoreTarget = ref<HTMLElement | null>(null);
const requestVersion = ref(0);
const attributeSelectionKey = computed(() => JSON.stringify(ui.catalog.attributes));
const filterSignature = computed(() => JSON.stringify({
  search: debouncedSearch.value,
  categoryId: ui.catalog.categoryId,
  sort: ui.catalog.sort,
  minPrice: ui.catalog.minPrice,
  maxPrice: ui.catalog.maxPrice,
  discountOnly: ui.catalog.discountOnly,
  attributes: ui.catalog.attributes
}));

watchDebounced(
  () => ui.catalog.search,
  (value) => {
    debouncedSearch.value = value;
  },
  { debounce: 350, maxWait: 1000 }
);

watch(
  () => ui.catalog.categoryId,
  () => {
    ui.clearCatalogAttributeFilters();
  }
);

watch(filterSignature, () => {
  void fetchProducts({ reset: true });
});

useIntersectionObserver(
  loadMoreTarget,
  ([entry]) => {
    if (entry?.isIntersecting) {
      void fetchProducts({ reset: false });
    }
  },
  {
    rootMargin: "640px 0px"
  }
);

const { data: categoriesData } = await useAsyncData(
  "shop-categories",
  () => shopFetch<Category[]>("/api/public/product/categories"),
  { default: () => [] }
);

const attributeQuery = computed(() => buildQuery({
  categoryId: ui.catalog.categoryId
}));

const { data: attributesData, pending: attributesPending } = await useAsyncData(
  "shop-product-attributes",
  () => shopFetch<AttributeFilter[]>(`/api/public/product/attributes${attributeQuery.value}`),
  {
    watch: [attributeQuery],
    default: () => []
  }
);

const categories = computed(() => categoriesData.value ?? []);
const attributes = computed(() => attributesData.value ?? []);
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

await fetchProducts({ reset: true });

function buildProductsQuery(pageNumber: number) {
  return buildQuery({
    page: pageNumber,
    search: debouncedSearch.value,
    categoryId: ui.catalog.categoryId,
    sort: ui.catalog.sort,
    minPrice: ui.catalog.minPrice,
    maxPrice: ui.catalog.maxPrice,
    discountOnly: ui.catalog.discountOnly ? 1 : null,
    attributes: attributeSelectionKey.value === "[]" ? null : attributeSelectionKey.value
  });
}

async function fetchProducts(options: { reset: boolean }) {
  if (!options.reset && (pending.value || loadingMore.value || reachedEnd.value)) {
    return;
  }

  const nextPage = options.reset ? 1 : page.value + 1;
  const currentVersion = requestVersion.value + 1;
  requestVersion.value = currentVersion;

  if (options.reset) {
    pending.value = true;
    reachedEnd.value = false;
  } else {
    loadingMore.value = true;
  }

  try {
    const items = await shopFetch<ProductCardItem[]>(`/api/public/product${buildProductsQuery(nextPage)}`);

    if (requestVersion.value !== currentVersion) {
      return;
    }

    products.value = options.reset ? items : [...products.value, ...items];
    page.value = nextPage;
    reachedEnd.value = items.length < PRODUCT_PAGE_SIZE;
    error.value = null;
  } catch (err) {
    if (requestVersion.value === currentVersion) {
      error.value = err;
    }
  } finally {
    if (requestVersion.value === currentVersion) {
      pending.value = false;
      loadingMore.value = false;
    }
  }
}

async function reloadProducts() {
  await fetchProducts({ reset: true });
}

function toggleAttribute(attributeId: number, value: string) {
  ui.toggleCatalogAttribute(attributeId, value);
}

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
}
</script>
