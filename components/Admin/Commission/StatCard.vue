<template>
  <UiCard>
    <UiCardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
      <UiCardTitle class="text-sm font-medium">
        {{ title }}
      </UiCardTitle>
      <Icon :name="icon" class="h-4 w-4 text-muted-foreground" />
    </UiCardHeader>
    <UiCardContent>
      <div class="text-2xl font-bold">
        <template v-if="typeof value === 'number'"> ₱{{ value.toLocaleString() }} </template>
        <template v-else>
          {{ value }}
        </template>
      </div>
    </UiCardContent>
  </UiCard>
</template>

<script lang="ts" setup>
  defineProps<{
    title: string;
    value: string | number;
    icon: string;
    variant?: "success" | "warning" | "neutral";
  }>();
</script>
