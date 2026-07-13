<template>
  <UModal
    v-model:open="open"
    :title="title"
    :description="description"
  >
    <template #body>
      <div class="flex gap-4">
        <div
          :class="[
            'grid size-14 shrink-0 place-items-center rounded-lg',
            color === 'error'
              ? 'bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-300'
              : 'bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]'
          ]"
        >
          <AlertTriangle
            v-if="color === 'error'"
            class="size-7"
          />
          <CheckCircle2
            v-else
            class="size-7"
          />
        </div>
        <div class="min-w-0 space-y-2">
          <p class="text-base leading-7 text-[var(--admin-text)]">
            {{ message }}
          </p>
          <p
            v-if="hint"
            class="text-sm leading-6 text-[var(--admin-text-muted)]"
          >
            {{ hint }}
          </p>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="loading"
          @click="close"
        >
          {{ cancelLabel }}
        </UButton>
        <UButton
          :color="color"
          :loading="loading"
          @click="$emit('confirm')"
        >
          {{ confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { AlertTriangle, CheckCircle2 } from "@lucide/vue";

const open = defineModel<boolean>("open", { default: false });

withDefaults(defineProps<{
  title: string;
  description?: string;
  message: string;
  hint?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  color?: "primary" | "error";
  loading?: boolean;
}>(), {
  description: undefined,
  hint: undefined,
  confirmLabel: "Подтвердить",
  cancelLabel: "Отмена",
  color: "primary",
  loading: false
});

defineEmits<{
  confirm: [];
}>();

function close() {
  open.value = false;
}
</script>
