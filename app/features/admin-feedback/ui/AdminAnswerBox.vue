<template>
  <form
    class="space-y-3 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)] p-3"
    @submit.prevent="$emit('submit')"
  >
    <UTextarea
      :model-value="modelValue"
      class="w-full"
      size="lg"
      :placeholder="placeholder"
      autoresize
      :rows="3"
      @update:model-value="$emit('update:modelValue', String($event ?? ''))"
    />
    <div class="flex justify-end">
      <UButton
        color="primary"
        type="submit"
        :loading="loading"
        :disabled="!(modelValue ?? '').trim()"
      >
        <Send class="size-4" />
        {{ buttonLabel }}
      </UButton>
    </div>
  </form>
</template>

<script setup lang="ts">
import { Send } from "@lucide/vue";

withDefaults(defineProps<{
  modelValue?: string;
  loading?: boolean;
  placeholder?: string;
  buttonLabel?: string;
}>(), {
  modelValue: "",
  placeholder: "Введите ответ",
  buttonLabel: "Ответить"
});

defineEmits<{
  "update:modelValue": [value: string];
  submit: [];
}>();
</script>