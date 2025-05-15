<template>
  <div class="hidden w-full sm:block">
    <Suspense>
      <template #default>
        <UiDatatable :options="options" :columns="columns" :data="orders">
          <template #actions="{ cellData }: { cellData: Order & { id: string } }">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton class="h-7 text-xs"> Actions </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-32">
                <UiDropdownMenuItem @click="$emit('view-order', cellData.id)">
                  <Icon name="lucide:view" class="mr-2" />
                  View Order
                </UiDropdownMenuItem>
                <UiDropdownMenuItem
                  v-if="cellData.orderStatus === 'pending'"
                  @click="$emit('cancel-order', cellData.id)"
                >
                  <Icon name="lucide:file-x" class="mr-2" />
                  Cancel Order
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </template>
        </UiDatatable>
      </template>
      <template #fallback>
        <div class="flex w-full items-center justify-center py-8">
          <div class="flex flex-col items-center gap-3">
            <Icon name="lucide:loader-circle" class="h-10 w-10 animate-spin text-primary" />
            <span class="text-sm text-muted-foreground">Loading orders data...</span>
          </div>
        </div>
      </template>
    </Suspense>
  </div>
</template>

<script lang="ts" setup>
  import type { Order } from "~/types/models/Order";
  import type { Config, ConfigColumns } from "datatables.net";

  const props = defineProps<{
    orders: (Order & { id: string })[];
  }>();

  const emit = defineEmits<{
    (e: "view-order", orderId: string): void;
    (e: "cancel-order", orderId: string): void;
  }>();

  const columns: ConfigColumns[] = [
    {
      title: "Reference Number",
      data: "uniqRefNumber",
    },
    {
      title: "Order Status",
      data: "orderStatus",
      render: (data: string) => {
        let colorClass = "bg-gray-200 text-gray-800";
        if (data === "pending") {
          colorClass = "bg-yellow-200 text-yellow-800";
        } else if (data === "cancelled") {
          colorClass = "bg-red-200 text-red-800";
        } else if (data === "completed") {
          colorClass = "bg-green-200 text-green-800";
        } else if (data === "preparing") {
          colorClass = "bg-blue-200 text-blue-800";
        } else if (data === "ready") {
          colorClass = "bg-amber-200 text-amber-800";
        }
        return `
      <div class="flex items-center gap-3">
        <div class="flex cursor-pointer items-center gap-2">
          <span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>
        </div>
      </div>`;
      },
    },
    {
      title: "Payment Status",
      data: "paymentStatus",
      render: (data: string) => {
        let colorClass = "bg-gray-200 text-gray-800";
        if (data === "not_paid") {
          colorClass = "bg-red-200 text-red-800";
        } else if (data === "paid") {
          colorClass = "bg-green-200 text-green-800";
        } else if (data === "cancelled") {
          colorClass = "bg-red-200 text-red-800";
        }
        return `
      <div class="flex items-center gap-3">
        <div class="flex cursor-pointer items-center gap-2">
          <span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>
        </div>
      </div>`;
      },
    },
    {
      title: "Date Ordered",
      data: "dateOrdered",
      render: (data: any) => formatDate(data),
    },
    {
      title: "Total Payment",
      data: "totalPrice",
      render: (data: number) => `₱${data.toFixed(2)}`,
    },
    {
      data: null,
      title: "",
      className: "no-export",
      searchable: false,
      orderable: false,
      name: "actions",
      render: "#actions",
    },
  ];

  const options: Config = {
    buttons: [
      {
        extend: "colvis",
        text: "Columns",
        columns: ":not(.no-export)",
      },
      {
        extend: "copy",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
      {
        extend: "excel",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
      {
        extend: "pdf",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
      {
        extend: "print",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
      {
        extend: "csv",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
    ],
    dom: "Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5'Bf><'border rounded-lg't><'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li><''p>",
    responsive: true,
    autoWidth: true,
    select: true,
  };

  // Utility function to format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp !== "object" || !timestamp.seconds) {
      return "N/A";
    }

    try {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
</script>
