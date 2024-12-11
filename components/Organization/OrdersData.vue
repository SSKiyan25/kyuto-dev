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
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-7 text-xs" size="sm">Actions</UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-32">
              <UiDropdownMenuLabel>Actions</UiDropdownMenuLabel>
              <UiDropdownMenuItem @click="viewOrder(cellData)">View Order</UiDropdownMenuItem>
              <UiDropdownMenuItem @click="viewCancelOrder(cellData)"
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
  <UiDialog v-model:open="viewOrderDialog">
    <UiDialogContent
      class="overflow-y-auto bg-secondary sm:max-h-[750px] sm:max-w-[750px]"
      title="View Reference Number Order Details"
      description="Testing if it works"
      :hideClose="hideClose"
    >
      <template #content>
        <div
          v-if="statusLoading"
          class="absolute flex h-full w-full flex-col items-center justify-center bg-secondary-foreground/10 px-12"
        >
          <Icon name="lucide:loader-circle" class="h-24 w-24 animate-spin text-primary" />
          <p>Updating Status...</p>
        </div>
        <div class="flex flex-col gap-2 p-4">
          <div class="flex flex-row items-center gap-1">
            <span class="text-sm text-muted-foreground">Order ID:</span>
            <span class="text-lg font-semibold">{{ selectedOrder?.uniqRefNumber }}</span>
          </div>
          <div class="flex flex-row items-center justify-between gap-1">
            <div class="flex flex-row items-center gap-1">
              <span class="text-sm text-muted-foreground">Order Date:</span>
              <span class="text-md font-semibold">{{
                formatDate(selectedOrder?.dateOrdered)
              }}</span>
            </div>
            <div class="flex flex-row items-center gap-1">
              <span class="text-sm text-muted-foreground">Order Status:</span>
              <span class="text-md font-semibold capitalize">{{ selectedOrder?.orderStatus }}</span>
            </div>
          </div>
          <hr />
          <div class="flex flex-col gap-2">
            <span class="text-md font-semibold">Order Details</span>
            <div class="flex flex-col gap-2 px-8">
              <div
                v-for="item in selectedOrder?.orderItems"
                :key="item.productID"
                class="flex flex-row items-center justify-between"
              >
                <span class="text-sm">
                  {{ item.productDetails?.name }}
                  <span v-if="item.variationDetails?.value"
                    >({{ item.variationDetails.value }})</span
                  >
                  <span v-if="item.isPreOrder">: Pre-Order</span>
                  x {{ item.quantity }}
                </span>
                <span class="text-sm">₱{{ item.price }}</span>
              </div>
              <div class="flex flex-row items-center justify-end gap-2">
                <span class="text-sm text-muted-foreground">Subtotal: </span>
                <span class="text-sm font-medium"
                  >₱{{ computeSubtotal(selectedOrder?.orderItems) }}</span
                >
              </div>
            </div>
            <UiDivider />
            <div class="flex flex-row items-center justify-between gap-2 px-8">
              <span class="text-sm text-muted-foreground">Discount: </span>
              <span class="text-sm">₱{{ selectedOrder?.discountValue }}</span>
            </div>
            <div class="flex flex-row items-center justify-between gap-2 px-8">
              <span class="text-sm text-muted-foreground">Total Payment: </span>
              <span class="text-sm font-bold">₱{{ selectedOrder?.totalPrice }}</span>
            </div>
          </div>
          <hr />
          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Customer Information</span>
            <div class="flex flex-col gap-2 px-8">
              <div class="flex flex-row items-center justify-between">
                <span class="text-sm text-muted-foreground">Customer</span>
                <span class="text-sm"
                  >{{ selectedOrder?.buyerAccountDetails?.firstname }}
                  {{ selectedOrder?.buyerAccountDetails?.lastname }}</span
                >
              </div>
              <div class="flex flex-row items-center justify-between">
                <span class="text-sm text-muted-foreground">Email</span>
                <span class="text-sm">{{ selectedOrder?.buyerAccountDetails?.email }}</span>
              </div>
              <div class="flex flex-row items-center justify-between">
                <span class="text-sm text-muted-foreground">Phone</span>
                <span class="text-sm">{{ selectedOrder?.buyerAccountDetails?.phoneNumber }}</span>
              </div>
              <div class="flex flex-row items-center justify-between">
                <span class="text-sm text-muted-foreground">Student ID</span>
                <span class="text-sm font-semibold">{{
                  selectedOrder?.buyerAccountDetails?.studentID
                }}</span>
              </div>
            </div>
          </div>
          <hr />
          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Payment Information</span>
            <div class="flex flex-col gap-2 px-8">
              <span class="text-sm text-muted-foreground">{{ selectedOrder?.paymentMethod }}</span>
              <span class="text-sm text-muted-foreground">{{ selectedOrder?.paymentStatus }}</span>
            </div>
          </div>
          <UiDivider />
          <div v-if="selectedOrder?.remarks !== ''" class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Order Remarks</span>
            <p class="text-sm text-gray-600">{{ selectedOrder?.remarks }}</p>
          </div>
          <UiDivider />
          <div class="flex flex-col gap-2">
            <span class="text-lg font-semibold">Actions</span>
            <div class="flex flex-col gap-2">
              <div v-if="selectedOrder?.orderStatus === 'cancelled'" class="text-red-500">
                Order has already been cancelled.
              </div>
              <div v-else>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedOrder?.orderStatus === 'ready'"
                    @change="handleMarkAsReady"
                    :disabled="selectedOrder?.orderStatus === 'cancelled'"
                  />
                  <span>Mark as Ready to Get</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedOrder?.paymentStatus === 'paid'"
                    @change="handleMarkAsPaid"
                    :disabled="selectedOrder?.orderStatus === 'cancelled'"
                  />
                  <span>Mark as Paid Order</span>
                </div>
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedOrder?.orderStatus === 'completed'"
                    @change="handleMarkAsClaimed"
                    :disabled="selectedOrder?.orderStatus === 'cancelled'"
                  />
                  <span>Mark as Claimed Order</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UiButton @click="closeDialog">Close</UiButton>
      </template>
    </UiDialogContent>
  </UiDialog>

  <!-- Cancel Order Dialog -->
  <UiAlertDialog v-model:open="viewCancelDialog">
    <UiAlertDialogContent class="bg-secondary">
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          This action cannot be undone. This will permanently cancel the order.
          <UiInput v-model="cancelRemarks" type="text" placeholder="Enter reason" class="mt-4" />
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="viewCancelDialog = false">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction
          @click="confirmCancelOrder"
          :disabled="cancelRemarks === ''"
          variant="destructive"
          >Confirm</UiAlertDialogAction
        >
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>

