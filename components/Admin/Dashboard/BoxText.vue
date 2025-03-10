<template>
  <div class="flex flex-row items-center space-x-2 space-y-4">
    <Icon :name="icon" class="mt-3 h-6 w-6" />
    <span class="">{{ title }}:</span>
    <span class="font-medium">{{ value }}</span>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    title: string;
    icon: string;
    value: string;
  }>();
</script>
