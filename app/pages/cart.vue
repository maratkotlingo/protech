<template>
  <div class="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <div class="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <UBadge
          color="primary"
          variant="soft"
          class="mb-4"
        >
          Покупки
        </UBadge>
        <h1 class="text-4xl font-semibold tracking-normal text-[var(--shop-text)]">Корзина</h1>
        <p class="mt-3 text-[var(--shop-text-muted)]">
          Проверьте количество товаров перед оформлением заказа.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="outline"
        to="/"
      >
        Продолжить покупки
      </UButton>
    </div>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <USkeleton class="h-80 rounded-lg" />
      <USkeleton class="h-80 rounded-lg" />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <ShoppingCart class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Войдите, чтобы открыть корзину</h2>
        <UButton
          class="mt-5"
          color="primary"
          to="/auth?redirect=/cart"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!cart.items.length"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <ShoppingCart class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Корзина пуста</h2>
        <p class="mt-2 text-sm text-[var(--shop-text-muted)]">Добавьте товары из каталога, чтобы оформить заказ.</p>
        <UButton
          class="mt-5"
          color="primary"
          to="/"
        >
          Перейти в каталог
        </UButton>
      </div>
    </div>

    <div
      v-else
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div
        v-auto-animate
        class="space-y-4"
      >
        <CartLineItem
          v-for="item in cart.items"
          :key="item.id"
          :item="item"
          :loading="cart.syncingProductId === item.product.id"
          @update="updateQuantity"
          @remove="removeItem"
        />
      </div>

      <aside class="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary
          :items="cart.items"
          :subtotal="cart.subtotal"
          delivery-label="выбирается при оформлении"
        >
          <template #actions>
            <div class="mt-6 grid gap-3">
              <UButton
                color="primary"
                size="xl"
                block
                to="/checkout"
              >
                Оформить заказ
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                block
                :loading="cart.pending"
                @click="clearCart"
              >
                Очистить корзину
              </UButton>
            </div>
          </template>
        </OrderSummary>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ShoppingCart } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";

useSeoMeta({
  title: "Корзина",
  description: "Корзина покупателя ProTech."
});

const auth = useAuthStore();
const cart = useCartStore();
const loading = ref(true);

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
