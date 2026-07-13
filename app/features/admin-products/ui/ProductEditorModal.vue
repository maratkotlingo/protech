<template>
  <UModal
    v-model:open="open"
    :title="productId ? 'Редактировать товар' : 'Новый товар'"
    :description="productId ? 'Обновите карточку товара, цены, изображения и характеристики.' : 'Заполните карточку товара и добавьте медиа.'"
    scrollable
    :ui="{ content: 'max-w-6xl', body: 'p-6 sm:p-8' }"
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
        class="space-y-7"
        @submit.prevent="save"
      >
        <UFormField
          label="Название"
          required
          :error="fieldErrors.name"
        >
          <UInput
            v-model="form.name"
            class="w-full"
            size="xl"
            placeholder="Например, Аккумулятор ProTech X"
          />
        </UFormField>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
          <UFormField
            label="Артикул"
            required
            :error="fieldErrors.article"
          >
            <UInput
              v-model="form.article"
              class="w-full"
              size="xl"
              placeholder="PT-X-001"
            />
          </UFormField>

          <UFormField
            label="Категория"
            required
            :error="fieldErrors.categoryId"
          >
            <USelect
              :model-value="form.categoryId"
              class="w-full"
              size="xl"
              :items="categoryItems"
              placeholder="Выберите категорию"
              @update:model-value="handleCategorySelect"
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
            size="xl"
            autoresize
            :rows="8"
            :maxrows="18"
            :ui="{ base: 'min-h-48 text-base leading-7' }"
            placeholder="Коротко опишите свойства, комплектацию и назначение товара"
          />
        </UFormField>

        <div class="grid gap-5 lg:grid-cols-3">
          <UFormField
            label="Цена"
            required
            :error="fieldErrors.currentPrice"
          >
            <UInput
              v-model.number="form.currentPrice"
              class="w-full"
              size="xl"
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
              size="xl"
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
              size="xl"
              type="number"
              min="0"
              step="0.01"
            />
          </UFormField>
        </div>

        <div class="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
          <UFormField
            label="Ссылка OZON"
            :error="fieldErrors.ozonLink"
          >
            <UInput
              v-model="form.ozonLink"
              class="w-full"
              size="xl"
              placeholder="https://www.ozon.ru/..."
            />
          </UFormField>

          <div class="rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)] p-5">
            <USwitch
              v-model="form.isActive"
              label="Товар активен"
              description="Показывать товар в публичном каталоге"
            />
          </div>
        </div>

        <section class="space-y-5 rounded-lg border border-[var(--admin-border)] p-5 sm:p-6">
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
              @click="addAttribute"
            >
              <Plus class="size-4" />
              Добавить
            </UButton>
          </div>

          <UAlert
            v-if="fieldErrors.productAttributes"
            color="error"
            variant="soft"
            :description="fieldErrors.productAttributes"
          />

          <div class="space-y-4">
            <div
              v-for="(attribute, index) in form.productAttributes"
              :key="index"
              class="grid gap-3 rounded-lg bg-[var(--admin-surface-muted)] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end"
            >
              <UFormField label="Характеристика">
                <USelect
                  :model-value="attribute.attributeId"
                  class="w-full"
                  size="xl"
                  :items="attributeItems"
                  placeholder="Выберите характеристику"
                  @update:model-value="handleAttributeSelect(index, $event)"
                />
              </UFormField>
              <UFormField label="Значение">
                <UInput
                  v-model="attribute.value"
                  class="w-full"
                  size="xl"
                  placeholder="Значение"
                />
              </UFormField>
              <UButton
                color="error"
                variant="ghost"
                type="button"
                size="lg"
                aria-label="Удалить характеристику"
                @click="removeAttribute(index)"
              >
                <Trash2 class="size-4" />
              </UButton>
            </div>

            <div
              v-if="!form.productAttributes.length"
              class="grid min-h-24 place-items-center rounded-lg bg-[var(--admin-surface-muted)] px-4 text-center text-sm text-[var(--admin-text-muted)]"
            >
              Добавьте характеристику или создайте новую через селектор.
            </div>
          </div>
        </section>

        <section class="space-y-5 rounded-lg border border-[var(--admin-border)] p-5 sm:p-6">
          <div>
            <h3 class="text-lg font-semibold text-[var(--admin-text)]">
              Основное изображение
            </h3>
            <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
              Можно вставить URL или загрузить файл.
            </p>
          </div>

          <div class="overflow-hidden rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]">
            <img
              v-if="form.mainImage"
              :src="form.mainImage"
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
                v-model="form.mainImage"
                class="w-full"
                size="xl"
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

        <section class="space-y-5 rounded-lg border border-[var(--admin-border)] p-5 sm:p-6">
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
                  @change="uploadGalleryImage"
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
            v-if="form.productImages.length"
            class="grid gap-4 md:grid-cols-2"
          >
            <div
              v-for="(image, index) in form.productImages"
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
                  size="xl"
                  placeholder="URL изображения"
                />
                <UButton
                  color="error"
                  variant="ghost"
                  type="button"
                  size="lg"
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
          Сохранить товар
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="categoryCreateOpen"
    title="Новая категория"
    description="Категория будет создана и сразу выбрана для товара."
    :ui="{ content: 'max-w-lg' }"
  >
    <template #body>
      <UFormField
        label="Название категории"
        required
        :error="newCategoryError"
      >
        <UInput
          v-model="newCategoryName"
          class="w-full"
          size="xl"
          autofocus
          placeholder="Например, Аккумуляторы"
          :disabled="creatingCategory"
          @keydown.enter.prevent="createCategory"
        />
      </UFormField>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          @click="closeCategoryCreator"
        >
          Отмена
        </UButton>
        <UButton
          color="primary"
          size="lg"
          :loading="creatingCategory"
          @click="createCategory"
        >
          <Plus class="size-4" />
          Создать
        </UButton>
      </div>
    </template>
  </UModal>

  <UModal
    v-model:open="attributeCreateOpen"
    title="Новая характеристика"
    description="Характеристика будет создана и сразу подставлена в выбранную строку."
    :ui="{ content: 'max-w-2xl' }"
  >
    <template #body>
      <div class="grid gap-4 sm:grid-cols-[minmax(0,1fr)_180px]">
        <UFormField
          label="Название"
          required
          :error="newAttributeErrors.name"
        >
          <UInput
            v-model="newAttributeForm.name"
            class="w-full"
            size="xl"
            autofocus
            placeholder="Например, Ёмкость"
            :disabled="creatingAttribute"
            @keydown.enter.prevent="createAttribute"
          />
        </UFormField>
        <UFormField
          label="Ед. изм."
          :error="newAttributeErrors.unit"
        >
          <UInput
            v-model="newAttributeForm.unit"
            class="w-full"
            size="xl"
            placeholder="А·ч"
            :disabled="creatingAttribute"
            @keydown.enter.prevent="createAttribute"
          />
        </UFormField>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UButton
          color="neutral"
          variant="ghost"
          size="lg"
          @click="closeAttributeCreator"
        >
          Отмена
        </UButton>
        <UButton
          color="primary"
          size="lg"
          :loading="creatingAttribute"
          @click="createAttribute"
        >
          <Plus class="size-4" />
          Создать
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
import { categorySchema } from "~~/shared/schemas/admin/products/category";
import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";
import { createProductSchema } from "~~/shared/schemas/admin/products/createProduct";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

