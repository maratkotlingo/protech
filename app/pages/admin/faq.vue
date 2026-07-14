<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="FAQ и вопросы"
      kicker="Support"
      description="Вопросы пользователей по магазину и публичные ответы администратора."
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

    <UCard
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <USwitch
        v-model="filters.faq.pendingOnly"
        label="Только без ответа"
        description="Показывать вопросы, на которые ещё не ответили"
      />
    </UCard>

    <UCard
      v-if="selectedQuestionIds.length"
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-lg font-semibold text-[var(--admin-text)]">
            Выбрано вопросов: {{ selectedQuestionIds.length }}
          </p>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Можно массово изменить статус ответа, удалить или экспортировать выбранные вопросы.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <UButton
            color="primary"
            variant="soft"
            :loading="bulkLoading === 'markAnswered'"
            @click="bulkMarkAnswered(true)"
          >
            <CheckCircle2 class="size-4" />
            Отвечено
          </UButton>
          <UButton
            color="neutral"
            variant="soft"
            :loading="bulkLoading === 'markUnanswered'"
            @click="bulkMarkAnswered(false)"
          >
            <CircleOff class="size-4" />
            Без ответа
          </UButton>
          <UButton
            color="neutral"
            variant="outline"
            @click="exportSelectedQuestions"
          >
            <Download class="size-4" />
            Экспорт
          </UButton>
          <UButton
            color="error"
            variant="soft"
            :loading="bulkLoading === 'delete'"
            @click="confirmBulkDelete"
          >
            <Trash2 class="size-4" />
            Удалить
          </UButton>
        </div>
      </div>
    </UCard>

    <UAlert
      v-if="error"
      color="error"
      variant="soft"
      title="Не удалось загрузить вопросы"
      :description="getErrorMessage(error)"
    />

    <div class="space-y-4">
      <UCard
        v-for="question in questions"
        :key="question.id"
        class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        :ui="{ body: 'p-6 sm:p-7' }"
      >
        <div class="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <div class="space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex flex-wrap items-center gap-2">
                  <input
                    :checked="selectedQuestionIds.includes(question.id)"
                    class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                    type="checkbox"
                    :aria-label="`Выбрать вопрос ${question.id}`"
                    @change="toggleQuestionSelection(question.id, $event)"
                  >
                  <h2 class="text-base font-semibold text-[var(--admin-text)]">
                    {{ question.title }}
                  </h2>
                  <AdminStatusBadge
                    type="boolean"
                    :value="question.isAnswered"
                    true-label="Отвечено"
                    false-label="Ждёт ответа"
                  />
                </div>
                <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                  {{ question.user.name || question.user.email }} · {{ formatDate(question.createdAt) }}
                </p>
              </div>
              <div class="flex gap-2">
                <UTooltip text="Редактировать">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    square
                    aria-label="Редактировать вопрос"
                    @click="openEditQuestion(question)"
                  >
                    <Pencil class="size-4" />
                  </UButton>
                </UTooltip>
                <UTooltip text="Удалить">
                  <UButton
                    color="error"
                    variant="ghost"
                    square
                    aria-label="Удалить вопрос"
                    :loading="deletingQuestionId === question.id"
                    @click="deleteQuestion(question)"
                  >
                    <Trash2 class="size-4" />
                  </UButton>
                </UTooltip>
              </div>
            </div>

            <p class="rounded-lg bg-[var(--admin-surface-muted)] p-4 text-sm leading-6 text-[var(--admin-text)]">
              {{ question.comment }}
            </p>

            <div
              v-if="question.shopQuestionImages.length"
              class="flex flex-wrap gap-2"
            >
              <img
                v-for="image in question.shopQuestionImages"
                :key="image.id ?? image.url"
                :src="image.url"
                alt=""
                class="size-20 rounded-lg object-cover"
              >
            </div>

            <div
              v-if="question.shopAnswers.length"
              class="space-y-2"
            >
              <p class="text-base font-semibold text-[var(--admin-text)]">
                Ответы
              </p>
              <div
                v-for="answer in question.shopAnswers"
                :key="answer.id"
                class="rounded-lg border border-[var(--admin-border)] p-3 text-sm"
              >
                <p class="text-[var(--admin-text)]">{{ answer.comment }}</p>
                <p class="mt-2 text-xs text-[var(--admin-text-muted)]">
                  {{ answer.user?.name || "Администратор" }} · {{ formatDate(answer.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <AdminAnswerBox
            v-model="answerDrafts[question.id]"
            :loading="answeringId === question.id"
            placeholder="Ответьте на вопрос пользователя"
            button-label="Ответить на вопрос"
            @submit="answerQuestion(question)"
          />
        </div>
      </UCard>

      <AdminEmptyState
        v-if="!questions.length && !pending"
        title="Вопросы не найдены"
        description="Новые вопросы пользователей появятся здесь."
      >
        <template #icon>
          <HelpCircle class="size-6" />
        </template>
      </AdminEmptyState>
    </div>

    <AdminPagination
      v-if="questionsData?.pagination"
      :pagination="questionsData.pagination"
      :loading="pending"
      @update:page="page = $event"
    />

    <UModal
      v-model:open="questionModalOpen"
      title="Редактировать вопрос"
      scrollable
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Заголовок"
            required
            :error="questionErrors.title"
          >
            <UInput
              v-model="questionForm.title"
              class="w-full"
              size="lg"
              placeholder="Заголовок вопроса"
            />
          </UFormField>
          <UFormField
            label="Вопрос"
            required
            :error="questionErrors.comment"
          >
            <UTextarea
              v-model="questionForm.comment"
              class="w-full"
              size="lg"
              autoresize
              :rows="5"
            />
          </UFormField>

          <section class="space-y-3 rounded-lg border border-[var(--admin-border)] p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-lg font-semibold text-[var(--admin-text)]">
                Изображения
              </p>
              <UButton
                color="primary"
                variant="soft"
                type="button"
                @click="addQuestionImage"
              >
                <Plus class="size-4" />
                URL
              </UButton>
            </div>
            <div
              v-if="questionErrors.shopQuestionImages"
              class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
            >
              {{ questionErrors.shopQuestionImages }}
            </div>
            <div
              v-for="(image, index) in questionForm.shopQuestionImages"
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
                square
                type="button"
                aria-label="Удалить изображение"
                @click="removeQuestionImage(index)"
              >
                <Trash2 class="size-4" />
              </UButton>
            </div>
          </section>
        </div>
      </template>
      <template #footer>
        <div class="flex w-full justify-end gap-2">
          <UButton
            color="neutral"
            variant="ghost"
            @click="closeQuestionModal"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="savingQuestion"
            @click="saveQuestion"
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
import { CheckCircle2, CircleOff, Download, HelpCircle, Pencil, Plus, RefreshCw, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { buildQuery, formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type { FaqQuestion, PaginatedResponse } from "~~/app/shared/types/admin";
import { shopAnswerSchema } from "~~/shared/schemas/admin/faq/shopAnswer";
import { updateShopQuestionSchema } from "~~/shared/schemas/user/faq/updateShopQuestion";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const answeringId = ref<number | null>(null);
const deletingQuestionId = ref<number | null>(null);
const editingQuestion = ref<FaqQuestion | null>(null);
const questionModalOpen = ref(false);
const savingQuestion = ref(false);
const bulkLoading = ref<string | null>(null);
const selectedQuestionIds = ref<number[]>([]);
const answerDrafts = reactive<Record<number, string>>({});
const questionErrors = reactive<Record<string, string | undefined>>({});
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
const questionForm = reactive({
  title: "",
  comment: "",
  shopQuestionImages: [] as Array<{ url: string }>
});

watch(() => filters.faq.pendingOnly, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  pending: filters.faq.pendingOnly
}));

const { data: questionsData, pending, error, refresh } = await useAsyncData(
  "admin-faq-list",
  () => adminFetch<PaginatedResponse<FaqQuestion>>(`/api/admin/faq${query.value}`),
  { watch: [query] }
);

const questions = computed(() => questionsData.value?.items ?? []);
const selectedQuestions = computed(() => questions.value.filter((question) => selectedQuestionIds.value.includes(question.id)));

watch(questions, (items) => {
  const visibleIds = new Set(items.map((question) => question.id));
  selectedQuestionIds.value = selectedQuestionIds.value.filter((id) => visibleIds.has(id));

  for (const question of items) {
    answerDrafts[question.id] ??= "";
  }
}, { immediate: true });

async function answerQuestion(question: FaqQuestion) {
  const comment = answerDrafts[question.id]?.trim();
  const parsed = shopAnswerSchema.safeParse({
    shopQuestionId: question.id,
    comment
  });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).comment ?? "Проверьте текст ответа");
    return;
  }

  answeringId.value = question.id;

  try {
    await $fetch("/api/admin/faq/answer", {
      method: "POST",
      body: parsed.data
    });
    toast.success("Ответ опубликован");
    answerDrafts[question.id] = "";
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось ответить на вопрос"));
  } finally {
    answeringId.value = null;
  }
}

