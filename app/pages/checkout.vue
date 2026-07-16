<template>
  <div class="min-h-screen bg-[#f9fafb] text-zinc-950  ">
    <div
      v-if="loading"
      class="mx-auto grid w-full max-w-370 gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(460px,1.18fr)] lg:px-8 lg:py-10"
    >
      <USkeleton class="h-[620px] rounded-[2rem]" />
      <USkeleton class="h-[calc(100vh-8rem)] min-h-[620px] rounded-[2rem]" />
    </div>

    <div
      v-else-if="!auth.user"
      class="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-370 place-items-center px-4 py-8 sm:px-6 lg:px-8"
    >
      <CheckoutStateCard
        button-icon="i-lucide-log-in"
        button-label="Войти"
        description="Авторизуйтесь, чтобы оформить заказ и сохранить его в истории."
        icon="i-lucide-lock-keyhole"
        title="Нужен вход в аккаунт"
        to="/auth?redirect=/checkout"
      />
    </div>

    <div
      v-else-if="!cart.items.length"
      class="mx-auto grid min-h-[calc(100vh-8rem)] w-full max-w-370 place-items-center px-4 py-8 sm:px-6 lg:px-8"
    >
      <CheckoutStateCard
        button-icon="i-lucide-layout-grid"
        button-label="В каталог"
        description="Добавьте товары из каталога, а затем вернитесь к оформлению."
        icon="i-lucide-shopping-cart"
        title="Корзина пуста"
        to="/"
      />
    </div>

    <div
      v-else
      class="mx-auto grid w-full max-w-370 gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,0.82fr)_minmax(460px,1.18fr)] lg:px-8 lg:py-8 xl:gap-6"
    >
      <main
        v-auto-animate
        class="space-y-4 lg:pb-8"
      >
        <CheckoutOverviewCard
          :facts="checkoutFacts"
          :subtotal="cart.subtotal"
        />

        <CheckoutContactSection
          :error="fieldErrors.customerPhone"
          :phone="draft.customerPhone"
          @update-phone="updateCheckoutField('customerPhone', $event)"
        />

        <CheckoutChoiceGroupsSection
          :obtaining-method="draft.obtainingMethod"
          :obtaining-options="obtainingOptions"
          :payment-method="draft.paymentMethod"
          :payment-options="paymentOptions"
          @select-obtaining="setObtainingMethod"
          @select-payment="setPaymentMethod"
        />
        <CheckoutDeliveryDetailsSection
          :draft="draft"
          :field-errors="fieldErrors"
          :is-delivery="isDelivery"
          @update-field="updateCheckoutField"
        />

        <CheckoutSubmitPanel
          :delivery-label="deliveryLabel"
          :hidden-items-count="hiddenCheckoutItemsCount"
          :preview-items="checkoutPreviewItems"
          :submit-error="submitError"
          :submitting="submitting"
          :subtotal="cart.subtotal"
          :total-items="cart.totalItems"
          @submit="submitOrder"
        />
      </main>

      <aside class="min-h-[520px] lg:sticky lg:top-28 lg:h-[calc(100vh-8rem)] lg:self-start">
        <CheckoutDeliveryMap
          :city="draft.city"
          :house="draft.house"
          :obtaining-method="draft.obtainingMethod"
          :street="draft.street"
          class="h-full"
        />
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatCurrency, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ObtainingMethod, PaymentMethod, ShopOrder } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore, type CheckoutDraft } from "~~/app/stores/cart";

type CreateOrderResponse = {
  order: ShopOrder;
  payment: {
    type: "offline" | "yookassa";
    status?: string;
    confirmationUrl: string | null;
  };
};

