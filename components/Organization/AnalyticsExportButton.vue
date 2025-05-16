<template>
  <div class="relative">
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton variant="outline" size="sm" class="flex items-center gap-2">
          <Icon name="lucide:download" class="h-4 w-4" />
          <span>Export</span>
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent class="w-56">
        <UiDropdownMenuLabel>Export Options</UiDropdownMenuLabel>
        <UiDropdownMenuSeparator />

        <!-- PDF Export -->
        <UiDropdownMenuItem @click="exportToPdf" class="flex cursor-pointer items-center gap-2">
          <Icon name="lucide:file-text" class="h-4 w-4 text-red-500" />
          <span>Export to PDF</span>
        </UiDropdownMenuItem>

        <!-- Excel Export -->
        <UiDropdownMenuItem @click="exportToExcel" class="flex cursor-pointer items-center gap-2">
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
  import { useExportAnalytics } from "~/composables/organization/useExportAnalytics";

  // Define more specific types
  type SummaryData = {
    totalRevenue: number;
    totalOrders: number;
    totalProductsViewed: number;
  };

  const props = defineProps({
    type: {
      type: String,
      required: true,
      validator: (value: string) => {
        return ["summary", "sales", "comparison", "products"].includes(value);
      },
    },
    data: {
      type: [Array, Object],
      required: true,
    },
    chartRef: {
      type: [Object, null],
      default: null,
    },
    timeRange: {
      type: String,
      default: "",
    },
  });
  const {
    exportSummaryToPdf,
    exportSummaryToExcel,
    exportSalesChartToPdf,
    exportSalesChartToExcel,
    exportComparisonToPdf,
    exportComparisonToExcel,
    exportTopProductsToPdf,
    exportTopProductsToExcel,
    isMobileDevice,
  } = useExportAnalytics();

  const isMobile = ref(isMobileDevice());

  onMounted(() => {
    isMobile.value = isMobileDevice();
  });

  const exportToPdf = async () => {
    switch (props.type) {
      case "summary":
        exportSummaryToPdf(props.data as SummaryData);
        break;
      case "sales":
        if (props.chartRef) {
          await exportSalesChartToPdf(
            props.chartRef as HTMLElement,
            props.data as any[],
            props.timeRange
          );
        }
        break;
      case "comparison":
        if (props.chartRef) {
          await exportComparisonToPdf(props.chartRef as HTMLElement, props.data as any[]);
        }
        break;
      case "products":
        exportTopProductsToPdf(props.data as any[]);
        break;
    }
  };

  const exportToExcel = () => {
    switch (props.type) {
      case "summary":
        exportSummaryToExcel(props.data as SummaryData);
        break;
      case "sales":
        exportSalesChartToExcel(props.data as any[], props.timeRange);
        break;
      case "comparison":
        exportComparisonToExcel(props.data as any[]);
        break;
      case "products":
        exportTopProductsToExcel(props.data as any[]);
        break;
    }
  };
</script>
