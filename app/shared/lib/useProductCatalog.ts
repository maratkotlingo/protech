import { useIntersectionObserver, watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import {
  PRODUCT_CATALOG_PAGE_SIZE,
  PRODUCT_CATALOG_PRICE_MAX,
  PRODUCT_CATALOG_PRICE_MIN,
  productCatalogSortOptions
} from "~~/app/shared/lib/catalogProductHelpers";
import { buildQuery, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { AttributeFilter, Category, ProductCardItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useShopUiStore } from "~~/app/stores/shopUi";

export async function useProductCatalog() {
  const route = useRoute();
  const auth = useAuthStore();
  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const ui = useShopUiStore();
  const catalogFetchOptions = {
    forwardRequestHeaders: false,
    headers: import.meta.server ? useRequestHeaders(["cookie"]) : {}
  };

  const filtersOpen = ref(false);
  const page = ref(1);
  const debouncedSearch = ref(ui.catalog.search);
  const products = ref<ProductCardItem[]>([]);
  const pending = ref(false);
  const loadingMore = ref(false);
  const reachedEnd = ref(false);
  const error = shallowRef<unknown>(null);
  const loadMoreTarget = ref<HTMLElement | null>(null);
  const requestVersion = ref(0);

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

  const categoriesAsyncData = useAsyncData(
    "shop-categories",
    () => shopFetch<Category[]>("/api/public/product/categories", catalogFetchOptions),
    { default: () => [] }
  );

  const attributeQuery = computed(() => buildQuery({
    categoryId: ui.catalog.categoryId
  }));

  const attributesAsyncData = useAsyncData(
    "shop-product-attributes",
    () => shopFetch<AttributeFilter[]>(`/api/public/product/attributes${attributeQuery.value}`, catalogFetchOptions),
    {
      watch: [attributeQuery],
      default: () => []
    }
  );
  const { data: categoriesData } = await categoriesAsyncData;
  const { data: attributesData, pending: attributesPending } = await attributesAsyncData;

  const categories = computed(() => categoriesData.value ?? []);
  const attributes = computed(() => attributesData.value ?? []);
  const categoryItems = computed(() => [
    { id: null, name: "Все категории" },
    ...categories.value
  ]);
  const selectedCategoryName = computed(() =>
    categories.value.find((category) => category.id === ui.catalog.categoryId)?.name ?? ""
  );
  const isPriceFiltered = computed(() => ui.catalog.minPrice !== null || ui.catalog.maxPrice !== null);
  const priceMin = computed(() => ui.catalog.minPrice ?? PRODUCT_CATALOG_PRICE_MIN);
  const priceMax = computed(() => ui.catalog.maxPrice ?? PRODUCT_CATALOG_PRICE_MAX);
  const priceRange = computed({
    get: () => [priceMin.value, priceMax.value],
    set: (value: number[]) => {
      const min = value[0] ?? PRODUCT_CATALOG_PRICE_MIN;
      const max = value[1] ?? PRODUCT_CATALOG_PRICE_MAX;

      ui.catalog.minPrice = min > PRODUCT_CATALOG_PRICE_MIN ? min : null;
      ui.catalog.maxPrice = max < PRODUCT_CATALOG_PRICE_MAX ? max : null;
    }
  });

  const activeDrawerFilterCount = computed(() => ui.catalog.attributes.length + (isPriceFiltered.value ? 1 : 0));
  const hasAnyFilter = computed(() => Boolean(
    ui.catalog.search ||
    ui.catalog.categoryId ||
    ui.catalog.discountOnly ||
    isPriceFiltered.value ||
    ui.catalog.attributes.length ||
    ui.catalog.sort !== "newest"
  ));
  const selectedAttributeLabels = computed(() => ui.catalog.attributes.map((selection) => {
    const attribute = attributes.value.find((item) => item.id === selection.attributeId);
    const name = attribute?.name ?? "Фильтр";

    return {
      key: `${selection.attributeId}-${selection.value}`,
      label: `${name}: ${selection.value}`
    };
  }));
  const catalogStatusText = computed(() => {
    if (pending.value && !products.value.length) {
      return "Загружаю товары из базы";
    }

    const suffix = reachedEnd.value ? "все найденные" : "загружено";
    return `${products.value.length} товаров, ${suffix}`;
  });
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
      const items = await shopFetch<ProductCardItem[]>(
        `/api/public/product${buildProductsQuery(nextPage)}`,
        catalogFetchOptions
      );

      if (requestVersion.value !== currentVersion) {
        return;
      }

      products.value = options.reset ? items : [...products.value, ...items];
      page.value = nextPage;
      reachedEnd.value = items.length < PRODUCT_CATALOG_PAGE_SIZE;
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

  function openFilters() {
    filtersOpen.value = true;
  }

  function closeFilters() {
    filtersOpen.value = false;
  }

  function clearAllFilters() {
    ui.resetCatalogFilters();
  }

  function isAttributeSelected(attributeId: number, value: string) {
    return ui.isCatalogAttributeSelected(attributeId, value);
  }

  function toggleAttribute(attributeId: number, value: string) {
    ui.toggleCatalogAttribute(attributeId, value);
  }

  function normalizePriceInput(value: string | number | null | undefined) {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) {
      return null;
    }

    return Math.min(Math.max(Math.round(numberValue), PRODUCT_CATALOG_PRICE_MIN), PRODUCT_CATALOG_PRICE_MAX);
  }

  function setMinPrice(value: string | number | null | undefined) {
    const nextPrice = normalizePriceInput(value);
    const minPrice = Math.min(nextPrice ?? PRODUCT_CATALOG_PRICE_MIN, priceMax.value);

    ui.catalog.minPrice = minPrice > PRODUCT_CATALOG_PRICE_MIN ? minPrice : null;
  }

  function setMaxPrice(value: string | number | null | undefined) {
    const nextPrice = normalizePriceInput(value);
    const maxPrice = Math.max(nextPrice ?? PRODUCT_CATALOG_PRICE_MAX, priceMin.value);

    ui.catalog.maxPrice = maxPrice < PRODUCT_CATALOG_PRICE_MAX ? maxPrice : null;
  }

  async function requireAuth() {
    if (auth.user || await auth.fetchMe()) {
      return true;
    }

    toast.info("Войдите, чтобы добавить товар в корзину или избранное");
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

  return {
    activeDrawerFilterCount,
    addToCart,
    attributes,
    attributesPending,
    cart,
    catalogStatusText,
    categoryItems,
    clearAllFilters,
    closeFilters,
    error,
    favorites,
    filtersOpen,
    hasAnyFilter,
    isAttributeSelected,
    isPriceFiltered,
    loadMoreTarget,
    loadingMore,
    openFilters,
    pending,
    priceMax,
    priceMin,
    priceRange,
    products,
    productCatalogSortOptions,
    reachedEnd,
    selectedAttributeLabels,
    selectedCategoryName,
    setMaxPrice,
    setMinPrice,
    toggleAttribute,
    toggleFavorite,
    ui
  };
}
