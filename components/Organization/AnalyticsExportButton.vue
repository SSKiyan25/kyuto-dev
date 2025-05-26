<template>
  <div class="relative">
    <UiDropdownMenu>
      <UiDropdownMenuTrigger as-child>
        <UiButton
          variant="outline"
          size="sm"
          class="flex items-center gap-2"
          :disabled="isExporting"
        >
          <Icon
            :name="isExporting ? 'lucide:loader-2' : 'lucide:download'"
            class="h-4 w-4"
            :class="{ 'animate-spin': isExporting }"
          />
          <span>{{ isExporting ? "Exporting..." : "Export" }}</span>
        </UiButton>
      </UiDropdownMenuTrigger>
      <UiDropdownMenuContent class="w-56">
        <UiDropdownMenuLabel>Export Options</UiDropdownMenuLabel>
        <UiDropdownMenuSeparator />

        <!-- PDF Export -->
        <UiDropdownMenuItem
          @click="exportToPdf"
          class="flex cursor-pointer items-center gap-2"
          :disabled="isExporting"
        >
          <Icon name="lucide:file-text" class="h-4 w-4 text-red-500" />
          <span>Export to PDF</span>
        </UiDropdownMenuItem>

        <!-- Excel Export -->
        <UiDropdownMenuItem
          @click="exportToExcel"
          class="flex cursor-pointer items-center gap-2"
          :disabled="isExporting"
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
  // Define more specific types
  type SummaryData = {
    totalRevenue: number;
    totalOrders: number;
    totalProductsViewed: number;
    popularProducts?: any[];
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

  const isExporting = ref(false);
  const isMobile = ref(false);
  const toast = useToast();

  // Check if running on client-side and determine if mobile
  onMounted(() => {
    isMobile.value =
      window.innerWidth < 768 ||
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  });

  // Function to generate a filename with date
  const getFileName = (format: "pdf" | "xlsx") => {
    const date = new Date().toISOString().split("T")[0];
    const extension = format === "pdf" ? "pdf" : "xlsx";
    const timeRangeSuffix = props.timeRange ? `-${props.timeRange}` : "";

    switch (props.type) {
      case "summary":
        return `organization-analytics-summary-${date}.${extension}`;
      case "sales":
        return `sales-trend${timeRangeSuffix}-${date}.${extension}`;
      case "products":
        return `top-products-${date}.${extension}`;
      case "comparison":
        return `order-type-comparison-${date}.${extension}`;
      default:
        return `export-${date}.${extension}`;
    }
  };

  // PDF Export handler
  const exportToPdf = async () => {
    if (isExporting.value) return;

    try {
      isExporting.value = true;

      // Dynamic import of jspdf and related libraries
      const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
      ]);

      const doc = new jsPDF();

      // Add title to the PDF
      let title = "Analytics Report";
      switch (props.type) {
        case "summary":
          title = "Analytics Summary";
          break;
        case "sales":
          title = `Sales Trend${props.timeRange ? ` (${props.timeRange})` : ""}`;
          break;
        case "products":
          title = "Top Products";
          break;
        case "comparison":
          title = "Order Type Comparison";
          break;
      }

      doc.setFontSize(18);
      doc.text(title, 14, 22);
      doc.setFontSize(11);
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, 14, 30);

      // Add appropriate content based on type
      switch (props.type) {
        case "summary": {
          const data = props.data as SummaryData;

          // Format summary data
          autoTable(doc, {
            startY: 40,
            head: [["Metric", "Value"]],
            body: [
              ["Total Revenue", formatCurrency(data.totalRevenue)],
              ["Total Orders", data.totalOrders.toString()],
              ["Total Product Views", data.totalProductsViewed.toString()],
            ],
            theme: "grid",
          });

          // Add popular products if available
          if (data.popularProducts && data.popularProducts.length > 0) {
            doc.addPage();
            doc.setFontSize(16);
            doc.text("Top Performing Products", 14, 22);

            autoTable(doc, {
              startY: 30,
              head: [["Product Name", "Views", "Orders", "Quantity", "Revenue"]],
              body: data.popularProducts.map((p) => [
                p.name,
                p.viewCount.toString(),
                p.orderCount.toString(),
                p.totalQuantitySold.toString(),
                formatCurrency(p.totalRevenue),
              ]),
              theme: "grid",
            });
          }
          break;
        }

        case "sales": {
          // For sales data, we create a table from the chart data
          const salesData = props.data as any[];

          autoTable(doc, {
            startY: 40,
            head: [["Date", "Revenue", "Orders"]],
            body: salesData.map((item) => [
              item.date,
              formatCurrency(item.Revenue),
              item.Orders.toString(),
            ]),
            theme: "grid",
          });
          break;
        }

        case "comparison": {
          const comparisonData = props.data as any[];

          autoTable(doc, {
            startY: 40,
            head: [["Order Type", "Count"]],
            body: comparisonData.map((item) => [item.name, item.Total.toString()]),
            theme: "grid",
          });
          break;
        }

        case "products": {
          const productsData = props.data as any[];

          autoTable(doc, {
            startY: 40,
            head: [["Product Name", "Views", "Orders", "Quantity", "Revenue"]],
            body: productsData.map((p) => [
              p.name,
              p.viewCount.toString(),
              p.orderCount.toString(),
              p.totalQuantitySold.toString(),
              formatCurrency(p.totalRevenue),
            ]),
            theme: "grid",
          });
          break;
        }
      }

      // Save the PDF
      doc.save(getFileName("pdf"));

      toast.toast({
        title: "Export Successful",
        description: "Your data has been exported to PDF.",
        variant: "success",
      });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.toast({
        title: "Export Failed",
        description: "There was an error exporting to PDF. Please try again.",
        variant: "destructive",
      });
    } finally {
      isExporting.value = false;
    }
  };

  // Excel Export handler - completely rewritten to use dynamic imports
  const exportToExcel = async () => {
    if (isExporting.value) return;

    try {
      isExporting.value = true;

      // Dynamically import XLSX only when needed
      const XLSX = await import("xlsx");

      let wb = XLSX.utils.book_new();
      let ws;

      switch (props.type) {
        case "summary": {
          const data = props.data as SummaryData;

          // Summary sheet
          const summaryData = [
            ["Metric", "Value"],
            ["Total Revenue", formatCurrency(data.totalRevenue)],
            ["Total Orders", data.totalOrders],
            ["Total Product Views", data.totalProductsViewed],
          ];

          ws = XLSX.utils.aoa_to_sheet(summaryData);
          XLSX.utils.book_append_sheet(wb, ws, "Summary");

          // Add product data if available
          if (data.popularProducts && data.popularProducts.length > 0) {
            const productsData = [
              ["Product Name", "Views", "Orders", "Quantity Sold", "Revenue"],
              ...data.popularProducts.map((p) => [
                p.name,
                p.viewCount,
                p.orderCount,
                p.totalQuantitySold,
                p.totalRevenue,
              ]),
            ];

            const productsSheet = XLSX.utils.aoa_to_sheet(productsData);
            XLSX.utils.book_append_sheet(wb, productsSheet, "Top Products");
          }
          break;
        }

        case "sales": {
          const salesData = props.data as any[];

          const sheetData = [
            ["Date", "Revenue", "Orders"],
            ...salesData.map((item) => [item.date, item.Revenue, item.Orders]),
          ];

          ws = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, "Sales Trend");
          break;
        }

        case "comparison": {
          const comparisonData = props.data as any[];

          const sheetData = [
            ["Order Type", "Count"],
            ...comparisonData.map((item) => [item.name, item.Total]),
          ];

          ws = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, "Order Types");
          break;
        }

        case "products": {
          const productsData = props.data as any[];

          const sheetData = [
            ["Product Name", "Views", "Orders", "Quantity Sold", "Revenue"],
            ...productsData.map((p) => [
              p.name,
              p.viewCount,
              p.orderCount,
              p.totalQuantitySold,
              p.totalRevenue,
            ]),
          ];

          ws = XLSX.utils.aoa_to_sheet(sheetData);
          XLSX.utils.book_append_sheet(wb, ws, "Top Products");
          break;
        }
      }

      // Generate the file and trigger download
      XLSX.writeFile(wb, getFileName("xlsx"));

      toast.toast({
        title: "Export Successful",
        description: "Your data has been exported to Excel.",
        variant: "success",
      });
    } catch (error) {
      console.error("Excel export error:", error);
      toast.toast({
        title: "Export Failed",
        description: "There was an error exporting to Excel. Please try again.",
        variant: "destructive",
      });
    } finally {
      isExporting.value = false;
    }
  };

  // Utility function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
</script>
