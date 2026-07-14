<template>
  <UBadge
    :color="color"
    variant="soft"
    class="rounded-full px-3 py-1"
  >
    {{ label }}
  </UBadge>
</template>

<script setup lang="ts">
import type { OrderStatus, PaymentStatus } from "~~/app/shared/types/shop";

const props = defineProps<{
  type: "order" | "payment";
  value: OrderStatus | PaymentStatus;
}>();

const orderLabels: Record<OrderStatus, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтвержден",
  PROCESSING: "В работе",
  SHIPPED: "Отправлен",
  COMPLETED: "Завершен",
  CANCELLED: "Отменен"
};

const paymentLabels: Record<PaymentStatus, string> = {
  PENDING: "Ожидает оплаты",
  UPON_RECEIPT: "При получении",
  PAID: "Оплачен",
  CANCELLED: "Отменен"
};

const label = computed(() => props.type === "order"
  ? orderLabels[props.value as OrderStatus]
  : paymentLabels[props.value as PaymentStatus]);

const color = computed<"neutral" | "primary" | "warning" | "success" | "error" | "info">(() => {
  if (props.value === "CANCELLED") return "error";
  if (props.value === "COMPLETED" || props.value === "PAID") return "success";
  if (props.value === "PENDING" || props.value === "PROCESSING") return "warning";
  if (props.value === "NEW") return "info";
  return "primary";
});
</script>
