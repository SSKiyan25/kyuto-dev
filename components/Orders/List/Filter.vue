<template>
  <div class="mb-4 w-full">
    <!-- Mobile dropdown (visible only on small screens) -->
    <div class="block sm:hidden">
      <div class="flex items-center justify-between">
        <span class="text-sm text-muted-foreground">Filter by status:</span>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton variant="outline" size="sm" class="w-[140px] justify-between">
              <span class="capitalize">{{ getSelectedStatusLabel() }}</span>
              <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent align="end" class="w-[180px]">
            <UiDropdownMenuLabel>Order Status</UiDropdownMenuLabel>
            <UiDropdownMenuSeparator />
            <UiDropdownMenuItem
              v-for="status in statuses"
              :key="status.value"
              @click="selectStatus(status.value)"
              :class="{ 'bg-accent text-accent-foreground': modelValue === status.value }"
            >
              <Icon v-if="modelValue === status.value" name="lucide:check" class="mr-2 h-4 w-4" />
              <span v-else class="ml-6">{{ status.status }}</span>
            </UiDropdownMenuItem>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
    </div>

    <!-- Desktop horizontal buttons (visible only on larger screens) -->
    <div class="relative hidden sm:block">
      <div class="hide-scrollbar flex overflow-x-auto pb-2">
        <div class="flex space-x-2">
          <template v-for="(status, i) in statuses" :key="i">
            <UiButton
              :variant="getStatusVariant(status.value)"
              @click="selectStatus(status.value)"
              class="flex-shrink-0 whitespace-nowrap text-sm"
            >
              <span>{{ status.status }}</span>
              <Icon v-if="modelValue === status.value" name="lucide:check" class="ml-1 h-3 w-3" />
            </UiButton>
          </template>
        </div>
      </div>
      <!-- Scroll indicators (for wide desktop) -->
      <div
        class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent"
      ></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ButtonVariant } from "~/types/Button";

  const props = defineProps<{
    modelValue: string;
    statuses: {
      status: string;
      value: string;
      variant?: ButtonVariant;
    }[];
  }>();

  const emit = defineEmits<{
    (e: "update:modelValue", value: string): void;
    (e: "filter", value: string): void;
  }>();

  const selectStatus = (status: string) => {
    emit("update:modelValue", status);
    emit("filter", status);
  };

  const getStatusVariant = (status: string): ButtonVariant => {
    return props.modelValue === status ? "linkHover1" : "linkHover2";
  };

  const getSelectedStatusLabel = () => {
    const selected = props.statuses.find((s) => s.value === props.modelValue);
    return selected ? selected.status : "All";
  };
</script>

<style scoped>
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }
</style>
