<script setup lang="ts">
  defineProps<{
    loading: boolean;
    message: string;
  }>();
</script>

<template>
  <div
    v-if="loading"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-slate-900/40 backdrop-blur-sm"
  >
    <div
      class="flex max-w-md flex-col items-center justify-center gap-4 rounded-lg bg-white p-6 shadow-lg"
    >
      <div class="flex flex-col items-center">
        <Icon
          name="lucide:loader-circle"
          class="h-12 w-12 animate-spin text-green-600 sm:h-16 sm:w-16"
        />
        <div class="mt-4 text-center">
          <h3 class="text-base font-medium text-slate-800">Adding Your Product</h3>
          <p class="mt-1 text-sm text-slate-600">{{ message }}</p>
        </div>
      </div>
      <UiProgress class="mt-2 w-full bg-slate-100">
        <UiProgressIndicator class="animate-progress-indeterminate bg-green-600" />
      </UiProgress>
    </div>
  </div>
</template>

<style scoped>
  .animate-progress-indeterminate {
    animation: indeterminate 2s cubic-bezier(0.65, 0.815, 0.735, 0.395) infinite;
  }

  @keyframes indeterminate {
    0% {
      width: 0%;
      left: 0;
    }
    50% {
      width: 75%;
      left: 25%;
    }
    75% {
      width: 95%;
      left: 0;
    }
    100% {
      width: 100%;
      left: 100%;
    }
  }
</style>
