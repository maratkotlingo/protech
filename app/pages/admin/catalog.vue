<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Справочники"
      kicker="Catalog dictionaries"
      description="Категории товаров и характеристики, которые используются в карточках каталога."
    >
      <template #actions>
        <UButton
          color="neutral"
          variant="outline"
          :loading="pending"
          @click="refresh()"
        >
          <RefreshCw class="size-4" />
          Обновить
        </UButton>
      </template>
    </AdminPageHeader>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <AdminMetricCard
        label="Категории"
        :value="formatNumber(categories.length)"
        hint="Основная навигация каталога"
        positive
      >
        <template #icon>
          <FolderTree class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Характеристики"
        :value="formatNumber(attributes.length)"
        hint="Поля, доступные в карточках товаров"
        positive
      >
        <template #icon>
          <ListChecks class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Используются"
        :value="formatNumber(usedAttributesCount)"
        hint="Уже привязаны хотя бы к одному товару"
        positive
      >
        <template #icon>
          <Pencil class="size-7" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Без единиц"
        :value="formatNumber(attributesWithoutUnitCount)"
        hint="Можно уточнить для лучшего сравнения"
        :positive="attributesWithoutUnitCount === 0"
      >
        <template #icon>
          <Tags class="size-7" />
        </template>
      </AdminMetricCard>
    </div>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить справочники"
      :description="getErrorMessage(error)"
    />

    <div class="grid gap-6 xl:grid-cols-2">
      <UCard
        class="admin-list-card"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="admin-section-heading">
                Категории
              </p>
              <p class="admin-section-copy">
                Основная группировка товаров.
              </p>
            </div>
            <UButton
              color="primary"
              @click="openCategoryForm()"
            >
              <Plus class="size-4" />
              Добавить
            </UButton>
          </div>
        </template>

        <div
          v-if="categories.length"
          class="divide-y divide-[var(--admin-border)]"
        >
          <div
            v-for="category in categories"
            :key="category.id"
            class="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-[#f9fafb]"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--admin-text)]">
                {{ category.name }}
              </p>
              <p class="text-xs text-[var(--admin-text-muted)]">
                ID {{ category.id }}
              </p>
            </div>
            <div class="flex gap-3">
              <UTooltip text="Редактировать">
                <UButton
                  color="neutral"
                  variant="ghost"
                  square
                  aria-label="Редактировать категорию"
                  @click="openCategoryForm(category)"
                >
                  <Pencil class="size-4" />
                </UButton>
              </UTooltip>
              <UTooltip text="Удалить">
                <UButton
                  color="error"
                  variant="ghost"
                  square
                  aria-label="Удалить категорию"
                  :loading="deletingCategoryId === category.id"
                  @click="deleteCategory(category)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>
        </div>
        <AdminEmptyState
          v-else-if="!pending"
          title="Категорий пока нет"
          description="Создайте первую категорию, чтобы сгруппировать товары каталога."
        >
          <template #icon>
            <FolderTree class="size-6" />
          </template>
          <template #actions>
            <UButton
              color="primary"
              @click="openCategoryForm()"
            >
              Добавить категорию
            </UButton>
          </template>
        </AdminEmptyState>
      </UCard>

      <UCard
        class="admin-list-card"
        :ui="{ body: 'p-0' }"
      >
        <template #header>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="admin-section-heading">
                Характеристики
              </p>
              <p class="admin-section-copy">
                Параметры, которые привязываются к товарам.
              </p>
            </div>
            <UButton
              color="primary"
              @click="openAttributeForm()"
            >
              <Plus class="size-4" />
              Добавить
            </UButton>
          </div>
        </template>

        <div
          v-if="attributes.length"
          class="divide-y divide-[var(--admin-border)]"
        >
          <div
            v-for="attribute in attributes"
            :key="attribute.id"
            class="flex items-center justify-between gap-4 px-4 py-4 transition hover:bg-[#f9fafb]"
          >
            <div class="min-w-0">
              <p class="truncate font-medium text-[var(--admin-text)]">
                {{ attribute.name }}
                <span
                  v-if="attribute.unit"
                  class="text-[var(--admin-text-muted)]"
                >
                  · {{ attribute.unit }}
                </span>
              </p>
              <p class="text-xs text-[var(--admin-text-muted)]">
                Используется: {{ attribute._count?.productAttributes ?? 0 }}
              </p>
            </div>
            <div class="flex gap-3">
              <UTooltip text="Редактировать">
                <UButton
                  color="neutral"
                  variant="ghost"
                  square
                  aria-label="Редактировать характеристику"
                  @click="openAttributeForm(attribute)"
                >
                  <Pencil class="size-4" />
                </UButton>
              </UTooltip>
              <UTooltip text="Удалить">
                <UButton
                  color="error"
                  variant="ghost"
                  square
                  aria-label="Удалить характеристику"
                  :loading="deletingAttributeId === attribute.id"
                  @click="deleteAttribute(attribute)"
                >
                  <Trash2 class="size-4" />
                </UButton>
              </UTooltip>
            </div>
          </div>
        </div>
        <AdminEmptyState
          v-else-if="!pending"
          title="Характеристик пока нет"
          description="Добавьте параметры, которые помогут сравнивать товары внутри категорий."
        >
          <template #icon>
            <ListChecks class="size-6" />
          </template>
          <template #actions>
            <UButton
              color="primary"
              @click="openAttributeForm()"
            >
              Добавить характеристику
            </UButton>
          </template>
        </AdminEmptyState>
      </UCard>
    </div>

    <UModal
      v-model:open="categoryModalOpen"
      :title="editingCategory ? 'Редактировать категорию' : 'Новая категория'"
    >
      <template #body>
        <UFormField
          label="Название"
          required
          :error="categoryErrors.name"
        >
          <UInput
            v-model="categoryName"
            class="w-full"
            size="lg"
            placeholder="Название категории"
          />
        </UFormField>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeCategoryForm"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="savingCategory"
            @click="saveCategory"
          >
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="attributeModalOpen"
      :title="editingAttribute ? 'Редактировать характеристику' : 'Новая характеристика'"
    >
      <template #body>
        <div class="grid gap-5 sm:grid-cols-2">
          <UFormField
            label="Название"
            required
            :error="attributeErrors.name"
          >
            <UInput
              v-model="attributeForm.name"
              class="w-full"
              size="lg"
              placeholder="Например, Мощность"
            />
          </UFormField>
          <UFormField
            label="Единица"
            :error="attributeErrors.unit"
          >
            <UInput
              v-model="attributeForm.unit"
              class="w-full"
              size="lg"
              placeholder="Вт, мм, шт."
            />
          </UFormField>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeAttributeForm"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="savingAttribute"
            @click="saveAttribute"
          >
            Сохранить
          </UButton>
        </div>
      </template>
    </UModal>

    <AdminConfirmModal
      v-model:open="confirmOpen"
      v-bind="confirmOptions"
      :loading="confirmLoading"
      @confirm="runConfirmedAction"
    />
  </div>
