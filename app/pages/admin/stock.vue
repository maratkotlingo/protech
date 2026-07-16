<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Остатки"
      kicker="Inventory"
      description="Контроль доступности товаров, быстрые корректировки и подсветка критических остатков."
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
      </template>
    </AdminPageHeader>

    <div class="grid gap-6 sm:grid-cols-3">
      <AdminMetricCard
        label="Всего позиций"
        :value="formatNumber(stocks.length)"
        hint="Товары с заведённым складским остатком"
        positive
      >
        <template #icon>
          <Warehouse class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Низкий остаток"
        :value="formatNumber(lowStockCount)"
        hint="Количество 5 или меньше"
        :positive="lowStockCount === 0"
      >
        <template #icon>
          <PackageX class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Нет в наличии"
        :value="formatNumber(outOfStockCount)"
        hint="Требуют внимания перед продажами"
        :positive="outOfStockCount === 0"
      >
        <template #icon>
          <CircleOff class="size-7" />
        </template>
      </AdminMetricCard>
    </div>

    <UCard
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="space-y-5">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-end">
          <UFormField label="Добавить товар в приход">
            <UInput
              v-model="arrivalSearch"
              class="w-full"
              size="lg"
              placeholder="Название или артикул"
            >
              <template #leading>
                <Search class="size-4 text-[var(--admin-text-muted)]" />
              </template>
            </UInput>
          </UFormField>
          <UFormField label="Комментарий">
            <UInput
              v-model="arrivalReason"
              class="w-full"
              size="lg"
              placeholder="Поставка, инвентаризация"
            />
          </UFormField>
          <UButton
            color="primary"
            size="lg"
            :disabled="!arrivalItems.length"
            :loading="arrivalSubmitting"
            @click="submitArrival"
          >
            <PackagePlus class="size-4" />
            Принять приход
          </UButton>
        </div>

        <div
          v-if="arrivalSearch.trim()"
          class="overflow-hidden rounded-lg border border-[var(--admin-border)]"
        >
          <button
            v-for="stock in arrivalSearchResults"
            :key="stock.product.id"
            type="button"
            class="flex w-full items-center justify-between gap-4 border-b border-[var(--admin-border)] px-4 py-3 text-left last:border-b-0 transition hover:bg-[var(--admin-surface-muted)]"
            @click="addArrivalItem(stock)"
          >
            <span class="min-w-0">
              <span class="block truncate font-medium text-[var(--admin-text)]">
                {{ stock.product.name }}
              </span>
              <span class="mt-0.5 block truncate text-xs text-[var(--admin-text-muted)]">
                {{ stock.product.article }} · сейчас {{ stock.quantity }} шт.
              </span>
            </span>
            <span class="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-[var(--admin-accent)]">
              <Plus class="size-4" />
              Добавить
            </span>
          </button>

          <div
            v-if="!arrivalSearchResults.length"
            class="px-4 py-3 text-sm text-[var(--admin-text-muted)]"
          >
            Подходящие товары не найдены или уже добавлены в приход.
          </div>
        </div>

        <div
          v-if="arrivalItems.length"
          class="overflow-x-auto rounded-lg border border-[var(--admin-border)]"
        >
          <table class="w-full min-w-[760px] divide-y divide-[var(--admin-border)] text-sm">
            <thead class="bg-[var(--admin-surface-muted)]">
              <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
                <th class="px-4 py-3 font-medium">Товар</th>
                <th class="px-4 py-3 font-medium">Сейчас</th>
                <th class="px-4 py-3 font-medium">Приход</th>
                <th class="px-4 py-3 font-medium">Будет</th>
                <th class="px-4 py-3 text-right font-medium">Действие</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-[var(--admin-border)]">
              <tr
                v-for="item in arrivalItems"
                :key="item.productId"
                class="transition hover:bg-[var(--admin-surface-muted)]"
              >
                <td class="px-4 py-4">
                  <p class="font-medium text-[var(--admin-text)]">
                    {{ item.name }}
                  </p>
                  <p class="text-xs text-[var(--admin-text-muted)]">
                    {{ item.article }}
                  </p>
                </td>
                <td class="px-4 py-4 font-semibold text-[var(--admin-text)]">
                  {{ item.currentQuantity }} шт.
                </td>
                <td class="px-4 py-4">
                  <UInput
                    v-model.number="item.quantityDelta"
                    size="lg"
                    type="number"
                    min="1"
                    class="w-36"
                  />
                </td>
                <td class="px-4 py-4 font-semibold text-[var(--admin-text)]">
                  {{ item.currentQuantity + Number(item.quantityDelta ?? 0) }} шт.
                </td>
                <td class="px-4 py-4">
                  <div class="flex justify-end">
                    <UButton
                      color="error"
                      variant="ghost"
                      type="button"
                      aria-label="Убрать товар из прихода"
                      @click="removeArrivalItem(item.productId)"
                    >
                      <Trash2 class="size-4" />
                    </UButton>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--admin-text-muted)]">
          <span>Товаров в приходе: {{ arrivalItems.length }}</span>
          <span>Всего будет добавлено: {{ formatNumber(arrivalTotalQuantity) }} шт.</span>
        </div>
      </div>
    </UCard>

    <UCard
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <UFormField label="Поиск по остаткам">
        <UInput
          v-model="search"
          class="w-full"
          size="lg"
          placeholder="Название или артикул"
        >
          <template #leading>
            <Search class="size-4 text-[var(--admin-text-muted)]" />
          </template>
        </UInput>
      </UFormField>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить остатки"
      :description="getErrorMessage(error)"
    />

    <UCard
      class="overflow-hidden border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-0' }"
    >
      <div
        v-if="filteredStocks.length"
        class="overflow-x-auto"
      >
        <table class="w-full min-w-[720px] divide-y divide-[var(--admin-border)] text-sm">
          <thead class="bg-[var(--admin-surface-muted)]">
            <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
              <th class="px-4 py-3 font-medium">Товар</th>
              <th class="px-4 py-3 font-medium">Текущий остаток</th>
              <th class="px-4 py-3 font-medium">Новый остаток</th>
              <th class="px-4 py-3 font-medium">Обновлено</th>
              <th class="px-4 py-3 text-right font-medium">Действие</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-[var(--admin-border)]">
            <tr
              v-for="stock in filteredStocks"
              :key="stock.product.id"
              class="transition hover:bg-[var(--admin-surface-muted)]"
            >
              <td class="px-4 py-4">
                <p class="font-medium text-[var(--admin-text)]">
                  {{ stock.product.name }}
                </p>
                <p class="text-xs text-[var(--admin-text-muted)]">
                  {{ stock.product.article }}
                </p>
              </td>
              <td class="px-4 py-4">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-[var(--admin-text)]">{{ stock.quantity }} шт.</span>
                  <AdminStatusBadge
                    type="stock"
                    :value="stock.quantity"
                  />
                </div>
              </td>
              <td class="px-4 py-4">
                <UInput
                  v-model.number="draftQuantities[stock.product.id]"
                  size="lg"
                  type="number"
                  min="0"
                  class="w-36"
                />
              </td>
              <td class="px-4 py-4 text-[var(--admin-text-muted)]">
                {{ formatDate(stock.updatedAt) }}
              </td>
              <td class="px-4 py-4">
                <div class="flex justify-end">
                  <UButton
                    color="primary"
                    variant="soft"
                    :loading="savingId === stock.product.id"
                    :disabled="draftQuantities[stock.product.id] === stock.quantity"
                    @click="saveStock(stock)"
                  >
                    <Save class="size-4" />
                    Сохранить
                  </UButton>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <AdminEmptyState
        v-if="!filteredStocks.length && !pending"
        title="Остатки не найдены"
        description="Попробуйте изменить поисковый запрос."
      >
        <template #icon>
          <Warehouse class="size-6" />
        </template>
      </AdminEmptyState>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { CircleOff, PackagePlus, PackageX, Plus, RefreshCw, Save, Search, Trash2, Warehouse } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { formatDate, formatNumber, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { getZodFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { ProductStock } from "~~/app/shared/types/admin";
import { bulkStockArrivalSchema } from "~~/shared/schemas/admin/products/bulkStockArrival";
import { updateProductStockSchema } from "~~/shared/schemas/admin/products/updateProductStock";

type ArrivalDraftItem = {
  productId: number;
  name: string;
  article: string;
  currentQuantity: number;
  quantityDelta: number | null;
};

definePageMeta({
  layout: "admin"
});

const search = ref("");
const arrivalSearch = ref("");
const arrivalReason = ref("");
const arrivalSubmitting = ref(false);
const arrivalItems = ref<ArrivalDraftItem[]>([]);
const savingId = ref<number | null>(null);
const draftQuantities = reactive<Record<number, number>>({});

const { data, pending, error, refresh } = await useAsyncData("admin-product-stocks", () => adminFetch<ProductStock[]>("/api/admin/products/stock"));

const stocks = computed(() => data.value ?? []);
const lowStockCount = computed(() => stocks.value.filter((stock) => stock.quantity > 0 && stock.quantity <= 5).length);
const outOfStockCount = computed(() => stocks.value.filter((stock) => stock.quantity <= 0).length);
const filteredStocks = computed(() => {
  const query = search.value.trim().toLowerCase();

  if (!query) {
    return stocks.value;
  }

  return stocks.value.filter((stock) =>
    stock.product.name.toLowerCase().includes(query) ||
    stock.product.article.toLowerCase().includes(query)
  );
});
const arrivalSearchResults = computed(() => {
  const query = arrivalSearch.value.trim().toLowerCase();
  const selectedIds = new Set(arrivalItems.value.map((item) => item.productId));

  if (!query) {
    return [];
  }

  return stocks.value
    .filter((stock) =>
      !selectedIds.has(stock.product.id) &&
      (
        stock.product.name.toLowerCase().includes(query) ||
        stock.product.article.toLowerCase().includes(query)
      )
    )
    .slice(0, 8);
});
const arrivalTotalQuantity = computed(() =>
  arrivalItems.value.reduce((total, item) => total + Math.max(0, Number(item.quantityDelta ?? 0)), 0)
);

watch(stocks, (items) => {
  const stockByProductId = new Map(items.map((stock) => [stock.product.id, stock]));

  for (const stock of items) {
    draftQuantities[stock.product.id] = stock.quantity;
  }

  arrivalItems.value = arrivalItems.value
    .filter((item) => stockByProductId.has(item.productId))
    .map((item) => {
      const stock = stockByProductId.get(item.productId)!;

      return {
        ...item,
        name: stock.product.name,
        article: stock.product.article,
        currentQuantity: stock.quantity
      };
    });
}, { immediate: true });

function addArrivalItem(stock: ProductStock) {
  if (arrivalItems.value.some((item) => item.productId === stock.product.id)) {
    return;
  }

  arrivalItems.value.push({
    productId: stock.product.id,
    name: stock.product.name,
    article: stock.product.article,
    currentQuantity: stock.quantity,
    quantityDelta: 1
  });
  arrivalSearch.value = "";
}

function removeArrivalItem(productId: number) {
  arrivalItems.value = arrivalItems.value.filter((item) => item.productId !== productId);
}

async function submitArrival() {
  const parsed = bulkStockArrivalSchema.safeParse({
    arrivals: arrivalItems.value.map((item) => ({
      productId: item.productId,
      quantityDelta: item.quantityDelta
    })),
    reason: arrivalReason.value.trim() || undefined
  });

  if (!parsed.success) {
    const errors = getZodFieldErrors(parsed.error);
    toast.error(errors.arrivals ?? errors.quantityDelta ?? errors.reason ?? "Проверьте товары и количество прихода");
    return;
  }

  arrivalSubmitting.value = true;

  try {
    const result = await adminFetch<{ count: number; quantityDeltaTotal: number }>("/api/admin/products/stock/bulk", {
      method: "POST",
      body: parsed.data
    });
    toast.success(`Приход принят: ${result.count} позиций, ${formatNumber(result.quantityDeltaTotal)} шт.`);
    arrivalItems.value = [];
    arrivalReason.value = "";
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось принять приход"));
  } finally {
    arrivalSubmitting.value = false;
  }
}

async function saveStock(stock: ProductStock) {
  const nextQuantity = Number(draftQuantities[stock.product.id] ?? 0);
  const parsed = updateProductStockSchema.safeParse({ quantity: nextQuantity });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).quantity ?? "Проверьте остаток");
    return;
  }

  savingId.value = stock.product.id;

  try {
    await adminFetch(`/api/admin/products/stock/update/${stock.product.id}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Остаток обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить остаток"));
  } finally {
    savingId.value = null;
  }
}
</script>
