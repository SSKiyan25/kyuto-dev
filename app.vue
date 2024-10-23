<script setup lang="ts">
  useHead({
    title: "Verch | Official Website for Merchandises",
    link: [
      {
        rel: "icon",
        type: "image/webp",
        href: "/logo-verch.webp",
      },
    ],
  });
</script>

<template>
  <div>
    <NuxtLoadingIndicator />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
    <UiVueSonner />
    <UiToastToaster />
  </div>
</template>
