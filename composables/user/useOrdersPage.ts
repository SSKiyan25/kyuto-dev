import { useFetchOrders } from "~/composables/user/useFetchOrders";
import { Timestamp } from "firebase/firestore";
import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
import type { ButtonVariant } from "~/types/Button";
import type { Order } from "~/types/models/Order";

export const useOrdersPage = (userID: string) => {
  // State
  const isPageLoading = ref(false);
  const recentOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);
  const orders = ref<(Order & { id: string; orderItems: ExtendedOrderItem[] })[]>([]);
  const filteredOrders = ref<(Order & { id: string; orderItems: ExtendedOrderItem[] })[]>([]);
  const selectedStatus = ref<string>("all");
  const searchTerm = ref("");
  const expandedOrders = ref<string[]>([]);

  // Dialogs state
  const cancelOrderDialog = ref(false);
  const viewOrderDialog = ref(false);
  const selectedOrderID = ref<string | null>(null);
  const selectedOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);

  // Pagination state
  const currentPage = ref(1);
  const itemsPerPage = ref(6); // Default items per page - adjusted for card layout

  // Get services
  const { fetchUserOrders, fetchLatestOrder, cancelOrder, fetchOrderItems } = useFetchOrders();

  // Toggle order details expansion
  const toggleOrderDetails = (orderId: string) => {
    if (expandedOrders.value.includes(orderId)) {
      expandedOrders.value = expandedOrders.value.filter((id) => id !== orderId);
    } else {
      expandedOrders.value.push(orderId);
    }
  };

  // Load data
  async function loadOrderData() {
    const userOrders = await fetchUserOrders(userID);
    orders.value = userOrders;
    applyFilters();
    await refreshLatestOrder();
  }

  // Apply both status filter and search filter
  const applyFilters = () => {
    let result = orders.value;

    // Apply status filter
    if (selectedStatus.value !== "all") {
      if (selectedStatus.value === "not_paid") {
        result = result.filter((order) => order.paymentStatus === selectedStatus.value);
      } else {
        result = result.filter((order) => order.orderStatus === selectedStatus.value);
      }
    }

    // Apply search filter
    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase().trim();
      result = result.filter((order) => {
        // Search by reference number
        if (order.uniqRefNumber?.toLowerCase().includes(term)) return true;

        // Search by status
        if (order.orderStatus?.toLowerCase().includes(term)) return true;
        if (order.paymentStatus?.toLowerCase().includes(term)) return true;

        // Search by date
        if (order.dateOrdered) {
          const date =
            order.dateOrdered instanceof Timestamp
              ? order.dateOrdered.toDate()
              : new Date(order.dateOrdered);

          const formattedDate = date
            .toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
            .toLowerCase();

          if (formattedDate.includes(term)) return true;
        }

        return false;
      });
    }

    filteredOrders.value = result;
    // Reset to first page when filters change
    currentPage.value = 1;
  };

  // Filter orders by status only
  const filterOrders = (status: string) => {
    selectedStatus.value = status;
    applyFilters();
  };

  // Reset all filters
  const resetFilters = () => {
    searchTerm.value = "";
    selectedStatus.value = "all";
    applyFilters();
  };

  // Refresh orders
  async function refreshOrders() {
    await refreshLatestOrder();
    try {
      const userOrders = await fetchUserOrders(userID);
      orders.value = userOrders;
      applyFilters();
    } catch (error) {
      console.error("Error refreshing orders:", error);
    }
  }

  // Get latest order
  const refreshLatestOrder = async () => {
    const latestOrder = await fetchLatestOrder(userID);
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
      if (!remarks || remarks.trim() === "") {
        console.error("Empty remarks detected in handler");
        throw new Error("Remarks cannot be empty");
      }

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
        description:
          error instanceof Error ? error.message : "There was an error cancelling the order.",
        duration: 5000,
        icon: "lucide:x",
      });
    }
  };

  // Status styling helpers
  const getStatusClass = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentClass = (status: string): string => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "not_paid":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-amber-100 text-amber-800";
      case "refunded":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-red-100 text-red-800"; // Default to not paid
    }
  };

  // Format date helper
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";

    try {
      const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);

      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Statistics helpers
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

  // Pagination computed properties
  const totalPages = computed(() => {
    return Math.ceil(filteredOrders.value.length / itemsPerPage.value);
  });

  const paginatedOrders = computed(() => {
    const startIndex = (currentPage.value - 1) * itemsPerPage.value;
    const endIndex = startIndex + itemsPerPage.value;
    return filteredOrders.value.slice(startIndex, endIndex);
  });

  // Pagination range with ellipsis for large page counts
  const paginationRange = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;

    // If 7 or fewer pages, show all
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Always show first, last, and pages around current
    let pages: (number | string)[] = [1];

    if (current <= 3) {
      // Near start: show 1,2,3,4,5,...,last
      pages.push(2, 3, 4, 5, "...", total);
    } else if (current >= total - 2) {
      // Near end: show 1,...,last-4,last-3,last-2,last-1,last
      pages.push("...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      // Middle: show 1,...,current-1,current,current+1,...,last
      pages.push("...", current - 1, current, current + 1, "...", total);
    }

    return pages;
  });

  // Navigation methods
  const goToPage = (page: number | string) => {
    if (typeof page === "number") {
      currentPage.value = page;
      // Scroll to top of orders section
      const ordersSection = document.querySelector(".order-list-section");
      ordersSection?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      goToPage(currentPage.value + 1);
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      goToPage(currentPage.value - 1);
    }
  };

  return {
    // State
    isPageLoading,
    recentOrder,
    orders,
    filteredOrders,
    selectedStatus,
    searchTerm,
    expandedOrders,
    cancelOrderDialog,
    viewOrderDialog,
    selectedOrderID,
    selectedOrder,
    currentPage,
    itemsPerPage,

    // Methods
    loadOrderData,
    applyFilters,
    filterOrders,
    resetFilters,
    refreshOrders,
    refreshLatestOrder,
    openViewOrderDialog,
    openCancelOrderDialog,
    handleCancelOrder,
    getStatusClass,
    getPaymentClass,
    formatDate,
    getPendingOrdersCount,
    getCompletedOrdersCount,
    toggleOrderDetails,
    goToPage,
    nextPage,
    prevPage,

    // Computed
    totalPages,
    paginatedOrders,
    paginationRange,
  };
};
