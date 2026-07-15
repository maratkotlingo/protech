<template>
  <UModal
    v-model:open="open"
    :title="modalTitle"
    :ui="modalUi"
  >
    <template #body>
      <div
        v-if="order"
        class="max-h-[calc(92dvh-4rem)] overflow-y-auto overscroll-contain bg-white p-4 sm:p-6 dark:bg-zinc-950"
      >
        <section class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 sm:p-6 dark:bg-zinc-900/80 dark:shadow-black/20">
          <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
            <div class="min-w-0">
              <p class="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-emerald-700 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950 dark:text-emerald-200">
                <UIcon
                  name="i-lucide-receipt-text"
                  class="size-4"
                />
                Заказ №{{ order.id }}
              </p>
              <h2 class="mt-4 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">
                Детали заказа
              </h2>
              <p class="mt-3 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
                Оформлен {{ formatDateTime(order.createdAt) }}
              </p>

              <div class="mt-4 flex flex-wrap gap-2">
                <OrderStatusPill
                  type="order"
                  :value="order.orderStatus"
                />
                <OrderStatusPill
                  v-if="order.payment"
                  type="payment"
                  :value="order.payment.paymentStatus"
                />
              </div>
            </div>

            <div class="rounded-[1.5rem] bg-white p-5 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950">
              <p class="text-xs uppercase tracking-[0.16em] text-zinc-400">Итого</p>
              <p class="mt-2 text-3xl font-semibold text-zinc-950 dark:text-white">
                {{ formatCurrency(orderTotal) }}
              </p>
              <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {{ order.orderItems.length }} позиций
              </p>
            </div>
          </div>

          <div class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div
              v-for="card in overviewCards"
              :key="card.label"
              class="rounded-[1.5rem] bg-white p-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950"
            >
              <div class="flex items-center justify-between gap-3">
                <p class="text-xs uppercase tracking-[0.16em] text-zinc-400">{{ card.label }}</p>
                <UIcon
                  :name="card.icon"
                  class="size-4 text-zinc-400"
                />
              </div>
              <p class="mt-3 text-lg font-semibold text-zinc-950 dark:text-white">{{ card.value }}</p>
            </div>
          </div>
        </section>

        <section class="mt-6 rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 sm:p-6 dark:bg-zinc-900/80 dark:shadow-black/20">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-white">История статусов</h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Все изменения заказа и оплаты в хронологическом порядке.</p>
            </div>
            <UIcon
              name="i-lucide-route"
              class="size-6 text-zinc-400"
            />
          </div>

          <div
            v-auto-animate
            class="mt-5 grid gap-3 lg:grid-cols-2"
          >
            <article
              v-for="event in statusEvents"
              :key="event.id"
              class="grid grid-cols-[44px_minmax(0,1fr)] gap-3 rounded-[1.35rem] bg-white p-3 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-zinc-950/10 dark:bg-zinc-950"
            >
              <div
                class="grid size-11 place-items-center rounded-2xl"
                :class="event.meta.class"
              >
                <UIcon
                  :name="event.meta.icon"
                  class="size-5"
                />
              </div>

              <div class="min-w-0">
                <div class="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p class="text-sm font-semibold text-zinc-950 dark:text-white">{{ event.title }}</p>
                    <p class="mt-1 text-xs leading-5 text-zinc-500 dark:text-zinc-400">{{ event.description }}</p>
                  </div>
                  <time class="rounded-full bg-[#f3f4f6] px-3 py-1 text-xs font-medium text-zinc-500 dark:bg-zinc-900 dark:text-zinc-300">
                    {{ formatDateTime(event.changedAt) }}
                  </time>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section class="mt-6 rounded-[2rem] bg-white p-5 shadow-sm shadow-zinc-950/5 sm:p-6 dark:bg-zinc-950/80 dark:shadow-black/20">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 class="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-white">Товары в заказе</h3>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {{ order.orderItems.length }} позиций, каждая с ценой и количеством.
              </p>
            </div>
            <UBadge
              color="neutral"
              variant="soft"
              class="rounded-full bg-[#f3f4f6] px-3 py-1.5 dark:bg-zinc-900"
            >
              {{ formatCurrency(orderTotal) }}
            </UBadge>
          </div>

          <div
            v-auto-animate
            class="mt-5 space-y-3"
          >
            <OrderLineItem
              v-for="item in order.orderItems"
              :key="item.id"
              :item="item"
            />
          </div>
        </section>

        <div
          class="mt-6 grid gap-6"
          :class="deliveryRows.length ? 'lg:grid-cols-2' : 'lg:grid-cols-1'"
        >
          <section class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/80 dark:shadow-black/20">
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-xl font-semibold text-zinc-950 dark:text-white">Оплата и получение</h3>
              <UIcon
                name="i-lucide-wallet-cards"
                class="size-5 text-zinc-400"
              />
            </div>

            <dl class="mt-5 grid gap-3 sm:grid-cols-2">
              <div
                v-for="row in summaryRows"
                :key="row.label"
                class="rounded-[1.25rem] bg-white p-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950"
              >
                <dt class="text-xs uppercase tracking-[0.16em] text-zinc-400">{{ row.label }}</dt>
                <dd class="mt-2 text-sm font-semibold text-zinc-950 dark:text-white">{{ row.value }}</dd>
              </div>
            </dl>
          </section>

          <section
            v-if="deliveryRows.length"
            class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/80 dark:shadow-black/20"
          >
            <div class="flex items-center justify-between gap-4">
              <h3 class="text-xl font-semibold text-zinc-950 dark:text-white">Адрес получения</h3>
              <UIcon
                name="i-lucide-map-pin"
                class="size-5 text-zinc-400"
              />
            </div>

            <dl class="mt-5 grid gap-3 sm:grid-cols-2">
              <div
                v-for="row in deliveryRows"
                :key="row.label"
                class="rounded-[1.25rem] bg-white p-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950"
              >
                <dt class="text-xs uppercase tracking-[0.16em] text-zinc-400">{{ row.label }}</dt>
                <dd class="mt-2 text-sm font-semibold leading-6 text-zinc-950 dark:text-white">{{ row.value }}</dd>
              </div>
            </dl>
          </section>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import {
  getStatusMeta,
  obtainingMethodLabels,
  paymentMethodLabels,
  type StatusMeta
} from "~~/app/entities/order/lib/orderDisplay";
import { formatCurrency, formatDateTime } from "~~/app/shared/lib/shopFormatters";
import type { OrderStatus, OrderStatusHistoryItem, PaymentStatus, ShopOrder } from "~~/app/shared/types/shop";

