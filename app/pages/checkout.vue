<template>
  <div class="mx-auto w-full max-w-370 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <section class="mb-7 max-w-3xl">
      <UBadge
        color="primary"
        variant="soft"
        class="rounded-full"
      >
        Оформление
      </UBadge>
      <h1 class="mt-2 text-3xl font-semibold tracking-normal text-zinc-950 sm:text-4xl dark:text-white">Оформление заказа</h1>
      <p class="mt-3 max-w-2xl text-zinc-500 dark:text-zinc-400">
        Выберите способ получения, оплату и уточните адрес доставки.
      </p>
    </section>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <USkeleton class="h-[640px] rounded-[2rem]" />
      <USkeleton class="h-96 rounded-[2rem]" />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-96 place-items-center rounded-[2rem] bg-white px-6 text-center shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
    >
      <div>
        <div class="mx-auto grid size-14 place-items-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-300">
          <LockKeyhole class="size-7" />
        </div>
        <h2 class="mt-4 text-xl font-semibold tracking-normal text-zinc-950 dark:text-white">Нужен вход в аккаунт</h2>
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/auth?redirect=/checkout"
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
        <UButton
          class="mt-5 rounded-full"
          color="primary"
          to="/"
        >
          В каталог
        </UButton>
      </div>
    </div>

    <div
      v-else
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <div class="space-y-6">
        <UCard
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Способ получения</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-3xl p-4 text-left transition"
              :class="draft.obtainingMethod === 'DELIVERY' ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/40' : 'bg-[#f9fafb] hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800'"
              @click="setObtainingMethod('DELIVERY')"
            >
              <Truck class="mb-3 size-6 text-emerald-600 dark:text-emerald-300" />
              <p class="font-semibold text-zinc-950 dark:text-white">Доставка</p>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Курьерская доставка через OZON.</p>
            </button>
            <button
              type="button"
              class="rounded-3xl p-4 text-left transition"
              :class="draft.obtainingMethod === 'PICKUP' ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/40' : 'bg-[#f9fafb] hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800'"
              @click="setObtainingMethod('PICKUP')"
            >
              <Store class="mb-3 size-6 text-emerald-600 dark:text-emerald-300" />
              <p class="font-semibold text-zinc-950 dark:text-white">Самовывоз</p>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Заберите заказ после подтверждения.</p>
            </button>
          </div>
        </UCard>

        <UCard
          class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Оплата</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-3xl p-4 text-left transition"
              :class="draft.paymentMethod === 'ONLINE' ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/40' : 'bg-[#f9fafb] hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800'"
              @click="draft.paymentMethod = 'ONLINE'"
            >
              <CreditCard class="mb-3 size-6 text-emerald-600 dark:text-emerald-300" />
              <p class="font-semibold text-zinc-950 dark:text-white">Онлайн</p>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Оплата через YooKassa.</p>
            </button>
            <button
              type="button"
              class="rounded-3xl p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="draft.paymentMethod === 'OFFLINE' ? 'bg-emerald-50 ring-2 ring-emerald-500 dark:bg-emerald-950/40' : 'bg-[#f9fafb] hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800'"
              :disabled="draft.obtainingMethod === 'DELIVERY'"
              @click="draft.paymentMethod = 'OFFLINE'"
            >
              <Wallet class="mb-3 size-6 text-emerald-600 dark:text-emerald-300" />
              <p class="font-semibold text-zinc-950 dark:text-white">При получении</p>
              <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Доступно только для самовывоза.</p>
            </button>
          </div>
        </UCard>

        <section
          v-if="draft.obtainingMethod === 'DELIVERY'"
          class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]"
        >
          <UCard
            class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
            :ui="{ body: 'space-y-5 p-5 sm:p-6' }"
          >
            <h2 class="text-xl font-semibold text-zinc-950 dark:text-white">Адрес доставки</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField
                label="Город"
                required
                :error="fieldErrors.city"
              >
                <UInput
                  v-model="draft.city"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  placeholder="Москва"
                  :ui="checkoutInputUi"
                />
              </UFormField>
              <UFormField
                label="Улица"
                required
                :error="fieldErrors.street"
              >
                <UInput
                  v-model="draft.street"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  placeholder="Тверская"
                  :ui="checkoutInputUi"
                />
              </UFormField>
              <UFormField
                label="Дом"
                required
                :error="fieldErrors.house"
              >
                <UInput
                  v-model="draft.house"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  placeholder="10"
                  :ui="checkoutInputUi"
                />
              </UFormField>
              <UFormField label="Квартира">
                <UInput
                  v-model="draft.apartment"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  placeholder="45"
                  :ui="checkoutInputUi"
                />
              </UFormField>
              <UFormField label="Подъезд">
                <UInput
                  v-model="draft.entrance"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  :ui="checkoutInputUi"
                />
              </UFormField>
              <UFormField label="Этаж">
                <UInput
                  v-model="draft.floor"
                  class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                  size="lg"
                  variant="none"
                  :ui="checkoutInputUi"
                />
              </UFormField>
            </div>
            <UFormField label="Домофон">
              <UInput
                v-model="draft.intercom"
                class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                size="lg"
                variant="none"
                :ui="checkoutInputUi"
              />
            </UFormField>
            <UFormField label="Комментарий курьеру">
              <UTextarea
                v-model="draft.comment"
                class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
                :rows="4"
                variant="none"
                placeholder="Например, позвонить за 10 минут"
                :ui="checkoutTextareaUi"
              />
            </UFormField>
          </UCard>

          <CheckoutDeliveryMap
            :city="draft.city"
            :street="draft.street"
            :house="draft.house"
          />
        </section>
      </div>

      <aside class="lg:sticky lg:top-24 lg:self-start">
        <OrderSummary
          :items="cart.items"
          :subtotal="cart.subtotal"
          :delivery-label="draft.obtainingMethod === 'DELIVERY' ? 'OZON, по тарифу' : 'самовывоз'"
        >
          <template #actions>
            <div class="mt-6">
              <UAlert
                v-if="submitError"
                color="error"
                variant="soft"
                :description="submitError"
                class="mb-4 rounded-3xl"
              />
              <UButton
                color="primary"
                size="xl"
                block
                class="rounded-full"
                :loading="submitting"
                @click="submitOrder"
              >
                <CheckCircle2 class="size-5" />
                Подтвердить заказ
              </UButton>
            </div>
          </template>
        </OrderSummary>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { CheckCircle2, CreditCard, LockKeyhole, ShoppingCart, Store, Truck, Wallet } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ObtainingMethod, ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";

