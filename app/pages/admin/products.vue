<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Товары"
      kicker="Catalog"
      description="Создание, редактирование, медиа, цены, категории, характеристики и видимость товаров."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-4" />
          Обновить
        </UButton>
        <UButton
          color="primary"
          @click="openCreate"
        >
          <Plus class="size-4" />
          Добавить товар
        </UButton>
      </template>
    </AdminPageHeader>

    <UCard
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="grid gap-4 lg:grid-cols-[1fr_280px_220px]">
        <UFormField label="Поиск">
          <UInput
            v-model="filters.products.search"
            class="w-full"
            size="lg"
            placeholder="Название или артикул"
          >
            <template #leading>
              <Search class="size-4 text-[var(--admin-text-muted)]" />
            </template>
          </UInput>
        </UFormField>
        <UFormField label="Категория">
          <USelect
            v-model="filters.products.categoryId"
            class="w-full"
            size="lg"
            :items="categoryFilterItems"
            placeholder="Все категории"
          />
        </UFormField>
        <UFormField label="Статус">
          <USelect
            v-model="filters.products.isActive"
            class="w-full"
            size="lg"
            :items="statusItems"
          />
        </UFormField>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить товары"
      :description="getErrorMessage(error)"
    />

    <UCard
      class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-0' }"
    >
      <div
        v-if="selectedProductIds.length"
        class="flex flex-wrap items-end justify-between gap-3 border-b border-[var(--admin-border)] bg-[var(--admin-surface-muted)] px-4 py-3"
      >
        <div>
          <p class="text-lg font-semibold text-[var(--admin-text)]">
            Выбрано товаров: {{ selectedProductIds.length }}
          </p>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Массовые операции применяются к выбранным строкам текущей выдачи.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UButton
            color="primary"
            variant="soft"
            :loading="bulkLoading === 'activate'"
            @click="bulkSetActive(true)"
          >
            <CheckCircle2 class="size-4" />
            Включить
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            :loading="bulkLoading === 'deactivate'"
            @click="bulkSetActive(false)"
          >
            <CircleOff class="size-4" />
            Выключить
          </UButton>
          <USelect
            v-model="bulkCategoryId"
            :items="bulkCategoryItems"
            placeholder="Категория"
            class="w-full sm:w-64"
            size="lg"
          />
          <UButton
            color="primary"
            variant="outline"
            :disabled="!bulkCategoryId"
            :loading="bulkLoading === 'changeCategory'"
            @click="bulkChangeCategory"
          >
            <Tags class="size-4" />
            Сменить категорию
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            @click="exportSelectedProducts"
          >
            <Download class="size-4" />
            Экспорт
          </UButton>
          <UButton
            color="error"
            variant="soft"
            :loading="bulkLoading === 'delete'"
            @click="confirmBulkDelete"
          >
            <Trash2 class="size-4" />
            Удалить
          </UButton>
        </div>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-[980px] divide-y divide-[var(--admin-border)] text-sm">
          <thead class="bg-[var(--admin-surface-muted)]">
            <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
              <th class="w-12 px-4 py-3">
                <input
                  v-model="allProductsOnPageSelected"
                  class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  aria-label="Выбрать все товары на странице"
                >
              </th>
              <th class="px-4 py-3 font-medium">Товар</th>
              <th class="px-4 py-3 font-medium">Категория</th>
              <th class="px-4 py-3 font-medium">Цена</th>
              <th class="px-4 py-3 font-medium">Остаток</th>
              <th class="px-4 py-3 font-medium">Статус</th>
              <th class="px-4 py-3 font-medium">Активность</th>
              <th class="px-4 py-3 text-right font-medium">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--admin-border)]">
            <tr
              v-for="product in products"
              :key="product.id"
              class="align-top transition hover:bg-[var(--admin-surface-muted)]"
            >
              <td class="px-4 py-4">
                <input
                  :checked="selectedProductIds.includes(product.id)"
                  class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  :aria-label="`Выбрать товар ${product.name}`"
                  @change="toggleProductSelection(product.id, $event)"
                >
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-3">
                  <img
                    :src="product.mainImage"
                    alt=""
                    class="size-14 rounded-lg object-cover"
                  >
                  <div class="min-w-0">
                    <p class="truncate font-medium text-[var(--admin-text)]">
                      {{ product.name }}
                    </p>
                    <p class="mt-1 truncate text-sm text-[var(--admin-text-muted)]">
                      {{ product.article }}
                    </p>
                    <p class="mt-2 line-clamp-2 max-w-md text-sm text-[var(--admin-text-muted)]">
                      {{ product.description }}
                    </p>
                  </div>
                </div>
              </td>
              <td class="px-4 py-4 text-[var(--admin-text)]">
                {{ product.category.name }}
              </td>
              <td class="px-4 py-4">
                <p class="font-semibold text-[var(--admin-text)]">
                  {{ formatCurrency(product.currentPrice) }}
                </p>
                <p
                  v-if="product.oldPrice"
                  class="text-xs text-[var(--admin-text-muted)] line-through"
                >
                  {{ formatCurrency(product.oldPrice) }}
                </p>
              </td>
              <td class="px-4 py-4">
                <div class="space-y-1">
                  <p class="font-medium text-[var(--admin-text)]">
                    {{ stockQuantity(product) }} шт.
                  </p>
                  <AdminStatusBadge
                    type="stock"
                    :value="stockQuantity(product)"
                  />
                </div>
              </td>
              <td class="px-4 py-4">
                <AdminStatusBadge
                  type="boolean"
                  :value="product.isActive"
                />
              </td>
              <td class="px-4 py-4 text-xs text-[var(--admin-text-muted)]">
                <p>{{ product._count.reviews }} отзывов</p>
                <p>{{ product._count.orderItems }} продаж</p>
                <p>{{ formatDate(product.updatedAt) }}</p>
              </td>
              <td class="px-4 py-4">
                <div class="flex justify-end gap-2">
                  <UTooltip text="Редактировать">
                    <UButton
                      color="neutral"
                      variant="ghost"
                      square
                      aria-label="Редактировать товар"
                      @click="openEdit(product.id)"
                    >
                      <Pencil class="size-4" />
                    </UButton>
                  </UTooltip>
                  <UTooltip text="Удалить">
                    <UButton
                      color="error"
                      variant="ghost"
                      square
                      aria-label="Удалить товар"
                      :loading="deletingId === product.id"
                      @click="deleteProduct(product)"
                    >
                      <Trash2 class="size-4" />
                    </UButton>
                  </UTooltip>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminEmptyState
        v-if="!products.length && !pending"
        title="Товары не найдены"
        description="Измените фильтры или создайте новый товар."
      >
        <template #icon>
          <PackageSearch class="size-6" />
        </template>
        <template #actions>
          <UButton
            color="primary"
            @click="openCreate"
          >
            Добавить товар
          </UButton>
        </template>
      </AdminEmptyState>

      <AdminPagination
        v-if="productsData?.pagination"
        :pagination="productsData.pagination"
        :loading="pending"
        @update:page="page = $event"
      />
    </UCard>

    <ProductEditorModal
      v-model:open="editorOpen"
      :product-id="selectedProductId"
      :categories="categories"
      :attributes="attributes"
      @saved="handleSaved"
    />

    <AdminConfirmModal
      v-model:open="confirmOpen"
      v-bind="confirmOptions"
      :loading="confirmLoading"
      @confirm="runConfirmedAction"
    />
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, CircleOff, Download, PackageSearch, Pencil, Plus, RefreshCw, Search, Tags, Trash2 } from "@lucide/vue";
import { watchDebounced } from "@vueuse/core";
import { toast } from "vue-sonner";
import {
  buildQuery,
  formatCurrency,
  formatDate,
  getErrorMessage
} from "~~/app/shared/lib/adminFormatters";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type {
  Attribute,
  Category,
  PaginatedResponse,
  ProductListItem
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const debouncedSearch = ref(filters.products.search);
const editorOpen = ref(false);
const selectedProductId = ref<number | null>(null);
const deletingId = ref<number | null>(null);
const selectedProductIds = ref<number[]>([]);
const bulkCategoryId = ref<number | undefined>(undefined);
const bulkLoading = ref<string | null>(null);
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmOptions = reactive({
  title: "",
  description: "",
  message: "",
  hint: "",
  confirmLabel: "Подтвердить",
  color: "primary" as "primary" | "error"
});
let confirmedAction: (() => Promise<void>) | null = null;

watchDebounced(
  () => filters.products.search,
  (value) => {
    debouncedSearch.value = value;
    page.value = 1;
  },
  { debounce: 350, maxWait: 1000 }
);

watch(
  () => [filters.products.categoryId, filters.products.isActive],
  () => {
    page.value = 1;
  }
);

const productsQuery = computed(() => buildQuery({
  page: page.value,
  search: debouncedSearch.value,
  categoryId: filters.products.categoryId,
  isActive: filters.products.isActive === "all" ? null : filters.products.isActive
}));

const { data: dictionaries } = await useAsyncData("admin-product-dictionaries", async () => {
  const [categories, attributes] = await Promise.all([
    $fetch<Category[]>("/api/admin/categories"),
    $fetch<Attribute[]>("/api/admin/products/attributes")
  ]);

  return { categories, attributes };
});

const { data: productsData, pending, error, refresh } = await useAsyncData(
  "admin-products-list",
  () => $fetch<PaginatedResponse<ProductListItem>>(`/api/admin/products${productsQuery.value}`),
  { watch: [productsQuery] }
);

const products = computed(() => productsData.value?.items ?? []);
const categories = computed(() => dictionaries.value?.categories ?? []);
const attributes = computed(() => dictionaries.value?.attributes ?? []);
const categoryFilterItems = computed(() => [
  { label: "Все категории", value: null },
  ...categories.value.map((category) => ({ label: category.name, value: category.id }))
]);
const statusItems = [
  { label: "Все", value: "all" },
  { label: "Активные", value: "true" },
  { label: "Выключенные", value: "false" }
];
const selectedProducts = computed(() => products.value.filter((product) => selectedProductIds.value.includes(product.id)));
const bulkCategoryItems = computed(() => categories.value.map((category) => ({
  label: category.name,
  value: category.id
})));
const allProductsOnPageSelected = computed({
  get: () => products.value.length > 0 && products.value.every((product) => selectedProductIds.value.includes(product.id)),
  set: (checked: boolean) => {
    const pageIds = products.value.map((product) => product.id);
    selectedProductIds.value = checked
      ? [...new Set([...selectedProductIds.value, ...pageIds])]
      : selectedProductIds.value.filter((id) => !pageIds.includes(id));
  }
});

watch(products, (items) => {
  const visibleIds = new Set(items.map((product) => product.id));
  selectedProductIds.value = selectedProductIds.value.filter((id) => visibleIds.has(id));
});

function stockQuantity(product: ProductListItem) {
  return product.productStocks[0]?.quantity ?? 0;
}

function openCreate() {
  selectedProductId.value = null;
  editorOpen.value = true;
}

function openEdit(productId: number) {
  selectedProductId.value = productId;
  editorOpen.value = true;
}

async function handleSaved() {
  await refresh();
}

function toggleProductSelection(productId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedProductIds.value = checked
    ? [...new Set([...selectedProductIds.value, productId])]
    : selectedProductIds.value.filter((id) => id !== productId);
}

function requestConfirm(
  options: Partial<typeof confirmOptions>,
  action: () => Promise<void>
) {
  Object.assign(confirmOptions, {
    title: "",
    description: "",
    message: "",
    hint: "",
    confirmLabel: "Подтвердить",
    color: "primary" as "primary" | "error",
    ...options
  });
  confirmedAction = action;
  confirmOpen.value = true;
}

async function runConfirmedAction() {
  if (!confirmedAction) {
    confirmOpen.value = false;
    return;
  }

  confirmLoading.value = true;

  try {
    await confirmedAction();
    confirmOpen.value = false;
  } finally {
    confirmLoading.value = false;
    confirmedAction = null;
  }
}

function deleteProduct(product: ProductListItem) {
  requestConfirm({
    title: "Удалить товар",
    message: `Удалить товар "${product.name}"?`,
    hint: "Связанные изображения, цены, характеристики и остатки будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingId.value = product.id;

    try {
      await $fetch(`/api/admin/products/delete/${product.id}`, {
        method: "POST"
      });
      toast.success("Товар удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить товар"));
    } finally {
      deletingId.value = null;
    }
  });
}

