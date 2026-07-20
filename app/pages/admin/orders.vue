<template>
  <div class="orders-shop-page space-y-5">
    <AdminPageHeader
      title="Заказы"
      kicker="Операции"
      description="Статусы заказов, оплаты, состав, доставка и быстрые операционные изменения."
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

    <section class="rounded-3xl bg-white/90 p-4 shadow-[0_18px_60px_rgba(24,24,27,0.06)] backdrop-blur sm:p-5">
      <div class="grid gap-3 xl:grid-cols-[minmax(16rem,24rem)_minmax(0,1fr)] xl:items-end">
        <label class="block min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Статус заказа</span>
          <USelect
            v-model="filters.orders.status"
            class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
            size="lg"
            color="neutral"
            variant="none"
            icon="i-lucide-clipboard-list"
            :content="adminSelectContent"
            :items="orderStatusFilterItems"
            :ui="adminSelectUi"
          />
        </label>

        <div class="min-w-0 rounded-2xl bg-[#f9fafb] p-3 shadow-inner shadow-zinc-950/5">
          <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Быстрый фильтр</span>
          <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <UButton
              v-for="quickStatus in quickStatusItems"
              :key="quickStatus.value"
              :color="filters.orders.status === quickStatus.value ? 'primary' : 'neutral'"
              :variant="filters.orders.status === quickStatus.value ? 'solid' : 'ghost'"
              size="lg"
              class="h-12 min-w-0 justify-center rounded-full px-4 text-sm font-medium"
              :class="filters.orders.status === quickStatus.value ? 'shadow-lg shadow-emerald-950/10' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 hover:text-zinc-950'"
              @click="setOrderStatusFilter(quickStatus.value)"
            >
              {{ quickStatus.label }}
            </UButton>
          </div>
        </div>
      </div>
    </section>

    <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-sm text-zinc-500">
        {{ ordersStatusText }}
      </p>

      <div
        v-auto-animate
        class="flex flex-wrap gap-2"
      >
        <UButton
          v-if="hasAnyOrderFilter"
          color="neutral"
          variant="ghost"
          size="sm"
          icon="i-lucide-rotate-ccw"
          class="rounded-full bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
          @click="setOrderStatusFilter('all')"
        >
          Сбросить
        </UButton>
        <UBadge
          color="primary"
          variant="soft"
          class="rounded-full px-3 py-1"
        >
          {{ selectedOrderStatusFilterLabel }}
        </UBadge>
      </div>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить заказы"
      :description="getErrorMessage(error)"
      class="rounded-2xl"
    />

    <section class="admin-list-card">
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4">
        <div>
          <p class="admin-section-heading">
            Лента заказов
          </p>
          <p class="admin-section-copy">
            Статусы, оплата, доставка, состав и сообщение покупателю в одной рабочей карточке.
          </p>
        </div>
        <UBadge
          color="neutral"
          variant="soft"
          class="rounded-full px-3 py-1"
        >
          {{ ordersData?.pagination?.total ?? orders.length }} заказов
        </UBadge>
      </div>

      <div
        v-if="orders.length"
        class="space-y-4 bg-[#f9fafb] p-3 sm:p-4"
      >
        <article
          v-for="order in orders"
          :key="order.id"
          class="rounded-[1.5rem] bg-white p-4 shadow-[0_18px_50px_rgba(24,24,27,0.08)] ring-1 ring-zinc-200/80 transition hover:-translate-y-0.5 hover:shadow-[0_24px_70px_rgba(24,24,27,0.12)] sm:p-5"
        >
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-xl font-semibold text-zinc-950">
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
              <p class="mt-2 text-sm leading-6 text-zinc-500">
                {{ order.user?.name || order.user?.email || "Гость" }} · {{ formatDate(order.createdAt) }}
              </p>
            </div>

            <div class="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
              <UButton
                v-if="order.user"
                color="neutral"
                variant="ghost"
                icon="i-lucide-messages-square"
                :to="{ path: '/admin/messages', query: { userId: order.user.id } }"
                class="col-span-2 min-h-12 justify-center rounded-2xl bg-[#f9fafb] px-4 text-zinc-700 shadow-sm shadow-zinc-950/5 hover:bg-emerald-50 hover:text-emerald-700 sm:col-span-1"
              >
                Перейти в чат
              </UButton>
              <div class="rounded-2xl bg-emerald-50 px-4 py-3 text-emerald-700">
                <p class="text-xs font-semibold uppercase">Сумма</p>
                <p class="mt-1 whitespace-nowrap text-base font-semibold">
                  {{ formatCurrency(order.payment?.amount) }}
                </p>
              </div>
              <div class="rounded-2xl bg-zinc-50 px-4 py-3 text-zinc-700">
                <p class="text-xs font-semibold uppercase">Позиций</p>
                <p class="mt-1 whitespace-nowrap text-base font-semibold">
                  {{ order.orderItems.length }}
                </p>
              </div>
            </div>
          </div>

          <div class="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Телефон
              </p>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-950">
                {{ order.customerPhone || "Не указан" }}
              </p>
            </div>
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Получение
              </p>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-950">
                {{ obtainingMethodLabels[order.obtainingMethod] }}
              </p>
            </div>
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Оплата
              </p>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-950">
                {{ paymentMethodLabels[order.paymentMethod] }}
              </p>
            </div>
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <p class="text-xs font-semibold uppercase text-zinc-400">
                Обновлён
              </p>
              <p class="mt-2 truncate text-sm font-semibold text-zinc-950">
                {{ formatDate(order.updatedAt) }}
              </p>
            </div>
          </div>

          <div class="mt-4 grid gap-4 2xl:grid-cols-[minmax(0,1fr)_minmax(340px,430px)]">
            <div class="rounded-2xl bg-[#f9fafb] p-4">
              <div class="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p class="text-base font-semibold text-zinc-950">
                    Состав заказа
                  </p>
                  <p class="mt-1 text-sm text-zinc-500">
                    {{ order.orderItems.length }} позиций в заказе
                  </p>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="item in order.orderItems"
                  :key="item.product.id"
                  class="grid gap-3 rounded-2xl bg-white p-3 shadow-sm shadow-zinc-950/5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
                >
                  <div class="flex min-w-0 items-center gap-3">
                    <img
                      :src="item.product.mainImage"
                      alt=""
                      class="size-14 shrink-0 rounded-xl object-cover"
                    >
                    <div class="min-w-0">
                      <p class="truncate text-sm font-semibold text-zinc-950">
                        {{ item.product.name }}
                      </p>
                      <p class="mt-1 text-xs text-zinc-500">
                        {{ item.quantity }} × {{ formatCurrency(item.price) }}
                      </p>
                    </div>
                  </div>
                  <p class="justify-self-start whitespace-nowrap text-sm font-semibold text-zinc-950 sm:justify-self-end">
                    {{ formatCurrency(Number(item.price) * item.quantity) }}
                  </p>
                </div>
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-2xl bg-[#f9fafb] p-4">
                <p class="text-base font-semibold text-zinc-950">
                  Операции
                </p>
                <p class="mt-1 text-sm text-zinc-500">
                  Быстрое изменение статуса заказа и оплаты.
                </p>

                <div class="mt-4 grid gap-3 sm:grid-cols-2 2xl:grid-cols-1">
                  <label class="block min-w-0">
                    <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Статус</span>
                    <USelect
                      :model-value="order.orderStatus"
                      class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                      size="lg"
                      color="neutral"
                      variant="none"
                      icon="i-lucide-clipboard-check"
                      :content="adminSelectContent"
                      :items="orderStatusItems"
                      :ui="adminSelectUi"
                      :disabled="savingOrderId === order.id"
                      @update:model-value="(value) => updateOrderStatus(order, value)"
                    />
                  </label>
                  <label class="block min-w-0">
                    <span class="mb-2 block px-1 text-xs font-semibold uppercase text-zinc-400">Оплата</span>
                    <USelect
                      :model-value="order.payment?.paymentStatus"
                      class="w-full rounded-2xl bg-white shadow-sm shadow-zinc-950/5"
                      size="lg"
                      color="neutral"
                      variant="none"
                      icon="i-lucide-wallet-cards"
                      :content="adminSelectContent"
                      :items="paymentStatusItems"
                      :ui="adminSelectUi"
                      :disabled="!order.payment || savingPaymentId === order.id"
                      @update:model-value="(value) => updatePaymentStatus(order, value)"
                    />
                  </label>
                </div>
              </div>

              <div class="rounded-2xl bg-[#f9fafb] p-4">
                <p class="text-base font-semibold text-zinc-950">
                  Доставка и связь
                </p>
                <dl class="mt-4 space-y-3 text-sm">
                  <div class="flex justify-between gap-4">
                    <dt class="text-zinc-500">Получатель</dt>
                    <dd class="text-right font-semibold text-zinc-950">
                      {{ recipientLabel(order) || order.user?.name || order.user?.email || "Гость" }}
                    </dd>
                  </div>
                  <div class="flex justify-between gap-4">
                    <dt class="text-zinc-500">Телефон</dt>
                    <dd class="text-right font-semibold text-zinc-950">
                      {{ order.recipientPhone || order.customerPhone || "Не указан" }}
                    </dd>
                  </div>
                  <div
                    v-if="order.delivery"
                    class="border-t border-zinc-200 pt-3"
                  >
                    <dt class="text-zinc-500">Служба доставки</dt>
                    <dd class="mt-1 font-semibold text-zinc-950">
                      {{ deliveryServiceLabel(order) }}
                    </dd>
                    <dt class="mt-3 text-zinc-500">Адрес</dt>
                    <dd class="mt-1 leading-6 text-zinc-950">
                      {{ order.delivery.address }}
                    </dd>
                    <dd
                      v-if="deliveryDetails(order)"
                      class="mt-1 text-xs leading-5 text-zinc-500"
                    >
                      {{ deliveryDetails(order) }}
                    </dd>
                    <dd
                      v-if="order.delivery.comment"
                      class="mt-2 rounded-xl bg-white p-3 text-xs leading-5 text-zinc-500 shadow-sm shadow-zinc-950/5"
                    >
                      {{ order.delivery.comment }}
                    </dd>
                  </div>
                  <div
                    v-else
                    class="border-t border-zinc-200 pt-3"
                  >
                    <dt class="text-zinc-500">Адрес самовывоза</dt>
                    <dd class="mt-1 font-semibold text-zinc-950">
                      Ярославль, пр.-т Октября, д. 78д
                    </dd>
                    <dd class="mt-1 text-xs leading-5 text-zinc-500">
                      По предварительной записи 89201309744.
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>

          <form
            class="mt-4 rounded-2xl bg-[#f9fafb] p-4 shadow-inner shadow-zinc-950/5"
            @submit.prevent="sendOrderMessage(order)"
          >
            <template v-if="order.user">
              <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p class="text-base font-semibold text-zinc-950">
                    Сообщение заказчику
                  </p>
                  <p class="mt-1 text-sm leading-6 text-zinc-500">
                    Ответ уйдёт в диалог пользователя и будет привязан к заказу #{{ order.id }}.
                  </p>
                </div>
                <UBadge
                  color="primary"
                  variant="soft"
                  class="w-fit rounded-full px-3 py-1"
                >
                  {{ order.user.name || order.user.email }}
                </UBadge>
              </div>

              <div class="mt-4 rounded-2xl bg-white p-1.5 shadow-sm shadow-zinc-950/5">
                <UTextarea
                  v-model="orderMessageDrafts[order.id]"
                  class="w-full"
                  size="lg"
                  variant="none"
                  :rows="4"
                  :ui="adminTextareaUi"
                  :disabled="sendingMessageOrderId === order.id"
                  placeholder="Напишите сообщение по этому заказу"
                />
              </div>

              <div class="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p class="text-xs leading-5 text-zinc-500">
                  Получатель: {{ order.user.name || order.user.email }}
                </p>
                <div class="grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:justify-end">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    icon="i-lucide-messages-square"
                    :to="{ path: '/admin/messages', query: { userId: order.user.id } }"
                    class="min-h-11 justify-center rounded-full bg-white px-5 text-zinc-600 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100"
                  >
                    Перейти в чат
                  </UButton>
                  <UButton
                    color="primary"
                    icon="i-lucide-send"
                    type="submit"
                    class="min-h-11 justify-center rounded-full px-5 shadow-lg shadow-emerald-950/10"
                    :disabled="!orderMessageDrafts[order.id]?.trim()"
                    :loading="sendingMessageOrderId === order.id"
                  >
                    Отправить
                  </UButton>
                </div>
              </div>
            </template>
            <p
              v-else
              class="rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-500 shadow-sm shadow-zinc-950/5"
            >
              У заказа нет зарегистрированного аккаунта, поэтому сообщение через личный кабинет недоступно.
            </p>
          </form>
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
    </section>
  </div>
</template>

<script setup lang="ts">
import { Banknote, ClipboardList, Clock3, Truck } from "@lucide/vue";
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
  { value: "all", label: "Все статусы" },
  ...orderStatusItems
];
const quickStatusItems = [
  { value: "all" as const, label: "Все" },
  { value: "NEW" as const, label: "Новые" },
  { value: "PROCESSING" as const, label: "В работе" },
  { value: "COMPLETED" as const, label: "Завершённые" }
];
const adminSelectContent = {
  bodyLock: false,
  collisionPadding: 12
};
const adminSelectUi = {
  base: "h-12 rounded-2xl bg-transparent font-medium text-zinc-700",
  content: "max-w-[min(28rem,calc(100vw-1rem))] rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0",
  item: "rounded-xl",
  itemLabel: "truncate",
  value: "truncate",
  viewport: "max-h-72 p-1"
};
const adminTextareaUi = {
  base: "min-h-32 resize-y rounded-2xl bg-transparent text-sm leading-6 text-zinc-900"
};
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
const selectedOrderStatusFilterLabel = computed(() => (
  filters.orders.status === "all"
    ? "Все статусы"
    : orderStatusLabels[filters.orders.status] ?? "Статус"
));
const hasAnyOrderFilter = computed(() => filters.orders.status !== "all");
const ordersStatusText = computed(() => {
  const pagination = ordersData.value?.pagination;

  if (!pagination) {
    return pending.value ? "Загружаем заказы..." : "Нет данных по заказам";
  }

  if (pagination.total === 0) {
    return "По текущему фильтру заказы не найдены";
  }

  const start = (pagination.page - 1) * pagination.limit + 1;
  const end = Math.min(pagination.page * pagination.limit, pagination.total);

  return `Показаны ${formatNumber(start)}-${formatNumber(end)} из ${formatNumber(pagination.total)} заказов`;
});

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

function deliveryServiceLabel(order: OrderListItem) {
  return order.delivery?.deliveryMethod === "OZON"
    ? "Служба доставки OZON"
    : "Не указана";
}

function recipientLabel(order: OrderListItem) {
  return [order.recipientName, order.recipientPhone].filter(Boolean).join(" · ");
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