</template>

<script setup lang="ts">
import { FolderTree, ListChecks, Pencil, Plus, RefreshCw, Tags, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { formatNumber, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import type { Attribute, Category } from "~~/app/shared/types/admin";
import { categorySchema } from "~~/shared/schemas/admin/products/category";
import { createAttributeSchema } from "~~/shared/schemas/admin/products/createAttribute";
import { updateAttributeSchema } from "~~/shared/schemas/admin/products/updateAttribute";

definePageMeta({
  layout: "admin"
});

const categoryModalOpen = ref(false);
const attributeModalOpen = ref(false);
const savingCategory = ref(false);
const savingAttribute = ref(false);
const deletingCategoryId = ref<number | null>(null);
const deletingAttributeId = ref<number | null>(null);
const editingCategory = ref<Category | null>(null);
const editingAttribute = ref<Attribute | null>(null);
const categoryName = ref("");
const attributeForm = reactive({
  name: "",
  unit: ""
});
const categoryErrors = reactive<Record<string, string | undefined>>({});
const attributeErrors = reactive<Record<string, string | undefined>>({});
const confirmOpen = ref(false);
const confirmLoading = ref(false);
const confirmOptions = reactive({
  title: "",
  description: "",
  message: "",
  hint: "",
  confirmLabel: "Подтвердить",
  color: "primary" as "primary" | "error"
});
let confirmedAction: (() => Promise<void>) | null = null;

const { data, pending, error, refresh } = await useAsyncData("admin-catalog-dictionaries", async () => {
  const [categories, attributes] = await Promise.all([
    adminFetch<Category[]>("/api/admin/categories"),
    adminFetch<Attribute[]>("/api/admin/products/attributes")
  ]);

  return { categories, attributes };
});

const categories = computed(() => data.value?.categories ?? []);
const attributes = computed(() => data.value?.attributes ?? []);
const usedAttributesCount = computed(() => attributes.value.filter((attribute) => (attribute._count?.productAttributes ?? 0) > 0).length);
const attributesWithoutUnitCount = computed(() => attributes.value.filter((attribute) => !attribute.unit).length);

function openCategoryForm(category?: Category) {
  editingCategory.value = category ?? null;
  categoryName.value = category?.name ?? "";
  clearFieldErrors(categoryErrors);
  categoryModalOpen.value = true;
}

function openAttributeForm(attribute?: Attribute) {
  editingAttribute.value = attribute ?? null;
  attributeForm.name = attribute?.name ?? "";
  attributeForm.unit = attribute?.unit ?? "";
  clearFieldErrors(attributeErrors);
  attributeModalOpen.value = true;
}

function closeCategoryForm() {
  categoryModalOpen.value = false;
}

function closeAttributeForm() {
  attributeModalOpen.value = false;
}

async function saveCategory() {
  const parsed = categorySchema.safeParse({ name: categoryName.value });

  if (!parsed.success) {
    replaceFieldErrors(categoryErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте название категории");
    return;
  }

  clearFieldErrors(categoryErrors);
  savingCategory.value = true;

  try {
    if (editingCategory.value) {
      await $fetch(`/api/admin/categories/update/${editingCategory.value.id}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Категория обновлена");
    } else {
      await $fetch("/api/admin/categories", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Категория создана");
    }

    categoryModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить категорию"));
  } finally {
    savingCategory.value = false;
  }
}

async function saveAttribute() {
  const body = {
    name: attributeForm.name,
    unit: attributeForm.unit
  };
  const parsed = (editingAttribute.value ? updateAttributeSchema : createAttributeSchema).safeParse(body);

  if (!parsed.success) {
    replaceFieldErrors(attributeErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля характеристики");
    return;
  }

  clearFieldErrors(attributeErrors);
  savingAttribute.value = true;

  try {
    if (editingAttribute.value) {
      await $fetch(`/api/admin/products/attributes/update/${editingAttribute.value.id}`, {
        method: "POST",
        body: parsed.data
      });
      toast.success("Характеристика обновлена");
    } else {
      await $fetch("/api/admin/products/attributes", {
        method: "POST",
        body: parsed.data
      });
      toast.success("Характеристика создана");
    }

    attributeModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось сохранить характеристику"));
  } finally {
    savingAttribute.value = false;
  }
}

function requestConfirm(
  options: Partial<typeof confirmOptions>,
  action: () => Promise<void>
) {
  Object.assign(confirmOptions, {
    title: "",
    description: "",
    message: "",
    hint: "",
    confirmLabel: "Подтвердить",
    color: "primary" as "primary" | "error",
    ...options
  });
  confirmedAction = action;
  confirmOpen.value = true;
}

async function runConfirmedAction() {
  if (!confirmedAction) {
    confirmOpen.value = false;
    return;
  }

  confirmLoading.value = true;

  try {
    await confirmedAction();
    confirmOpen.value = false;
  } finally {
    confirmLoading.value = false;
    confirmedAction = null;
  }
}

function deleteCategory(category: Category) {
  requestConfirm({
    title: "Удалить категорию",
    message: `Удалить категорию "${category.name}"?`,
    hint: "Категорию нельзя удалить, если к ней привязаны товары.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingCategoryId.value = category.id;

    try {
      await $fetch(`/api/admin/categories/delete/${category.id}`, {
        method: "POST"
      });
      toast.success("Категория удалена");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить категорию"));
    } finally {
      deletingCategoryId.value = null;
    }
  });
}

function deleteAttribute(attribute: Attribute) {
  requestConfirm({
    title: "Удалить характеристику",
    message: `Удалить характеристику "${attribute.name}"?`,
    hint: "Значения этой характеристики у товаров будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingAttributeId.value = attribute.id;

    try {
      await $fetch(`/api/admin/products/attributes/delete/${attribute.id}`, {
        method: "POST"
      });
      toast.success("Характеристика удалена");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить характеристику"));
    } finally {
      deletingAttributeId.value = null;
    }
  });
}
</script>
