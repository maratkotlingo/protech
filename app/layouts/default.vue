<template>
  <div class="shop-shell min-h-screen bg-(--shop-surface-muted) text-(--shop-text)">
    <PublicHeader />

    <main class="min-h-[calc(100dvh-9rem)]">
      <slot />
    </main>

    <PublicFooter />
  </div>
</template>

<script setup lang="ts">
import { useAuthStore } from "~~/app/stores/auth";
import { useCartStore } from "~~/app/stores/cart";
import { useFavoritesStore } from "~~/app/stores/favorites";
import { useMessageNotificationsStore } from "~~/app/stores/messageNotifications";

const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const messageNotifications = useMessageNotificationsStore();

onMounted(async () => {
  const user = await auth.fetchMe();

  if (user) {
    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites(),
      messageNotifications.initialize(user.id)
    ]);
  }
});

onBeforeUnmount(() => {
  messageNotifications.disconnect();
});

watch(
  () => auth.user?.id,
  async (userId) => {
    if (userId) {
      await Promise.all([
        cart.fetchCart(),
        favorites.fetchFavorites(),
        messageNotifications.initialize(userId)
      ]);
      return;
    }

    cart.items = [];
    favorites.clearLocal();
    messageNotifications.reset();
  }
);
</script>
