<template>
  <div class="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <UButton
      color="neutral"
      variant="ghost"
      to="/orders"
      class="mb-6"
    >
      <ArrowLeft class="size-4" />
      К заказам
    </UButton>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <USkeleton class="h-96 rounded-lg" />
      <USkeleton class="h-80 rounded-lg" />
    </div>

    <UAlert
      v-else-if="!order"
      color="error"
      variant="soft"
      title="Заказ не найден"
      description="Проверьте номер заказа или войдите в нужный аккаунт."
    />

    <div
      v-else
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div class="space-y-6">
        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <UBadge
                color="primary"
                variant="soft"
                class="mb-4"
              >
                Заказ №{{ order.id }}
              </UBadge>
              <h1 class="text-3xl font-semibold tracking-normal text-[var(--shop-text)]">
                Детали заказа
              </h1>
              <p class="mt-2 text-sm text-[var(--shop-text-muted)]">
                Создан {{ formatDateTime(order.createdAt) }}
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
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
        </UCard>

        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-0' }"
        >
          <div class="border-b border-[var(--shop-border)] p-5 sm:p-6">
            <h2 class="text-xl font-semibold text-[var(--shop-text)]">Состав заказа</h2>
          </div>
          <div class="divide-y divide-[var(--shop-border)]">
            <div
              v-for="item in order.orderItems"
              :key="item.id"
              class="grid gap-4 p-5 sm:grid-cols-[84px_minmax(0,1fr)_auto] sm:p-6"
            >
              <img
                :src="item.productMainImage || item.product?.mainImage"
                :alt="item.productName"
                class="size-20 rounded-lg object-cover"
              >
              <div>
                <p class="font-semibold text-[var(--shop-text)]">{{ item.productName }}</p>
                <p class="mt-1 text-sm text-[var(--shop-text-muted)]">Арт. {{ item.productArticle }}</p>
                <p class="mt-2 text-sm text-[var(--shop-text-muted)]">
                  {{ item.quantity }} × {{ formatCurrency(item.price) }}
                </p>
              </div>
              <p class="text-lg font-semibold text-[var(--shop-text)] sm:text-right">
                {{ formatCurrency(item.lineTotal) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-[var(--shop-text)]">Итого</h2>
          <div class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between gap-4 text-[var(--shop-text-muted)]">
              <span>Получение</span>
              <span>{{ order.obtainingMethod === "DELIVERY" ? "Доставка" : "Самовывоз" }}</span>
            </div>
            <div class="flex justify-between gap-4 text-[var(--shop-text-muted)]">
              <span>Оплата</span>
              <span>{{ order.paymentMethod === "ONLINE" ? "Онлайн" : "При получении" }}</span>
            </div>
            <div class="flex justify-between gap-4 text-lg font-semibold text-[var(--shop-text)]">
              <span>Сумма</span>
              <span>{{ formatCurrency(order.payment?.amount) }}</span>
            </div>
          </div>
        </UCard>

        <UCard
          v-if="order.delivery"
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-[var(--shop-text)]">Доставка</h2>
          <div class="mt-4 space-y-2 text-sm leading-6 text-[var(--shop-text-muted)]">
            <p class="font-medium text-[var(--shop-text)]">{{ order.delivery.address }}</p>
            <p v-if="order.delivery.apartment">Квартира: {{ order.delivery.apartment }}</p>
            <p v-if="order.delivery.entrance">Подъезд: {{ order.delivery.entrance }}</p>
            <p v-if="order.delivery.floor">Этаж: {{ order.delivery.floor }}</p>
            <p v-if="order.delivery.intercom">Домофон: {{ order.delivery.intercom }}</p>
            <p v-if="order.delivery.comment">Комментарий: {{ order.delivery.comment }}</p>
          </div>
        </UCard>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatCurrency, formatDateTime, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

const route = useRoute();
const auth = useAuthStore();
const order = ref<ShopOrder | null>(null);
const loading = ref(true);

useSeoMeta({
  title: () => order.value ? `Заказ №${order.value.id}` : "Заказ",
  description: "Детальная информация о заказе ProTech."
});

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
    return;
  }

  try {
    order.value = await shopFetch<ShopOrder>(`/api/public/orders/${route.params.id}`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить заказ"));
  } finally {
    loading.value = false;
  }
});
</script>
