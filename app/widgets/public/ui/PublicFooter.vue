<template>
  <footer class="border-t border-[var(--shop-border)] bg-[var(--shop-surface)]">
    <div class="mx-auto grid w-full max-w-[1480px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto_auto] xl:px-8">
      <div class="max-w-xl">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-lg bg-[var(--shop-accent)] text-white">
            <Zap class="size-5" />
          </span>
          <div>
            <p class="font-semibold text-[var(--shop-text)]">ProTech</p>
            <p class="text-sm text-[var(--shop-text-muted)]">Интернет-магазин техники и комплектующих</p>
          </div>
        </div>
        <p class="mt-4 text-sm leading-6 text-[var(--shop-text-muted)]">
          Подбирайте товары, сохраняйте избранное, отслеживайте корзину и оформляйте доставку в одном аккуратном интерфейсе.
        </p>
      </div>

      <div class="space-y-3 text-sm">
        <p class="font-semibold text-[var(--shop-text)]">Покупателю</p>
        <NuxtLink
          class="block text-[var(--shop-text-muted)] transition hover:text-[var(--shop-accent)]"
          to="/"
        >
          Каталог
        </NuxtLink>
        <NuxtLink
          class="block text-[var(--shop-text-muted)] transition hover:text-[var(--shop-accent)]"
          to="/cart"
        >
          Корзина
        </NuxtLink>
        <NuxtLink
          class="block text-[var(--shop-text-muted)] transition hover:text-[var(--shop-accent)]"
          to="/orders"
        >
          Мои заказы
        </NuxtLink>
      </div>

      <div class="space-y-3 text-sm">
        <p class="font-semibold text-[var(--shop-text)]">Аккаунт</p>
        <NuxtLink
          class="block text-[var(--shop-text-muted)] transition hover:text-[var(--shop-accent)]"
          to="/auth"
        >
          Войти
        </NuxtLink>
        <NuxtLink
          class="block text-[var(--shop-text-muted)] transition hover:text-[var(--shop-accent)]"
          to="/favorites"
        >
          Избранное
        </NuxtLink>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">
import { Zap } from "@lucide/vue";
</script>
