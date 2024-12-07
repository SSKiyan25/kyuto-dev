<script setup lang="ts">
  import { useSidebar } from "~/composables/misc/useSidebar";

  useHead({
    title: "Verch | The Central Store for Organization Merchandises",
    link: [
      {
        rel: "icon",
        type: "image/webp",
        href: "/logo-verch.webp",
      },
    ],
    meta: [
      { property: "og:title", content: "Verch | The Central Store for Organization Merchandises" },
      { property: "og:description", content: "Discover the best merchandises on Verch." },
      { property: "og:image", content: "https://verch-ten.vercel.app/display2.png?v=2" },
      { property: "og:url", content: "https://verch-ten.vercel.app/" },
      { property: "og:type", content: "website" },

      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Verch | Official Website for Merchandises" },
      { name: "twitter:description", content: "Discover the best merchandises on Verch." },
      { name: "twitter:image", content: "https://verch-vs.vercel.app/display.png" },
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
