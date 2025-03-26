<template>
  <div
    class="flex flex-col rounded-lg border p-4 transition-all hover:shadow-md"
    :class="{
      'bg-background': !variant,
      'border-green-200 bg-green-50': variant === 'success',
      'border-yellow-200 bg-yellow-50': variant === 'warning',
      'border-red-200 bg-red-50': variant === 'danger',
      'border-blue-200 bg-blue-50': variant === 'info',
    }"
  >
    <div class="flex items-center justify-between">
      <span class="text-sm font-medium text-gray-500">{{ title }}</span>
      <Icon
        v-if="icon"
        :name="icon"
        class="h-4 w-4"
        :class="{
          'text-green-500': variant === 'success',
          'text-yellow-500': variant === 'warning',
          'text-red-500': variant === 'danger',
          'text-blue-500': variant === 'info',
          'text-gray-500': !variant,
        }"
      />
    </div>

    <div class="mt-2 flex items-baseline space-x-2">
      <span class="text-2xl font-semibold text-gray-900">{{ value }}</span>

      <span
        v-if="trend"
        class="flex items-center text-sm"
        :class="{
          'text-green-600': trend === 'up',
          'text-red-600': trend === 'down',
          'text-gray-500': trend === 'neutral',
        }"
      >
        <Icon
          :name="trend === 'up' ? 'lucide:trending-up' : 'lucide:trending-down'"
          class="h-4 w-4"
        />
        <span v-if="trendValue" class="ml-1">{{ trendValue }}</span>
      </span>
    </div>

    <div v-if="description" class="mt-1 text-xs text-gray-500">
      {{ description }}
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps({
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
      default: "",
    },
    variant: {
      type: String as PropType<"success" | "warning" | "danger" | "info">,
      default: "",
    },
    trend: {
      type: String as PropType<"up" | "down" | "neutral">,
      default: "",
    },
    trendValue: {
      type: String,
      default: "",
    },
    description: {
      type: String,
      default: "",
    },
  });
</script>
