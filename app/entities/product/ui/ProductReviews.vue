<template>
  <section class="space-y-8">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <ProductSectionHeading
        eyebrow="Отзывы"
        title="Опыт покупателей"
        :description="reviewSummaryText"
      />

      <UButton
        color="primary"
        variant="soft"
        icon="i-lucide-message-square-plus"
        size="lg"
        class="rounded-full transition duration-300 hover:scale-[1.02]"
        @click="toggleReviewForm"
      >
        Оставить отзыв
      </UButton>
    </div>

    <div class="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <aside class="rounded-[2rem] bg-[#f9fafb] p-6 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/70 dark:shadow-black/20">
        <div class="flex items-end justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-zinc-400">Средняя оценка</p>
            <p class="mt-2 text-6xl font-semibold tracking-normal text-zinc-950 dark:text-white">
              {{ averageRatingLabel }}
            </p>
          </div>
          <p class="pb-2 text-sm font-medium text-zinc-400">/ 5</p>
        </div>

        <div class="mt-5 flex gap-1 text-amber-400">
          <UIcon
            v-for="rating in 5"
            :key="rating"
            name="i-lucide-star"
            class="size-5"
            :class="rating <= roundedAverage ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'"
          />
        </div>

        <div
          v-auto-animate
          class="mt-8 space-y-3"
        >
          <div
            v-for="item in ratingBreakdown"
            :key="item.rating"
            class="grid grid-cols-[2rem_minmax(0,1fr)_2.5rem] items-center gap-3 text-sm"
          >
            <span class="font-medium text-zinc-500 dark:text-zinc-400">{{ item.rating }}</span>
            <div class="h-2 overflow-hidden rounded-full bg-white shadow-inner shadow-zinc-950/5 dark:bg-zinc-950/70">
              <div
                class="h-full rounded-full bg-amber-400 transition-all duration-500"
                :style="{ width: `${item.percent}%` }"
              />
            </div>
            <span class="text-right text-zinc-400">{{ item.count }}</span>
          </div>
        </div>
      </aside>

      <div class="space-y-5">
        <div class="rounded-[2rem] bg-[#f9fafb] p-3 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/70 dark:shadow-black/20">
          <div class="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div
              v-auto-animate
              class="flex flex-wrap gap-2"
            >
              <button
                v-for="filter in ratingFilters"
                :key="filter.key"
                type="button"
                class="rounded-full px-4 py-2 text-sm font-medium transition duration-300 hover:scale-[1.03]"
                :class="ratingFilter === filter.value ? 'bg-zinc-950 text-white shadow-lg shadow-zinc-950/20 dark:bg-white dark:text-zinc-950' : 'bg-white text-zinc-500 shadow-sm shadow-zinc-950/5 hover:text-zinc-950 dark:bg-zinc-950/70 dark:text-zinc-300 dark:hover:text-white'"
                @click="selectRatingFilter(filter.value)"
              >
                {{ filter.label }}
              </button>
            </div>

            <USelect
              v-model="reviewSort"
              :items="reviewSortOptions"
              value-key="value"
              label-key="label"
              color="neutral"
              variant="none"
              icon="i-lucide-arrow-up-down"
              class="w-full rounded-full bg-white shadow-sm shadow-zinc-950/5 xl:w-56 dark:bg-zinc-950/70"
              :ui="reviewSelectUi"
              aria-label="Сортировка отзывов"
            />
          </div>
        </div>

        <div v-auto-animate>
          <div
            v-if="reviewFormOpen"
            class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 sm:p-6 dark:bg-zinc-900/70 dark:shadow-black/20"
          >
            <form
              class="space-y-5"
              @submit.prevent="submitReview"
            >
              <div>
                <p class="mb-2 text-sm font-semibold text-zinc-950 dark:text-white">Оценка</p>
                <div class="flex gap-1">
                  <button
                    v-for="rating in 5"
                    :key="rating"
                    type="button"
                    class="rounded-full p-1 text-amber-400 transition duration-300 hover:scale-110 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                    :aria-label="`Поставить ${rating}`"
                    @click="form.rating = rating"
                  >
                    <UIcon
                      name="i-lucide-star"
                      class="size-8"
                      :class="rating <= form.rating ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'"
                    />
                  </button>
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2">
                <UFormField label="Плюсы">
                  <UTextarea
                    v-model="form.advantages"
                    class="w-full rounded-3xl bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70"
                    :rows="3"
                    variant="none"
                    placeholder="Что понравилось"
                    :ui="reviewTextareaUi"
                  />
                </UFormField>

                <UFormField label="Минусы">
                  <UTextarea
                    v-model="form.disadvantages"
                    class="w-full rounded-3xl bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70"
                    :rows="3"
                    variant="none"
                    placeholder="Что можно улучшить"
                    :ui="reviewTextareaUi"
                  />
                </UFormField>
              </div>

              <UFormField label="Комментарий">
                <UTextarea
                  v-model="form.comment"
                  class="w-full rounded-3xl bg-white shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70"
                  :rows="4"
                  variant="none"
                  placeholder="Поделитесь опытом использования"
                  :ui="reviewTextareaUi"
                />
              </UFormField>

              <div class="flex justify-end">
                <UButton
                  color="primary"
                  icon="i-lucide-send"
                  class="rounded-full transition duration-300 hover:scale-[1.02]"
                  type="submit"
                  :loading="submitting"
                >
                  Отправить
                </UButton>
              </div>
            </form>
          </div>
        </div>

        <div
          v-auto-animate
          class="grid gap-4"
        >
          <article
            v-for="review in visibleReviews"
            :key="review.id"
            class="rounded-[2rem] bg-[#f9fafb] p-5 shadow-sm shadow-zinc-950/5 transition duration-300 hover:-translate-y-0.5 hover:bg-white hover:shadow-xl hover:shadow-zinc-950/10 sm:p-6 dark:bg-zinc-900/70 dark:shadow-black/20 dark:hover:bg-zinc-900"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div class="flex items-center gap-3">
                <img
                  v-if="review.user?.image"
                  :src="review.user.image"
                  :alt="review.user.name ?? 'Покупатель'"
                  class="size-12 rounded-full object-cover shadow-sm shadow-zinc-950/10"
                >
                <div
                  v-else
                  class="grid size-12 place-items-center rounded-full bg-white font-semibold text-emerald-700 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70 dark:text-emerald-300"
                >
                  {{ (review.user?.name ?? "П").slice(0, 1).toUpperCase() }}
                </div>
                <div>
                  <p class="font-semibold text-zinc-950 dark:text-white">
                    {{ review.user?.name || "Покупатель" }}
                  </p>
                  <p class="text-sm text-zinc-500 dark:text-zinc-400">
                    {{ formatDate(review.createdAt) }}
                  </p>
                </div>
              </div>

              <div class="flex rounded-full bg-white px-3 py-2 text-amber-400 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70">
                <UIcon
                  v-for="rating in 5"
                  :key="rating"
                  name="i-lucide-star"
                  class="size-4"
                  :class="rating <= review.rating ? 'fill-amber-400' : 'text-zinc-300 dark:text-zinc-700'"
                />
              </div>
            </div>

            <div class="mt-6 grid gap-4 text-sm leading-7 text-zinc-600 md:grid-cols-3 dark:text-zinc-300">
              <div v-if="review.advantages">
                <p class="font-semibold text-zinc-950 dark:text-white">Плюсы</p>
                <p class="mt-1">{{ review.advantages }}</p>
              </div>
              <div v-if="review.disadvantages">
                <p class="font-semibold text-zinc-950 dark:text-white">Минусы</p>
                <p class="mt-1">{{ review.disadvantages }}</p>
              </div>
              <div v-if="review.comment">
                <p class="font-semibold text-zinc-950 dark:text-white">Комментарий</p>
                <p class="mt-1">{{ review.comment }}</p>
              </div>
            </div>

            <div
              v-if="review.reviewPhotos.length"
              class="mt-5 flex gap-3 overflow-x-auto pb-1"
            >
              <img
                v-for="photo in review.reviewPhotos"
                :key="photo.id"
                :src="photo.url"
                :alt="`Фото отзыва ${review.id}`"
                class="size-20 rounded-2xl object-cover shadow-sm shadow-zinc-950/10"
                loading="lazy"
              >
            </div>

            <div
              v-if="review.reviewAnswers.length"
              class="mt-5 rounded-3xl bg-white p-4 shadow-sm shadow-zinc-950/5 dark:bg-zinc-950/70"
            >
              <p class="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-white">
                <UIcon
                  name="i-lucide-store"
                  class="size-4 text-emerald-600 dark:text-emerald-300"
                />
                Ответ магазина
              </p>
              <p class="mt-2 text-sm leading-7 text-zinc-600 dark:text-zinc-300">
                {{ review.reviewAnswers[0]?.text }}
              </p>
            </div>
          </article>

          <div
            v-if="!filteredReviews.length"
            class="grid min-h-44 place-items-center rounded-[2rem] bg-[#f9fafb] px-6 text-center text-zinc-500 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900/70 dark:text-zinc-400 dark:shadow-black/20"
          >
            Отзывов с такой оценкой пока нет.
          </div>

          <div
            v-else-if="hasMoreReviews"
            class="flex justify-center pt-2"
          >
            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-plus"
              size="lg"
              class="rounded-full bg-[#f9fafb] transition duration-300 hover:scale-[1.02] dark:bg-zinc-900/70"
              @click="loadMoreReviews"
            >
              Показать еще {{ remainingReviewsCount }}
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { toast } from "vue-sonner";
import { formatDate, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ReviewItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

type ReviewSort = "newest" | "highest" | "lowest";
type RatingFilter = "all" | 1 | 2 | 3 | 4 | 5;

const props = defineProps<{
  productId: number;
  reviews: ReviewItem[];
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const route = useRoute();
const auth = useAuthStore();
const reviewFormOpen = ref(false);
const submitting = ref(false);
const reviewSort = ref<ReviewSort>("newest");
const ratingFilter = ref<RatingFilter>("all");
const visibleCount = ref(3);
const form = reactive({
  rating: 5,
  advantages: "",
  disadvantages: "",
  comment: ""
});
const reviewSortOptions: Array<{ label: string; value: ReviewSort }> = [
  { label: "Сначала новые", value: "newest" },
  { label: "Сначала высокие", value: "highest" },
  { label: "Сначала низкие", value: "lowest" }
];
const reviewSelectUi = {
  base: "h-11 rounded-full bg-transparent font-medium text-zinc-700 dark:text-zinc-200",
  content: "rounded-2xl bg-white shadow-xl shadow-zinc-950/10 ring-0 dark:bg-zinc-900",
  item: "rounded-xl",
  viewport: "p-1"
};
const reviewTextareaUi = { base: "rounded-3xl bg-transparent" };
const reviewSummaryText = computed(() => props.reviews.length ? `${props.reviews.length} отзывов о товаре` : "Пока отзывов нет");
const averageRating = computed(() => {
  if (!props.reviews.length) {
    return 0;
  }

  return props.reviews.reduce((sum, review) => sum + review.rating, 0) / props.reviews.length;
});
const averageRatingLabel = computed(() => props.reviews.length ? averageRating.value.toFixed(1) : "—");
const roundedAverage = computed(() => Math.round(averageRating.value));
const ratingBreakdown = computed(() => [5, 4, 3, 2, 1].map((rating) => {
  const count = props.reviews.filter((review) => review.rating === rating).length;

  return {
    count,
    percent: props.reviews.length ? Math.round((count / props.reviews.length) * 100) : 0,
    rating
  };
}));
const ratingFilters = computed(() => [
  { count: props.reviews.length, key: "all", label: "Все", value: "all" as const },
  ...ratingBreakdown.value.map((item) => ({
    count: item.count,
    key: String(item.rating),
    label: `${item.rating} ★`,
    value: item.rating as RatingFilter
  }))
]);
const filteredReviews = computed(() => {
  const reviews = ratingFilter.value === "all"
    ? [...props.reviews]
    : props.reviews.filter((review) => review.rating === ratingFilter.value);

  return reviews.sort((first, second) => {
    if (reviewSort.value === "highest") {
      return second.rating - first.rating || newestFirst(first, second);
    }

    if (reviewSort.value === "lowest") {
      return first.rating - second.rating || newestFirst(first, second);
    }

    return newestFirst(first, second);
  });
});
const visibleReviews = computed(() => filteredReviews.value.slice(0, visibleCount.value));
const hasMoreReviews = computed(() => filteredReviews.value.length > visibleReviews.value.length);
const remainingReviewsCount = computed(() => filteredReviews.value.length - visibleReviews.value.length);

watch(() => props.reviews.length, () => {
  visibleCount.value = 3;
});

function newestFirst(first: ReviewItem, second: ReviewItem) {
  return new Date(second.createdAt).getTime() - new Date(first.createdAt).getTime();
}

function selectRatingFilter(value: RatingFilter) {
  ratingFilter.value = value;
  visibleCount.value = 3;
}

function loadMoreReviews() {
  visibleCount.value += 3;
}

async function requireAuth() {
  if (auth.user || await auth.fetchMe()) {
    return true;
  }

  toast.info("Войдите, чтобы оставить отзыв");
  await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
  return false;
}

async function submitReview() {
  if (!await requireAuth()) {
    return;
  }

  submitting.value = true;

  try {
    await shopFetch(`/api/public/product/review/add/${props.productId}`, {
      method: "POST",
      body: {
        rating: form.rating,
        advantages: form.advantages.trim() || undefined,
        disadvantages: form.disadvantages.trim() || undefined,
        comment: form.comment.trim() || undefined
      }
    });

    form.rating = 5;
    form.advantages = "";
    form.disadvantages = "";
    form.comment = "";
    reviewFormOpen.value = false;
    toast.success("Отзыв опубликован");
    emit("refresh");
  } catch (error) {
    toast.error(getErrorMessage(error, "Не удалось отправить отзыв"));
  } finally {
    submitting.value = false;
  }
}

function toggleReviewForm() {
  reviewFormOpen.value = !reviewFormOpen.value;
}
</script>
