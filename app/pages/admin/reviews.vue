<template>
  <div class="space-y-5">
    <AdminPageHeader
      title="Отзывы"
      kicker="Customer voice"
      description="Модерация отзывов, ответы покупателям и контроль качества карточек товаров."
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

    <div class="grid gap-4 md:grid-cols-3">
      <AdminMetricCard
        label="Всего в выдаче"
        :value="formatNumber(reviewsData?.pagination.total ?? reviews.length)"
        hint="С учётом текущего фильтра"
        positive
      >
        <template #icon>
          <MessageSquareText class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Ждут ответа"
        :value="formatNumber(pendingReviewsCount)"
        hint="На текущей странице"
        :positive="pendingReviewsCount === 0"
      >
        <template #icon>
          <Clock3 class="size-6" />
        </template>
      </AdminMetricCard>
      <AdminMetricCard
        label="Средняя оценка"
        :value="averageRatingLabel"
        hint="По отзывам текущей страницы"
        :positive="averageRating >= 4"
      >
        <template #icon>
          <Star class="size-6" />
        </template>
      </AdminMetricCard>
    </div>

    <UCard
      class="admin-filter-card"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div class="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <USwitch
          v-model="filters.reviews.pendingOnly"
          label="Только без ответа"
          description="Показывать отзывы, где покупатель ещё не получил ответ"
        />
        <div class="flex flex-wrap gap-2">
          <UButton
            color="neutral"
            variant="outline"
            icon="i-lucide-list-filter"
            @click="setReviewsPendingOnly(false)"
          >
            Все отзывы
          </UButton>
          <UButton
            color="primary"
            variant="soft"
            icon="i-lucide-clock-3"
            @click="setReviewsPendingOnly(true)"
          >
            Очередь ответов
          </UButton>
        </div>
      </div>
    </UCard>

    <UCard
      v-if="selectedReviewIds.length"
      class="admin-card admin-action-bar"
      :ui="{ body: 'p-4 sm:p-5' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p class="admin-section-heading">
            Выбрано отзывов: {{ selectedReviewIds.length }}
          </p>
          <p class="admin-section-copy">
            Массово меняйте статус ответа, экспортируйте или удаляйте выбранные отзывы.
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

    <UCard
      class="admin-list-card"
      :ui="{ body: 'p-0' }"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--admin-border)] px-4 py-3">
        <div>
          <p class="admin-section-heading">
            Лента отзывов
          </p>
          <p class="admin-section-copy">
            Сортировка по свежести, ответы публикуются от имени администратора.
          </p>
        </div>
        <label class="inline-flex items-center gap-2 text-sm text-[var(--admin-text-muted)]">
          <input
            v-model="allReviewsOnPageSelected"
            class="size-4 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
            type="checkbox"
          >
          Выбрать страницу
        </label>
      </div>

      <div class="divide-y divide-[var(--admin-border)]">
        <article
          v-for="review in reviews"
          :key="review.id"
          class="grid gap-5 p-4 transition hover:bg-[var(--admin-surface-muted)]/70 xl:grid-cols-[minmax(0,1fr)_360px] xl:p-5"
        >
          <div class="min-w-0 space-y-4">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex min-w-0 gap-3">
                <input
                  :checked="selectedReviewIds.includes(review.id)"
                  class="mt-1 size-4 shrink-0 rounded border-[var(--admin-border)] accent-[var(--admin-accent)]"
                  type="checkbox"
                  :aria-label="`Выбрать отзыв ${review.id}`"
                  @change="toggleReviewSelection(review.id, $event)"
                >
                <img
                  :src="review.product.mainImage"
                  alt=""
                  class="size-14 shrink-0 rounded-lg object-cover ring-1 ring-[var(--admin-border)]"
                >
                <div class="min-w-0">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="truncate font-semibold text-[var(--admin-text)]">
                      {{ review.product.name }}
                    </p>
                    <AdminStatusBadge
                      type="boolean"
                      :value="review.isAnswered"
                      true-label="Отвечено"
                      false-label="Ждёт ответа"
                    />
                  </div>
                  <p class="mt-1 text-sm text-[var(--admin-text-muted)]">
                    {{ review.user.name || review.user.email }} · {{ formatDate(review.createdAt) }}
                  </p>
                  <div class="mt-2 flex items-center gap-1">
                    <Star
                      v-for="star in 5"
                      :key="star"
                      :class="[
                        'size-4',
                        star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-[var(--admin-border)]'
                      ]"
                    />
                    <span class="ml-1 text-xs font-semibold text-[var(--admin-text-muted)]">
                      {{ review.rating }}/5
                    </span>
                  </div>
                </div>
              </div>

              <div class="flex shrink-0 gap-1">
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

            <div class="grid gap-3 lg:grid-cols-3">
              <div class="rounded-lg border border-[var(--admin-border)] bg-white p-3">
                <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                  Достоинства
                </p>
                <p class="mt-2 text-sm leading-6 text-[var(--admin-text)]">
                  {{ review.advantages || "Не указаны" }}
                </p>
              </div>
              <div class="rounded-lg border border-[var(--admin-border)] bg-white p-3">
                <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                  Недостатки
                </p>
                <p class="mt-2 text-sm leading-6 text-[var(--admin-text)]">
                  {{ review.disadvantages || "Не указаны" }}
                </p>
              </div>
              <div class="rounded-lg border border-[var(--admin-border)] bg-white p-3">
                <p class="text-xs font-semibold uppercase text-[var(--admin-text-subtle)]">
                  Комментарий
                </p>
                <p class="mt-2 text-sm leading-6 text-[var(--admin-text)]">
                  {{ review.comment || "Без комментария" }}
                </p>
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
                class="size-20 rounded-lg object-cover ring-1 ring-[var(--admin-border)]"
              >
            </div>

            <div
              v-if="review.reviewAnswers.length"
              class="space-y-2 rounded-lg border border-[var(--admin-border)] bg-[var(--admin-surface-muted)]/60 p-3"
            >
              <p class="text-sm font-semibold text-[var(--admin-text)]">
                Ответы администратора
              </p>
              <div
                v-for="answer in review.reviewAnswers"
                :key="answer.id"
                class="rounded-lg bg-white p-3 text-sm ring-1 ring-[var(--admin-border)]"
              >
                <p class="leading-6 text-[var(--admin-text)]">
                  {{ answer.text }}
                </p>
                <p class="mt-2 text-xs text-[var(--admin-text-muted)]">
                  {{ answer.user?.name || "Администратор" }} · {{ formatDate(answer.createdAt) }}
                </p>
              </div>
            </div>
          </div>

          <AdminAnswerBox
            v-model="answerDrafts[review.id]"
            :loading="answeringId === review.id"
            placeholder="Ответьте на отзыв покупателя"
            button-label="Ответить"
            @submit="answerReview(review)"
          />
        </article>
      </div>

      <AdminEmptyState
        v-if="!reviews.length && !pending"
        title="Отзывы не найдены"
        description="Новые отзывы покупателей появятся здесь."
      >
        <template #icon>
          <MessageSquareText class="size-6" />
        </template>
      </AdminEmptyState>

      <AdminPagination
        v-if="reviewsData?.pagination"
        :pagination="reviewsData.pagination"
        :loading="pending"
        @update:page="page = $event"
      />
    </UCard>

    <UModal
      v-model:open="reviewModalOpen"
      title="Редактировать отзыв"
      scrollable
    >
      <template #body>
        <div class="space-y-4">
          <UFormField
            label="Рейтинг"
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

          <div class="grid gap-4 sm:grid-cols-2">
            <UFormField
              label="Достоинства"
              :error="reviewErrors.advantages"
            >
              <UTextarea
                v-model="reviewForm.advantages"
                class="w-full"
                :rows="3"
              />
            </UFormField>
            <UFormField
              label="Недостатки"
              :error="reviewErrors.disadvantages"
            >
              <UTextarea
                v-model="reviewForm.disadvantages"
                class="w-full"
                :rows="3"
              />
            </UFormField>
          </div>

          <UFormField
            label="Комментарий"
            :error="reviewErrors.comment"
          >
            <UTextarea
              v-model="reviewForm.comment"
              class="w-full"
              :rows="4"
            />
          </UFormField>

          <section class="space-y-3 rounded-lg border border-[var(--admin-border)] p-3">
            <div class="flex items-center justify-between gap-3">
              <p class="admin-section-heading">
                Фотографии
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
            <p
              v-if="reviewErrors.reviewPhotos"
              class="rounded-lg bg-red-50 p-3 text-sm text-red-700"
            >
              {{ reviewErrors.reviewPhotos }}
            </p>
            <div
              v-for="(photo, index) in reviewForm.reviewPhotos"
              :key="index"
              class="grid grid-cols-[1fr_auto] gap-2"
            >
              <UInput
                v-model="photo.url"
                class="w-full"
                size="lg"
                placeholder="URL изображения"
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
import {
  CheckCircle2,
  CircleOff,
  Clock3,
  Download,
  MessageSquareText,
  Pencil,
  Plus,
  RefreshCw,
  Star,
  Trash2
} from "@lucide/vue";
import { toast } from "vue-sonner";
import { adminFetch } from "~~/app/shared/lib/adminFetch";
import { downloadCsv } from "~~/app/shared/lib/csvExport";
import {
  buildQuery,
  formatDate,
  formatNumber,
  getErrorMessage
} from "~~/app/shared/lib/adminFormatters";
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
const selectedReviewIds = ref<number[]>([]);
const answerDrafts = reactive<Record<number, string>>({});
const answeringId = ref<number | null>(null);
const deletingReviewId = ref<number | null>(null);
const bulkLoading = ref<string | null>(null);
const reviewModalOpen = ref(false);
const savingReview = ref(false);
const editingReview = ref<ReviewListItem | null>(null);
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
const pendingReviewsCount = computed(() => reviews.value.filter((review) => !review.isAnswered).length);
const averageRating = computed(() => {
  if (!reviews.value.length) {
    return 0;
  }

  return reviews.value.reduce((sum, review) => sum + review.rating, 0) / reviews.value.length;
});
const averageRatingLabel = computed(() => reviews.value.length ? averageRating.value.toFixed(1) : "—");
const allReviewsOnPageSelected = computed({
  get: () => reviews.value.length > 0 && reviews.value.every((review) => selectedReviewIds.value.includes(review.id)),
  set: (checked: boolean) => {
    const pageIds = reviews.value.map((review) => review.id);
    selectedReviewIds.value = checked
      ? [...new Set([...selectedReviewIds.value, ...pageIds])]
      : selectedReviewIds.value.filter((id) => !pageIds.includes(id));
  }
});