type StatusEvent = OrderStatusHistoryItem & {
  description: string;
  meta: StatusMeta;
  title: string;
};

const props = defineProps<{
  order: ShopOrder | null;
}>();

const open = defineModel<boolean>("open", { required: true });

const order = computed(() => props.order);
const modalTitle = computed(() => order.value ? `Заказ №${order.value.id}` : "Детали заказа");
const modalUi = {
  overlay: "bg-zinc-950/55 backdrop-blur-sm",
  content: "max-h-[92dvh] max-w-6xl overflow-hidden rounded-[2rem] bg-white shadow-2xl shadow-zinc-950/20 ring-0 dark:bg-zinc-950 dark:shadow-black/40",
  header: "px-5 py-4 sm:px-6",
  title: "text-base font-semibold text-zinc-950 dark:text-white",
  body: "overflow-hidden p-0"
};

const orderTotal = computed(() => {
  if (!order.value) {
    return 0;
  }

  if (order.value.payment?.amount !== null && order.value.payment?.amount !== undefined) {
    return order.value.payment.amount;
  }

  return order.value.orderItems.reduce((sum, item) => sum + Number(item.lineTotal ?? 0), 0);
});

const overviewCards = computed(() => {
  if (!order.value) {
    return [];
  }

  return [
    {
      icon: "i-lucide-hash",
      label: "Номер",
      value: `№${order.value.id}`
    },
    {
      icon: "i-lucide-calendar-days",
      label: "Дата",
      value: formatDateTime(order.value.createdAt)
    },
    {
      icon: "i-lucide-credit-card",
      label: "Оплата",
      value: paymentMethodLabels[order.value.paymentMethod]
    },
    {
      icon: "i-lucide-badge-russian-ruble",
      label: "Сумма",
      value: formatCurrency(orderTotal.value)
    }
  ];
});

