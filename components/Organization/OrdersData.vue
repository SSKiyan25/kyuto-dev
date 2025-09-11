<template>
  <UiDivider class="my-4" />
  <div class="flex flex-row flex-wrap items-center justify-between gap-2 pt-8">
    <div class="flex flex-wrap gap-2 opacity-70">
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

    <UiButton
      variant="outline"
      size="sm"
      @click="refreshOrders"
      :disabled="loading"
      class="h-8 text-xs"
    >
      <Icon
        :name="loading ? 'lucide:loader-circle' : 'lucide:refresh-cw'"
        class="mr-1 h-4 w-4"
        :class="{ 'animate-spin': loading }"
      />
      Refresh
    </UiButton>
  </div>
  <UiDivider />

  <Suspense>
    <OrdersTable
      :orders="orders"
      :loading="loading"
      @view-order="viewOrder"
      @view-cancel-order="viewCancelOrder"
    />
  </Suspense>

  <OrderDetailDialog
    :open="viewOrderDialog"
    :order="selectedOrder"
    :status-loading="statusLoading"
    :order-details-loading="orderDetailsLoading"
    @close="closeDialog"
    @mark-as-ready="handleMarkAsReady"
    @mark-as-paid="handleMarkAsPaid"
    @mark-as-claimed="handleMarkAsClaimed"
    @view-cancel-order="viewCancelOrder"
  />

  <CancelOrderDialog
    :open="viewCancelDialog"
    @close="viewCancelDialog = false"
    @confirm="confirmCancelOrder"
  />
</template>

