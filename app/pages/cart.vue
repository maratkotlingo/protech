<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section
      class="rounded-[2rem] bg-white/90 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.07)] sm:p-8 dark:bg-zinc-950/80 dark:shadow-black/25">
      <div class="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div class="max-w-3xl">
          <p
            class="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-200">
            <UIcon name="i-lucide-shopping-cart" class="size-4" />
            Корзина
          </p>
          <h1 class="mt-4 text-4xl font-semibold tracking-normal text-zinc-950 sm:text-5xl dark:text-white">
            Готово к оформлению
          </h1>
          <p class="mt-4 max-w-2xl text-base leading-7 text-zinc-500 dark:text-zinc-400">
            Проверьте товары, количество и наличие перед переходом к оплате.
          </p>
        </div>

        <UButton
color="primary" icon="i-lucide-layout-grid" to="/" size="lg"
          class="rounded-full px-5 transition duration-300 hover:scale-[1.02]">
          Продолжить покупки
        </UButton>
      </div>

      <div class="mt-8 grid gap-3 md:grid-cols-4">
        <div
v-for="metric in cartMetrics" :key="metric.label"
          class="rounded-[1.5rem] bg-[#f9fafb] p-4 dark:bg-zinc-900/80">
          <div class="flex items-center justify-between gap-4">
            <p class="text-sm text-zinc-500 dark:text-zinc-400">{{ metric.label }}</p>
            <UIcon :name="metric.icon" class="size-5 text-zinc-400" />
          </div>
          <p class="mt-2 text-2xl font-semibold text-zinc-950 dark:text-white">{{ metric.value }}</p>
        </div>
      </div>
    </section>

    <div v-if="loading" class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <div class="space-y-4">
        <USkeleton v-for="item in 3" :key="item" class="h-48 rounded-[2rem]" />
      </div>
      <USkeleton class="h-[34rem] rounded-[2rem]" />
    </div>

    <OrderEmptyState
v-else-if="!auth.user" class="mt-8" icon="i-lucide-lock-keyhole"
      title="Войдите, чтобы открыть корзину"
      description="После входа мы синхронизируем товары и сохраним корзину в вашем аккаунте." action-label="Войти"
      action-icon="i-lucide-user-round" action-to="/auth?redirect=/cart" />

    <OrderEmptyState
v-else-if="!cart.items.length" class="mt-8" icon="i-lucide-shopping-cart" title="Корзина пуста"
      description="Добавьте товары из каталога, чтобы собрать заказ." action-label="Перейти в каталог"
      action-icon="i-lucide-layout-grid" action-to="/" />

    <div v-else class="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_400px]">
      <section class="space-y-4">
        <div
          class="rounded-[2rem] bg-[#f9fafb] p-4 shadow-sm shadow-zinc-950/5 sm:p-5 dark:bg-zinc-900/80 dark:shadow-black/20">
          <div class="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 class="text-2xl font-semibold tracking-normal text-zinc-950 dark:text-white">Товары в корзине</h2>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {{ cart.items.length }} позиций, {{ cart.totalItems }} шт.
              </p>
            </div>

            <UButton
color="error" variant="soft" icon="i-lucide-trash-2"
              class="rounded-full bg-red-50/80 transition duration-300 hover:scale-[1.02] dark:bg-red-950/30"
              :loading="cart.pending" @click="clearCart">
              Очистить
            </UButton>
          </div>

          <UAlert
v-if="hasBlockingItems" color="warning" variant="soft" icon="i-lucide-triangle-alert"
            class="mt-4 rounded-[1.5rem]" title="Проверьте наличие"
            description="В корзине есть товар без остатка или количество выше доступного. Скорректируйте заказ перед оформлением." />
        </div>

        <div v-auto-animate class="space-y-4">
          <CartLineItem
v-for="item in cart.items" :key="item.id" :item="item"
            :loading="cart.syncingProductId === item.product.id" @update="updateQuantity" @remove="removeItem" />
        </div>
      </section>

      <aside class="space-y-4 xl:sticky xl:top-28 xl:self-start">
        <OrderSummary :items="cart.items" :subtotal="cart.subtotal" delivery-label="выбирается при оформлении">
          <template #actions>
            <div class="mt-6 grid gap-3">
              <UButton
color="primary" size="xl" block icon="i-lucide-credit-card" to="/checkout"
                class="rounded-full transition duration-300 hover:scale-[1.01]" :disabled="hasBlockingItems">
                Оформить заказ
              </UButton>
              <UButton
color="neutral" variant="soft" block icon="i-lucide-heart" to="/favorites"
                class="rounded-full bg-[#f3f4f6] transition duration-300 hover:scale-[1.01] dark:bg-zinc-900">
                Смотреть избранное
              </UButton>
            </div>
          </template>
        </OrderSummary>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, getErrorMessage, toNumber } from "~~/app/shared/lib/shopFormatters";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";

useSeoMeta({
  title: "Корзина",
  description: "Корзина покупателя ProTech."
});

const auth = useAuthStore();
const cart = useCartStore();
const loading = ref(true);
const discountAmount = computed(() => cart.items.reduce((sum, item) => {
  const oldPrice = toNumber(item.product.oldPrice);
  const currentPrice = toNumber(item.product.currentPrice);

  return oldPrice > currentPrice
    ? sum + (oldPrice - currentPrice) * item.quantity
    : sum;
}, 0));
const hasBlockingItems = computed(() => cart.items.some((item) => (
  !item.product.isActive ||
  item.product.stockQuantity <= 0 ||
  item.quantity > item.product.stockQuantity
)));
const cartMetrics = computed(() => [
  {
    icon: "i-lucide-package",
    label: "Позиций",
    value: `${cart.items.length}`
  },
  {
    icon: "i-lucide-shopping-bag",
    label: "Товаров",
    value: `${cart.totalItems}`
  },
  {
    icon: "i-lucide-badge-percent",
    label: "Экономия",
    value: formatCurrency(discountAmount.value)
  },
  {
    icon: "i-lucide-badge-russian-ruble",
    label: "Итого",
    value: formatCurrency(cart.subtotal)
  }
]);

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await cart.fetchCart();
  }

  loading.value = false;
});

async function updateQuantity(productId: number, quantity: number) {
  try {
    await cart.updateQuantity(productId, quantity);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить количество"));
  }
}

async function removeItem(productId: number) {
  try {
    await cart.remove(productId);
    toast.success("Товар удален из корзины");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось удалить товар"));
  }
}

async function clearCart() {
  try {
    await cart.clear();
    toast.success("Корзина очищена");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось очистить корзину"));
  }
}
</script>
