<template>
  <div class="flex items-center">
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton class="flex items-center gap-2" size="sm" variant="outline">
          <Icon name="lucide:download" class="h-4 w-4" />
          <span>Export</span>
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent class="w-56">
        <UiDropdownMenuLabel>Export Options</UiDropdownMenuLabel>
        <UiDropdownMenuSeparator />
        <UiDropdownMenuItem
          @click="handleExportToPdf"
          class="flex cursor-pointer items-center gap-2"
        >
          <Icon name="lucide:file-text" class="h-4 w-4 text-red-500" />
          <span>Export to PDF</span>
        </UiDropdownMenuItem>
        <UiDropdownMenuItem
          @click="handleExportToExcel"
          class="flex cursor-pointer items-center gap-2"
        >
          <Icon name="lucide:file-spreadsheet" class="h-4 w-4 text-green-600" />
          <span>Export to Excel</span>
        </UiDropdownMenuItem>
        <UiDropdownMenuSeparator v-if="isMobile" />
        <UiDropdownMenuLabel v-if="isMobile" class="text-xs text-amber-600">
          <Icon name="lucide:info" class="mr-1 inline h-3.5 w-3.5" />
          Mobile browsers may limit file downloads
        </UiDropdownMenuLabel>
      </UiDropdownMenuContent>
    </UiDropdownMenu>
  </div>
</template>

<script setup lang="ts">
  import { useExportOrders } from "~/composables/organization/orders/useExportOrders";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";

  const props = defineProps<{
    orders: ExtendedOrder[];
    currentStatus: string;
    isMobile?: boolean;
  }>();

  const { exportToPdf, exportToExcel } = useExportOrders();

  const handleExportToPdf = () => {
    exportToPdf(props.orders, props.currentStatus);
  };

  const handleExportToExcel = () => {
    exportToExcel(props.orders, props.currentStatus);
  };
</script>