<script lang="ts" setup>
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ButtonVariant } from "~/types/Button";

  import CancelOrderDialog from "./Orders/CancelOrderDialog.vue";
  import OrderDetailDialog from "./Orders/OrderDetailDialog.vue";
  import OrdersTable from "./Orders/OrdersTable.vue";

  const props = defineProps<{ organizationID: string }>();
  const emit = defineEmits(["updateCommission"]);

  const orders = ref<ExtendedOrder[]>([]);
  const loading = ref(false);
  const selectedStatus = ref<string>("all");
  const selectedOrder = ref<ExtendedOrder | null>(null);
  const viewOrderDialog = ref(false);
  const viewCancelDialog = ref(false);
  const statusLoading = ref(false);
  const orderDetailsLoading = ref(false);
  const isCheckboxMarked = ref(false);

  const {
    fetchFilteredOrders,
    markAsReady,
    markAsPaid,
    markAsClaimed,
    fetchOrderDetails,
    cancelOrder,
    invalidateOrganizationCache,
    clearBuyerCaches,
  } = useFetchFilterOrders();

  const closeDialog = () => {
    viewOrderDialog.value = false;
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
      try {
        await markAsReady(selectedOrder.value.id, selectedOrder.value.orderStatus);

        // Force refresh to get updated order
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
        if (updatedOrder) {
          selectedOrder.value = updatedOrder;
          updateOrderInList(updatedOrder);
        }
      } catch (error) {
        console.error("Error marking order as ready:", error);
        useToast().toast({
          title: "Update Failed",
          description: "Failed to update order status",
          duration: 3000,
          icon: "lucide:alert-triangle",
          variant: "destructive",
        });
      } finally {
        statusLoading.value = false;
        isCheckboxMarked.value = false;
      }
    }
  };

  const handleMarkAsPaid = async () => {
    if (selectedOrder.value && selectedOrder.value.id) {
      statusLoading.value = true;
      isCheckboxMarked.value = true;
      try {
        await markAsPaid(selectedOrder.value.id, selectedOrder.value.paymentStatus);

        // Force refresh to get updated order
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
        if (updatedOrder) {
          selectedOrder.value = updatedOrder;
          updateOrderInList(updatedOrder);
        }

        emit("updateCommission");
      } catch (error) {
        console.error("Error marking order as paid:", error);
        useToast().toast({
          title: "Update Failed",
          description: "Failed to update payment status",
          duration: 3000,
          icon: "lucide:alert-triangle",
          variant: "destructive",
        });
      } finally {
        statusLoading.value = false;
        isCheckboxMarked.value = false;
      }
    }
  };

  const handleMarkAsClaimed = async () => {
    if (selectedOrder.value && selectedOrder.value.id && selectedOrder.value.orderItems) {
      statusLoading.value = true;
      isCheckboxMarked.value = true;
      try {
        await markAsClaimed(
          selectedOrder.value.id,
          selectedOrder.value.orderStatus,
          selectedOrder.value.orderItems
        );

        // Force refresh to get updated order
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
        if (updatedOrder) {
          selectedOrder.value = updatedOrder;
          updateOrderInList(updatedOrder);
        }
      } catch (error) {
        console.error("Error marking order as claimed:", error);
        useToast().toast({
          title: "Update Failed",
          description: "Failed to update order status",
          duration: 3000,
          icon: "lucide:alert-triangle",
          variant: "destructive",
        });
      } finally {
        statusLoading.value = false;
        isCheckboxMarked.value = false;
      }
    }
  };

  const confirmCancelOrder = async (remarks: string) => {
    statusLoading.value = true;
    if (selectedOrder.value && selectedOrder.value.id) {
      try {
        await cancelOrder(selectedOrder.value.id, remarks, selectedOrder.value.orderItems);

        // Refresh orders after cancellation with forceRefresh=true
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
        if (updatedOrder) {
          updateOrderInList(updatedOrder);
        }

        // Also refresh filtered orders
        await fetchOrders(selectedStatus.value, true);

        useToast().toast({
          title: "Order Cancelled",
          description: "The order has been cancelled successfully.",
          duration: 5000,
          icon: "lucide:check",
        });

        emit("updateCommission");
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
    { status: "All", value: "all", variant: "linkHover1" },
    { status: "Pending", value: "pending", variant: "linkHover2" },
    { status: "Preparing", value: "preparing", variant: "linkHover2" },
    { status: "Ready", value: "ready", variant: "linkHover2" },
    { status: "Completed", value: "completed", variant: "linkHover2" },
    { status: "Cancelled", value: "cancelled", variant: "linkHover2" },
  ];

  const fetchOrders = async (status: string, forceRefresh = false) => {
    loading.value = true;
    try {
      // Use forceRefresh parameter to control cache usage
      const fetchedOrders = await fetchFilteredOrders(props.organizationID, status, forceRefresh);
      orders.value = fetchedOrders;
      selectedStatus.value = status;
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      loading.value = false;
    }
  };

  const refreshOrders = async () => {
    loading.value = true;
    try {
      // Invalidate organization cache and fetch fresh data
      invalidateOrganizationCache(props.organizationID);
      clearBuyerCaches();
      const freshOrders = await fetchFilteredOrders(
        props.organizationID,
        selectedStatus.value,
        true, // forceRefresh
        true // refreshBuyers
      );
      orders.value = freshOrders;
      useToast().toast({
        title: "Orders Refreshed",
        description: "Order data has been refreshed from the server",
        duration: 3000,
        icon: "lucide:refresh-cw",
      });
    } catch (error) {
      console.error("Error refreshing orders:", error);
      useToast().toast({
        title: "Refresh Failed",
        description: "Failed to refresh order data",
        duration: 3000,
        icon: "lucide:alert-triangle",
        variant: "destructive",
      });
    } finally {
      loading.value = false;
    }
  };

  const viewOrder = async (order: ExtendedOrder) => {
    // Initialize the dialog with existing data first
    selectedOrder.value = order;
    viewOrderDialog.value = true;

    // Then fetch fresh data in the background without loading the whole table
    orderDetailsLoading.value = true;
    try {
      const freshOrderData = await fetchOrderDetails(order.id);
      if (freshOrderData) {
        selectedOrder.value = freshOrderData;
      }
    } catch (error) {
      console.error("Error fetching fresh order data:", error);
    } finally {
      orderDetailsLoading.value = false;
    }
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

  onMounted(() => {
    fetchOrders("all");
  });
</script>
