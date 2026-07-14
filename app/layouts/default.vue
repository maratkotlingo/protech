<template>
  <div class="min-h-screen bg-[var(--shop-surface-muted)] text-[var(--shop-text)]">
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
import { useShopUiStore } from "~~/app/stores/shopUi";

const auth = useAuthStore();
const cart = useCartStore();
const favorites = useFavoritesStore();
const ui = useShopUiStore();

onMounted(async () => {
  ui.hydrateColorMode();

  const user = await auth.fetchMe();

  if (user) {
    await Promise.all([
      cart.fetchCart(),
      favorites.fetchFavorites()
    ]);
  }
});

watch(
  () => auth.user?.id,
  async (userId) => {
    if (userId) {
      await Promise.all([
        cart.fetchCart(),
        favorites.fetchFavorites()
      ]);
      return;
    }

    cart.items = [];
    favorites.clearLocal();
  }
);
</script>
