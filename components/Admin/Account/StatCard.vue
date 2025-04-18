<!-- components/UiStatCard.vue -->
<template>
  <div class="flex flex-col gap-2 rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-medium text-muted-foreground">
        {{ title }}
      </h3>
      <Icon :name="icon" class="h-4 w-4 text-muted-foreground" aria-hidden="true" />
    </div>

    <div class="flex items-baseline gap-2">
      <p class="text-2xl font-bold">
        {{ value }}
      </p>
      <div v-if="percentage" class="flex items-center gap-1 text-sm" :class="trendColor">
        <Icon :name="trendIcon" class="h-3 w-3" aria-hidden="true" />
        <span>{{ percentage }}%</span>
      </div>
    </div>

    <p v-if="description" class="text-sm text-muted-foreground">
      {{ description }}
    </p>
  </div>
</template>

<script lang="ts" setup>
  import type { Icon } from "#build/components";

  const props = defineProps({
    title: {
      type: String,
      required: true,
    },
    value: {
      type: [String, Number],
      required: true,
    },
    icon: {
      type: String,
      default: "heroicons:chart-bar",
    },
    trend: {
      type: String as () => "positive" | "negative" | "stable",
      default: "stable",
    },
    percentage: {
      type: Number,
      default: null,
    },
    description: {
      type: String,
      default: "",
    },
  });

  const trendConfig = {
    positive: { icon: "heroicons:arrow-trending-up", color: "text-green-600" },
    negative: { icon: "heroicons:arrow-trending-down", color: "text-red-600" },
    stable: { icon: "heroicons:minus-small", color: "text-gray-500" },
  };

  const trendIcon = computed(() => trendConfig[props.trend].icon);
  const trendColor = computed(() => trendConfig[props.trend].color);
</script>

<style scoped>
  /* Add custom transitions if needed */
</style>
