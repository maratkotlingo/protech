<template>
  <div class="space-y-7">
    <section class="space-y-5 rounded-md border border-[var(--admin-border)] p-5 sm:p-6">
      <div>
        <h3 class="text-lg font-semibold text-[var(--admin-text)]">
          Основное изображение
        </h3>
        <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
          Можно вставить URL или загрузить файл.
        </p>
      </div>

      <div class="overflow-hidden rounded-md border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
        <img
          v-if="mainImage"
          :src="mainImage"
          alt=""
          class="aspect-[16/7] w-full object-cover"
        >
        <div
          v-else
          class="grid aspect-[16/7] place-items-center text-[var(--admin-text-muted)]"
        >
          <ImageIcon class="size-12" />
        </div>
      </div>

      <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px] lg:items-end">
        <UFormField
          label="URL изображения"
          :error="fieldErrors.mainImage"
        >
          <UInput
            :model-value="mainImage"
            class="w-full"
            size="xl"
            placeholder="/uploads/file.webp или https://..."
            @update:model-value="emit('updateMainImage', String($event ?? ''))"
          />
        </UFormField>

        <label class="block">
          <input
            class="sr-only"
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            @change="emit('uploadMainImage', $event)"
          >
          <UButton
            color="neutral"
            variant="outline"
            type="button"
            size="lg"
            :loading="uploadingMain"
            class="w-full justify-center"
            as="span"
          >
            <Upload class="size-4" />
            Загрузить
          </UButton>
        </label>
      </div>
    </section>

    <section class="space-y-5 rounded-md border border-[var(--admin-border)] p-5 sm:p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 class="text-lg font-semibold text-[var(--admin-text)]">
            Галерея
          </h3>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Дополнительные изображения товара.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <label class="block">
            <input
              class="sr-only"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              @change="emit('uploadGalleryImage', $event)"
            >
            <UButton
              color="neutral"
              variant="outline"
              type="button"
              size="lg"
              :loading="uploadingGallery"
              class="w-full justify-center sm:w-auto"
              as="span"
            >
              <Upload class="size-4" />
              Загрузить
            </UButton>
          </label>
          <UButton
            color="primary"
            variant="soft"
            type="button"
            size="lg"
            @click="emit('addGalleryUrl')"
          >
            <Plus class="size-4" />
            URL
          </UButton>
        </div>
      </div>

      <UAlert
        v-if="fieldErrors.productImages"
        color="error"
        variant="soft"
        :description="fieldErrors.productImages"
      />

      <div
        v-if="productImages.length"
        class="grid gap-4 md:grid-cols-2"
      >
        <div
          v-for="(image, index) in productImages"
          :key="index"
          class="space-y-3 rounded-md bg-[#f9fafb] p-3"
        >
          <div class="overflow-hidden rounded-md border border-[var(--admin-border)] bg-white">
            <img
              v-if="image.url"
              :src="image.url"
              alt=""
              class="aspect-[4/3] w-full object-cover"
            >
            <div
              v-else
              class="grid aspect-[4/3] place-items-center text-[var(--admin-text-muted)]"
            >
              <ImageIcon class="size-8" />
            </div>
          </div>
          <div class="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
            <UInput
              :model-value="image.url"
              class="w-full"
              size="xl"
              placeholder="URL изображения"
              @update:model-value="emit('updateGalleryImage', index, String($event ?? ''))"
            />
            <UButton
              color="error"
              variant="ghost"
              type="button"
              size="lg"
              aria-label="Удалить изображение"
              @click="emit('removeGalleryImage', index)"
            >
              <Trash2 class="size-4" />
            </UButton>
          </div>
        </div>
      </div>

      <div
        v-else
        class="grid min-h-32 place-items-center rounded-md bg-[#f9fafb] px-4 text-center text-sm text-[var(--admin-text-muted)]"
      >
        Добавьте URL или загрузите изображение в галерею.
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ImageIcon, Plus, Trash2, Upload } from "@lucide/vue";
import type { ProductFormState } from "~~/app/shared/types/admin";

defineProps<{
  fieldErrors: Record<string, string | undefined>;
  mainImage: string;
  productImages: ProductFormState["productImages"];
  uploadingGallery: boolean;
  uploadingMain: boolean;
}>();

const emit = defineEmits<{
  addGalleryUrl: [];
  removeGalleryImage: [index: number];
  updateGalleryImage: [index: number, value: string];
  updateMainImage: [value: string];
  uploadGalleryImage: [event: Event];
  uploadMainImage: [event: Event];
}>();
</script>