function openEditQuestion(question: FaqQuestion) {
  editingQuestion.value = question;
  questionForm.title = question.title;
  questionForm.comment = question.comment;
  questionForm.shopQuestionImages = question.shopQuestionImages.map((image) => ({ url: image.url }));
  clearFieldErrors(questionErrors);
  questionModalOpen.value = true;
}

function closeQuestionModal() {
  questionModalOpen.value = false;
}

function addQuestionImage() {
  questionForm.shopQuestionImages.push({ url: "" });
}

function removeQuestionImage(index: number) {
  questionForm.shopQuestionImages.splice(index, 1);
}

async function saveQuestion() {
  if (!editingQuestion.value) {
    return;
  }

  const body = {
    title: questionForm.title.trim(),
    comment: questionForm.comment.trim(),
    shopQuestionImages: questionForm.shopQuestionImages
      .map((image) => ({ url: image.url.trim() }))
      .filter((image) => image.url)
  };
  const parsed = updateShopQuestionSchema.safeParse(body);

  if (!parsed.success) {
    replaceFieldErrors(questionErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля вопроса");
    return;
  }

  clearFieldErrors(questionErrors);
  savingQuestion.value = true;

  try {
    await $fetch(`/api/admin/faq/update/${editingQuestion.value.id}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Вопрос обновлён");
    questionModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить вопрос"));
  } finally {
    savingQuestion.value = false;
  }
}

function toggleQuestionSelection(questionId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedQuestionIds.value = checked
    ? [...new Set([...selectedQuestionIds.value, questionId])]
    : selectedQuestionIds.value.filter((id) => id !== questionId);
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

function deleteQuestion(question: FaqQuestion) {
  requestConfirm({
    title: "Удалить вопрос",
    message: `Удалить вопрос "${question.title}"?`,
    hint: "Изображения и ответы к вопросу будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingQuestionId.value = question.id;

    try {
      await $fetch(`/api/admin/faq/delete/${question.id}`, {
        method: "POST"
      });
      toast.success("Вопрос удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить вопрос"));
    } finally {
      deletingQuestionId.value = null;
    }
  });
}

async function runBulkQuestions(action: string) {
  bulkLoading.value = action;

  try {
    const result = await $fetch<{ count: number }>("/api/admin/faq/bulk", {
      method: "POST",
      body: {
        action,
        shopQuestionIds: selectedQuestionIds.value
      }
    });
    toast.success(`Обновлено вопросов: ${result.count}`);
    selectedQuestionIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовую операцию"));
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkMarkAnswered(answered: boolean) {
  await runBulkQuestions(answered ? "markAnswered" : "markUnanswered");
}

function confirmBulkDelete() {
  requestConfirm({
    title: "Удалить выбранные вопросы",
    message: `Удалить выбранные вопросы: ${selectedQuestionIds.value.length}?`,
    hint: "Изображения и ответы будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    await runBulkQuestions("delete");
  });
}

function exportSelectedQuestions() {
  const rows = selectedQuestions.value.map((question) => ({
    id: question.id,
    title: question.title,
    user: question.user.name || question.user.email,
    comment: question.comment,
    answered: question.isAnswered ? "yes" : "no",
    createdAt: question.createdAt
  }));

  downloadCsv("faq-selected.csv", rows);
  toast.success(`Экспортировано вопросов: ${rows.length}`);
}
</script>
