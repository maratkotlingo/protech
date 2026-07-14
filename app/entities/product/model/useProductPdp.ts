import { toast } from "vue-sonner";
import {
  discountPercent,
  productBrand,
  productColorValues
} from "~~/app/shared/lib/catalogProductHelpers";
import { formatCurrency, getErrorMessage, toNumber } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ProductDetails } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import {
  formatProductAttribute,
  isVariantAttribute
} from "~~/app/entities/product/lib/productDetails";

export type ProductStockStatus = {
  dotClass: string;
  label: string;
  pulseClass: string;
  shellClass: string;
};

export function useProductPdp() {
  const route = useRoute();
  const auth = useAuthStore();
  const cart = useCartStore();
  const favorites = useFavoritesStore();
  const quantity = ref(1);
  const selectedSize = ref("");
  const selectedColor = ref("");
  const cartAdded = ref(false);
  const productId = computed(() => Number(route.params.id));
  let cartSuccessTimer: ReturnType<typeof setTimeout> | undefined;

  const { data: product, pending, error, refresh } = useAsyncData(
    () => `shop-product-${productId.value}`,
    () => shopFetch<ProductDetails>(`/api/public/product/${productId.value}`),
    { watch: [productId] }
  );

  useSeoMeta({
    title: () => product.value?.name ?? "Товар",
    description: () => product.value?.description?.slice(0, 160) ?? "Карточка товара ProTech",
    ogTitle: () => product.value?.name ?? "Товар ProTech",
    ogDescription: () => product.value?.description?.slice(0, 160) ?? "Карточка товара ProTech",
    ogImage: () => product.value?.mainImage
  });

  const stockQuantity = computed(() => product.value?.productStocks[0]?.quantity ?? 0);
  const maxQuantity = computed(() => Math.max(Math.min(stockQuantity.value, 99), 1));
  const selectedQuantityTotal = computed(() => formatCurrency(toNumber(product.value?.currentPrice) * quantity.value));
  const brandName = computed(() => product.value ? productBrand(product.value) : "ProTech");
  const colorOptions = computed(() => product.value ? productColorValues(product.value) : []);
  const discountValue = computed(() => product.value ? discountPercent(product.value) : 0);
  const isFavorite = computed(() => product.value ? favorites.productIds.includes(product.value.id) : false);
  const averageRating = computed(() => {
    const reviews = product.value?.reviews ?? [];

    if (!reviews.length) {
      return null;
    }

    return reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  });
  const averageRatingLabel = computed(() => averageRating.value ? averageRating.value.toFixed(1) : "—");
  const cartButtonIcon = computed(() => cartAdded.value ? "i-lucide-check" : "i-lucide-shopping-bag");
  const cartButtonLabel = computed(() => stockQuantity.value <= 0 ? "Нет в наличии" : cartAdded.value ? "Добавлено" : "Добавить в корзину");
  const cartSyncing = computed(() => product.value ? cart.syncingProductId === product.value.id : false);
  const favoriteSyncing = computed(() => product.value ? favorites.syncingProductId === product.value.id : false);
  const productErrorDescription = computed(() => getErrorMessage(error.value, "Не удалось загрузить карточку товара"));
  const sizeOptions = computed(() => {
    const attributes = product.value?.productAttributes ?? [];

    return attributes
      .filter(isVariantAttribute)
      .map((attribute) => ({
        caption: attribute.attribute.name,
        label: formatProductAttribute(attribute),
        value: `${attribute.attribute.id}:${attribute.value}:${attribute.attribute.unit}`
      }))
      .slice(0, 6);
  });
  const selectedSizeLabel = computed(() => sizeOptions.value.find((option) => option.value === selectedSize.value)?.label ?? "Не выбран");
  const stockStatus = computed<ProductStockStatus>(() => {
    if (stockQuantity.value <= 0) {
      return {
        dotClass: "bg-zinc-400",
        label: "Нет в наличии",
        pulseClass: "bg-zinc-300",
        shellClass: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
      };
    }

    if (stockQuantity.value <= 3) {
      return {
        dotClass: "bg-orange-500",
        label: `Осталось ${stockQuantity.value} шт.`,
        pulseClass: "bg-orange-400",
        shellClass: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-200"
      };
    }

    return {
      dotClass: "bg-emerald-500",
      label: "В наличии",
      pulseClass: "bg-emerald-400",
      shellClass: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200"
    };
  });

  watch(stockQuantity, normalizeQuantity);
  watch(sizeOptions, (options) => {
    if (!options.some((option) => option.value === selectedSize.value)) {
      selectedSize.value = options[0]?.value ?? "";
    }
  }, { immediate: true });
  watch(colorOptions, (options) => {
    if (!options.includes(selectedColor.value)) {
      selectedColor.value = options[0] ?? "";
    }
  }, { immediate: true });

  onBeforeUnmount(() => {
    if (cartSuccessTimer) {
      clearTimeout(cartSuccessTimer);
    }
  });

  function normalizeQuantity() {
    quantity.value = Math.min(Math.max(Number(quantity.value) || 1, 1), maxQuantity.value);
  }

  async function requireAuth() {
    if (auth.user || await auth.fetchMe()) {
      return true;
    }

    toast.info("Войдите, чтобы продолжить покупку");
    await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
    return false;
  }

  async function addToCart() {
    if (!product.value || stockQuantity.value <= 0 || !await requireAuth()) {
      return;
    }

    normalizeQuantity();

    try {
      await cart.add(product.value.id);

      if (quantity.value > 1) {
        await cart.updateQuantity(product.value.id, quantity.value);
      }

      cartAdded.value = true;
      toast.success("Товар добавлен в корзину");

      if (cartSuccessTimer) {
        clearTimeout(cartSuccessTimer);
      }

      cartSuccessTimer = setTimeout(() => {
        cartAdded.value = false;
      }, 1800);
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось добавить товар в корзину"));
    }
  }

  async function toggleFavorite() {
    if (!product.value || !await requireAuth()) {
      return;
    }

    try {
      await favorites.toggle(product.value.id);
      toast.success(favorites.isFavorite(product.value.id) ? "Товар в избранном" : "Товар удален из избранного");
    } catch (err) {
      toast.error(getErrorMessage(err, "Не удалось обновить избранное"));
    }
  }

  return {
    addToCart,
    averageRating,
    averageRatingLabel,
    brandName,
    cartAdded,
    cartButtonIcon,
    cartButtonLabel,
    cartSyncing,
    colorOptions,
    discountValue,
    error,
    favoriteSyncing,
    isFavorite,
    maxQuantity,
    pending,
    product,
    productErrorDescription,
    quantity,
    refresh,
    selectedColor,
    selectedQuantityTotal,
    selectedSize,
    selectedSizeLabel,
    sizeOptions,
    stockQuantity,
    stockStatus,
    toggleFavorite
  };
}
