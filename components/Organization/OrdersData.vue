<template>
  <UiDivider class="my-4" />
  <div class="flex flex-row pt-8 opacity-70">
    <template v-for="status in statuses" :key="status.value">
      <UiButton :variant="statusVariant(status.value)" @click="fetchOrders(status.value)">{{
        status.status
      }}</UiButton>
    </template>
  </div>
  <UiDivider />
  <div class="mt-4 w-full">
    <div v-if="!loading" class="w-full">
      <UiDatatable :options="options" :columns="columns" :data="orders">
        <template #actions="{ cellData }: { cellData: ExtendedOrder }">
          <UiButton class="h-7 text-xs" size="sm">Actions</UiButton>
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
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import { Timestamp } from "firebase/firestore";
  import { onMounted, ref } from "vue";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Config, ConfigColumns } from "datatables.net";

  const props = defineProps<{ organizationID: string }>();

  const orders = ref<ExtendedOrder[]>([]);
  const loading = ref(false);
  const selectedStatus = ref<string>("all");

  const { fetchFilteredOrders } = useFetchFilterOrders();

  const statusVariant = (status: string) => {
    return selectedStatus.value === status ? "linkHover1" : "linkHover2";
  };

  const statuses: { status: string; value: string; variant: ButtonVariant }[] = [
    {
      status: "All",
      value: "all",
      variant: "linkHover1",
    },
    {
      status: "Pending",
      value: "pending",
      variant: "linkHover2",
    },
    {
      status: "Completed",
      value: "completed",
      variant: "linkHover2",
    },
    {
      status: "Cancelled",
      value: "cancelled",
      variant: "linkHover2",
    },
  ];

  const fetchOrders = async (status: string) => {
    loading.value = true;
    try {
      const fetchedOrders = await fetchFilteredOrders(props.organizationID, status);
      orders.value = fetchedOrders;
      selectedStatus.value = status;
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      loading.value = false;
    }
  };

  onMounted(() => {
    fetchOrders("all");
  });

  const columns: ConfigColumns[] = [
    { title: "Reference Number", data: "uniqRefNumber" },
    { title: "Buyer Email", data: "buyerEmail" },
    {
      title: "Products",
      data: "orderItems",
      render: (data: ExtendedOrder["orderItems"]) => {
        return data.map((item) => item.productDetails?.name || "Unknown").join(", ");
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
            <span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>
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
      "copy",
      "excel",
      "pdf",
      "print",
      "csv",
    ],
    dom: "Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5'Bf><'border rounded-lg't><'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li><''p>",
    responsive: true,
    autoWidth: true,
    select: true,
  };
</script>
