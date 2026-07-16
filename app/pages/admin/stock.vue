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
      <UFormField label="Поиск">
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

    <UCard
      v-if="selectedStockProductIds.length"
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-end">
        <div>
          <p class="text-lg font-semibold text-[var(--admin-text)]">
            Выбрано складских позиций: {{ selectedStockProductIds.length }}
          </p>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Массовый приход увеличит остаток каждого выбранного товара на указанное количество.
          </p>
        </div>
        <div class="flex flex-wrap items-end gap-2">
          <UFormField label="Приход, шт.">
            <UInput
              v-model.number="bulkArrivalQuantity"
              size="lg"
              type="number"
              min="1"
              class="w-36"
            />
          </UFormField>
          <UFormField label="Комментарий">
            <UInput
              v-model="bulkArrivalReason"
              size="lg"
              placeholder="Поставка, инвентаризация"
              class="w-full sm:w-80"
            />
          </UFormField>
          <UButton
            color="primary"
            :loading="bulkLoading === 'arrival'"
            @click="bulkArrival"
          >
            <PackagePlus class="size-4" />
            Принять
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            @click="exportSelectedStocks"
          >
            <Download class="size-4" />
            Экспорт
          </UButton>
        </div>
      </div>
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
        <table class="w-full min-w-[780px] divide-y divide-[var(--admin-border)] text-sm">
          <thead class="bg-[var(--admin-surface-muted)]">
            <tr class="text-left text-xs uppercase text-[var(--admin-text-muted)]">
              <th class="w-12 px-4 py-3">
                <input
                  v-model="allStocksSelected"
                  class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  aria-label="Выбрать все остатки"
                >
              </th>
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
                <input
                  :checked="selectedStockProductIds.includes(stock.product.id)"
                  class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  :aria-label="`Выбрать остаток ${stock.product.name}`"
                  @change="toggleStockSelection(stock.product.id, $event)"
                >
              </td>
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
import { CircleOff, Download, PackagePlus, PackageX, RefreshCw, Save, Search, Warehouse } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatDate, formatNumber, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import { getZodFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { ProductStock } from "~~/app/shared/types/admin";
import { bulkStockArrivalSchema } from "~~/shared/schemas/admin/products/bulkStockArrival";
import { updateProductStockSchema } from "~~/shared/schemas/admin/products/updateProductStock";

definePageMeta({
  layout: "admin"
});

const search = ref("");
const savingId = ref<number | null>(null);
const bulkLoading = ref<string | null>(null);
const selectedStockProductIds = ref<number[]>([]);
const bulkArrivalQuantity = ref<number | null>(1);
const bulkArrivalReason = ref("");
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
const selectedStocks = computed(() => stocks.value.filter((stock) => selectedStockProductIds.value.includes(stock.product.id)));
const allStocksSelected = computed({
  get: () => filteredStocks.value.length > 0 && filteredStocks.value.every((stock) => selectedStockProductIds.value.includes(stock.product.id)),
  set: (checked: boolean) => {
    const visibleIds = filteredStocks.value.map((stock) => stock.product.id);
    selectedStockProductIds.value = checked
      ? [...new Set([...selectedStockProductIds.value, ...visibleIds])]
      : selectedStockProductIds.value.filter((id) => !visibleIds.includes(id));
  }
});

watch(stocks, (items) => {
  const visibleIds = new Set(items.map((stock) => stock.product.id));
  selectedStockProductIds.value = selectedStockProductIds.value.filter((id) => visibleIds.has(id));

  for (const stock of items) {
    draftQuantities[stock.product.id] = stock.quantity;
  }
}, { immediate: true });

function toggleStockSelection(productId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedStockProductIds.value = checked
    ? [...new Set([...selectedStockProductIds.value, productId])]
    : selectedStockProductIds.value.filter((id) => id !== productId);
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
    await $fetch(`/api/admin/products/stock/update/${stock.product.id}`, {
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

async function bulkArrival() {
  const parsed = bulkStockArrivalSchema.safeParse({
    productIds: selectedStockProductIds.value,
    quantityDelta: bulkArrivalQuantity.value,
    reason: bulkArrivalReason.value.trim() || undefined
  });

  if (!parsed.success) {
    const errors = getZodFieldErrors(parsed.error);
    toast.error(errors.productIds ?? errors.quantityDelta ?? errors.reason ?? "Проверьте параметры прихода");
    return;
  }

  bulkLoading.value = "arrival";

  try {
    const result = await $fetch<{ count: number }>("/api/admin/products/stock/bulk", {
      method: "POST",
      body: parsed.data
    });
    toast.success(`Приход применён к позициям: ${result.count}`);
    selectedStockProductIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовый приход"));
  } finally {
    bulkLoading.value = null;
  }
}

function exportSelectedStocks() {
  const rows = selectedStocks.value.map((stock) => ({
    productId: stock.product.id,
    name: stock.product.name,
    article: stock.product.article,
    active: stock.product.isActive ? "yes" : "no",
    quantity: stock.quantity,
    updatedAt: stock.updatedAt
  }));

  downloadCsv("stock-selected.csv", rows);
  toast.success(`Экспортировано позиций: ${rows.length}`);
}
</script>