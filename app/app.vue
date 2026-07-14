<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <ClientOnly>
      <Toaster
        rich-colors
        close-button
        position="top-right"
      />
    </ClientOnly>
  </UApp>
</template>

<script setup lang="ts">
useHead({
  title: "ProTech",
  titleTemplate: (title) => title ? `${title} · ProTech` : "ProTech"
});
</script>
