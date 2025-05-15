<template>
  <UiDivider class="my-4" />
  <div class="flex flex-row flex-wrap gap-2 pt-8 opacity-70">
    <template v-for="status in statuses" :key="status.value">
      <UiButton
        :variant="statusVariant(status.value)"
        @click="fetchOrders(status.value)"
        class="mb-2 text-xs sm:text-sm"
      >
        {{ status.status }}
      </UiButton>
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
  <!-- Desktop version dialog -->
  <UiDialog v-model:open="viewOrderDialog">
    <UiDialogContent
      class="overflow-y-auto bg-card sm:max-h-[750px] sm:max-w-[750px]"
      :title="`Order: ${selectedOrder?.uniqRefNumber || ''}`"
      :hideClose="statusLoading"
    >
      <template #content>
        <!-- Loading overlay -->
        <div
          v-if="statusLoading"
          class="absolute inset-0 z-50 flex flex-col items-center justify-center bg-secondary-foreground/10 backdrop-blur-sm"
        >
          <Icon name="lucide:loader-circle" class="h-20 w-20 animate-spin text-primary" />
          <p class="mt-4 font-medium">Updating order status...</p>
        </div>

        <!-- Order details -->
        <div class="flex flex-col gap-4">
          <!-- Status badges -->
          <div class="flex flex-wrap items-center gap-2">
            <div :class="getStatusClass(selectedOrder?.orderStatus || '')">
              <Icon name="lucide:box" class="mr-1 h-3 w-3" />
              {{ selectedOrder?.orderStatus }}
            </div>
            <div :class="getPaymentClass(selectedOrder?.paymentStatus || '')">
              <Icon name="lucide:credit-card" class="mr-1 h-3 w-3" />
              {{
                selectedOrder?.paymentStatus === "not_paid"
                  ? "Unpaid"
                  : selectedOrder?.paymentStatus
              }}
            </div>
            <div class="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
              <Icon name="lucide:calendar" class="mr-1 h-3 w-3" />
              {{ formatDate(selectedOrder?.dateOrdered) }}
            </div>
          </div>

          <!-- Customer info -->
          <div class="rounded-lg border bg-card/50 p-3">
            <h3 class="mb-2 flex items-center gap-2 font-medium">
              <Icon name="lucide:user" class="h-4 w-4 text-muted-foreground" />
              Customer Information
            </h3>
            <div class="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
              <div class="flex justify-between sm:block">
                <span class="text-muted-foreground">Name:</span>
                <span>{{
                  [
                    selectedOrder?.buyerAccountDetails?.firstname,
                    selectedOrder?.buyerAccountDetails?.lastname,
                  ]
                    .filter(Boolean)
                    .join(" ") || "N/A"
                }}</span>
              </div>
              <div class="flex justify-between sm:block">
                <span class="text-muted-foreground">Email:</span>
                <span>{{ selectedOrder?.buyerAccountDetails?.email || "N/A" }}</span>
              </div>
              <div class="flex justify-between sm:block">
                <span class="text-muted-foreground">Phone:</span>
                <span>{{ selectedOrder?.buyerAccountDetails?.phoneNumber || "N/A" }}</span>
              </div>
              <div class="flex justify-between sm:block">
                <span class="text-muted-foreground">Student ID:</span>
                <span>{{ selectedOrder?.buyerAccountDetails?.studentID || "N/A" }}</span>
              </div>
            </div>
          </div>

          <!-- Order items -->
          <div class="rounded-lg border bg-card/50 p-3">
            <h3 class="mb-2 flex items-center gap-2 font-medium">
              <Icon name="lucide:shopping-cart" class="h-4 w-4 text-muted-foreground" />
              Order Items
            </h3>
            <div class="space-y-3">
              <div
                v-for="item in selectedOrder?.orderItems"
                :key="item.productID"
                class="flex items-start justify-between gap-2 border-b pb-2 text-sm"
              >
                <div class="flex-1">
                  <p class="font-medium">{{ item.productDetails?.name || "Unknown Product" }}</p>
                  <div class="flex gap-2 text-xs text-muted-foreground">
                    <span v-if="item.variationDetails?.value">{{
                      item.variationDetails.value
                    }}</span>
                    <span
                      v-if="item.isPreOrder"
                      class="rounded-sm bg-primary px-1 text-primary-foreground"
                      >Pre-Order</span
                    >
                    <span>× {{ item.quantity }}</span>
                  </div>
                </div>
                <div class="text-right">
                  <p>₱{{ (item.priceWithCommission * item.quantity).toFixed(2) }}</p>
                  <p class="text-xs text-muted-foreground">₱{{ item.priceWithCommission }} each</p>
                </div>
              </div>
            </div>

            <!-- Order summary -->
            <div class="mt-3 space-y-2 border-t pt-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Subtotal:</span>
                <span>₱{{ Number(computeSubtotal(selectedOrder?.orderItems)).toFixed(2) }}</span>
              </div>
              <div v-if="selectedOrder?.discountValue" class="flex justify-between text-sm">
                <span class="text-muted-foreground">Discount:</span>
                <span>₱{{ selectedOrder?.discountValue }}</span>
              </div>
              <div class="flex justify-between text-sm font-bold">
                <span>Total:</span>
                <span>₱{{ Number(selectedOrder?.totalPrice).toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <!-- Payment info -->
          <div class="rounded-lg border bg-card/50 p-3">
            <h3 class="mb-2 flex items-center gap-2 font-medium">
              <Icon name="lucide:credit-card" class="h-4 w-4 text-muted-foreground" />
              Payment Information
            </h3>
            <div class="grid grid-cols-1 gap-2 text-sm">
              <div class="flex justify-between">
                <span class="text-muted-foreground">Method:</span>
                <span class="capitalize">{{ selectedOrder?.paymentMethod || "N/A" }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-muted-foreground">Status:</span>
                <span :class="getPaymentTextClass(selectedOrder?.paymentStatus || '')">
                  {{
                    selectedOrder?.paymentStatus === "not_paid"
                      ? "Unpaid"
                      : selectedOrder?.paymentStatus
                  }}
                </span>
              </div>
            </div>
          </div>

          <!-- Remarks -->
          <div v-if="selectedOrder?.remarks" class="rounded-lg border bg-card/50 p-3">
            <h3 class="mb-2 flex items-center gap-2 font-medium">
              <Icon name="lucide:message-square" class="h-4 w-4 text-muted-foreground" />
              Order Remarks
            </h3>
            <p class="text-sm text-muted-foreground">{{ selectedOrder?.remarks }}</p>
          </div>

          <!-- Status change actions -->
          <div class="rounded-lg border bg-card/50 p-3">
            <h3 class="mb-3 flex items-center gap-2 font-medium">
              <Icon name="lucide:settings" class="h-4 w-4 text-muted-foreground" />
              Order Actions
            </h3>

            <div v-if="selectedOrder?.orderStatus === 'cancelled'" class="text-sm text-red-500">
              This order has been cancelled and cannot be modified.
            </div>

            <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <!-- Ready button -->
              <UiButton
                v-if="selectedOrder?.orderStatus === 'pending'"
                variant="outline"
                class="w-full justify-start"
                size="sm"
                @click="handleMarkAsReady"
              >
                <Icon name="lucide:package-check" class="mr-2 h-4 w-4" />
                Mark as Ready
              </UiButton>

              <!-- Claimed button -->
              <UiButton
                v-if="selectedOrder?.orderStatus === 'ready'"
                variant="outline"
                class="w-full justify-start"
                size="sm"
                @click="handleMarkAsClaimed"
              >
                <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                Mark as Claimed
              </UiButton>

              <!-- Paid button -->
              <UiButton
                v-if="
                  selectedOrder?.paymentStatus !== 'paid' &&
                  selectedOrder?.orderStatus !== 'cancelled'
                "
                variant="outline"
                class="w-full justify-start"
                size="sm"
                @click="handleMarkAsPaid"
              >
                <Icon name="lucide:credit-card" class="mr-2 h-4 w-4" />
                Mark as Paid
              </UiButton>

              <!-- Cancel button -->
              <UiButton
                v-if="
                  selectedOrder?.orderStatus !== 'cancelled' &&
                  selectedOrder?.orderStatus !== 'completed'
                "
                variant="destructive"
                class="w-full justify-start"
                size="sm"
                @click="viewCancelOrder(selectedOrder as ExtendedOrder)"
              >
                <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
                Cancel Order
              </UiButton>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UiButton @click="closeDialog" :disabled="statusLoading">Close</UiButton>
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
  import type {
    ExtendedOrder,
    ExtendedOrderItem,
  } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Config, ConfigColumns } from "datatables.net";

  const props = defineProps<{ organizationID: string }>();
  const emit = defineEmits(["updateCommission"]);

  const orders = ref<ExtendedOrder[]>([]);
  const loading = ref(false);
  const selectedStatus = ref<string>("all");
  const selectedOrder = ref<ExtendedOrder | null>(null);
  const viewOrderDialog = ref(false);
  const viewCancelDialog = ref(false);
  const cancelRemarks = ref("");
  const statusLoading = ref(false);
  const hideClose = computed(() => statusLoading.value);
  const isCheckboxMarked = ref(false);

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
      isCheckboxMarked.value = true;
      await markAsReady(selectedOrder.value.id, selectedOrder.value.orderStatus);
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
      if (updatedOrder) {
        selectedOrder.value = updatedOrder;
        updateOrderInList(updatedOrder);
      }
      statusLoading.value = false;
      isCheckboxMarked.value = false;
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedOrder.value && selectedOrder.value.id) {
      statusLoading.value = true;
      isCheckboxMarked.value = true;
      await markAsPaid(selectedOrder.value.id, selectedOrder.value.paymentStatus);
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
      if (updatedOrder) {
        selectedOrder.value = updatedOrder;
        updateOrderInList(updatedOrder);
      }
      statusLoading.value = false;
      isCheckboxMarked.value = false;

      emit("updateCommission");
    }
  };

  const handleMarkAsClaimed = async () => {
    if (selectedOrder.value && selectedOrder.value.id && selectedOrder.value.orderItems) {
      statusLoading.value = true;
      isCheckboxMarked.value = true;
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
      isCheckboxMarked.value = false;
    }
  };

  const confirmCancelOrder = async () => {
    statusLoading.value = true;
    if (selectedOrder.value && selectedOrder.value.id) {
      try {
        // console.log("Cancelling order:", selectedOrder.value.id);
        // console.log("Remarks:", cancelRemarks.value);
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
    console.log(props.organizationID, status);
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

  const viewOrder = async (order: ExtendedOrder) => {
    // Fetch the latest order data directly from the database
    loading.value = true;
    try {
      const freshOrderData = await fetchOrderDetails(order.id);
      if (freshOrderData) {
        selectedOrder.value = freshOrderData;
        // Also update the order in the list to keep the table in sync
        updateOrderInList(freshOrderData);
      } else {
        selectedOrder.value = order;
      }
    } catch (error) {
      console.error("Error fetching fresh order data:", error);
      selectedOrder.value = order; // Fallback to the provided order
    } finally {
      loading.value = false;
    }
    viewOrderDialog.value = true;
  };

  const viewCancelOrder = async (order: ExtendedOrder) => {
    // Fetch fresh data before showing the cancel dialog
    try {
      const freshOrderData = await fetchOrderDetails(order.id);
      if (freshOrderData) {
        selectedOrder.value = freshOrderData;
        updateOrderInList(freshOrderData);
      } else {
        selectedOrder.value = order;
      }
    } catch (error) {
      console.error("Error fetching fresh order data:", error);
      selectedOrder.value = order;
    }
    viewCancelDialog.value = true;
  };

  const computeSubtotal = (orderItems: ExtendedOrderItem[] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce(
      (subtotal, item) => subtotal + item.priceWithCommission * item.quantity,
      0
    );
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

  // Add these styling helper methods
  const getStatusClass = (status: string) => {
    let baseClass = "flex items-center rounded px-2 py-1 text-xs capitalize";
    if (status === "pending") return `${baseClass} bg-yellow-200 text-yellow-800`;
    if (status === "cancelled") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "completed") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "ready") return `${baseClass} bg-blue-200 text-blue-800`;
    if (status === "preparing") return `${baseClass} bg-purple-200 text-purple-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
  };

  const getPaymentClass = (status: string) => {
    let baseClass = "flex items-center rounded px-2 py-1 text-xs capitalize";
    if (status === "paid") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "not_paid") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "partial") return `${baseClass} bg-yellow-200 text-yellow-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
  };

  const getPaymentTextClass = (status: string) => {
    if (status === "paid") return "text-green-600";
    if (status === "not_paid") return "text-red-600";
    if (status === "partial") return "text-amber-600";
    return "";
  };
</script>
