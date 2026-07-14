<template>
  <footer class="bg-white/80 shadow-[0_-18px_60px_rgba(24,24,27,0.04)] dark:bg-zinc-950/80">
    <div class="mx-auto grid w-full max-w-370 gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_auto_auto] lg:px-8">
      <div class="max-w-xl">
        <div class="flex items-center gap-3">
          <span class="grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white">
            <Zap class="size-5" />
          </span>
          <div>
            <p class="font-semibold text-zinc-950 dark:text-white">ProTech</p>
            <p class="text-sm text-zinc-500 dark:text-zinc-400">Интернет-магазин техники и комплектующих</p>
          </div>
        </div>
        <p class="mt-4 text-sm leading-6 text-zinc-500 dark:text-zinc-400">
          Подбирайте товары, сохраняйте избранное, отслеживайте корзину и оформляйте доставку в одном аккуратном интерфейсе.
        </p>
      </div>

      <div class="space-y-3 text-sm">
        <p class="font-semibold text-zinc-950 dark:text-white">Покупателю</p>
        <NuxtLink
          class="block text-zinc-500 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
          to="/"
        >
          Каталог
        </NuxtLink>
        <NuxtLink
          class="block text-zinc-500 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
          to="/cart"
        >
          Корзина
        </NuxtLink>
        <NuxtLink
          class="block text-zinc-500 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
          to="/orders"
        >
          Мои заказы
        </NuxtLink>
      </div>

      <div class="space-y-3 text-sm">
        <p class="font-semibold text-zinc-950 dark:text-white">Аккаунт</p>
        <NuxtLink
          class="block text-zinc-500 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
          to="/auth"
        >
          Войти
        </NuxtLink>
        <NuxtLink
          class="block text-zinc-500 transition hover:text-emerald-700 dark:text-zinc-400 dark:hover:text-emerald-300"
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
