<template>
  <div class="mb-24">
    <UiDivider class="my-4" />

    <div class="mb-4 flex items-center justify-between">
      <p class="text-xs text-muted-foreground">{{ filteredOrders.length }} orders found</p>

      <!-- Export options - Show on all devices -->
      <div class="flex gap-2">
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
        <OrganizationMobileExportButton
          :orders="filteredOrders"
          :current-status="selectedStatus"
          :is-mobile="isMobileDeviceValue"
        />
      </div>
    </div>

    <!-- Search input with enhanced instructions -->
    <div class="mb-4 w-full">
      <div class="group relative">
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search orders (ref #, email, customer name, date...)"
          aria-label="Search orders by reference number, email, name or date"
          class="w-full rounded-md border px-10 py-2 text-xs focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
          @input="debounceSearch"
        />
        <Icon name="lucide:search" class="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <button
          v-if="searchTerm"
          @click="clearSearch"
          class="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
        >
          <Icon name="lucide:x" class="h-4 w-4" />
        </button>

        <!-- Tooltip with instructions -->
        <div
          class="pointer-events-none absolute -top-14 left-0 hidden w-full rounded-md bg-popover p-3 text-xs shadow-md group-hover:block"
        >
          <p class="font-medium">Search by:</p>
          <ul class="ml-2 mt-1 list-disc space-y-0.5">
            <li>Reference number (e.g., "ORD12345")</li>
            <li>Customer email or name</li>
            <li>Order date (e.g., "May 2025")</li>
          </ul>
        </div>

        <p class="mt-1 text-xs text-muted-foreground">Type at least 3 characters to search</p>
      </div>
    </div>

    <!-- Status filter buttons -->
    <div class="flex flex-row flex-wrap gap-2 pt-4 opacity-70">
      <template v-for="status in statuses" :key="status.value">
        <UiButton
          :variant="statusVariant(status.value)"
          @click="fetchOrders(status.value)"
          class="mb-2 text-xs"
        >
          {{ status.status }}
        </UiButton>
      </template>
    </div>
    <UiDivider />

    <!-- Loading indicator -->
    <div v-if="loading" class="flex w-full flex-col items-center justify-center gap-3 py-5">
      <Icon name="lucide:loader-circle" class="h-16 w-16 animate-spin text-primary" />
      <span class="text-sm text-gray-600">Loading orders...</span>
    </div>

    <!-- Order cards list -->
    <div v-else class="flex flex-col gap-4 py-3">
      <!-- No orders message -->
      <div v-if="filteredOrders.length === 0" class="py-8 text-center text-muted-foreground">
        {{
          searchTerm
            ? `No orders matching "${searchTerm}"`
            : "No orders found for the selected status."
        }}
      </div>

      <!-- Items per page selector -->
      <div v-if="filteredOrders.length > 0" class="mb-3 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-xs text-muted-foreground">Items per page:</span>
          <UiSelect v-model="itemsPerPageString">
            <UiSelectTrigger class="h-8 w-20 text-xs">
              <UiSelectValue placeholder="Select" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem
                  v-for="option in itemsPerPageOptions"
                  :key="option"
                  :value="String(option)"
                  :text="String(option)"
                />
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
        </div>
        <div class="text-xs text-muted-foreground">
          Showing {{ startIndex + 1 }}-{{ Math.min(endIndex, filteredOrders.length) }} of
          {{ filteredOrders.length }} orders
        </div>
      </div>

      <!-- Order cards -->
      <div
        v-for="(order, index) in paginatedOrders"
        :key="order.id"
        class="rounded-lg border bg-card p-4 shadow-sm"
      >
        <!-- Order Header -->
        <span
          class="inline-flex items-center justify-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
        >
          Order #{{ startIndex + index + 1 }}
        </span>
        <div class="mb-2 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-semibold">Ref: {{ order.uniqRefNumber }}</span>
          </div>
          <div class="flex items-center gap-2">
            <!-- Order Status Badge -->
            <div :class="getStatusClass(order.orderStatus)">
              {{ order.orderStatus }}
            </div>

            <!-- Payment Status Badge -->
            <div :class="getPaymentClass(order.paymentStatus)">
              {{ order.paymentStatus }}
            </div>
          </div>
        </div>

        <!-- Order Info -->
        <div class="space-y-2 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Buyer:</span>
            <span>{{ order.buyerAccountDetails?.email || "N/A" }}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-muted-foreground">Date:</span>
            <span>{{ formatDate(order.dateOrdered) }}</span>
          </div>

          <!-- Products preview (collapsed) -->
          <div>
            <div
              class="flex cursor-pointer items-center justify-between"
              @click="toggleProductDetails(order.id)"
            >
              <span class="text-muted-foreground">Products:</span>
              <Icon
                :name="
                  expandedOrders.includes(order.id) ? 'lucide:chevron-up' : 'lucide:chevron-down'
                "
                class="h-4 w-4"
              />
            </div>

            <!-- Expanded products list -->
            <div v-if="expandedOrders.includes(order.id)" class="mt-2 space-y-1 border-l-2 pl-4">
              <div v-for="(item, idx) in order.orderItems" :key="idx" class="text-xs">
                {{ item.productDetails?.name || "Unknown Product" }}
                {{ item.variationDetails?.value ? `(${item.variationDetails.value})` : "" }}
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="mt-4 flex justify-end">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-8 text-xs" size="sm">Actions</UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-40">
              <UiDropdownMenuLabel>Actions</UiDropdownMenuLabel>
              <UiDropdownMenuItem @click="viewOrder(order)">View Order</UiDropdownMenuItem>
              <UiDropdownMenuItem
                v-if="order.orderStatus !== 'cancelled' && order.orderStatus !== 'completed'"
                @click="viewCancelOrder(order)"
              >
                Cancel Order
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </div>
      </div>

      <!-- Pagination controls -->
      <div v-if="totalPages > 1" class="mt-4 flex items-center justify-between">
        <UiButton
          variant="outline"
          size="sm"
          @click="prevPage"
          :disabled="currentPage === 1"
          class="h-8 w-24 text-xs"
        >
          <Icon name="lucide:chevron-left" class="mr-1 h-4 w-4" />
          Previous
        </UiButton>

        <div class="flex items-center space-x-1">
          <UiButton
            v-for="page in paginationRange"
            :key="page"
            :variant="currentPage === page ? 'default' : 'outline'"
            size="sm"
            @click="goToPage(page)"
            class="h-8 w-8 p-0 text-xs"
          >
            {{ page }}
          </UiButton>
        </div>

        <UiButton
          variant="outline"
          size="sm"
          @click="nextPage"
          :disabled="currentPage === totalPages"
          class="h-8 w-24 text-xs"
        >
          Next
          <Icon name="lucide:chevron-right" class="ml-1 h-4 w-4" />
        </UiButton>
      </div>
    </div>

    <!-- Reuse OrderDetailDialog component -->
    <OrganizationOrdersOrderDetailDialog
      :open="viewOrderDialog"
      :order="selectedOrder"
      :status-loading="statusLoading"
      :order-details-loading="orderDetailsLoading"
      @close="closeDialog"
      @mark-as-ready="handleMarkAsReady"
      @mark-as-paid="handleMarkAsPaid"
      @mark-as-claimed="handleMarkAsClaimed"
      @view-cancel-order="viewCancelOrder"
      @update:open="viewOrderDialog = $event"
    />

    <!-- Reuse CancelOrderDialog component -->
    <OrganizationOrdersCancelOrderDialog
      :open="viewCancelDialog"
      :order="selectedOrder"
      :status-loading="statusLoading"
      @close="closeCancel"
      @confirm="confirmCancelOrder"
      @update:open="viewCancelDialog = $event"
    />
  </div>
</template>

<script lang="ts" setup>
  import { useExportOrders } from "~/composables/organization/orders/useExportOrders";
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import { useOrderUtils } from "~/utils/useOrderUtils";
  import { Timestamp } from "firebase/firestore";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { ButtonVariant } from "~/types/Button";

  const props = defineProps<{ organizationID: string }>();
  const emit = defineEmits(["update-commission"]);

  // State
  const searchTerm = ref("");
  const allOrders = ref<ExtendedOrder[]>([]);
  const orders = ref<ExtendedOrder[]>([]);
  const loading = ref(false);
  const selectedStatus = ref<string>("all");
  const selectedOrder = ref<ExtendedOrder | null>(null);
  const viewOrderDialog = ref(false);
  const viewCancelDialog = ref(false);
  const statusLoading = ref(false);
  const orderDetailsLoading = ref(false);
  const expandedOrders = ref<string[]>([]);

  // Get utils
  const { getStatusClass, getPaymentClass, computeSubtotal } = useOrderUtils();

  // Inside <script setup>
  const { isMobileDevice } = useExportOrders();

  // Create a reactive property based on the function result
  const isMobileDeviceValue = ref(isMobileDevice());

  // Pagination state
  const currentPage = ref(1);
  const itemsPerPage = ref(10); // Default to 10 items per page
  const itemsPerPageOptions = [5, 10, 20, 50];

  const itemsPerPageString = computed({
    get: () => String(itemsPerPage.value),
    set: (val: string) => {
      itemsPerPage.value = Number(val);
    },
  });

  // Update on mount to ensure client-side detection
  onMounted(() => {
    isMobileDeviceValue.value = isMobileDevice();
  });

  // Fetch orders composable
  const {
    fetchFilteredOrders,
    markAsReady,
    markAsClaimed,
    markAsPaid,
    cancelOrder,
    fetchOrderDetails,
    invalidateOrganizationCache,
    clearBuyerCaches,
  } = useFetchFilterOrders();

  const statuses = [
    { status: "All Orders", value: "all", variant: "linkHover1" },
    { status: "Pending", value: "pending", variant: "linkHover2" },
    { status: "Ready", value: "ready", variant: "linkHover2" },
    { status: "Completed", value: "completed", variant: "linkHover2" },
    { status: "Preparing", value: "preparing", variant: "linkHover2" },
    { status: "Cancelled", value: "cancelled", variant: "linkHover2" },
  ];

  const filteredOrders = computed(() => {
    if (!searchTerm.value) return orders.value;

    const searchTermLower = searchTerm.value.toLowerCase();

    return orders.value.filter((order) => {
      // Search by reference number
      if (order.uniqRefNumber?.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Search by buyer email
      if (order.buyerAccountDetails?.email?.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Search by buyer name
      const buyerName = [order.buyerAccountDetails?.firstname, order.buyerAccountDetails?.lastname]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (buyerName && buyerName.includes(searchTermLower)) {
        return true;
      }

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

        if (formattedDate.includes(searchTermLower)) {
          return true;
        }
      }

      return false;
    });
  });

  // Add debouncing for search input
  const debounceTimeout = ref<NodeJS.Timeout | null>(null);

  const debounceSearch = () => {
    if (debounceTimeout.value) {
      clearTimeout(debounceTimeout.value);
    }
    debounceTimeout.value = setTimeout(() => {
      // No additional action needed as we're using computed properties
    }, 300);
  };

  const clearSearch = () => {
    searchTerm.value = "";
  };

  // Fetch orders
  const fetchOrders = async (status: string, forceRefresh = false) => {
    loading.value = true;
    currentPage.value = 1; // Reset to first page when changing status
    try {
      // Use forceRefresh parameter to control cache usage
      const fetchedOrders = await fetchFilteredOrders(props.organizationID, status, forceRefresh);
      orders.value = fetchedOrders;
      allOrders.value = status === "all" ? fetchedOrders : allOrders.value;
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
      // Add this line to update the UI:
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

  // Format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp) return "N/A";
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  };

  // Toggle product details
  const toggleProductDetails = (orderId: string) => {
    if (expandedOrders.value.includes(orderId)) {
      expandedOrders.value = expandedOrders.value.filter((id) => id !== orderId);
    } else {
      expandedOrders.value.push(orderId);
    }
  };

  // View order
  const viewOrder = (order: ExtendedOrder) => {
    selectedOrder.value = order;
    viewOrderDialog.value = true;
  };

  // Close dialog
  const closeDialog = () => {
    viewOrderDialog.value = false;
  };

  // View cancel order
  const viewCancelOrder = (order: ExtendedOrder) => {
    selectedOrder.value = order;
    viewCancelDialog.value = true;
  };

  const confirmCancelOrder = async (reason: string) => {
    statusLoading.value = true;
    if (selectedOrder.value && selectedOrder.value.id && selectedOrder.value.orderItems) {
      try {
        await cancelOrder(selectedOrder.value.id, reason.trim(), selectedOrder.value.orderItems);

        // Force refresh to get the updated order
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
        if (updatedOrder) {
          const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
          if (index !== -1) {
            orders.value[index] = updatedOrder;
          }

          // Also refresh the filtered orders
          await fetchOrders(selectedStatus.value, true);

          emit("update-commission");
        }

        useToast().toast({
          title: "Order Cancelled",
          description: "The order has been cancelled successfully.",
          duration: 3000,
          icon: "lucide:check",
        });
      } catch (error) {
        console.error("Error cancelling order:", error);
        useToast().toast({
          title: "Error",
          description: "There was an error cancelling the order.",
          duration: 3000,
          icon: "lucide:alert-triangle",
          variant: "destructive",
        });
      }
    }

    // Reset and close
    closeCancel();
    statusLoading.value = false;
  };

  // Close cancel dialog
  const closeCancel = () => {
    viewCancelDialog.value = false;
  };

  // Button variant
  const statusVariant = (status: string): ButtonVariant => {
    return status === selectedStatus.value ? "default" : "outline";
  };

  // Fetch initial orders
  onMounted(() => {
    fetchOrders("all");
  });

  const handleMarkAsReady = async () => {
    if (!selectedOrder.value || !selectedOrder.value.id) return;

    statusLoading.value = true;
    try {
      await markAsReady(selectedOrder.value.id, selectedOrder.value.orderStatus || "");

      // Force refresh to get the updated order
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
      if (updatedOrder) {
        // Update selected order for the dialog
        selectedOrder.value = updatedOrder;

        // Update order in the orders list
        const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
        if (index !== -1) {
          orders.value[index] = updatedOrder;
        }

        emit("update-commission");
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
    }
  };

  // Mark order as claimed
  const handleMarkAsClaimed = async () => {
    if (!selectedOrder.value || !selectedOrder.value.id || !selectedOrder.value.orderItems) return;

    statusLoading.value = true;
    try {
      await markAsClaimed(
        selectedOrder.value.id,
        selectedOrder.value.orderStatus || "",
        selectedOrder.value.orderItems
      );

      // Force refresh to get the updated order
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
      if (updatedOrder) {
        // Update selected order for the dialog
        selectedOrder.value = updatedOrder;

        // Update order in the orders list
        const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
        if (index !== -1) {
          orders.value[index] = updatedOrder;
        }

        emit("update-commission");
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
    }
  };

  // Mark order as paid
  const handleMarkAsPaid = async () => {
    if (!selectedOrder.value || !selectedOrder.value.id) return;

    statusLoading.value = true;
    try {
      await markAsPaid(selectedOrder.value.id, selectedOrder.value.paymentStatus || "");

      // Force refresh to get the updated order
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id, true);
      if (updatedOrder) {
        // Update selected order for the dialog
        selectedOrder.value = updatedOrder;

        // Update order in the orders list
        const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
        if (index !== -1) {
          orders.value[index] = updatedOrder;
        }

        emit("update-commission");
      }
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
    }
  };

  // Compute the total number of pages
  const totalPages = computed(() => {
    return Math.ceil(filteredOrders.value.length / itemsPerPage.value);
  });

  // Calculate start and end indices for the current page
  const startIndex = computed(() => (currentPage.value - 1) * itemsPerPage.value);
  const endIndex = computed(() => startIndex.value + itemsPerPage.value);

  // Compute the current page's orders
  const paginatedOrders = computed(() => {
    return filteredOrders.value.slice(startIndex.value, endIndex.value);
  });

  // Create a range of page numbers to display (with ellipsis for large ranges)
  const paginationRange = computed(() => {
    const range = [];
    const maxVisiblePages = 5;

    if (totalPages.value <= maxVisiblePages) {
      // Show all pages if total is less than max visible
      for (let i = 1; i <= totalPages.value; i++) {
        range.push(i);
      }
    } else {
      // Always show first page
      range.push(1);

      // Calculate center range
      const leftBound = Math.max(2, currentPage.value - 1);
      const rightBound = Math.min(totalPages.value - 1, currentPage.value + 1);

      // Add ellipsis if needed before left bound
      if (leftBound > 2) {
        range.push("...");
      }

      // Add center pages
      for (let i = leftBound; i <= rightBound; i++) {
        range.push(i);
      }

      // Add ellipsis if needed after right bound
      if (rightBound < totalPages.value - 1) {
        range.push("...");
      }

      // Always show last page
      range.push(totalPages.value);
    }

    return range;
  });

  // Navigation methods
  const goToPage = (page: number | string) => {
    if (typeof page === "number") {
      currentPage.value = page;
    }
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      currentPage.value++;
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      currentPage.value--;
    }
  };

  // Watch for changes that should reset pagination
  watch([searchTerm, selectedStatus, itemsPerPage], () => {
    currentPage.value = 1;
  });
</script>
