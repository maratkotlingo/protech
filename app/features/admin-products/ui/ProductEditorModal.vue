<template>
  <UModal
    v-model:open="open"
    :title="productId ? 'Редактировать товар' : 'Новый товар'"
    :description="productId ? 'Обновите карточку товара, цены, изображения и характеристики.' : 'Заполните карточку товара и добавьте медиа.'"
    scrollable
    :ui="{ content: 'max-w-5xl' }"
  >
    <template #body>
      <div
        v-if="loading"
        class="grid min-h-80 place-items-center"
      >
        <div class="flex items-center gap-3 text-[var(--admin-text-muted)]">
          <LoaderCircle class="size-5 animate-spin" />
          Загружаю товар
        </div>
      </div>

      <form
        v-else
        class="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]"
        @submit.prevent="save"
      >
        <div class="space-y-5">
          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Название"
              required
              :error="fieldErrors.name"
            >
              <UInput
                v-model="form.name"
                class="w-full"
                size="lg"
                placeholder="Например, Аккумулятор ProTech X"
              />
            </UFormField>

            <UFormField
              label="Артикул"
              required
              :error="fieldErrors.article"
            >
              <UInput
                v-model="form.article"
                class="w-full"
                size="lg"
                placeholder="PT-X-001"
              />
            </UFormField>
          </div>

          <UFormField
            label="Описание"
            required
            :error="fieldErrors.description"
          >
            <UTextarea
              v-model="form.description"
              class="w-full"
              size="lg"
              autoresize
              :rows="5"
              placeholder="Коротко опишите свойства, комплектацию и назначение товара"
            />
          </UFormField>

          <div class="grid gap-4 sm:grid-cols-3">
            <UFormField
              label="Цена"
              required
              :error="fieldErrors.currentPrice"
            >
              <UInput
                v-model.number="form.currentPrice"
                class="w-full"
                size="lg"
                type="number"
                min="0"
                step="0.01"
              />
            </UFormField>

            <UFormField
              label="Себестоимость"
              :error="fieldErrors.costPrice"
            >
              <UInput
                v-model.number="form.costPrice"
                class="w-full"
                size="lg"
                type="number"
                min="0"
                step="0.01"
              />
            </UFormField>

            <UFormField
              label="Старая цена"
              :error="fieldErrors.oldPrice"
            >
              <UInput
                v-model.number="form.oldPrice"
                class="w-full"
                size="lg"
                type="number"
                min="0"
                step="0.01"
              />
            </UFormField>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Категория"
              required
              :error="fieldErrors.categoryId"
            >
              <USelect
                v-model="form.categoryId"
                class="w-full"
                size="lg"
                :items="categoryItems"
                placeholder="Выберите категорию"
              />
            </UFormField>

            <UFormField
              label="Ссылка OZON"
              :error="fieldErrors.ozonLink"
            >
              <UInput
                v-model="form.ozonLink"
                class="w-full"
                size="lg"
                placeholder="https://www.ozon.ru/..."
              />
            </UFormField>
          </div>

          <USwitch
            v-model="form.isActive"
            label="Товар активен"
            description="Показывать товар в публичном каталоге"
          />

          <section class="space-y-3 rounded-lg border border-[var(--admin-border)] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-[var(--admin-text)]">
                  Характеристики
                </h3>
                <p class="text-xs text-[var(--admin-text-muted)]">
                  Значения будут заменены при сохранении товара.
                </p>
              </div>
              <UButton
                color="primary"
                variant="soft"
                type="button"
                @click="addAttribute"
              >
                <Plus class="size-4" />
                Добавить
              </UButton>
            </div>

            <div class="space-y-3">
              <UAlert
                v-if="fieldErrors.productAttributes"
                color="error"
                variant="soft"
                :description="fieldErrors.productAttributes"
              />
              <div
                v-for="(attribute, index) in form.productAttributes"
                :key="index"
                class="grid gap-3 rounded-lg bg-[var(--admin-surface-muted)] p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <USelect
                  v-model="attribute.attributeId"
                  class="w-full"
                  size="lg"
                  :items="attributeItems"
                  placeholder="Характеристика"
                />
                <UInput
                  v-model="attribute.value"
                  class="w-full"
                  size="lg"
                  placeholder="Значение"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  type="button"
                  aria-label="Удалить характеристику"
                  @click="removeAttribute(index)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </div>
            </div>
          </section>
        </div>

        <div class="space-y-5">
          <section class="space-y-4 rounded-lg border border-[var(--admin-border)] p-4">
            <div>
              <h3 class="text-sm font-semibold text-[var(--admin-text)]">
                Основное изображение
              </h3>
              <p class="text-xs text-[var(--admin-text-muted)]">
                Можно вставить URL или загрузить файл.
              </p>
            </div>

            <div class="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
              <img
                v-if="form.mainImage"
                :src="form.mainImage"
                alt=""
                class="aspect-[4/3] w-full object-cover"
              >
              <div
                v-else
                class="grid aspect-[4/3] place-items-center text-[var(--admin-text-muted)]"
              >
                <ImageIcon class="size-10" />
              </div>
            </div>

            <UFormField
              label="URL изображения"
              :error="fieldErrors.mainImage"
            >
              <UInput
                v-model="form.mainImage"
                class="w-full"
                size="lg"
                placeholder="/uploads/file.webp или https://..."
              />
            </UFormField>

            <label class="block">
              <input
                class="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="uploadMainImage"
              >
              <UButton
                color="neutral"
                variant="outline"
                type="button"
                :loading="uploadingMain"
                class="w-full justify-center"
                as="span"
              >
                <Upload class="size-4" />
                Загрузить изображение
              </UButton>
            </label>
          </section>

          <section class="space-y-3 rounded-lg border border-[var(--admin-border)] p-4">
            <div class="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 class="text-sm font-semibold text-[var(--admin-text)]">
                  Галерея
                </h3>
                <p class="text-xs text-[var(--admin-text-muted)]">
                  Дополнительные изображения товара.
                </p>
              </div>
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

            <label class="block">
              <input
                class="sr-only"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                @change="uploadGalleryImage"
              >
              <UButton
                color="neutral"
                variant="outline"
                type="button"
                :loading="uploadingGallery"
                class="w-full justify-center"
                as="span"
              >
                <Upload class="size-4" />
                Загрузить в галерею
              </UButton>
            </label>

            <div class="space-y-3">
              <UAlert
                v-if="fieldErrors.productImages"
                color="error"
                variant="soft"
                :description="fieldErrors.productImages"
              />
              <div
                v-for="(image, index) in form.productImages"
                :key="index"
                class="grid grid-cols-[1fr_auto] gap-2"
              >
                <UInput
                  v-model="image.url"
                  class="w-full"
                  size="lg"
                  placeholder="URL изображения"
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
          </section>
        </div>
      </form>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          @click="closeEditor"
        >
          Отмена
        </UButton>
        <UButton
          color="primary"
          :loading="submitting"
          @click="save"
        >
          <Save class="size-4" />
          Сохранить товар
        </UButton>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import { ImageIcon, LoaderCircle, Plus, Save, Trash2, Upload } from "@lucide/vue";