watch(reviews, (items) => {
  const visibleIds = new Set(items.map((review) => review.id));
  selectedReviewIds.value = selectedReviewIds.value.filter((id) => visibleIds.has(id));

  for (const review of items) {
    answerDrafts[review.id] ??= "";
  }
}, { immediate: true });

function setReviewsPendingOnly(value: boolean) {
  filters.reviews.pendingOnly = value;
}

function toggleReviewSelection(reviewId: number, event: Event) {
  const checked = (event.target as HTMLInputElement | null)?.checked ?? false;

  selectedReviewIds.value = checked
    ? [...new Set([...selectedReviewIds.value, reviewId])]
    : selectedReviewIds.value.filter((id) => id !== reviewId);
}

async function answerReview(review: ReviewListItem) {
  const text = answerDrafts[review.id]?.trim();
  const parsed = reviewAnswerSchema.safeParse({ text });

  if (!parsed.success) {
    toast.error(getZodFieldErrors(parsed.error).text ?? "Проверьте текст ответа");
    return;
  }

  answeringId.value = review.id;

  try {
    await adminFetch(`/api/admin/reviews/${review.id}/answer`, {
      method: "POST",
      body: parsed.data
    });
    answerDrafts[review.id] = "";
    toast.success("Ответ опубликован");
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
    await adminFetch(`/api/admin/reviews/update/${editingReview.value.id}`, {
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
      await adminFetch(`/api/admin/reviews/delete/${review.id}`, { method: "POST" });
      toast.success("Отзыв удалён");
      await refresh();
    } catch (error) {
      toast.error(getErrorMessage(error, "Не удалось удалить отзыв"));
    } finally {
      deletingReviewId.value = null;
    }
  });
}

async function runBulkReviews(action: "delete" | "markAnswered" | "markUnanswered") {
  bulkLoading.value = action;

  try {
    const result = await adminFetch<{ count: number }>("/api/admin/reviews/bulk", {
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
    advantages: review.advantages ?? "",
    disadvantages: review.disadvantages ?? "",
    comment: review.comment ?? "",
    answered: review.isAnswered ? "yes" : "no",
    createdAt: review.createdAt
  }));

  downloadCsv("reviews-selected.csv", rows);
  toast.success(`Экспортировано отзывов: ${rows.length}`);
}
</script>
