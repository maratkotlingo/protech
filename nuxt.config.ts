import { defineNuxtConfig } from "nuxt/config";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import type { InputPluginOption } from "rollup";
import process from "process";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/eslint'
  ],
  css: ["./app/assets/css/main.css"],
  devtools: {
    enabled: true
  },
  runtimeConfig: {
    yookassaShopId: process.env.YOKASSA_SHOP_ID,
    yookassaSecretKey: process.env.YOKASSA_SECRET_KEY,
    yookassaApiUrl: process.env.YOOKASSA_API_URL,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL
    }
  },
  nitro: {
    compressPublicAssets: true,
    rollupConfig: {
      plugins: [vue() as unknown as InputPluginOption],
    },
  },
  vite: {
    plugins: [tailwindcss()],
  }
})