const CREATE_CATEGORY_VALUE = "__create_category__";
const CREATE_ATTRIBUTE_VALUE = "__create_attribute__";

type SelectValue = number | string | null | undefined;

const open = defineModel<boolean>("open", { default: false });

const props = defineProps<{
  productId?: number | null;
  categories: Category[];
  attributes: Attribute[];
}>();

const emit = defineEmits<{
  saved: [];
  dictionariesUpdated: [];
}>();

const loading = ref(false);
const submitting = ref(false);
const uploadingMain = ref(false);
const uploadingGallery = ref(false);
const creatingCategory = ref(false);
const creatingAttribute = ref(false);
const categoryCreateOpen = ref(false);
const attributeCreateOpen = ref(false);
const pendingAttributeIndex = ref<number | null>(null);
const newCategoryName = ref("");
const newCategoryError = ref<string | undefined>();
const newAttributeForm = reactive({
  name: "",
  unit: ""
});
const newAttributeErrors = reactive<Record<string, string | undefined>>({});
const localCategories = ref<Category[]>([]);
const localAttributes = ref<Attribute[]>([]);
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

watch(
  () => props.categories,
  (categories) => {
    localCategories.value = sortByName(categories);
  },
  { immediate: true }
);

watch(
  () => props.attributes,
  (attributes) => {
    localAttributes.value = sortByName(attributes);
  },
  { immediate: true }
);

const categoryItems = computed(() => [
  ...localCategories.value.map((category) => ({
    label: category.name,
    value: category.id
  })),
  { type: "separator" as const },
  {
    label: "Создать новую категорию",
    value: CREATE_CATEGORY_VALUE,
    class: "text-[var(--admin-accent)]"
  }
]);