const summaryRows = computed(() => {
  if (!order.value) {
    return [];
  }

  return [
    {
      label: "Способ оплаты",
      value: paymentMethodLabels[order.value.paymentMethod]
    },
    {
      label: "Статус оплаты",
      value: order.value.payment ? getStatusMeta("payment", order.value.payment.paymentStatus).label : "Не указан"
    },
    {
      label: "Способ получения",
      value: obtainingMethodLabels[order.value.obtainingMethod]
    },
    {
      label: "Итого",
      value: formatCurrency(orderTotal.value)
    }
  ];
});

const deliveryRows = computed(() => {
  if (!order.value || !order.value.delivery) {
    return [];
  }

  return [
    {
      label: "Служба",
      value: order.value.delivery.deliveryMethod
    },
    {
      label: "Адрес",
      value: order.value.delivery.address
    },
    order.value.delivery.apartment ? {
      label: "Квартира",
      value: order.value.delivery.apartment
    } : null,
    order.value.delivery.entrance ? {
      label: "Подъезд",
      value: order.value.delivery.entrance
    } : null,
    order.value.delivery.floor ? {
      label: "Этаж",
      value: order.value.delivery.floor
    } : null,
    order.value.delivery.intercom ? {
      label: "Домофон",
      value: order.value.delivery.intercom
    } : null,
    order.value.delivery.comment ? {
      label: "Комментарий",
      value: order.value.delivery.comment
    } : null
  ].filter((row): row is { label: string; value: string } => Boolean(row));
});

const statusEvents = computed<StatusEvent[]>(() => {
  if (!order.value) {
    return [];
  }

  const history = order.value.statusHistory?.length
    ? order.value.statusHistory
    : buildFallbackHistory(order.value);

  return [...history]
    .sort((left, right) => getTime(left.changedAt) - getTime(right.changedAt))
    .map((event) => ({
      ...event,
      description: getStatusDescription(event),
      meta: getHistoryMeta(event),
      title: getStatusTitle(event)
    }));
});

function buildFallbackHistory(orderValue: ShopOrder): OrderStatusHistoryItem[] {
  const history: OrderStatusHistoryItem[] = [
    {
      id: `fallback-order-created-${orderValue.id}`,
      type: "order",
      status: "NEW",
      changedAt: orderValue.createdAt
    }
  ];

  if (orderValue.orderStatus !== "NEW") {
    history.push({
      id: `fallback-order-current-${orderValue.id}`,
      type: "order",
      status: orderValue.orderStatus,
      changedAt: orderValue.updatedAt
    });
  }

  if (orderValue.payment) {
    history.push({
      id: `fallback-payment-current-${orderValue.id}`,
      type: "payment",
      status: orderValue.payment.paymentStatus,
      changedAt: orderValue.payment.paidAt ?? orderValue.updatedAt
    });
  }

  return history;
}

function getHistoryMeta(event: OrderStatusHistoryItem) {
  return event.type === "order"
    ? getStatusMeta("order", event.status as OrderStatus)
    : getStatusMeta("payment", event.status as PaymentStatus);
}

function getStatusTitle(event: OrderStatusHistoryItem) {
  const prefix = event.type === "order" ? "Заказ" : "Оплата";

  return `${prefix}: ${getHistoryMeta(event).label}`;
}

function getStatusDescription(event: OrderStatusHistoryItem) {
  if (event.type === "payment") {
    return "Изменен статус оплаты по заказу.";
  }

  const descriptions: Record<OrderStatus, string> = {
    NEW: "Заказ создан и принят системой.",
    CONFIRMED: "Заказ подтвержден и готовится к обработке.",
    PROCESSING: "Состав заказа проверяется и собирается.",
    SHIPPED: "Заказ передан в доставку.",
    COMPLETED: "Заказ завершен.",
    CANCELLED: "Заказ отменен."
  };

  return descriptions[event.status as OrderStatus];
}

function getTime(value: string) {
  const time = new Date(value).getTime();

  return Number.isNaN(time) ? 0 : time;
}
</script>
