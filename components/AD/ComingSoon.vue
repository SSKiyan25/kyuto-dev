<template>
  <div
    class="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12"
  >
    <div class="mx-auto max-w-md rounded-2xl bg-white p-6 shadow-xl sm:p-8 md:max-w-lg">
      <div class="mb-6 flex justify-center">
        <div class="relative">
          <div class="animate-ping-slow absolute -inset-1 opacity-50">
            <div class="rounded-full bg-gradient-to-r from-blue-400 to-purple-500 p-8"></div>
          </div>
          <div class="relative text-7xl sm:text-8xl">🚀</div>
        </div>
      </div>

      <h1 class="mb-4 text-center text-2xl font-bold tracking-tight text-gray-900 sm:text-4xl">
        Coming Soon!
      </h1>

      <p class="mb-6 text-center text-base text-gray-600 sm:text-lg">
        This feature will be available in future patches. Stay tuned for exciting updates!
      </p>

      <div class="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-center">
        <button
          @click="$router.back()"
          class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
          Go Back
        </button>

        <button
          @click="navigateToHome"
          class="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-5 py-3 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          <Icon name="lucide:home" class="mr-2 h-4 w-4" />
          Back to Home
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const navigateToHome = () => {
    navigateTo("/");
  };
</script>

<style scoped>
  .animate-ping-slow {
    animation: ping 3s cubic-bezier(0, 0, 0.2, 1) infinite;
  }

  @keyframes ping {
    0% {
      transform: scale(0.95);
      opacity: 0.5;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.25;
    }
    100% {
      transform: scale(0.95);
      opacity: 0.5;
    }
  }
</style>
