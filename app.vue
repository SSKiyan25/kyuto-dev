<script setup lang="ts">
  import { useSidebar } from "~/composables/misc/useSidebar";

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

  useSidebar();
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