type CreateOrderResponse = {
  order: ShopOrder;
  payment: {
    type: "offline" | "yookassa";
    status?: string;
    confirmationUrl: string | null;
  };
};

useSeoMeta({
  title: "Оформление заказа",
  description: "Оформление заказа ProTech с выбором доставки, оплаты и адресом на карте."
});

const auth = useAuthStore();
const cart = useCartStore();
const draft = cart.checkoutDraft;
const loading = ref(true);
const submitting = ref(false);
const submitError = ref("");
const fieldErrors = reactive<Record<string, string | undefined>>({});
const checkoutInputUi = { base: "h-11 rounded-2xl bg-transparent" };
const checkoutTextareaUi = { base: "rounded-2xl bg-transparent" };

onMounted(async () => {
  const user = auth.user ?? await auth.fetchMe();

  if (user) {
    await cart.fetchCart();
  }

  loading.value = false;
});

function setObtainingMethod(value: ObtainingMethod) {
  draft.obtainingMethod = value;

  if (value === "DELIVERY") {
    draft.paymentMethod = "ONLINE";
  }
}

function validateDelivery() {
  fieldErrors.city = undefined;
  fieldErrors.street = undefined;
  fieldErrors.house = undefined;

  if (draft.obtainingMethod !== "DELIVERY") {
    return true;
  }

  if (!draft.city.trim()) fieldErrors.city = "Введите город";
  if (!draft.street.trim()) fieldErrors.street = "Введите улицу";
  if (!draft.house.trim()) fieldErrors.house = "Введите дом";

  return !fieldErrors.city && !fieldErrors.street && !fieldErrors.house;
}

function fullAddress() {
  return [draft.city, draft.street, draft.house]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

async function submitOrder() {
  submitError.value = "";

  if (!validateDelivery()) {
    submitError.value = "Заполните обязательные поля доставки";
    return;
  }

  submitting.value = true;

  try {
    const result = await shopFetch<CreateOrderResponse>("/api/public/orders", {
      method: "POST",
      body: {
        obtainingMethod: draft.obtainingMethod,
        paymentMethod: draft.obtainingMethod === "DELIVERY" ? "ONLINE" : draft.paymentMethod,
        orderItems: cart.orderItems,
        ...(draft.obtainingMethod === "DELIVERY"
          ? {
            delivery: {
              address: fullAddress(),
              apartment: draft.apartment.trim() || undefined,
              entrance: draft.entrance.trim() || undefined,
              floor: draft.floor.trim() || undefined,
              intercom: draft.intercom.trim() || undefined,
              comment: draft.comment.trim() || undefined,
              deliveryMethod: "OZON"
            }
          }
          : {})
      }
    });

    await cart.clear().catch(() => {
      cart.items = [];
    });
    cart.resetCheckoutDraft();
    toast.success("Заказ создан");

    if (result.payment.confirmationUrl) {
      await navigateTo(result.payment.confirmationUrl, { external: true });
      return;
    }

    await navigateTo(`/orders/${result.order.id}`);
  } catch (error) {
    submitError.value = getErrorMessage(error, "Не удалось создать заказ");
    toast.error(submitError.value);
  } finally {
    submitting.value = false;
  }
}
</script>
