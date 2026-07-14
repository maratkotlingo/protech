<template>
  <div class="mx-auto w-full max-w-[1480px] px-4 py-8 sm:px-6 lg:py-10 xl:px-8">
    <div class="mb-8">
      <UBadge
        color="primary"
        variant="soft"
        class="mb-4"
      >
        Оформление
      </UBadge>
      <h1 class="text-4xl font-semibold tracking-normal text-[var(--shop-text)]">Оформление заказа</h1>
      <p class="mt-3 text-[var(--shop-text-muted)]">
        Выберите способ получения, оплату и уточните адрес доставки.
      </p>
    </div>

    <div
      v-if="loading"
      class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]"
    >
      <USkeleton class="h-[640px] rounded-lg" />
      <USkeleton class="h-96 rounded-lg" />
    </div>

    <div
      v-else-if="!auth.user"
      class="grid min-h-80 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center"
    >
      <div>
        <LockKeyhole class="mx-auto size-12 text-[var(--shop-text-muted)]" />
        <h2 class="mt-4 text-2xl font-semibold text-[var(--shop-text)]">Нужен вход в аккаунт</h2>
        <UButton
          class="mt-5"
          color="primary"
          to="/auth?redirect=/checkout"
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
        <UButton
          class="mt-5"
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
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-[var(--shop-text)]">Способ получения</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition"
              :class="draft.obtainingMethod === 'DELIVERY' ? 'border-[var(--shop-accent)] bg-[var(--shop-accent-soft)]' : 'border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-accent)]'"
              @click="setObtainingMethod('DELIVERY')"
            >
              <Truck class="mb-3 size-6 text-[var(--shop-accent)]" />
              <p class="font-semibold text-[var(--shop-text)]">Доставка</p>
              <p class="mt-1 text-sm text-[var(--shop-text-muted)]">Курьерская доставка через OZON.</p>
            </button>
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition"
              :class="draft.obtainingMethod === 'PICKUP' ? 'border-[var(--shop-accent)] bg-[var(--shop-accent-soft)]' : 'border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-accent)]'"
              @click="setObtainingMethod('PICKUP')"
            >
              <Store class="mb-3 size-6 text-[var(--shop-accent)]" />
              <p class="font-semibold text-[var(--shop-text)]">Самовывоз</p>
              <p class="mt-1 text-sm text-[var(--shop-text-muted)]">Заберите заказ после подтверждения.</p>
            </button>
          </div>
        </UCard>

        <UCard
          class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
          :ui="{ body: 'p-5 sm:p-6' }"
        >
          <h2 class="text-xl font-semibold text-[var(--shop-text)]">Оплата</h2>
          <div class="mt-5 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition"
              :class="draft.paymentMethod === 'ONLINE' ? 'border-[var(--shop-accent)] bg-[var(--shop-accent-soft)]' : 'border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-accent)]'"
              @click="draft.paymentMethod = 'ONLINE'"
            >
              <CreditCard class="mb-3 size-6 text-[var(--shop-accent)]" />
              <p class="font-semibold text-[var(--shop-text)]">Онлайн</p>
              <p class="mt-1 text-sm text-[var(--shop-text-muted)]">Оплата через YooKassa.</p>
            </button>
            <button
              type="button"
              class="rounded-lg border p-4 text-left transition disabled:cursor-not-allowed disabled:opacity-50"
              :class="draft.paymentMethod === 'OFFLINE' ? 'border-[var(--shop-accent)] bg-[var(--shop-accent-soft)]' : 'border-[var(--shop-border)] bg-[var(--shop-surface)] hover:border-[var(--shop-accent)]'"
              :disabled="draft.obtainingMethod === 'DELIVERY'"
              @click="draft.paymentMethod = 'OFFLINE'"
            >
              <Wallet class="mb-3 size-6 text-[var(--shop-accent)]" />
              <p class="font-semibold text-[var(--shop-text)]">При получении</p>
              <p class="mt-1 text-sm text-[var(--shop-text-muted)]">Доступно только для самовывоза.</p>
            </button>
          </div>
        </UCard>

        <section
          v-if="draft.obtainingMethod === 'DELIVERY'"
          class="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1fr)]"
        >
          <UCard
            class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
            :ui="{ body: 'space-y-5 p-5 sm:p-6' }"
          >
            <h2 class="text-xl font-semibold text-[var(--shop-text)]">Адрес доставки</h2>
            <div class="grid gap-4 sm:grid-cols-2">
              <UFormField
                label="Город"
                required
                :error="fieldErrors.city"
              >
                <UInput
                  v-model="draft.city"
                  class="w-full"
                  size="lg"
                  placeholder="Москва"
                />
              </UFormField>
              <UFormField
                label="Улица"
                required
                :error="fieldErrors.street"
              >
                <UInput
                  v-model="draft.street"
                  class="w-full"
                  size="lg"
                  placeholder="Тверская"
                />
              </UFormField>
              <UFormField
                label="Дом"
                required
                :error="fieldErrors.house"
              >
                <UInput
                  v-model="draft.house"
                  class="w-full"
                  size="lg"
                  placeholder="10"
                />
              </UFormField>
              <UFormField label="Квартира">
                <UInput
                  v-model="draft.apartment"
                  class="w-full"
                  size="lg"
                  placeholder="45"
                />
              </UFormField>
              <UFormField label="Подъезд">
                <UInput
                  v-model="draft.entrance"
                  class="w-full"
                  size="lg"
                />
              </UFormField>
              <UFormField label="Этаж">
                <UInput
                  v-model="draft.floor"
                  class="w-full"
                  size="lg"
                />
              </UFormField>
            </div>
            <UFormField label="Домофон">
              <UInput
                v-model="draft.intercom"
                class="w-full"
                size="lg"
              />
            </UFormField>
            <UFormField label="Комментарий курьеру">
              <UTextarea
                v-model="draft.comment"
                class="w-full"
                :rows="4"
                placeholder="Например, позвонить за 10 минут"
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
                class="mb-4"
              />
              <UButton
                color="primary"
                size="xl"
                block
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