const attributeItems = computed(() => [
  ...localAttributes.value.map((attribute) => ({
    label: attribute.unit ? `${attribute.name}, ${attribute.unit}` : attribute.name,
    value: attribute.id
  })),
  { type: "separator" as const },
  {
    label: "Создать новую характеристику",
    value: CREATE_ATTRIBUTE_VALUE,
    class: "text-[var(--admin-accent)]"
  }
]);

function sortByName<T extends { name: string }>(items: T[]) {
  return [...items].sort((first, second) => first.name.localeCompare(second.name, "ru"));
}

function upsertCategory(category: Category) {
  localCategories.value = sortByName([
    ...localCategories.value.filter((item) => item.id !== category.id),
    category
  ]);
}

function upsertAttribute(attribute: Attribute) {
  localAttributes.value = sortByName([
    ...localAttributes.value.filter((item) => item.id !== attribute.id),
    attribute
  ]);
}

function toPositiveInt(value: SelectValue) {
  const numericValue = Number(value);
  return Number.isInteger(numericValue) && numericValue > 0 ? numericValue : undefined;
}

function handleCategorySelect(value: SelectValue) {
  if (value === CREATE_CATEGORY_VALUE) {
    openCategoryCreator();
    return;
  }

  form.categoryId = toPositiveInt(value);
  fieldErrors.categoryId = undefined;
}

function handleAttributeSelect(index: number, value: SelectValue) {
  if (value === CREATE_ATTRIBUTE_VALUE) {
    openAttributeCreator(index);
    return;
  }

  const target = form.productAttributes[index];

  if (target) {
    target.attributeId = toPositiveInt(value);
  }
}

function openCategoryCreator() {
  newCategoryName.value = "";
  newCategoryError.value = undefined;
  categoryCreateOpen.value = true;
}

function closeCategoryCreator() {
  categoryCreateOpen.value = false;
}

function openAttributeCreator(index: number | null = null) {
  pendingAttributeIndex.value = index;
  newAttributeForm.name = "";
  newAttributeForm.unit = "";
  clearFieldErrors(newAttributeErrors);
  attributeCreateOpen.value = true;
}

function closeAttributeCreator() {
  pendingAttributeIndex.value = null;
  attributeCreateOpen.value = false;
}

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

async function createCategory() {
  if (creatingCategory.value) {
    return;
  }

  const parsed = categorySchema.safeParse({ name: newCategoryName.value });

  if (!parsed.success) {
    newCategoryError.value = getZodFieldErrors(parsed.error).name ?? "Проверьте название категории";
    return;
  }

  newCategoryError.value = undefined;
  creatingCategory.value = true;

  try {
    const result = await $fetch<{ success: boolean; category: Category }>("/api/admin/categories", {
      method: "POST",
      body: parsed.data
    });

    upsertCategory(result.category);
    form.categoryId = result.category.id;
    fieldErrors.categoryId = undefined;
    newCategoryName.value = "";
    categoryCreateOpen.value = false;
    emit("dictionariesUpdated");
    toast.success(`Категория "${result.category.name}" создана`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось создать категорию"));
  } finally {
    creatingCategory.value = false;
  }
}

async function createAttribute() {
  if (creatingAttribute.value) {
    return;
  }

  const parsed = createAttributeSchema.safeParse({
    name: newAttributeForm.name,
    unit: newAttributeForm.unit
  });

  if (!parsed.success) {
    replaceFieldErrors(newAttributeErrors, getZodFieldErrors(parsed.error));
    return;
  }

  clearFieldErrors(newAttributeErrors);
  creatingAttribute.value = true;

  try {
    const result = await $fetch<{ success: boolean; attribute: Attribute }>("/api/admin/products/attributes", {
      method: "POST",
      body: parsed.data
    });

    upsertAttribute(result.attribute);

    const targetIndex = pendingAttributeIndex.value;
    const targetAttribute = targetIndex === null ? undefined : form.productAttributes[targetIndex];

    if (targetAttribute) {
      targetAttribute.attributeId = result.attribute.id;
    } else {
      form.productAttributes.push({
        attributeId: result.attribute.id,
        value: ""
      });
    }

    fieldErrors.productAttributes = undefined;
    newAttributeForm.name = "";
    newAttributeForm.unit = "";
    pendingAttributeIndex.value = null;
    attributeCreateOpen.value = false;
    emit("dictionariesUpdated");
    toast.success(`Характеристика "${result.attribute.name}" создана`);
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось создать характеристику"));
  } finally {
    creatingAttribute.value = false;
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
