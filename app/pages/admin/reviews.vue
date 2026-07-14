<template>
  <div class="space-y-8 2xl:space-y-10">
    <AdminPageHeader
      title="Отзывы"
      kicker="Moderation"
      description="Отзывы покупателей, оценки, фотографии и ответы администратора."
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
        v-model="filters.reviews.pendingOnly"
        label="Только без ответа"
        description="Показывать отзывы, которые ещё ждут реакции администратора"
      />
    </UCard>

    <UCard
      v-if="selectedReviewIds.length"
      class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
      :ui="{ body: 'p-6 sm:p-7' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="text-lg font-semibold text-[var(--admin-text)]">
            Выбрано отзывов: {{ selectedReviewIds.length }}
          </p>
          <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
            Можно массово изменить статус ответа, удалить или экспортировать выбранные отзывы.
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
            @click="exportSelectedReviews"
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
      title="Не удалось загрузить отзывы"
      :description="getErrorMessage(error)"
    />

    <div class="space-y-4">
      <UCard
        v-for="review in reviews"
        :key="review.id"
        class="border border-[var(--admin-border)] bg-[var(--admin-surface)]"
        :ui="{ body: 'p-6 sm:p-7' }"
      >
        <div class="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_440px]">
          <div class="space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex min-w-0 items-center gap-3">
                <input
                  :checked="selectedReviewIds.includes(review.id)"
                  class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  :aria-label="`Выбрать отзыв ${review.id}`"
                  @change="toggleReviewSelection(review.id, $event)"
                >
                <img
                  :src="review.product.mainImage"
                  alt=""
                  class="size-12 rounded-lg object-cover"
                >
                <div class="min-w-0">
                  <p class="truncate font-semibold text-[var(--admin-text)]">
                    {{ review.product.name }}
                  </p>
                  <p class="truncate text-sm text-[var(--admin-text-muted)]">
                    {{ review.user.name || review.user.email }} · {{ formatDate(review.createdAt) }}
                  </p>
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <div class="flex items-center gap-1">
                  <Star
                    v-for="star in 5"
                    :key="star"
                    :class="[
                      'size-4',
                      star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--admin-border)]'
                    ]"
                  />
                </div>
                <UTooltip text="Редактировать">
                  <UButton
                    color="neutral"
                    variant="ghost"
                    square
                    aria-label="Редактировать отзыв"
                    @click="openEditReview(review)"
                  >
                    <Pencil class="size-4" />
                  </UButton>
                </UTooltip>
                <UTooltip text="Удалить">
                  <UButton
                    color="error"
                    variant="ghost"
                    square
                    aria-label="Удалить отзыв"
                    :loading="deletingReviewId === review.id"
                    @click="deleteReview(review)"
                  >
                    <Trash2 class="size-4" />
                  </UButton>
                </UTooltip>
              </div>
            </div>

            <div class="grid gap-4 lg:grid-cols-3">
              <div
                v-if="review.advantages"
                class="rounded-lg bg-green-50 p-3 text-sm text-green-800 dark:bg-green-950 dark:text-green-200"
              >
                <p class="font-medium">Плюсы</p>
                <p class="mt-1 leading-6">{{ review.advantages }}</p>
              </div>
              <div
                v-if="review.disadvantages"
                class="rounded-lg bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200"
              >
                <p class="font-medium">Минусы</p>
                <p class="mt-1 leading-6">{{ review.disadvantages }}</p>
              </div>
              <div
                v-if="review.comment"
                class="rounded-lg bg-[var(--admin-surface-muted)] p-3 text-sm text-[var(--admin-text)]"
              >
                <p class="font-medium">Комментарий</p>
                <p class="mt-1 leading-6">{{ review.comment }}</p>
              </div>
            </div>

            <div
              v-if="review.reviewPhotos.length"
              class="flex flex-wrap gap-2"
            >
              <img
                v-for="photo in review.reviewPhotos"
                :key="photo.id ?? photo.url"
                :src="photo.url"
                alt=""
                class="size-20 rounded-lg object-cover"
              >
            </div>

            <div
              v-if="review.reviewAnswers.length"
              class="space-y-2"
            >
              <p class="text-base font-semibold text-[var(--admin-text)]">
                Ответы
              </p>
              <div
                v-for="answer in review.reviewAnswers"
                :key="answer.id"
                class="rounded-lg border border-[var(--admin-border)] p-3 text-sm"
              >
                <p class="text-[var(--admin-text)]">{{ answer.text }}</p>
                <p class="mt-2 text-xs text-[var(--admin-text-muted)]">
                  {{ answer.user?.name || "Администратор" }} · {{ formatDate(answer.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <AdminAnswerBox
            v-model="answerDrafts[review.id]"
            :loading="answeringId === review.id"
            placeholder="Ответьте покупателю от лица магазина"
            button-label="Ответить на отзыв"
            @submit="answerReview(review)"
          />
        </div>
      </UCard>

      <AdminEmptyState
        v-if="!reviews.length && !pending"
        title="Отзывы не найдены"
        description="Здесь появятся отзывы покупателей."
      >
        <template #icon>
          <MessageSquareText class="size-6" />
        </template>
      </AdminEmptyState>
    </div>

    <AdminPagination
      v-if="reviewsData?.pagination"
      :pagination="reviewsData.pagination"
      :loading="pending"
      @update:page="page = $event"
    />

    <UModal
      v-model:open="reviewModalOpen"
      title="Редактировать отзыв"
      scrollable
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Оценка"
            required
            :error="reviewErrors.rating"
          >
            <UInput
              v-model.number="reviewForm.rating"
              class="w-full"
              size="lg"
              type="number"
              min="1"
              max="5"
            />
          </UFormField>
          <UFormField
            label="Плюсы"
            :error="reviewErrors.advantages"
          >
            <UTextarea
              v-model="reviewForm.advantages"
              class="w-full"
              size="lg"
              autoresize
              :rows="2"
            />
          </UFormField>
          <UFormField
            label="Минусы"
            :error="reviewErrors.disadvantages"
          >
            <UTextarea
              v-model="reviewForm.disadvantages"
              class="w-full"
              size="lg"
              autoresize
              :rows="2"
            />
          </UFormField>
          <UFormField
            label="Комментарий"
            :error="reviewErrors.comment"
          >
            <UTextarea
              v-model="reviewForm.comment"
              class="w-full"
              size="lg"
              autoresize
              :rows="3"
            />
          </UFormField>

          <section class="space-y-3 rounded-lg border border-[var(--admin-border)] p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="text-lg font-semibold text-[var(--admin-text)]">
                Фото
              </p>
              <UButton
                color="primary"
                variant="soft"
                type="button"
                @click="addReviewPhoto"
              >
                <Plus class="size-4" />
                URL
              </UButton>
            </div>
            <div
              v-if="reviewErrors.reviewPhotos"
              class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-200"
            >
              {{ reviewErrors.reviewPhotos }}
            </div>
            <div
              v-for="(photo, index) in reviewForm.reviewPhotos"
              :key="index"
              class="grid grid-cols-[1fr_auto] gap-2"
            >
              <UInput
                v-model="photo.url"
                class="w-full"
                size="lg"
                placeholder="URL фото"
              />
              <UButton
                color="error"
                variant="ghost"
                square
                type="button"
                aria-label="Удалить фото"
                @click="removeReviewPhoto(index)"
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
            @click="closeReviewModal"
          >
            Отмена
          </UButton>
          <UButton
            color="primary"
            :loading="savingReview"
            @click="saveReview"
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
import { CheckCircle2, CircleOff, Download, MessageSquareText, Pencil, Plus, RefreshCw, Star, Trash2 } from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { buildQuery, formatDate, getErrorMessage } from "~~/app/shared/lib/adminFormatters";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import { clearFieldErrors, getZodFieldErrors, replaceFieldErrors } from "~~/app/shared/lib/zodValidation";
import { useAdminFiltersStore } from "~~/app/stores/adminFilters";
import type { PaginatedResponse, ReviewListItem } from "~~/app/shared/types/admin";
import { reviewAnswerSchema } from "~~/shared/schemas/admin/reviews/reviewAnswer";
import { updateReviewSchema } from "~~/shared/schemas/user/reviews/updateReview";

definePageMeta({
  layout: "admin"
});

const filters = useAdminFiltersStore();
const page = ref(1);
const answeringId = ref<number | null>(null);
const deletingReviewId = ref<number | null>(null);
const editingReview = ref<ReviewListItem | null>(null);
const reviewModalOpen = ref(false);
const savingReview = ref(false);
const bulkLoading = ref<string | null>(null);
const selectedReviewIds = ref<number[]>([]);
const answerDrafts = reactive<Record<number, string>>({});
const reviewErrors = reactive<Record<string, string | undefined>>({});
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
const reviewForm = reactive({
  rating: 5,
  advantages: "",
  disadvantages: "",
  comment: "",
  reviewPhotos: [] as Array<{ url: string }>
});

watch(() => filters.reviews.pendingOnly, () => {
  page.value = 1;
});

const query = computed(() => buildQuery({
  page: page.value,
  pending: filters.reviews.pendingOnly
}));

const { data: reviewsData, pending, error, refresh } = await useAsyncData(
  "admin-reviews-list",
  () => adminFetch<PaginatedResponse<ReviewListItem>>(`/api/admin/reviews${query.value}`),
  { watch: [query] }
);

const reviews = computed(() => reviewsData.value?.items ?? []);
const selectedReviews = computed(() => reviews.value.filter((review) => selectedReviewIds.value.includes(review.id)));

watch(reviews, (items) => {
  const visibleIds = new Set(items.map((review) => review.id));
  selectedReviewIds.value = selectedReviewIds.value.filter((id) => visibleIds.has(id));

  for (const review of items) {
    answerDrafts[review.id] ??= "";
  }
}, { immediate: true });

async function answerReview(review: ReviewListItem) {
  const text = answerDrafts[review.id]?.trim();
  const parsed = reviewAnswerSchema.safeParse({ text });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).text ?? "Проверьте текст ответа");
    return;
  }

  answeringId.value = review.id;

  try {
    await $fetch(`/api/admin/reviews/${review.id}/answer`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Ответ опубликован");
    answerDrafts[review.id] = "";
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось ответить на отзыв"));
  } finally {
    answeringId.value = null;
  }
}

function openEditReview(review: ReviewListItem) {
  editingReview.value = review;
  reviewForm.rating = review.rating;
  reviewForm.advantages = review.advantages ?? "";
  reviewForm.disadvantages = review.disadvantages ?? "";
  reviewForm.comment = review.comment ?? "";
  reviewForm.reviewPhotos = review.reviewPhotos.map((photo) => ({ url: photo.url }));
  clearFieldErrors(reviewErrors);
  reviewModalOpen.value = true;
}

function closeReviewModal() {
  reviewModalOpen.value = false;
}

function addReviewPhoto() {
  reviewForm.reviewPhotos.push({ url: "" });
}

function removeReviewPhoto(index: number) {
  reviewForm.reviewPhotos.splice(index, 1);
}

async function saveReview() {
  if (!editingReview.value) {
    return;
  }

  const body = {
    rating: reviewForm.rating,
    advantages: reviewForm.advantages.trim() || undefined,
    disadvantages: reviewForm.disadvantages.trim() || undefined,
    comment: reviewForm.comment.trim() || undefined,
    reviewPhotos: reviewForm.reviewPhotos
      .map((photo) => ({ url: photo.url.trim() }))
      .filter((photo) => photo.url)
  };
  const parsed = updateReviewSchema.safeParse(body);

  if (!parsed.success) {
    replaceFieldErrors(reviewErrors, getZodFieldErrors(parsed.error));
    toast.error("Проверьте поля отзыва");
    return;
  }

  clearFieldErrors(reviewErrors);
  savingReview.value = true;

  try {
    await $fetch(`/api/admin/reviews/update/${editingReview.value.id}`, {
      method: "POST",
      body: parsed.data
    });
    toast.success("Отзыв обновлён");
    reviewModalOpen.value = false;
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось обновить отзыв"));
  } finally {
    savingReview.value = false;
  }
}

function toggleReviewSelection(reviewId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedReviewIds.value = checked
    ? [...new Set([...selectedReviewIds.value, reviewId])]
    : selectedReviewIds.value.filter((id) => id !== reviewId);
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

function deleteReview(review: ReviewListItem) {
  requestConfirm({
    title: "Удалить отзыв",
    message: `Удалить отзыв к товару "${review.product.name}"?`,
    hint: "Фотографии и ответы к отзыву будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    deletingReviewId.value = review.id;

    try {
      await $fetch(`/api/admin/reviews/delete/${review.id}`, {
        method: "POST"
      });
      toast.success("Отзыв удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить отзыв"));
    } finally {
      deletingReviewId.value = null;
    }
  });
}

async function runBulkReviews(action: string) {
  bulkLoading.value = action;

  try {
    const result = await $fetch<{ count: number }>("/api/admin/reviews/bulk", {
      method: "POST",
      body: {
        action,
        reviewIds: selectedReviewIds.value
      }
    });
    toast.success(`Обновлено отзывов: ${result.count}`);
    selectedReviewIds.value = [];
    await refresh();
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось выполнить массовую операцию"));
  } finally {
    bulkLoading.value = null;
  }
}

async function bulkMarkAnswered(answered: boolean) {
  await runBulkReviews(answered ? "markAnswered" : "markUnanswered");
}

function confirmBulkDelete() {
  requestConfirm({
    title: "Удалить выбранные отзывы",
    message: `Удалить выбранные отзывы: ${selectedReviewIds.value.length}?`,
    hint: "Фотографии и ответы к отзывам будут удалены каскадно.",
    confirmLabel: "Удалить",
    color: "error"
  }, async () => {
    await runBulkReviews("delete");
  });
}

function exportSelectedReviews() {
  const rows = selectedReviews.value.map((review) => ({
    id: review.id,
    product: review.product.name,
    user: review.user.name || review.user.email,
    rating: review.rating,
    advantages: review.advantages,
    disadvantages: review.disadvantages,
    comment: review.comment,
    answered: review.isAnswered ? "yes" : "no",
    createdAt: review.createdAt
  }));

  downloadCsv("reviews-selected.csv", rows);
  toast.success(`Экспортировано отзывов: ${rows.length}`);
}
</script>
