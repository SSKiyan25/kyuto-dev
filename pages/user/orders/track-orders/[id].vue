<template>
  <!-- Loading Overlay -->
  <OrdersLoadingOverlay
    :is-loading="isPageLoading"
    title="Loading Orders"
    description="Please wait while we fetch your order data..."
  />

  <div class="flex h-screen w-full flex-col px-4 py-4 sm:px-8">
    <!-- Order Insights Banner -->
    <OrdersInsightsBanner
      :total-orders-count="filteredOrders.length"
      :pending-orders-count="getPendingOrdersCount()"
      :completed-orders-count="getCompletedOrdersCount()"
      @refresh-orders="refreshOrders"
    />

    <div class="flex w-full flex-col space-y-1 pt-4 sm:pt-6">
      <!-- Latest Order Card & Stepper -->
      <OrdersLatestOrderCard v-if="recentOrder" :order="recentOrder" :is-mobile="isMobile" />

      <!-- Order List Section -->
      <div class="mb-24 flex flex-col py-8">
        <h2 class="mb-2 text-lg font-semibold">Your Orders</h2>
        <p class="mb-3 text-xs text-muted-foreground">
          View and manage all your recent orders. Use the search box to find specific orders.
        </p>
        <!-- Order Status Filter -->
        <OrdersListFilter v-model="selectedStatus" :statuses="statuses" @filter="filterOrders" />
        <UiDivider />

        <!-- Responsive Order Lists -->
        <div class="mb-16 w-full overflow-x-auto sm:w-full">
          <!-- Desktop Table (hidden on mobile) -->
          <div class="hidden sm:block">
            <OrdersListDesktopTable
              :orders="filteredOrders"
              @view-order="openViewOrderDialog"
              @cancel-order="openCancelOrderDialog"
            />
          </div>

          <!-- Mobile List (shown only on mobile) -->
          <div class="block sm:hidden">
            <OrdersListMobile
              :orders="filteredOrders"
              @view-order="openViewOrderDialog"
              @cancel-order="openCancelOrderDialog"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialogs -->
  <OrdersDialogCancelOrder
    v-model:is-open="cancelOrderDialog"
    :orderId="selectedOrderID"
    @cancel-order="handleCancelOrder"
  />

  <OrdersDialogViewOrder
    v-model:is-open="viewOrderDialog"
    :order="selectedOrder"
    @cancel-order="openCancelOrderDialog"
  />
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/user/useFetchOrders";
  import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Order } from "~/types/models/Order";

  definePageMeta({
    middleware: "user-auth",
    layout: "user",
  });

  const isPageLoading = ref(false);
  const recentOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);
  const orders = ref<(Order & { id: string })[]>([]);
  const filteredOrders = ref<(Order & { id: string })[]>([]);
  const selectedStatus = ref<string>("all");
  const route = useRoute();
  const userID = computed(() => route.params.id as string);

  const isMobile = ref(false);
  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  // Dialogs state
  const cancelOrderDialog = ref(false);
  const viewOrderDialog = ref(false);
  const selectedOrderID = ref<string | null>(null);
  const selectedOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);

  // Load orders data
  onMounted(async () => {
    try {
      isPageLoading.value = true;
      await loadOrderData();
      handleResize();
      window.addEventListener("resize", handleResize);
    } catch (error) {
      console.error("Error loading order data:", error);
      useToast().toast({
        title: "Error",
        description: "Failed to load order data. Please try again.",
        duration: 5000,
        icon: "lucide:x",
      });
    } finally {
      isPageLoading.value = false;
    }
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

  // Composables and data fetching
  const { fetchUserOrders, fetchLatestOrder, fetchOrders, cancelOrder, fetchOrderItems } =
    useFetchOrders();

  async function loadOrderData() {
    const [userOrders, allOrders] = await Promise.all([
      fetchUserOrders(userID.value),
      fetchOrders(userID.value, "all", ""),
    ]);

    orders.value = userOrders;
    filterOrders(selectedStatus.value);
    await refreshLatestOrder();
  }

  // Filter orders by status
  const filterOrders = (status: string) => {
    selectedStatus.value = status;
    if (status === "all") {
      filteredOrders.value = orders.value;
    } else if (status === "not_paid") {
      filteredOrders.value = orders.value.filter((order) => order.paymentStatus === status);
    } else {
      filteredOrders.value = orders.value.filter((order) => order.orderStatus === status);
    }
  };

  // Refresh orders
  async function refreshOrders() {
    await refreshLatestOrder();
    try {
      const userOrders = await fetchUserOrders(userID.value);
      orders.value = userOrders;
      filterOrders(selectedStatus.value);
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  }

  // Get latest order
  const refreshLatestOrder = async () => {
    const latestOrder = await fetchLatestOrder(userID.value);
    recentOrder.value = latestOrder || null;
  };

  // Dialog handling
  const openViewOrderDialog = async (orderID: string) => {
    try {
      const order = orders.value.find((order) => order.id === orderID);
      if (!order) {
        throw new Error("Order not found");
      }

      const orderItems = await fetchOrderItems(orderID).catch(() => []);
      const organizationName =
        orderItems.length > 0
          ? orderItems[0].organizationName || "Unknown Organization"
          : "Unknown Organization";

      selectedOrder.value = { ...order, orderItems, organizationName };
      viewOrderDialog.value = true;
    } catch (error) {
      console.error("Error opening view order dialog:", error);
      useToast().toast({
        title: "Error",
        description: "Failed to load order details.",
        duration: 5000,
        icon: "lucide:x",
      });
    }
  };

  const openCancelOrderDialog = (orderID: string) => {
    selectedOrderID.value = orderID;
    cancelOrderDialog.value = true;
  };

  const handleCancelOrder = async (orderId: string, remarks: string) => {
    try {
      await cancelOrder(orderId, remarks);
      useToast().toast({
        title: "Order Cancelled",
        description: "The order has been cancelled successfully.",
        duration: 5000,
        icon: "lucide:check",
      });
      await refreshOrders();
    } catch (error) {
      console.error("Error cancelling order:", error);
      useToast().toast({
        title: "Error",
        description: "There was an error cancelling the order.",
        duration: 5000,
        icon: "lucide:x",
      });
    }
  };

  // Statistics
  const getPendingOrdersCount = () => {
    return orders.value.filter(
      (order) =>
        order.orderStatus === "pending" ||
        order.orderStatus === "preparing" ||
        order.orderStatus === "ready"
    ).length;
  };

  const getCompletedOrdersCount = () => {
    return orders.value.filter((order) => order.orderStatus === "completed").length;
  };

  // Filter status options
  const statuses = [
    { status: "All", value: "all", variant: "linkHover1" as ButtonVariant },
    { status: "Pending", value: "pending", variant: "linkHover2" as ButtonVariant },
    { status: "Preparing", value: "preparing", variant: "linkHover2" as ButtonVariant },
    { status: "Ready", value: "ready", variant: "linkHover2" as ButtonVariant },
    { status: "Completed", value: "completed", variant: "linkHover2" as ButtonVariant },
    { status: "Cancelled", value: "cancelled", variant: "linkHover2" as ButtonVariant },
  ];
</script>
