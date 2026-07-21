<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <Toaster rich-colors close-button position="top-right" />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
useHead({
  title: "Административная панель",
  titleTemplate: (title) => title ? `${title} · ПроТех76` : "ПроТех76",
});
</script>