<template>
  <section class="space-y-5 rounded-md border border-[var(--admin-border)] p-5 sm:p-6">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h3 class="text-lg font-semibold text-[var(--admin-text)]">
          Характеристики
        </h3>
        <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
          Значения будут заменены при сохранении товара.
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        type="button"
        size="lg"
        @click="emit('add')"
      >
        <Plus class="size-4" />
        Добавить
      </UButton>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      :description="error"
    />

    <div class="space-y-4">
      <div
        v-for="(attribute, index) in attributes"
        :key="index"
        class="grid gap-3 rounded-md bg-[#f9fafb] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
      >
        <UFormField label="Характеристика">
          <USelect
            :model-value="attribute.attributeId"
            class="w-full"
            size="xl"
            :items="attributeItems"
            placeholder="Выберите характеристику"
            @update:model-value="emit('select', index, $event)"
          />
        </UFormField>
        <UFormField label="Значение">
          <UInput
            :model-value="attribute.value"
            class="w-full"
            size="xl"
            placeholder="Значение"
            @update:model-value="emit('updateValue', index, String($event ?? ''))"
          />
        </UFormField>
        <UButton
          color="error"
          variant="ghost"
          type="button"
          size="lg"
          aria-label="Удалить характеристику"
          @click="emit('remove', index)"
        >
          <Trash2 class="size-4" />
        </UButton>
      </div>

      <div
        v-if="!attributes.length"
        class="grid min-h-24 place-items-center rounded-md bg-[#f9fafb] px-4 text-center text-sm text-[var(--admin-text-muted)]"
      >
        Добавьте характеристику или создайте новую через селектор.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { Plus, Trash2 } from "@lucide/vue";
import type { ProductFormState } from "~~/app/shared/types/admin";

type SelectValue = number | string | null | undefined;
type SelectItem = {
  class?: string;
  label?: string;
  type?: "separator";
  value?: number | string;
};

defineProps<{
  attributeItems: SelectItem[];
  attributes: ProductFormState["productAttributes"];
  error?: string;
}>();

const emit = defineEmits<{
  add: [];
  remove: [index: number];
  select: [index: number, value: SelectValue];
  updateValue: [index: number, value: string];
}>();
</script>
