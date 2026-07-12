import { defineNuxtConfig } from "nuxt/config";
import process from "process";

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    '@nuxt/eslint'
  ],
  devtools: {
    enabled: true
  },
  runtimeConfig: {
    yookassaShopId: process.env.YOOKASSA_SHOP_ID || process.env.YOKASSA_SHOP_ID,
    yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY || process.env.YOKASSA_SECRET_KEY,
    yookassaApiUrl: process.env.YOOKASSA_API_URL || 'https://api.yookassa.ru',
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL || 'http://localhost:3000'
    }
  },
  nitro: {
    compressPublicAssets: true,
  }
})
