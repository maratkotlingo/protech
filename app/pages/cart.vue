<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="mb-7 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="max-w-3xl">
        <UBadge
          color="primary"
          variant="soft"
          class="rounded-full"
        >
          Покупки
        </UBadge>
        <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">Корзина</h1>
        <p class="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">
          Проверьте количество товаров перед оформлением заказа.
        </p>
      </div>
      <UButton
        color="neutral"
        variant="ghost"
        to="/"
        class="rounded-full bg-white px-5 shadow-sm shadow-zinc-950/5 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800"
      >
        Продолжить покупки
      </UButton>
    </section>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <USkeleton class="h-80 rounded-3xl" />
      <USkeleton class="h-80 rounded-3xl" />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <ShoppingCart class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Войдите, чтобы открыть корзину</h2>
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/auth?redirect=/cart"
        >
          Войти
        </UButton>
      </div>
    </div>

    <div
      v-else-if="!cart.items.length"
      class="grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <ShoppingCart class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Корзина пуста</h2>
        <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">Добавьте товары из каталога, чтобы оформить заказ.</p>
        <UButton
          class="mt-5 rounded-full"
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
                class="rounded-full"
              >
                Оформить заказ
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                block
                class="rounded-full"
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
