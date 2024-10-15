<script setup lang="ts">
  useHead({
    title: "Verch",
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
