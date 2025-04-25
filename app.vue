<script setup lang="ts">
  import { useSidebar } from "~/composables/misc/useSidebar";

  const { isReady } = useAuthStore();

  // Global loading state
  const showLoader = ref(true);

  watchEffect(() => {
    if (isReady) {
      showLoader.value = false;
    }
  });

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
      { property: "og:image", content: "https://verch-vs.vercel.app/display2.png?v=1" },
      { property: "og:url", content: "https://verch-vs.vercel.app/" },
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
  <NuxtLoadingIndicator />
  <NuxtLayout>
    <div class="relative">
      <!-- Loader -->
      <div
        v-if="showLoader"
        class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/20 backdrop-blur"
      >
        <div class="text-center">
          <Icon name="lucide:loader-2" class="mx-auto h-8 w-8 animate-spin" />
          <p class="mt-2 text-lg font-semibold">Loading...</p>
        </div>
      </div>

      <!-- Page Content -->
      <div>
        <NuxtPage />
        <UiVueSonner />
        <UiToastToaster />
      </div>
    </div>
  </NuxtLayout>
</template>
