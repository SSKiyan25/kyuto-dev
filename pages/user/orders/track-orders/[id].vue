<template>
  <!-- Loading Overlay -->
  <OrdersLoadingOverlay
    :is-loading="isPageLoading"
    title="Loading Orders"
    description="Please wait while we fetch your order data..."
  />

  <div class="flex min-h-screen w-full flex-col px-4 py-4 sm:px-8">
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
      <div class="order-list-section mb-24 flex flex-col py-8">
        <h2 class="mb-2 text-lg font-semibold">Your Orders</h2>
        <p class="mb-3 text-xs text-muted-foreground">
          View and manage all your recent orders. Use the search box to find specific orders.
        </p>

        <!-- Search Box -->
        <div class="relative mb-4">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon name="lucide:search" class="h-4 w-4 text-muted-foreground" />
          </div>
          <input
            v-model="searchTerm"
            type="text"
            placeholder="Search by reference number, status, or date..."
            class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
          />
          <button
            v-if="searchTerm"
            @click="searchTerm = ''"
            class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
          >
            <Icon name="lucide:x" class="h-4 w-4 text-muted-foreground hover:text-foreground" />
          </button>
        </div>

        <!-- Order Status Filter -->
        <OrdersListFilter v-model="selectedStatus" :statuses="statuses" @filter="filterOrders" />
        <UiDivider />

        <!-- Orders List -->
        <div class="mb-16 mt-4 w-full">
          <!-- No Orders Message -->
          <div
            v-if="filteredOrders.length === 0"
            class="flex flex-col items-center justify-center py-8 text-center"
          >
            <div class="rounded-full bg-muted p-4">
              <Icon name="lucide:package-open" class="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 class="mt-4 text-lg font-medium">No orders found</h3>
            <p class="mt-2 max-w-md text-sm text-muted-foreground">
              {{
                searchTerm || selectedStatus !== "all"
                  ? "Try changing your search or filter settings."
                  : "You haven't placed any orders yet. Start shopping to see your orders here."
              }}
            </p>
            <UiButton
              v-if="searchTerm || selectedStatus !== 'all'"
              variant="outline"
              class="mt-4"
              @click="resetFilters"
            >
              Reset filters
            </UiButton>
          </div>

          <!-- Order Card List -->
          <TransitionGroup
            name="list-transition"
            tag="div"
            class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          >
            <div
              v-for="order in paginatedOrders"
              :key="order.id"
              class="group flex flex-col rounded-lg border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md"
            >
              <!-- Card Header -->
              <div class="mb-3 flex items-start justify-between">
                <div>
                  <!-- Reference Number -->
                  <p class="font-mono text-sm font-medium">{{ order.uniqRefNumber }}</p>
                  <!-- Date -->
                  <p class="mt-1 text-xs text-muted-foreground">
                    {{ formatDate(order.dateOrdered) }}
                  </p>
                </div>

                <!-- Status Badges -->
                <div class="flex flex-col gap-1.5">
                  <div
                    :class="getStatusClass(order.orderStatus)"
                    class="flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    <Icon name="lucide:package" class="mr-1.5 h-3 w-3" />
                    <span class="capitalize">{{ order.orderStatus }}</span>
                  </div>
                  <div
                    :class="getPaymentClass(order.paymentStatus)"
                    class="flex items-center rounded-full px-2.5 py-1 text-xs font-medium"
                  >
                    <Icon
                      :name="
                        order.paymentStatus === 'paid'
                          ? 'lucide:check-circle'
                          : 'lucide:credit-card'
                      "
                      class="mr-1.5 h-3 w-3"
                    />
                    <span class="capitalize">{{ order.paymentStatus || "not_paid" }}</span>
                  </div>
                </div>
              </div>

              <!-- Order Amount -->
              <div class="mb-3 flex items-baseline justify-between border-t border-border pt-3">
                <span class="text-sm text-muted-foreground">Total Amount:</span>
                <span class="text-lg font-semibold">₱{{ order.totalPrice.toFixed(2) }}</span>
              </div>

              <!-- Order Items Preview -->
              <div class="mb-4 flex-grow">
                <div
                  class="flex cursor-pointer items-center justify-between text-sm"
                  @click="toggleOrderDetails(order.id)"
                >
                  <span class="font-medium">Order Items</span>
                  <Icon
                    :name="
                      expandedOrders.includes(order.id)
                        ? 'lucide:chevron-up'
                        : 'lucide:chevron-down'
                    "
                    class="h-4 w-4 transition-transform"
                  />
                </div>

                <!-- Expanded Order Items -->
                <div
                  v-if="expandedOrders.includes(order.id)"
                  class="mt-2 space-y-2 rounded-md bg-muted/30 p-3 text-xs"
                >
                  <div
                    v-for="(item, idx) in order.orderItems"
                    :key="idx"
                    class="flex justify-between"
                  >
                    <div class="flex-1 pr-2">
                      <span class="font-medium">{{ item.productDetails?.name || "Product" }}</span>
                      <span v-if="item.variationDetails?.value" class="text-muted-foreground">
                        ({{ item.variationDetails.value }})
                      </span>
                    </div>
                    <div class="text-right">
                      <span>x{{ item.quantity }}</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex justify-end gap-2 border-t border-border pt-3">
                <UiButton
                  variant="outline"
                  size="sm"
                  @click="openViewOrderDialog(order.id)"
                  class="h-9"
                >
                  <Icon name="lucide:eye" class="mr-1 h-3.5 w-3.5" />
                  View Details
                </UiButton>

                <UiButton
                  v-if="order.orderStatus === 'pending'"
                  variant="destructive"
                  size="sm"
                  @click="openCancelOrderDialog(order.id)"
                  class="h-9"
                >
                  <Icon name="lucide:x" class="mr-1 h-3.5 w-3.5" />
                  Cancel
                </UiButton>
              </div>
            </div>
          </TransitionGroup>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="mt-8 flex items-center justify-center">
            <UiPagination>
              <UiPaginationContent>
                <UiPaginationItem :value="1">
                  <UiPaginationPrevious @click="prevPage" :disabled="currentPage === 1" />
                </UiPaginationItem>

                <template v-for="page in paginationRange" :key="page">
                  <UiPaginationItem v-if="page !== '...'" :value="Number(page)">
                    <UiPaginationLink :is-active="currentPage === page" @click="goToPage(page)">
                      {{ page }}
                    </UiPaginationLink>
                  </UiPaginationItem>
                  <UiPaginationEllipsis v-else />
                </template>

                <UiPaginationItem :value="totalPages">
                  <UiPaginationNext @click="nextPage" :disabled="currentPage === totalPages" />
                </UiPaginationItem>
              </UiPaginationContent>
            </UiPagination>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Dialogs -->
  <OrdersDialogCancelOrder
    v-model:isOpen="cancelOrderDialog"
    :orderId="selectedOrderID"
    @cancelOrder="handleCancelOrder"
  />

  <OrdersDialogViewOrder
    v-model:isOpen="viewOrderDialog"
    :order="selectedOrder"
    @cancelOrder="openCancelOrderDialog"
  />
