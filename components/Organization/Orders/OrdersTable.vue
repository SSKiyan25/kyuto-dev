<template>
  <div class="mt-4 w-full">
    <div v-if="!loading" class="w-full">
      <UiDatatable :options="options" :columns="columns" :data="orders">
        <template #actions="{ cellData }: { cellData: ExtendedOrder }">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-7 text-center text-sm" size="sm"> ... </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-32">
              <UiDropdownMenuLabel>Actions</UiDropdownMenuLabel>
              <UiDropdownMenuItem @click="$emit('viewOrder', cellData)"
                >View Order</UiDropdownMenuItem
              >
              <UiDropdownMenuItem @click="$emit('viewCancelOrder', cellData)"
                >Cancel Order</UiDropdownMenuItem
              >
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </template>
      </UiDatatable>
    </div>
    <div v-if="loading" class="flex w-full flex-col items-center justify-center gap-5 py-5">
      <Icon name="lucide:loader-circle" class="h-24 w-24 animate-spin text-primary" />
      <span class="text-lg text-gray-600">Loading orders...</span>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { Timestamp } from "firebase/firestore";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { Config, ConfigColumns } from "datatables.net";

  const props = defineProps<{
    orders: ExtendedOrder[];
    loading: boolean;
  }>();

  const emit = defineEmits<{
    viewOrder: [order: ExtendedOrder];
    viewCancelOrder: [order: ExtendedOrder];
  }>();

  const columns: ConfigColumns[] = [
    { title: "Reference Number", data: "uniqRefNumber" },
    {
      title: "Buyer Email",
      data: null,
      render: (data: any, type: any, row: ExtendedOrder) => {
        const email = row.buyerAccountDetails?.email;
        if (!email) return "N/A";
        return `
        <div class="max-w-[100px] text-[10px] md:max-w-[150px] lg:max-w-[200px] truncate" title="${email}">
          ${email}
        </div>`;
      },
    },
    {
      title: "Products",
      data: "orderItems",
      render: (data: ExtendedOrder["orderItems"]) => {
        const productList = data
          .map((item) => {
            const productName = item.productDetails?.name || "Unknown";
            const variationName = item.variationDetails?.value
              ? ` (${item.variationDetails.value})`
              : "";
            return `${productName}${variationName}`;
          })
          .join("<br>");

        return `<div class="max-w-[200px] text-[10px]">${productList}</div>`;
      },
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
        }
        return `
      <div class="flex items-center gap-3">
        <div class="flex cursor-pointer items-center gap-2">
          <span class="px-2 text-xs py-1 rounded ${colorClass} capitalize">${data}</span>
        </div>
      </div>`;
      },
    },
    {
      title: "Payment Status",
      data: "paymentStatus",
      render: (data: string) => {
        let colorClass = "bg-gray-200 text-gray-800";
        if (data === "paid") {
          colorClass = "bg-green-200 text-green-800";
        } else if (data === "not_paid") {
          colorClass = "bg-red-200 text-red-800";
        } else if (data === "partial") {
          colorClass = "bg-yellow-200 text-yellow-800";
        }
        return `
    <div class="flex items-center gap-3">
      <div class="flex cursor-pointer items-center gap-2">
        <span class="px-2 py-1 text-xs rounded ${colorClass} capitalize">${data}</span>
      </div>
    </div>`;
      },
    },
    {
      title: "Date Ordered",
      data: "dateOrdered",
      render: (data: any) => {
        const date = data instanceof Timestamp ? data.toDate() : new Date(data);
        return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      },
    },
    {
      data: null,
      title: "",
      className: "no-export",
      searchable: false,
      orderable: false,
      name: "actions",
      render: "#actions",
      responsivePriority: 1,
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
</script>
