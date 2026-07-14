<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-[var(--shop-text)]">Отзывы</h2>
        <p class="mt-1 text-sm text-[var(--shop-text-muted)]">
          {{ reviews.length ? `${reviews.length} отзывов покупателей` : "Пока отзывов нет" }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        @click="toggleReviewForm"
      >
        <MessageSquarePlus class="size-4" />
        Оставить отзыв
      </UButton>
    </div>

    <UCard
      v-if="reviewFormOpen"
      class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
      :ui="{ body: 'p-5 sm:p-6' }"
    >
      <form
        class="space-y-5"
        @submit.prevent="submitReview"
      >
        <div>
          <p class="mb-2 text-sm font-medium text-[var(--shop-text)]">Оценка</p>
          <div class="flex gap-1">
            <button
              v-for="rating in 5"
              :key="rating"
              type="button"
              class="rounded-lg p-1 text-amber-500 transition hover:bg-amber-100 dark:hover:bg-amber-950"
              :aria-label="`Поставить ${rating}`"
              @click="form.rating = rating"
            >
              <Star
                class="size-7"
                :class="rating <= form.rating ? 'fill-current' : ''"
              />
            </button>
          </div>
        </div>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Плюсы">
            <UTextarea
              v-model="form.advantages"
              class="w-full"
              :rows="3"
              placeholder="Что понравилось"
            />
          </UFormField>
          <UFormField label="Минусы">
            <UTextarea
              v-model="form.disadvantages"
              class="w-full"
              :rows="3"
              placeholder="Что можно улучшить"
            />
          </UFormField>
        </div>

        <UFormField label="Комментарий">
          <UTextarea
            v-model="form.comment"
            class="w-full"
            :rows="4"
            placeholder="Поделитесь опытом использования"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            color="primary"
            type="submit"
            :loading="submitting"
          >
            <Send class="size-4" />
            Отправить
          </UButton>
        </div>
      </form>
    </UCard>

    <div
      v-auto-animate
      class="grid gap-4"
    >
      <UCard
        v-for="review in reviews"
        :key="review.id"
        class="border border-[var(--shop-border)] bg-[var(--shop-surface)]"
        :ui="{ body: 'p-5 sm:p-6' }"
      >
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div class="flex items-center gap-3">
            <img
              v-if="review.user?.image"
              :src="review.user.image"
              :alt="review.user.name ?? 'Покупатель'"
              class="size-11 rounded-full object-cover"
            >
            <div
              v-else
              class="grid size-11 place-items-center rounded-full bg-[var(--shop-accent-soft)] font-semibold text-[var(--shop-accent)]"
            >
              {{ (review.user?.name ?? "П").slice(0, 1).toUpperCase() }}
            </div>
            <div>
              <p class="font-semibold text-[var(--shop-text)]">
                {{ review.user?.name || "Покупатель" }}
              </p>
              <p class="text-sm text-[var(--shop-text-muted)]">
                {{ formatDate(review.createdAt) }}
              </p>
            </div>
          </div>
          <div class="flex text-amber-500">
            <Star
              v-for="rating in 5"
              :key="rating"
              class="size-4"
              :class="rating <= review.rating ? 'fill-current' : ''"
            />
          </div>
        </div>

        <div class="mt-5 grid gap-4 text-sm leading-6 text-[var(--shop-text-muted)] md:grid-cols-3">
          <div v-if="review.advantages">
            <p class="font-medium text-[var(--shop-text)]">Плюсы</p>
            <p class="mt-1">{{ review.advantages }}</p>
          </div>
          <div v-if="review.disadvantages">
            <p class="font-medium text-[var(--shop-text)]">Минусы</p>
            <p class="mt-1">{{ review.disadvantages }}</p>
          </div>
          <div v-if="review.comment">
            <p class="font-medium text-[var(--shop-text)]">Комментарий</p>
            <p class="mt-1">{{ review.comment }}</p>
          </div>
        </div>

        <div
          v-if="review.reviewAnswers.length"
          class="mt-5 rounded-lg bg-[var(--shop-surface-muted)] p-4"
        >
          <p class="text-sm font-semibold text-[var(--shop-text)]">Ответ магазина</p>
          <p class="mt-2 text-sm leading-6 text-[var(--shop-text-muted)]">
            {{ review.reviewAnswers[0]?.text }}
          </p>
        </div>
      </UCard>

      <div
        v-if="!reviews.length"
        class="grid min-h-40 place-items-center rounded-lg border border-dashed border-[var(--shop-border)] bg-[var(--shop-surface)] px-6 text-center text-[var(--shop-text-muted)]"
      >
        Будьте первым, кто оставит отзыв на этот товар.
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { MessageSquarePlus, Send, Star } from "@lucide/vue";
import { toast } from "vue-sonner";
import { formatDate, getErrorMessage } from "~~/app/shared/lib/shopFormatters";
import { shopFetch } from "~~/app/shared/lib/shopFetch";
import type { ReviewItem } from "~~/app/shared/types/shop";
import { useAuthStore } from "~~/app/stores/auth";

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
const form = reactive({
  rating: 5,
  advantages: "",
  disadvantages: "",
  comment: ""
});

async function submitReview() {
  if (!auth.user) {
    toast.info("Войдите, чтобы оставить отзыв");
    await navigateTo({ path: "/auth", query: { redirect: route.fullPath } });
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