</template>

<script lang="ts" setup>
  import { useOrdersPage } from "~/composables/user/useOrdersPage";
  import type { ButtonVariant } from "~/types/Button";

  definePageMeta({
    middleware: "user-auth",
    layout: "user",
  });

  const route = useRoute();
  const userID = computed(() => route.params.id as string);

  // Get all order management functionality from the composable
  const {
    // State
    isPageLoading,
    recentOrder,
    filteredOrders,
    selectedStatus,
    searchTerm,
    expandedOrders,
    cancelOrderDialog,
    viewOrderDialog,
    selectedOrderID,
    selectedOrder,
    currentPage,

    // Methods
    loadOrderData,
    filterOrders,
    resetFilters,
    refreshOrders,
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
  } = useOrdersPage(userID.value);

  // Filter status options
  const statuses = [
    { status: "All", value: "all", variant: "linkHover1" as ButtonVariant },
    { status: "Pending", value: "pending", variant: "linkHover2" as ButtonVariant },
    { status: "Preparing", value: "preparing", variant: "linkHover2" as ButtonVariant },
    { status: "Ready", value: "ready", variant: "linkHover2" as ButtonVariant },
    { status: "Completed", value: "completed", variant: "linkHover2" as ButtonVariant },
    { status: "Cancelled", value: "cancelled", variant: "linkHover2" as ButtonVariant },
  ];

  // Responsive design handling
  const isMobile = ref(false);
  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  // Setup and cleanup
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

  // Watch for changes in search term
  watch(searchTerm, () => {
    if (typeof filterOrders === "function") {
      filterOrders(selectedStatus.value);
    }
  });
</script>

<style scoped>
  .list-transition-move,
  .list-transition-enter-active,
  .list-transition-leave-active {
    transition: all 0.3s ease;
  }

  .list-transition-enter-from,
  .list-transition-leave-to {
    opacity: 0;
    transform: translateY(20px);
  }

  .list-transition-leave-active {
    position: absolute;
  }
</style>