<script lang="ts" setup>
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import { Timestamp } from "firebase/firestore";
  import { onMounted, ref } from "vue";
  import type {
    ExtendedOrder,
    ExtendedOrderItem,
  } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Config, ConfigColumns } from "datatables.net";

  const props = defineProps<{ organizationID: string }>();

  const orders = ref<ExtendedOrder[]>([]);
  const loading = ref(false);
  const selectedStatus = ref<string>("all");
  const selectedOrder = ref<ExtendedOrder | null>(null);
  const viewOrderDialog = ref(false);
  const viewCancelDialog = ref(false);
  const cancelRemarks = ref("");
  const statusLoading = ref(false);
  const hideClose = computed(() => statusLoading.value);

  const {
    fetchFilteredOrders,
    markAsReady,
    markAsPaid,
    markAsClaimed,
    fetchOrderDetails,
    cancelOrder,
  } = useFetchFilterOrders();

  const closeDialog = () => {
    viewOrderDialog.value = false;
    viewCancelDialog.value = false;
  };
  const statusVariant = (status: string) => {
    return selectedStatus.value === status ? "linkHover1" : "linkHover2";
  };

  const updateOrderInList = (updatedOrder: ExtendedOrder) => {
    const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
    if (index !== -1) {
      orders.value[index] = updatedOrder;
    }
  };

  const handleMarkAsReady = async () => {
    if (selectedOrder.value && selectedOrder.value.id) {
      statusLoading.value = true;
      await markAsReady(selectedOrder.value.id, selectedOrder.value.orderStatus);
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
      if (updatedOrder) {
        selectedOrder.value = updatedOrder;
        updateOrderInList(updatedOrder);
      }
      statusLoading.value = false;
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedOrder.value && selectedOrder.value.id) {
      statusLoading.value = true;
      await markAsPaid(selectedOrder.value.id, selectedOrder.value.paymentStatus);
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
      if (updatedOrder) {
        selectedOrder.value = updatedOrder;
        updateOrderInList(updatedOrder);
      }
      statusLoading.value = false;
    }
  };

  const handleMarkAsClaimed = async () => {
    if (selectedOrder.value && selectedOrder.value.id && selectedOrder.value.orderItems) {
      statusLoading.value = true;
      await markAsClaimed(
        selectedOrder.value.id,
        selectedOrder.value.orderStatus,
        selectedOrder.value.orderItems
      );
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
      if (updatedOrder) {
        selectedOrder.value = updatedOrder;
        updateOrderInList(updatedOrder);
      }
      statusLoading.value = false;
    }
  };

  const confirmCancelOrder = async () => {
    statusLoading.value = true;
    if (selectedOrder.value && selectedOrder.value.id) {
      try {
        console.log("Cancelling order:", selectedOrder.value.id);
        console.log("Remarks:", cancelRemarks.value);
        await cancelOrder(
          selectedOrder.value.id,
          cancelRemarks.value,
          selectedOrder.value.orderItems
        );
        useToast().toast({
          title: "Order Cancelled",
          description: "The order has been cancelled successfully.",
          duration: 5000,
          icon: "lucide:check",
        });
        // Refresh orders after cancellation
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
        if (updatedOrder) {
          updateOrderInList(updatedOrder);
        }
        cancelRemarks.value = "";
      } catch (error) {
        console.error("Error cancelling order: ", error);
        useToast().toast({
          title: "Error",
          description: "There was an error cancelling the order.",
          duration: 5000,
          icon: "lucide:x",
        });
      }
    }
    viewCancelDialog.value = false;
    statusLoading.value = false;
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
      status: "Preparing",
      value: "preparing",
      variant: "linkHover2",
    },
    {
      status: "Ready",
      value: "ready",
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

  const viewOrder = (order: ExtendedOrder) => {
    selectedOrder.value = order;
    viewOrderDialog.value = true;
  };

  const viewCancelOrder = (order: ExtendedOrder) => {
    selectedOrder.value = order;
    viewCancelDialog.value = true;
  };

  const computeSubtotal = (orderItems: ExtendedOrderItem[] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce((subtotal, item) => subtotal + item.price * item.quantity, 0);
  };

  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };

  onMounted(() => {
    fetchOrders("all");
  });

  const columns: ConfigColumns[] = [
    { title: "Reference Number", data: "uniqRefNumber" },
    {
      title: "Buyer Email",
      data: "buyerAccountDetails.email",
      render: (data: string) => data || "N/A",
    },
    {
      title: "Products",
      data: "orderItems",
      render: (data: ExtendedOrder["orderItems"]) => {
        return data
          .map((item) => {
            const productName = item.productDetails?.name || "Unknown";
            const variationName = item.variationDetails?.value
              ? ` (${item.variationDetails.value})`
              : "";
            return `${productName}${variationName}`;
          })
          .join("<br>");
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
