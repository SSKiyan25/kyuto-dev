<template>
  <div class="container mx-auto px-4 py-6 md:py-10">
    <div class="mx-auto max-w-3xl">
      <!-- Back button -->
      <NuxtLink
        to="/"
        class="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <Icon name="lucide:arrow-left" class="h-4 w-4" />
        Back to Home
      </NuxtLink>

      <!-- Title -->
      <h1 v-if="title" class="mb-8 text-2xl font-bold md:text-3xl">{{ title }}</h1>

      <!-- Content -->
      <div class="prose-sm prose dark:prose-invert md:prose-base max-w-none">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup>
  defineProps({
    title: {
      type: String,
      default: "",
    },
  });
</script>

<style scoped>
  :deep(h2) {
    @apply text-xl font-semibold md:text-2xl;
    @apply mb-3;
  }

  :deep(a) {
    @apply text-primary hover:underline;
  }

  :deep(ul) {
    @apply space-y-2 pl-5;
  }

  :deep(li) {
    @apply text-sm md:text-base;
  }
</style>
