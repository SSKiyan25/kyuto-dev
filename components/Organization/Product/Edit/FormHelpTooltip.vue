<script setup lang="ts">
  defineProps({
    text: {
      type: String,
      required: true,
    },
  });
</script>

<template>
  <UiTooltip>
    <UiTooltipTrigger disabled>
      <Icon name="lucide:help-circle" class="h-4 w-4 cursor-help text-muted-foreground" />
    </UiTooltipTrigger>
    <UiTooltipContent>
      <p class="max-w-xs text-xs">{{ text }}</p>
    </UiTooltipContent>
  </UiTooltip>
</template>