async function runBulkProducts(action: string, body: Record<string, unknown>) {
  bulkLoading.value = action;

  try {
    const result = await $fetch<{ count: number }>("/api/admin/products/bulk", {
      method: "POST",
      body
    });
    toast.success(`Обновлено товаров: ${result.count}`);
    selectedProductIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовую операцию"));
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkSetActive(isActive: boolean) {
  await runBulkProducts(isActive ? "activate" : "deactivate", {
    action: isActive ? "activate" : "deactivate",
    productIds: selectedProductIds.value
  });
}

async function bulkChangeCategory() {
  if (!bulkCategoryId.value) {
    return;
  }

  await runBulkProducts("changeCategory", {
    action: "changeCategory",
    productIds: selectedProductIds.value,
    categoryId: bulkCategoryId.value
  });
}

function confirmBulkDelete() {
  requestConfirm({
    title: "Удалить выбранные товары",
    message: `Удалить выбранные товары: ${selectedProductIds.value.length}?`,
    hint: "Если товары связаны с заказами, сервер остановит удаление.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    await runBulkProducts("delete", {
      action: "delete",
      productIds: selectedProductIds.value
    });
  });
}

function exportSelectedProducts() {
  const rows = selectedProducts.value.map((product) => ({
    id: product.id,
    name: product.name,
    article: product.article,
    category: product.category.name,
    price: product.currentPrice,
    stock: stockQuantity(product),
    active: product.isActive ? "yes" : "no",
    updatedAt: product.updatedAt
  }));

  downloadCsv("products-selected.csv", rows);
  toast.success(`Экспортировано товаров: ${rows.length}`);
}
</script>