type CheckoutChoice<TValue extends string> = {
  value: TValue;
  title: string;
  description: string;
  icon: string;
  badge?: string;
  disabled?: boolean;
};
type CheckoutTextField = keyof Omit<CheckoutDraft, "obtainingMethod" | "paymentMethod">;

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
const obtainingOptions: Array<CheckoutChoice<ObtainingMethod>> = [
  {
    value: "DELIVERY",
    title: "Доставка",
    description: "OZON по указанному адресу.",
    icon: "i-lucide-truck"
  },
  {
    value: "PICKUP",
    title: "Самовывоз",
    description: "После подтверждения менеджером.",
    icon: "i-lucide-store"
  }
];

const isDelivery = computed(() => draft.obtainingMethod === "DELIVERY");
const deliveryLabel = computed(() => isDelivery.value ? "OZON" : "самовывоз");
const addressSummary = computed(() => fullAddress() || "Адрес пока не заполнен");
const customerPhone = computed(() => (draft.customerPhone ?? "").trim());
const checkoutPreviewItems = computed(() => cart.items.slice(0, 4));
const hiddenCheckoutItemsCount = computed(() => Math.max(cart.items.length - checkoutPreviewItems.value.length, 0));
const checkoutFacts = computed(() => [
  {
    label: "Получение",
    value: isDelivery.value ? "Доставка OZON" : "Самовывоз"
  },
  {
    label: "Адрес",
    value: isDelivery.value ? addressSummary.value : "Пункт выдачи"
  },
  {
    label: "Телефон",
    value: customerPhone.value || "Не указан"
  },
  {
    label: "Итого",
    value: formatCurrency(cart.subtotal)
  }
]);
const paymentOptions = computed<Array<CheckoutChoice<PaymentMethod>>>(() => [
  {
    value: "ONLINE",
    title: "Онлайн",
    description: "Через YooKassa.",
    icon: "i-lucide-credit-card",
    badge: isDelivery.value ? "обязательно" : "быстро"
  },
  {
    value: "OFFLINE",
    title: "При получении",
    description: "Только для самовывоза.",
    icon: "i-lucide-wallet",
    disabled: isDelivery.value
  }
]);

onMounted(async () => {
  draft.customerPhone = draft.customerPhone ?? "";

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

function setPaymentMethod(value: PaymentMethod) {
  if (isDelivery.value && value === "OFFLINE") {
    return;
  }

  draft.paymentMethod = value;
}

function updateCheckoutField(field: CheckoutTextField, value: string) {
  draft[field] = value;
  fieldErrors[field] = undefined;
}

function validateDelivery() {
  fieldErrors.city = undefined;
  fieldErrors.street = undefined;
  fieldErrors.house = undefined;

  if (!isDelivery.value) {
    return true;
  }

  if (!draft.city.trim()) fieldErrors.city = "Введите город";
  if (!draft.street.trim()) fieldErrors.street = "Введите улицу";
  if (!draft.house.trim()) fieldErrors.house = "Введите дом";

  return !fieldErrors.city && !fieldErrors.street && !fieldErrors.house;
}

function validateContact() {
  fieldErrors.customerPhone = undefined;

  if (!customerPhone.value) {
    fieldErrors.customerPhone = "Введите телефон";
  } else if (!/^\+?[0-9\s().-]{5,30}$/.test(customerPhone.value)) {
    fieldErrors.customerPhone = "Введите корректный телефон";
  }

  return !fieldErrors.customerPhone;
}

function fullAddress() {
  return [draft.city, draft.street, draft.house]
    .map((part) => part.trim())
    .filter(Boolean)
    .join(", ");
}

async function submitOrder() {
  submitError.value = "";

  const contactValid = validateContact();
  const deliveryValid = validateDelivery();

  if (!contactValid || !deliveryValid) {
    submitError.value = "Заполните обязательные поля";
    return;
  }

  submitting.value = true;

  try {
    const result = await shopFetch<CreateOrderResponse>("/api/public/orders", {
      method: "POST",
      body: {
        obtainingMethod: draft.obtainingMethod,
        paymentMethod: isDelivery.value ? "ONLINE" : draft.paymentMethod,
        customerPhone: customerPhone.value,
        orderItems: cart.orderItems,
        ...(isDelivery.value
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
