<template>
  <div class="stock-shop-page space-y-5">
    <AdminPageHeader
      title="Остатки"
      kicker="Склад"
      description="Контроль доступности товаров, быстрые корректировки и подсветка критических остатков."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="ghost"
          icon="i-lucide-refresh-cw"
          size="lg"
          class="h-12 justify-center rounded-full bg-white px-4 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          :loading="pending"
          @click="refresh()"
        >
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <div class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">
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
        label="Единиц на складе"
        :value="formatNumber(totalStockQuantity)"
        hint="Суммарный доступный остаток"
        positive
      >
        <template #icon>
          <PackagePlus class="size-7" />
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
      class="admin-list-card"
      :ui="{ body: 'p-0' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Приход на склад
          </p>
          <p class="admin-section-copy">
            Быстро соберите поставку из нескольких товаров и примените остатки одной операцией.
          </p>
        </div>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full px-3 py-1"
        >
          {{ arrivalItems.length }} в приходе
        </UBadge>
      </div>

      <div class="space-y-5 bg-[#f9fafb] p-4 sm:p-5">
        <div class="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px_auto] xl:items-end">
          <UFormField label="Добавить товар в приход">
            <div class="rounded-2xl bg-white p-1.5 shadow-sm shadow-zinc-950/5">
              <UInput
                v-model="arrivalSearch"
                class="w-full"
                size="lg"
                variant="none"
                :ui="stockInputUi"
                placeholder="Название или артикул"
              >
                <template #leading>
                  <Search class="size-4 text-zinc-400" />
                </template>
              </UInput>
            </div>
          </UFormField>
          <UFormField label="Комментарий">
            <div class="rounded-2xl bg-white p-1.5 shadow-sm shadow-zinc-950/5">
              <UInput
                v-model="arrivalReason"
                class="w-full"
                size="lg"
                variant="none"
                :ui="stockInputUi"
                placeholder="Поставка, инвентаризация"
              />
            </div>
          </UFormField>
          <UButton
            color="primary"
            size="lg"
            class="h-12 justify-center rounded-full px-5 shadow-lg shadow-emerald-950/10"
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
          class="overflow-hidden rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
        >
          <button
            v-for="stock in arrivalSearchResults"
            :key="stock.product.id"
            type="button"
            class="flex w-full items-center justify-between gap-4 border-b border-zinc-100 px-4 py-3 text-left last:border-b-0 transition hover:bg-[#f9fafb]"
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
          class="grid gap-3 sm:grid-cols-2 2xl:grid-cols-3"
        >
          <article
            v-for="item in arrivalItems"
            :key="item.productId"
            class="rounded-2xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <p class="line-clamp-2 font-semibold leading-6 text-zinc-950">
                  {{ item.name }}
                </p>
                <p class="mt-1 truncate text-xs font-medium uppercase text-zinc-400">
                  {{ item.article }}
                </p>
              </div>
              <UTooltip text="Убрать из прихода">
                <UButton
                  color="error"
                  variant="ghost"
                  class="rounded-full bg-[#f9fafb]"
                  type="button"
                  square
                  aria-label="Убрать товар из прихода"
                  @click="removeArrivalItem(item.productId)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>

            <div class="mt-4 grid gap-3">
              <div class="rounded-2xl bg-[#f9fafb] p-3">
                <p class="text-xs font-semibold uppercase text-zinc-400">
                  Сейчас
                </p>
                <p class="mt-2 text-sm font-semibold text-zinc-950">
                  {{ item.currentQuantity }} шт.
                </p>
              </div>
              <label class="block rounded-2xl bg-[#f9fafb] p-3">
                <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Приход</span>
                <UInput
                  v-model.number="item.quantityDelta"
                  size="lg"
                  type="number"
                  min="1"
                  class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                  variant="none"
                  :ui="stockInputUi"
                />
              </label>
              <div class="rounded-2xl bg-emerald-50 p-3 text-emerald-700">
                <p class="text-xs font-semibold uppercase">
                  Будет
                </p>
                <p class="mt-2 text-sm font-semibold">
                  {{ item.currentQuantity + Number(item.quantityDelta ?? 0) }} шт.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div class="flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--admin-text-muted)]">
          <span>Товаров в приходе: {{ arrivalItems.length }}</span>
          <span>Всего будет добавлено: {{ formatNumber(arrivalTotalQuantity) }} шт.</span>
        </div>
      </div>
    </UCard>

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <label class="block rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
        <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Поиск по остаткам</span>
        <UInput
          v-model="search"
          class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
          size="lg"
          variant="none"
          :ui="stockInputUi"
          placeholder="Название или артикул"
        >
          <template #leading>
            <Search class="size-4 text-zinc-400" />
          </template>
        </UInput>
      </label>
    </section>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить остатки"
      :description="getErrorMessage(error)"
      class="rounded-2xl"
    />

    <UCard
      class="admin-list-card"
      :ui="{ body: 'p-0' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Остатки товаров
          </p>
          <p class="admin-section-copy">
            Редактирование текущего количества без перехода в карточку товара.
          </p>
        </div>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full px-3 py-1"
        >
          {{ filteredStocks.length }} позиций
        </UBadge>
      </div>

      <div
        v-if="filteredStocks.length"
        class="grid gap-3 bg-[#f9fafb] p-3 sm:grid-cols-2 sm:p-4 2xl:grid-cols-3"
      >
        <article
          v-for="stock in filteredStocks"
          :key="stock.product.id"
          class="rounded-2xl bg-white p-4 shadow-sm shadow-zinc-950/5 ring-1 ring-zinc-200/70 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/10"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="line-clamp-2 font-semibold leading-6 text-zinc-950">
                {{ stock.product.name }}
              </p>
              <p class="mt-1 truncate text-xs font-medium uppercase text-zinc-400">
                {{ stock.product.article }}
              </p>
            </div>
            <AdminStatusBadge
              type="stock"
              :value="stock.quantity"
              class="shrink-0"
            />
          </div>

          <div class="mt-4 grid gap-3">
            <div class="rounded-2xl bg-[#f9fafb] p-3">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Текущий остаток
              </p>
              <p class="mt-2 text-lg font-semibold text-zinc-950">
                {{ stock.quantity }} шт.
              </p>
            </div>

            <label class="block rounded-2xl bg-[#f9fafb] p-3">
              <span class="mb-2 block text-xs font-semibold uppercase text-zinc-400">Новый остаток</span>
              <UInput
                v-model.number="draftQuantities[stock.product.id]"
                size="lg"
                type="number"
                min="0"
                class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                variant="none"
                :ui="stockInputUi"
              />
            </label>

            <div class="rounded-2xl bg-[#f9fafb] p-3">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Обновлено
              </p>
              <p class="mt-2 text-sm font-medium text-zinc-700">
                {{ formatDate(stock.updatedAt) }}
              </p>
            </div>
          </div>

          <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-save"
            class="mt-4 min-h-11 w-full justify-center rounded-full"
            :loading="savingId === stock.product.id"
            :disabled="draftQuantities[stock.product.id] === stock.quantity"
            @click="saveStock(stock)"
          >
            Сохранить
          </UButton>
        </article>
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
import { CircleOff, PackagePlus, PackageX, Plus, Search, Trash2, Warehouse } from "@lucide/vue";
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

const stockInputUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700"
};

const { data, pending, error, refresh } = await useAsyncData("admin-product-stocks", () => adminFetch<ProductStock[]>("/api/admin/products/stock"));

const stocks = computed(() => data.value ?? []);
const totalStockQuantity = computed(() => stocks.value.reduce((total, stock) => total + stock.quantity, 0));
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
