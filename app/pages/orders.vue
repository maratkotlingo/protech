<template>
  <div class="mx-auto w-full max-w-[1180px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <UBadge
          color="primary"
          variant="soft"
          class="mb-4"
        >
          История
        </UBadge>
        <h1 class="text-4xl font-semibold tracking-normal text-[var(--shop-text)]">Мои заказы</h1>
        <p class="mt-3 text-[var(--shop-text-muted)]">Статусы, оплата, доставка и состав заказов.</p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        to="/"
      >
        В каталог
      </UButton>
    </div>

    <div
      v-if="loading"
      class="space-y-4"
    >
      <USkeleton
        v-for="item in 3"
        :key="item"
        class="h-40 rounded-lg"
      />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <PackageCheck class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Войдите, чтобы увидеть заказы</h2>
        <UButton
          class="mt-5"
          color="primary"
          to="/auth?redirect=/orders"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!orders.length"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <PackageCheck class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Заказов пока нет</h2>
        <UButton
          class="mt-5"
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
        class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
        :ui="{ body: 'p-5 sm:p-6' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <NuxtLink
              :to="`/orders/${order.id}`"
              class="text-xl font-semibold text-[var(--shop-text)] transition hover:text-[var(--shop-accent)]"
            >
              Заказ №{{ order.id }}
            </NuxtLink>
            <p class="mt-1 text-sm text-[var(--shop-text-muted)]">{{ formatDateTime(order.createdAt) }}</p>
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
              :src="item.productMainImage || item.product?.mainImage"
              :alt="item.productName"
              class="size-12 rounded-full border-2 border-[var(--shop-surface)] object-cover"
            >
          </div>
          <div class="text-right">
            <p class="text-sm text-[var(--shop-text-muted)]">{{ order.orderItems.length }} позиций</p>
            <p class="text-xl font-semibold text-[var(--shop-text)]">{{ formatCurrency(order.payment?.amount) }}</p>
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
