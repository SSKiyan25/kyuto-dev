<script setup lang="ts">
  const props = defineProps<{
    icon: string;
    title: string;
  }>();
</script>
<template>
  <div
    class="flex h-20 w-[5rem] cursor-pointer flex-col items-center justify-center rounded-sm border bg-white hover:border-2 hover:shadow-lg md:h-40 md:w-[9.9rem]"
  >
    <div class="h-20 w-20 overflow-hidden md:h-40 md:w-40">
      <img
        :src="props.icon"
        alt="icon"
        class="h-full w-full object-cover transition-transform duration-300 ease-in-out hover:scale-110"
      />
    </div>
    <p class="hidden p-2 text-sm md:block">{{ props.title }}</p>
  </div>
</template>
