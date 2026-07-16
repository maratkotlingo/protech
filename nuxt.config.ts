import { defineNuxtConfig } from "nuxt/config";
import vue from "@vitejs/plugin-vue";
import type { InputPluginOption } from "rollup";
import process from "process";

const publicAppUrl = process.env.NUXT_PUBLIC_APP_URL;
const siteUrl = publicAppUrl && !/localhost|127\.0\.0\.1/.test(publicAppUrl)
  ? publicAppUrl
  : undefined;

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  modules: [
    "@nuxt/eslint",
    "@nuxt/ui",
    "@pinia/nuxt",
    "pinia-plugin-persistedstate/nuxt",
    "@vueuse/nuxt",
    "vue-sonner/nuxt",
    "@nuxtjs/seo"
  ],
  css: ["./app/assets/css/main.css"],
  components: [
    { path: "~/shared/ui", pathPrefix: false },
    { path: "~/shared/ui/charts", pathPrefix: false },
    { path: "~/entities/product/ui", pathPrefix: false },
    { path: "~/entities/order/ui", pathPrefix: false },
    { path: "~/features/cart/ui", pathPrefix: false },
    { path: "~/features/checkout/ui", pathPrefix: false },
    { path: "~/features/admin-products/ui", pathPrefix: false },
    { path: "~/features/admin-feedback/ui", pathPrefix: false },
    { path: "~/widgets/admin/ui", pathPrefix: false },
    { path: "~/widgets/public/ui", pathPrefix: false }
  ],
  imports: {
    dirs: ["app/shared/lib"]
  },
  devtools: {
    enabled: true
  },
  colorMode: {
    preference: "light",
    fallback: "light",
    classSuffix: ""
  },
  pinia: {
    storesDirs: ["app/stores/**"]
  },
  vueSonner: {
    css: true
  },
  runtimeConfig: {
    yookassaShopId: process.env.YOOKASSA_SHOP_ID ?? process.env.YOKASSA_SHOP_ID,
    yookassaSecretKey: process.env.YOOKASSA_SECRET_KEY ?? process.env.YOKASSA_SECRET_KEY,
    yookassaApiUrl: process.env.YOOKASSA_API_URL,
    yookassaReturnUrl: process.env.YOOKASSA_RETURN_URL ?? process.env.YOKASSA_RETURN_URL,
    public: {
      appUrl: process.env.NUXT_PUBLIC_APP_URL
    }
  },
  site: {
    ...(siteUrl ? { url: siteUrl } : {}),
    name: "ПроТех76",
    description: "Интернет-магазин техники, аксессуаров и комплектующих ProTech",
    defaultLocale: "ru"
  },
  nitro: {
    compressPublicAssets: true,
    experimental: {
      websocket: true
    },
    rollupConfig: {
      plugins: [vue() as unknown as InputPluginOption],
    },
  },
  vite: {
    optimizeDeps: {
      include: [
        '@formkit/auto-animate/vue',
        '@lucide/vue',
        '@unhead/schema-org/vue',
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'zod',
      ]
    }
  }
})
