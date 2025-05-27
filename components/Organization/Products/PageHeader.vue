<script setup lang="ts">
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  defineProps<{
    crumbs: Crumbs[];
    search: string;
  }>();

  defineEmits<{
    (e: "update:search", value: string): void;
  }>();
</script>

<template>
  <div class="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
    <div class="overflow-x-auto pb-2 sm:pb-0">
      <UiBreadcrumbs class="justify-center" :items="crumbs" />
    </div>
    <div class="flex w-full items-center gap-2 sm:w-auto">
      <UiInput
        type="search"
        :value="search"
        @input="$emit('update:search', ($event.target as HTMLInputElement).value)"
        placeholder="Search Product"
        class="w-full"
      />
      <!-- Slot for additional actions like refresh button -->
      <slot></slot>
    </div>
  </div>
</template>
