<template>
  <section class="space-y-6">
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 class="text-2xl font-semibold text-zinc-950 dark:text-white">Отзывы</h2>
        <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {{ reviews.length ? `${reviews.length} отзывов покупателей` : "Пока отзывов нет" }}
        </p>
      </div>
      <UButton
        color="primary"
        variant="soft"
        class="rounded-full"
        @click="toggleReviewForm"
      >
        <MessageSquarePlus class="size-4" />
        Оставить отзыв
      </UButton>
    </div>

    <UCard
      v-if="reviewFormOpen"
      class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
      :ui="{ body: 'p-5 sm:p-6' }"
    >
      <form
        class="space-y-5"
        @submit.prevent="submitReview"
      >
        <div>
          <p class="mb-2 text-sm font-medium text-zinc-950 dark:text-white">Оценка</p>
          <div class="flex gap-1">
            <button
              v-for="rating in 5"
              :key="rating"
              type="button"
              class="rounded-full p-1 text-amber-500 transition hover:bg-amber-100 dark:hover:bg-amber-950"
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
              class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
              :rows="3"
              variant="none"
              placeholder="Что понравилось"
              :ui="reviewTextareaUi"
            />
          </UFormField>
          <UFormField label="Минусы">
            <UTextarea
              v-model="form.disadvantages"
              class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
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
            class="w-full rounded-2xl bg-[#f9fafb] dark:bg-zinc-800"
            :rows="4"
            variant="none"
            placeholder="Поделитесь опытом использования"
            :ui="reviewTextareaUi"
          />
        </UFormField>

        <div class="flex justify-end">
          <UButton
            color="primary"
            class="rounded-full"
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
        class="rounded-[2rem] bg-white ring-0 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:shadow-black/20"
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
              class="grid size-11 place-items-center rounded-full bg-emerald-100 font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
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
          <div class="flex text-amber-500">
            <Star
              v-for="rating in 5"
              :key="rating"
              class="size-4"
              :class="rating <= review.rating ? 'fill-current' : ''"
            />
          </div>
        </div>

        <div class="mt-5 grid gap-4 text-sm leading-6 text-zinc-500 md:grid-cols-3 dark:text-zinc-400">
          <div v-if="review.advantages">
            <p class="font-medium text-zinc-950 dark:text-white">Плюсы</p>
            <p class="mt-1">{{ review.advantages }}</p>
          </div>
          <div v-if="review.disadvantages">
            <p class="font-medium text-zinc-950 dark:text-white">Минусы</p>
            <p class="mt-1">{{ review.disadvantages }}</p>
          </div>
          <div v-if="review.comment">
            <p class="font-medium text-zinc-950 dark:text-white">Комментарий</p>
            <p class="mt-1">{{ review.comment }}</p>
          </div>
        </div>

        <div
          v-if="review.reviewAnswers.length"
          class="mt-5 rounded-3xl bg-[#f9fafb] p-4 dark:bg-zinc-800/60"
        >
          <p class="text-sm font-semibold text-zinc-950 dark:text-white">Ответ магазина</p>
          <p class="mt-2 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
            {{ review.reviewAnswers[0]?.text }}
          </p>
        </div>
      </UCard>

      <div
        v-if="!reviews.length"
        class="grid min-h-40 place-items-center rounded-[2rem] bg-white px-6 text-center text-zinc-500 shadow-sm shadow-zinc-950/5 dark:bg-zinc-900 dark:text-zinc-400 dark:shadow-black/20"
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
const reviewTextareaUi = { base: "rounded-2xl bg-transparent" };

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
