<script setup lang="ts">
  defineProps<{
    filterBy: string;
    filterOptions: string[];
    defaultCategory: string;
    categories: string[];
    organizationIDLink: string;
  }>();

  defineEmits<{
    (e: "update:filterBy", value: string): void;
    (e: "update:defaultCategory", value: string): void;
  }>();
</script>

<template>
  <div
    class="flex flex-col justify-between gap-3 pb-3 pt-1 sm:flex-row sm:items-center sm:gap-4 sm:pb-4 sm:pt-4"
  >
    <!-- Show products depending on status -->
    <div class="w-full sm:w-auto">
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton
            size="sm"
            variant="secondary"
            class="flex w-full flex-row items-center justify-between sm:w-auto sm:justify-start"
          >
            <span class="truncate"
              >Show: <span class="font-medium opacity-70">{{ filterBy }}</span></span
            >
            <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4 flex-shrink-0" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent>
          <UiDropdownMenuLabel label="Filter by:" />
          <UiDropdownMenuRadioGroup
            :model-value="filterBy"
            @update:model-value="$emit('update:filterBy', $event)"
          >
            <UiDropdownMenuRadioItem
              v-for="item in filterOptions"
              :key="item"
              :value="item"
              :title="item"
              :text-value="item"
            />
          </UiDropdownMenuRadioGroup>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </div>

    <!-- Filter Options -->
    <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
      <!-- Filter by category -->
      <UiDropdownMenu>
        <UiDropdownMenuTrigger as-child>
          <UiButton
            size="sm"
            variant="secondary"
            class="flex w-full flex-row items-center justify-between sm:w-auto"
          >
            <span class="truncate">Filter by</span>
            <Icon name="lucide:list-filter" class="ml-2 h-4 w-4 flex-shrink-0" />
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent>
          <UiDropdownMenuLabel label="Filter by:" />
          <UiDropdownMenuRadioGroup
            :model-value="defaultCategory"
            @update:model-value="$emit('update:defaultCategory', $event)"
          >
            <UiDropdownMenuRadioItem
              v-for="item in categories"
              :key="item"
              :value="item"
              :title="item"
              :text-value="item"
            />
          </UiDropdownMenuRadioGroup>
        </UiDropdownMenuContent>
      </UiDropdownMenu>

      <UiButton
        :to="`/organization/products/add/${organizationIDLink}`"
        class="flex flex-row items-center justify-center"
      >
        <Icon name="lucide:circle-plus" class="mr-2 size-4 flex-shrink-0" />
        <span class="truncate">Add Product</span>
      </UiButton>
    </div>
  </div>
</template>
