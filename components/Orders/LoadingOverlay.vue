<template>
  <Transition name="fade">
    <div
      v-if="isLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-4 rounded-lg bg-card p-6 shadow-lg">
        <Icon name="lucide:loader-circle" class="h-12 w-12 animate-spin text-primary" />
        <div class="text-center">
          <h3 class="text-lg font-medium">{{ title }}</h3>
          <p class="text-sm text-muted-foreground">{{ description }}</p>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script lang="ts" setup>
  defineProps<{
    isLoading: boolean;
    title?: string;
    description?: string;
  }>();
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
  }
</style>