import { toast } from "vue-sonner";
import { getErrorMessage, toNumber } from "~~/app/shared/lib/adminFormatters";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { Attribute, Category, ProductDetails, ProductFormState } from "~~/app/shared/types/admin";
import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  productId?: number | null;
  categories: Category[];
  attributes: Attribute[];
}>();

const emit = defineEmits<{
  saved: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const uploadingMain = ref(false);
const uploadingGallery = ref(false);
const fieldErrors = reactive<Record<string, string | undefined>>({});

function createEmptyForm(): ProductFormState {
  return {
    name: "",
    description: "",
    currentPrice: null,
    costPrice: null,
    oldPrice: null,
    article: "",
    mainImage: "",
    ozonLink: "",
    categoryId: undefined,
    isActive: true,
    productImages: [],
    productAttributes: []
  };
}

const form = reactive<ProductFormState>(createEmptyForm());

const categoryItems = computed(() => props.categories.map((category) => ({
  label: category.name,
  value: category.id
})));
const attributeItems = computed(() => props.attributes.map((attribute) => ({
  label: attribute.unit ? `${attribute.name}, ${attribute.unit}` : attribute.name,
  value: attribute.id
})));

function resetForm(next = createEmptyForm()) {
  clearFieldErrors(fieldErrors);
  Object.assign(form, next);
}

function mapProductToForm(product: ProductDetails): ProductFormState {
  return {
    name: product.name,
    description: product.description,
    currentPrice: toNumber(product.currentPrice),
    costPrice: product.costPrice === null || product.costPrice === undefined ? null : toNumber(product.costPrice),
    oldPrice: product.oldPrice === null || product.oldPrice === undefined ? null : toNumber(product.oldPrice),
    article: product.article,
    mainImage: product.mainImage,
    ozonLink: product.ozonLink ?? "",
    categoryId: product.category.id,
    isActive: product.isActive,
    productImages: product.productImages.map((image) => ({ url: image.url })),
    productAttributes: product.productAttributes.map((attribute) => ({
      attributeId: attribute.attributeId,
      value: attribute.value
    }))
  };
}

async function loadProduct() {
  if (!props.productId) {
    resetForm();
    return;
  }

  loading.value = true;

  try {
    const product = await $fetch<ProductDetails>(`/api/admin/products/${props.productId}`);
    resetForm(mapProductToForm(product));
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить товар"));
    open.value = false;
  } finally {
    loading.value = false;
  }
}

function addAttribute() {
  form.productAttributes.push({
    attributeId: undefined,
    value: ""
  });
}

function removeAttribute(index: number) {
  form.productAttributes.splice(index, 1);
}

function addGalleryUrl() {
  form.productImages.push({ url: "" });
}

function removeGalleryImage(index: number) {
  form.productImages.splice(index, 1);
}

function closeEditor() {
  open.value = false;
}

function buildPayload() {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    currentPrice: form.currentPrice,
    costPrice: form.costPrice === null || form.costPrice === undefined ? undefined : form.costPrice,
    oldPrice: form.oldPrice === null || form.oldPrice === undefined ? undefined : form.oldPrice,
    article: form.article.trim(),
    mainImage: form.mainImage.trim(),
    ozonLink: form.ozonLink.trim() || undefined,
    categoryId: form.categoryId,
    isActive: form.isActive,
    productImages: form.productImages
      .map((image) => ({ url: image.url.trim() }))
      .filter((image) => image.url),
    productAttributes: form.productAttributes
      .filter((attribute) => attribute.attributeId && attribute.value.trim())
      .map((attribute) => ({
        attributeId: attribute.attributeId,
        value: attribute.value.trim()
      }))
  };
}

async function save() {
  if (submitting.value || loading.value) {
    return;
  }

  const payload = buildPayload();
  const schema = props.productId ? updateProductSchema : createProductSchema;
  const parsed = schema.safeParse(payload);

  if (!parsed.success) {
    replaceFieldErrors(fieldErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля товара");
    return;
  }

  clearFieldErrors(fieldErrors);
  submitting.value = true;

  try {
    if (props.productId) {
      await $fetch(`/api/admin/products/update/${props.productId}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Товар обновлён");
    } else {
      await $fetch("/api/admin/products", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Товар создан");
    }

    emit("saved");
    open.value = false;
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить товар"));
  } finally {
    submitting.value = false;
  }
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return await $fetch<{ url: string }>("/api/admin/upload", {
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
    form.mainImage = result.url;
    toast.success("Изображение загружено");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображение"));
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
    form.productImages.push({ url: result.url });
    toast.success("Изображение добавлено в галерею");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось загрузить изображение"));
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
