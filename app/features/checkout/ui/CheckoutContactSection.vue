<template>
  <section class="rounded-[1.75rem] bg-white/90 p-4 shadow-[0_18px_70px_rgba(15,23,42,0.06)] sm:p-5  ">
    <div class="flex items-center gap-3">
      <span class="grid size-9 place-items-center rounded-full bg-emerald-50 text-emerald-700  ">
        <UIcon
          name="i-lucide-phone"
          class="size-4.5"
        />
      </span>
      <div>
        <h2 class="text-base font-semibold tracking-normal text-zinc-950">Контакты</h2>
        <p class="mt-0.5 text-xs text-zinc-500">Телефон нужен для подтверждения и связи по заказу.</p>
      </div>
    </div>

    <div class="mt-4 grid gap-3 sm:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] sm:items-end">
      <UFormField
        label="Телефон"
        required
        :error="error"
      >
        <UInput
          :model-value="phone"
          autocomplete="tel"
          class="w-full rounded-[1.1rem] bg-[#f9fafb] shadow-inner shadow-zinc-950/5 "
          inputmode="tel"
          placeholder="+7 900 000-00-00"
          size="md"
          type="tel"
          variant="none"
          :ui="inputUi"
          @update:model-value="emit('updatePhone', String($event ?? ''))"
        />
      </UFormField>
      <p class="text-xs leading-5 text-zinc-500 ">
        Для подтверждения заказа и уточнений по получению.
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
defineProps<{
  error?: string;
  phone: string;
}>();

const emit = defineEmits<{
  updatePhone: [value: string];
}>();

const inputUi = { base: "h-10 rounded-[1.1rem] bg-transparent text-sm" };
</script>
