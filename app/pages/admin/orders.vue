<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Заказы"
      kicker="Operations"
      description="Статусы заказов, оплаты, состав, доставка и быстрые операционные изменения."
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

    <div class="grid gap-4 md:grid-cols-4">
      <AdminMetricCard
        label="Заказов в выдаче"
        :value="formatNumber(ordersData?.pagination.total ?? orders.length)"
        hint="С учётом выбранного статуса"
        positive
      >
        <template #icon>
          <ClipboardList class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Новые"
        :value="formatNumber(newOrdersCount)"
        hint="Требуют подтверждения"
        :positive="newOrdersCount === 0"
      >
        <template #icon>
          <Clock3 class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="В работе"
        :value="formatNumber(activeOrdersCount)"
        hint="Не завершены и не отменены"
        positive
      >
        <template #icon>
          <Truck class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Оплачено на странице"
        :value="formatCurrency(paidVisibleRevenue)"
        hint="Только заказы со статусом оплаты PAID"
        positive
      >
        <template #icon>
          <Banknote class="size-6" />
        </template>
      </AdminMetricCard>
    </div>

    <UCard
      class="admin-filter-card"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div class="grid gap-4 lg:grid-cols-[360px_1fr] lg:items-end">
        <UFormField label="Статус заказа">
          <USelect
            v-model="filters.orders.status"
            class="w-full"
            size="lg"
            :items="orderStatusFilterItems"
          />
        </UFormField>
        <div class="flex flex-wrap gap-2">
          <UButton
            v-for="quickStatus in quickStatusItems"
            :key="quickStatus.value"
            :color="filters.orders.status === quickStatus.value ? 'primary' : 'neutral'"
            :variant="filters.orders.status === quickStatus.value ? 'solid' : 'outline'"
            @click="setOrderStatusFilter(quickStatus.value)"
          >
            {{ quickStatus.label }}
          </UButton>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить заказы"
      :description="getErrorMessage(error)"
    />

    <UCard
      class="admin-list-card"
      :ui="{ body: 'p-0' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
        <div>
          <p class="admin-section-heading">
            Лента заказов
          </p>
          <p class="admin-section-copy">
            Обновляйте статусы, оплату и связывайтесь с покупателем из одной карточки.
          </p>
        </div>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-md"
        >
          {{ ordersData?.pagination?.total ?? orders.length }} заказов
        </UBadge>
      </div>

      <div class="divide-y divide-[var(--admin-border)]">
        <article
          v-for="order in orders"
          :key="order.id"
          class="p-4 transition hover:bg-[var(--admin-surface-muted)]/70 sm:p-5"
        >
          <div class="grid gap-5 xl:grid-cols-[minmax(0,1fr)_520px]">
            <div class="min-w-0 rounded-lg border border-[var(--admin-border)] bg-white p-4">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-base font-semibold text-[var(--admin-text)]">
                  Заказ #{{ order.id }}
                </h2>
                <AdminStatusBadge
                  type="order"
                  :value="order.orderStatus"
                />
                <AdminStatusBadge
                  v-if="order.payment"
                  type="payment"
                  :value="order.payment.paymentStatus"
                />
              </div>
              <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                {{ order.user?.name || order.user?.email || "Гость" }} · {{ formatDate(order.createdAt) }}
              </p>
              <div class="mt-4 grid gap-3 sm:grid-cols-3">
                <div class="rounded-lg bg-[var(--admin-surface-muted)]/80 p-3">
                  <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                    Телефон
                  </p>
                  <p class="mt-1 truncate text-sm font-medium text-[var(--admin-text)]">
                    {{ order.customerPhone || "Не указан" }}
                  </p>
                </div>
                <div class="rounded-lg bg-[var(--admin-surface-muted)]/80 p-3">
                  <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                    Получение
                  </p>
                  <p class="mt-1 truncate text-sm font-medium text-[var(--admin-text)]">
                    {{ obtainingMethodLabels[order.obtainingMethod] }}
                  </p>
                </div>
                <div class="rounded-lg bg-[var(--admin-surface-muted)]/80 p-3">
                  <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                    Сумма
                  </p>
                  <p class="mt-1 truncate text-sm font-semibold text-[var(--admin-text)]">
                    {{ formatCurrency(order.payment?.amount) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="grid gap-3 rounded-lg border border-[var(--admin-border)] bg-white p-4 sm:grid-cols-2">
              <UFormField label="Статус">
                <USelect
                  :model-value="order.orderStatus"
                  class="w-full"
                  size="lg"
                  :items="orderStatusItems"
                  :disabled="savingOrderId === order.id"
                  @update:model-value="(value) => updateOrderStatus(order, value)"
                />
              </UFormField>
              <UFormField label="Оплата">
                <USelect
                  :model-value="order.payment?.paymentStatus"
                  class="w-full"
                  size="lg"
                  :items="paymentStatusItems"
                  :disabled="!order.payment || savingPaymentId === order.id"
                  @update:model-value="(value) => updatePaymentStatus(order, value)"
                />
              </UFormField>
            </div>
          </div>

          <div class="mt-5 grid gap-5 lg:grid-cols-[1fr_320px]">
            <div class="space-y-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/55 p-3">
              <div class="mb-2 flex items-center justify-between gap-3">
                <p class="text-sm font-semibold text-[var(--admin-text)]">
                  Состав заказа
                </p>
                <span class="text-xs text-[var(--admin-text-muted)]">
                  {{ order.orderItems.length }} поз.
                </span>
              </div>
              <div
                v-for="item in order.orderItems"
                :key="item.product.id"
                class="flex items-center justify-between gap-4 rounded-lg bg-white p-3 ring-1 ring-[var(--admin-border)]"
              >
                <div class="flex min-w-0 items-center gap-3">
                  <img
                    :src="item.product.mainImage"
                    alt=""
                    class="size-12 rounded-lg object-cover"
                  >
                  <div class="min-w-0">
                    <p class="truncate text-sm font-medium text-[var(--admin-text)]">
                      {{ item.product.name }}
                    </p>
                    <p class="text-xs text-[var(--admin-text-muted)]">
                      {{ item.quantity }} × {{ formatCurrency(item.price) }}
                    </p>
                  </div>
                </div>
                <p class="whitespace-nowrap text-sm font-semibold text-[var(--admin-text)]">
                  {{ formatCurrency(Number(item.price) * item.quantity) }}
                </p>
              </div>
            </div>

            <div class="rounded-lg bg-white p-4 ring-1 ring-[var(--admin-border)]">
              <p class="mb-3 text-sm font-semibold text-[var(--admin-text)]">
                Детали и связь
              </p>
              <dl class="space-y-3 text-sm">
                <div class="flex justify-between gap-4">
                  <dt class="text-[var(--admin-text-muted)]">Сумма</dt>
                  <dd class="font-semibold text-[var(--admin-text)]">{{ formatCurrency(order.payment?.amount) }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-[var(--admin-text-muted)]">Оплата</dt>
                  <dd class="text-[var(--admin-text)]">{{ paymentMethodLabels[order.paymentMethod] }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-[var(--admin-text-muted)]">Получение</dt>
                  <dd class="text-[var(--admin-text)]">{{ obtainingMethodLabels[order.obtainingMethod] }}</dd>
                </div>
                <div class="flex justify-between gap-4">
                  <dt class="text-[var(--admin-text-muted)]">Телефон</dt>
                  <dd class="text-right font-medium text-[var(--admin-text)]">{{ order.customerPhone || "Не указан" }}</dd>
                </div>
                <div
                  v-if="order.delivery"
                  class="border-t border-[var(--admin-border)] pt-3"
                >
                  <dt class="text-[var(--admin-text-muted)]">Адрес</dt>
                  <dd class="mt-1 text-[var(--admin-text)]">
                    {{ order.delivery.address }}
                  </dd>
                  <dd
                    v-if="deliveryDetails(order)"
                    class="mt-1 text-xs text-[var(--admin-text-muted)]"
                  >
                    {{ deliveryDetails(order) }}
                  </dd>
                </div>
              </dl>

              <div class="mt-5 border-t border-[var(--admin-border)] pt-5">
                <template v-if="order.user">
                  <UFormField label="Сообщение заказчику">
                    <UTextarea
                      v-model="orderMessageDrafts[order.id]"
                      :rows="3"
                      :disabled="sendingMessageOrderId === order.id"
                      placeholder="Напишите сообщение по этому заказу"
                    />
                  </UFormField>
                  <div class="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <p class="text-xs text-[var(--admin-text-muted)]">
                      Получатель: {{ order.user.name || order.user.email }}
                    </p>
                    <UButton
                      color="primary"
                      variant="soft"
                      :disabled="!orderMessageDrafts[order.id]?.trim()"
                      :loading="sendingMessageOrderId === order.id"
                      @click="sendOrderMessage(order)"
                    >
                      <Send class="size-4" />
                      Отправить
                    </UButton>
                  </div>
                </template>
                <p
                  v-else
                  class="rounded-lg bg-[var(--admin-surface-muted)] px-4 py-3 text-sm text-[var(--admin-text-muted)]"
                >
                  У заказа нет зарегистрированного аккаунта, поэтому сообщение через личный кабинет недоступно.
                </p>
              </div>
            </div>
          </div>
        </article>
      </div>

      <AdminEmptyState
        v-if="!orders.length && !pending"
        title="Заказы не найдены"
        description="Измените фильтр статуса."
      >
        <template #icon>
          <ClipboardList class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination
        v-if="ordersData?.pagination"
        :pagination="ordersData.pagination"
        :loading="pending"
        @update:page="page = $event"
      />
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { Banknote, ClipboardList, Clock3, RefreshCw, Send, Truck } from "@lucide/vue";
import { toast } from "vue-sonner";
import {
  buildQuery,
  formatCurrency,
  formatDate,
  formatNumber,
  getErrorMessage,
  obtainingMethodLabels,
  orderStatusLabels,
  paymentMethodLabels,
  paymentStatusLabels
} from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type {
  OrderListItem,
  OrderStatus,
  PaginatedResponse,
  PaymentStatus
} from "~~/app/shared/types/admin";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const savingOrderId = ref<number | null>(null);
const savingPaymentId = ref<number | null>(null);
const sendingMessageOrderId = ref<number | null>(null);
const orderMessageDrafts = reactive<Record<number, string>>({});

watch(() => filters.orders.status, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  status: filters.orders.status === "all" ? null : filters.orders.status
}));

const { data: ordersData, pending, error, refresh } = await useAsyncData(
  "admin-orders-list",
  () => adminFetch<PaginatedResponse<OrderListItem>>(`/api/admin/orders${query.value}`),
  { watch: [query] }
);

const orders = computed(() => ordersData.value?.items ?? []);
const orderStatusItems = Object.entries(orderStatusLabels).map(([value, label]) => ({ value, label }));
const paymentStatusItems = Object.entries(paymentStatusLabels).map(([value, label]) => ({ value, label }));
const orderStatusFilterItems = [
  { value: "all", label: "Все" },
  ...orderStatusItems
];
const quickStatusItems = [
  { value: "all" as const, label: "Все" },
  { value: "NEW" as const, label: "Новые" },
  { value: "PROCESSING" as const, label: "В работе" },
  { value: "COMPLETED" as const, label: "Завершённые" }
];
const newOrdersCount = computed(() => orders.value.filter((order) => order.orderStatus === "NEW").length);
const activeOrdersCount = computed(() =>
  orders.value.filter((order) => !["COMPLETED", "CANCELLED"].includes(order.orderStatus)).length
);
const paidVisibleRevenue = computed(() =>
  orders.value.reduce((sum, order) => (
    order.payment?.paymentStatus === "PAID"
      ? sum + Number(order.payment.amount ?? 0)
      : sum
  ), 0)
);

function setOrderStatusFilter(status: "all" | OrderStatus) {
  filters.orders.status = status;
}

function deliveryDetails(order: OrderListItem) {
  if (!order.delivery) {
    return "";
  }

  return [
    order.delivery.apartment ? `кв. ${order.delivery.apartment}` : "",
    order.delivery.entrance ? `подъезд ${order.delivery.entrance}` : "",
    order.delivery.floor ? `этаж ${order.delivery.floor}` : "",
    order.delivery.intercom ? `домофон ${order.delivery.intercom}` : ""
  ].filter(Boolean).join(", ");
}

async function updateOrderStatus(order: OrderListItem, value: unknown) {
  const orderStatus = value as OrderStatus;

  if (!orderStatus || orderStatus === order.orderStatus) {
    return;
  }

  savingOrderId.value = order.id;

  try {
    await $fetch(`/api/admin/orders/${order.id}/status`, {
      method: "POST",
      body: { orderStatus }
    });
    toast.success("Статус заказа обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить статус заказа"));
  } finally {
    savingOrderId.value = null;
  }
}

async function updatePaymentStatus(order: OrderListItem, value: unknown) {
  const paymentStatus = value as PaymentStatus;

  if (!paymentStatus || !order.payment || paymentStatus === order.payment.paymentStatus) {
    return;
  }

  savingPaymentId.value = order.id;

  try {
    await $fetch("/api/admin/orders/payment", {
      method: "POST",
      body: {
        orderId: order.id,
        paymentStatus
      }
    });
    toast.success("Статус оплаты обновлён");
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить оплату"));
  } finally {
    savingPaymentId.value = null;
  }
}

async function sendOrderMessage(order: OrderListItem) {
  const userId = order.user?.id;
  const text = orderMessageDrafts[order.id]?.trim();

  if (!userId) {
    toast.error("У заказа нет зарегистрированного заказчика");
    return;
  }

  if (!text) {
    toast.error("Введите сообщение заказчику");
    return;
  }

  sendingMessageOrderId.value = order.id;

  try {
    await adminFetch(`/api/admin/messages/${userId}`, {
      method: "POST",
      body: {
        message: `По заказу #${order.id}\n\n${text}`
      }
    });
    orderMessageDrafts[order.id] = "";
    toast.success("Сообщение отправлено заказчику");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось отправить сообщение"));
  } finally {
    sendingMessageOrderId.value = null;
  }
}
</script>
