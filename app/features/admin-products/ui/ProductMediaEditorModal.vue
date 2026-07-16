<template>
  <UModal
    v-model:open="open"
    :title="productName ? `Изображения: ${productName}` : 'Изображения товара'"
    description="Быстрая замена главного фото и дополнительных изображений без полной формы товара."
    scrollable
    :ui="{ content: 'max-w-4xl', body: 'p-6 sm:p-7' }"
  >
    <template #body>
      <div
        v-if="loading"
        class="grid min-h-72 place-items-center"
      >
        <div class="flex items-center gap-3 text-[var(--admin-text-muted)]">
          <LoaderCircle class="size-5 animate-spin" />
          Загружаю изображения
        </div>
      </div>

      <form
        v-else
        class="space-y-7"
        @submit.prevent="save"
      >
        <section class="space-y-4 rounded-lg border border-[var(--admin-border)] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-[var(--admin-text)]">
                Главное фото
              </h3>
              <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                Это изображение видно в каталоге и карточке товара.
              </p>
            </div>
            <label class="block">
              <input
                class="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="uploadMainImage"
              >
              <UButton
                as="span"
                color="neutral"
                variant="outline"
                type="button"
                :loading="uploadingMain"
              >
                <Upload class="size-4" />
                Загрузить
              </UButton>
            </label>
          </div>

          <div class="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
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

          <UFormField
            label="URL главного фото"
            :error="fieldErrors.mainImage"
          >
            <UInput
              v-model="mainImage"
              class="w-full"
              size="lg"
              placeholder="/uploads/file.webp или https://..."
              @update:model-value="fieldErrors.mainImage = undefined"
            />
          </UFormField>
        </section>

        <section class="space-y-4 rounded-lg border border-[var(--admin-border)] p-5">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 class="text-lg font-semibold text-[var(--admin-text)]">
                Дополнительные фото
              </h3>
              <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                Галерея товара на публичной странице.
              </p>
            </div>
            <div class="flex flex-wrap gap-2">
              <label class="block">
                <input
                  class="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  @change="uploadGalleryImage"
                >
                <UButton
                  as="span"
                  color="neutral"
                  variant="outline"
                  type="button"
                  :loading="uploadingGallery"
                >
                  <Upload class="size-4" />
                  Загрузить
                </UButton>
              </label>
              <UButton
                color="primary"
                variant="soft"
                type="button"
                @click="addGalleryUrl"
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
              class="space-y-3 rounded-lg bg-[var(--admin-surface-muted)] p-3"
            >
              <div class="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface)]">
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
                  v-model="image.url"
                  class="w-full"
                  size="lg"
                  placeholder="URL изображения"
                  @update:model-value="fieldErrors.productImages = undefined"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  type="button"
                  aria-label="Удалить изображение"
                  @click="removeGalleryImage(index)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </div>
            </div>
          </div>

          <div
            v-else
            class="grid min-h-32 place-items-center rounded-lg bg-[var(--admin-surface-muted)] px-4 text-center text-sm text-[var(--admin-text-muted)]"
          >
            Добавьте URL или загрузите изображение в галерею.
          </div>
        </section>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          @click="closeEditor"
        >
          Отмена
        </UButton>
        <UButton
          color="primary"
          size="lg"
          :loading="submitting"
          @click="save"
        >
          <Save class="size-4" />
          Сохранить изображения
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ImageIcon, LoaderCircle, Plus, Save, Trash2, Upload } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { ProductDetails, ProductFormState } from "~~/app/shared/types/admin";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  productId?: number | null;
}>();

const emit = defineEmits<{
  saved: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const uploadingMain = ref(false);
const uploadingGallery = ref(false);
const productName = ref("");
const mainImage = ref("");
const productImages = ref<ProductFormState["productImages"]>([]);
const fieldErrors = reactive<Record<string, string | undefined>>({});

async function loadProduct() {
  if (!props.productId) {
    productName.value = "";
    mainImage.value = "";
    productImages.value = [];
    return;
  }

  loading.value = true;
  clearFieldErrors(fieldErrors);

  try {
    const product = await adminFetch<ProductDetails>(`/api/admin/products/${props.productId}`);
    productName.value = product.name;
    mainImage.value = product.mainImage;
    productImages.value = product.productImages.map((image) => ({ url: image.url }));
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображения товара"));
    open.value = false;
  } finally {
    loading.value = false;
  }
}

function addGalleryUrl() {
  productImages.value.push({ url: "" });
}

function removeGalleryImage(index: number) {
  productImages.value.splice(index, 1);
  fieldErrors.productImages = undefined;
}

function closeEditor() {
  open.value = false;
}

function buildPayload() {
  return {
    mainImage: mainImage.value.trim(),
    productImages: productImages.value
      .map((image) => ({ url: image.url.trim() }))
      .filter((image) => image.url)
  };
}

async function save() {
  if (!props.productId || submitting.value || loading.value) {
    return;
  }

  const parsed = updateProductSchema.safeParse(buildPayload());

  if (!parsed.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте изображения товара");
    return;
  }

  clearFieldErrors(fieldErrors);
  submitting.value = true;

  try {
    await adminFetch(`/api/admin/products/update/${props.productId}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Изображения товара обновлены");
    emit("saved");
    open.value = false;
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить изображения"));
  } finally {
    submitting.value = false;
  }
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return await adminFetch<{ url: string }>("/api/admin/upload", {
    method: "POST",
    body: formData
  });
}

async function uploadMainImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  uploadingMain.value = true;

  try {
    const result = await uploadImage(file);
    mainImage.value = result.url;
    fieldErrors.mainImage = undefined;
    toast.success("Главное фото загружено");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить главное фото"));
  } finally {
    uploadingMain.value = false;
    input.value = "";
  }
}

async function uploadGalleryImage(event: Event) {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];

  if (!file) {
    return;
  }

  uploadingGallery.value = true;

  try {
    const result = await uploadImage(file);
    productImages.value.push({ url: result.url });
    fieldErrors.productImages = undefined;
    toast.success("Фото добавлено в галерею");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить фото в галерею"));
  } finally {
    uploadingGallery.value = false;
    input.value = "";
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    void loadProduct();
  }
});
</script>
