<template>
  <div class="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <UButton
      color="neutral"
      variant="ghost"
      to="/orders"
      class="mb-6 rounded-full bg-white px-4 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
    >
      <ArrowLeft class="size-4" />
      К заказам
    </UButton>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <USkeleton class="h-96 rounded-[2rem]" />
      <USkeleton class="h-80 rounded-[2rem]" />
    </div>

    <UAlert
      v-else-if="!order"
      color="error"
      variant="soft"
      title="Заказ не найден"
      description="Проверьте номер заказа или войдите в нужный аккаунт."
      class="rounded-3xl"
    />

    <div
      v-else
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]"
    >
      <div class="space-y-6">
        <UCard
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <UBadge
                color="primary"
                variant="soft"
                class="mb-4 rounded-full"
              >
                Заказ №{{ order.id }}
              </UBadge>
              <h1 class="text-3xl font-semibold tracking-normal text-zinc-950 dark:text-white">
                Детали заказа
              </h1>
              <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
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
          class="overflow-hidden rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-0' }"
        >
          <div class="p-5 sm:p-6">
            <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Состав заказа</h2>
          </div>
          <div class="space-y-3 px-3 pb-3 sm:px-4 sm:pb-4">
            <div
              v-for="item in order.orderItems"
              :key="item.id"
              class="grid gap-4 rounded-3xl bg-[#f9fafb] p-4 sm:grid-cols-[84px_minmax(0,1fr)_auto] dark:bg-zinc-800/60"
            >
              <img
                :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'"
                :alt="item.productName"
                class="size-20 rounded-2xl object-cover"
              >
              <div>
                <p class="font-semibold text-zinc-950 dark:text-white">{{ item.productName }}</p>
                <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Арт. {{ item.productArticle }}</p>
                <p class="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {{ item.quantity }} × {{ formatCurrency(item.price) }}
                </p>
              </div>
              <p class="text-lg font-semibold text-zinc-950 sm:text-right dark:text-white">
                {{ formatCurrency(item.lineTotal) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <aside class="space-y-6 lg:sticky lg:top-24 lg:self-start">
        <UCard
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Итого</h2>
          <div class="mt-5 space-y-3 text-sm">
            <div class="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
              <span>Получение</span>
              <span>{{ order.obtainingMethod === "DELIVERY" ? "Доставка" : "Самовывоз" }}</span>
            </div>
            <div class="flex justify-between gap-4 text-zinc-500 dark:text-zinc-400">
              <span>Оплата</span>
              <span>{{ order.paymentMethod === "ONLINE" ? "Онлайн" : "При получении" }}</span>
            </div>
            <div class="flex justify-between gap-4 rounded-3xl bg-[#f9fafb] p-4 text-lg font-semibold text-zinc-950 dark:bg-zinc-800/60 dark:text-white">
              <span>Сумма</span>
              <span>{{ formatCurrency(order.payment?.amount) }}</span>
            </div>
          </div>
        </UCard>

        <UCard
          v-if="order.delivery"
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Доставка</h2>
          <div class="mt-4 space-y-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            <p class="font-medium text-zinc-950 dark:text-white">{{ order.delivery.address }}</p>
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
