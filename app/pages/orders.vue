<template>
  <div class="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <UBadge
          color="primary"
          variant="soft"
          class="rounded-full"
        >
          История
        </UBadge>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">Мои заказы</h1>
        <p class="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">Статусы, оплата, доставка и состав заказов.</p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        to="/"
        class="rounded-full bg-white px-5 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        В каталог
      </UButton>
    </section>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <USkeleton
        v-for="item in 3"
        :key="item"
        class="h-40 rounded-3xl"
      />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <PackageCheck class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Войдите, чтобы увидеть заказы</h2>
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/auth?redirect=/orders"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!orders.length"
      class="grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <PackageCheck class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Заказов пока нет</h2>
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/"
        >
          Начать покупки
        </UButton>
      </div>
    </div>

    <div
      v-else
      v-auto-animate
      class="space-y-4"
    >
      <UCard
        v-for="order in orders"
        :key="order.id"
        class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-zinc-950/10 dark:bg-zinc-900 dark:shadow-black/20 dark:hover:shadow-black/30"
        :ui="{ body: 'p-5 sm:p-6' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <NuxtLink
              :to="`/orders/${order.id}`"
              class="text-xl font-semibold text-zinc-950 transition hover:text-emerald-700 dark:text-white dark:hover:text-emerald-300"
            >
              Заказ №{{ order.id }}
            </NuxtLink>
            <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{{ formatDateTime(order.createdAt) }}</p>
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

        <div class="mt-5 flex flex-wrap items-center justify-between gap-4">
          <div class="flex -space-x-3">
            <img
              v-for="item in order.orderItems.slice(0, 4)"
              :key="item.id"
              :src="item.productMainImage || item.product?.mainImage || '/favicon.ico'"
              :alt="item.productName"
              class="size-12 rounded-full border-2 border-white object-cover dark:border-zinc-900"
            >
          </div>
          <div class="text-right">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ order.orderItems.length }} позиций</p>
            <p class="text-xl font-semibold text-zinc-950 dark:text-white">{{ formatCurrency(order.payment?.amount) }}</p>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PackageCheck } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatCurrency, formatDateTime, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

useSeoMeta({
  title: "Мои заказы",
  description: "История заказов покупателя ProTech."
});

const auth = useAuthStore();
const orders = ref<ShopOrder[]>([]);
const loading = ref(true);

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (!user) {
    loading.value = false;
    return;
  }

  try {
    orders.value = await shopFetch<ShopOrder[]>("/api/public/orders");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить заказы"));
  } finally {
    loading.value = false;
  }
});
</script>
