<script setup lang="ts">
  useHead({
    title: "Verch",
    link: [
      {
        rel: "icon",
        type: "image/webp",
        href: "/logo-verch.webp"
      }
    ]
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
