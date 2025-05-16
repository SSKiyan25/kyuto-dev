<template>
  <div class="mb-24">
    <UiDivider class="my-4" />

    <div class="mb-4 flex items-center justify-between">
      <p class="text-xs text-muted-foreground">{{ filteredOrders.length }} orders found</p>

      <!-- Export options - Show on all devices -->
      <div class="flex gap-2">
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

        <!-- Tooltip with instructions - added pointer-events-none to prevent click interference -->
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

        <!-- Helper text below input -->
        <p class="mt-1 text-xs text-muted-foreground">Type at least 3 characters to search</p>
      </div>
    </div>

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
      <div v-if="filteredOrders.length === 0" class="py-8 text-center text-muted-foreground">
        {{
          searchTerm
            ? `No orders matching "${searchTerm}"`
            : "No orders found for the selected status."
        }}
      </div>

      <div
        v-for="order in filteredOrders"
        :key="order.id"
        class="rounded-lg border bg-card p-4 shadow-sm"
      >
        <!-- Order Header -->
        <div class="mb-2 flex items-center justify-between">
          <span class="font-semibold">Ref: {{ order.uniqRefNumber }}</span>
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
    </div>

    <!-- Dialogs -->
    <UiDialog v-model:open="viewOrderDialog">
      <UiDialogContent
        class="overflow-y-auto bg-card sm:max-h-[750px]"
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
              <div class="grid grid-cols-1 gap-2 text-sm">
                <div class="flex justify-between">
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
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Email:</span>
                  <span>{{ selectedOrder?.buyerAccountDetails?.email || "N/A" }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-muted-foreground">Phone:</span>
                  <span>{{ selectedOrder?.buyerAccountDetails?.phoneNumber || "N/A" }}</span>
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
                    <p class="text-xs text-muted-foreground">
                      {{ item.variationDetails?.value || "No variation" }} × {{ item.quantity }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p>₱{{ (item.priceWithCommission * item.quantity).toFixed(2) }}</p>
                    <p class="text-xs text-muted-foreground">
                      ₱{{ item.priceWithCommission }} each
                    </p>
                  </div>
                </div>
              </div>

              <!-- Order summary -->
              <div class="mt-3 space-y-2 border-t pt-2">
                <div class="flex justify-between text-sm">
                  <span class="text-muted-foreground">Subtotal:</span>
                  <span>₱{{ Number(computeSubtotal(selectedOrder?.orderItems)).toFixed(2) }}</span>
                </div>
                <div class="flex justify-between text-sm font-bold">
                  <span>Total:</span>
                  <span>₱{{ Number(selectedOrder?.totalPrice).toFixed(2) }}</span>
                </div>
              </div>
            </div>

            <!-- Status change actions -->
            <div class="rounded-lg border bg-card/50 p-3">
              <h3 class="mb-3 flex items-center gap-2 font-medium">
                <Icon name="lucide:settings" class="h-4 w-4 text-muted-foreground" />
                Order Actions
              </h3>

              <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
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
      </UiDialogContent>
    </UiDialog>
    <!-- Cancel Order Dialog -->
    <UiDialog v-model:open="viewCancelDialog">
      <UiDialogContent
        title="Cancel Order"
        description="Are you sure you want to cancel this order?"
      >
        <template #content>
          <div class="flex flex-col gap-3">
            <p>Cancelling the order will release reserved stocks back to inventory.</p>

            <div class="flex flex-col gap-1">
              <span class="text-sm font-medium">Order Reference:</span>
              <span class="font-semibold">{{ selectedOrder?.uniqRefNumber }}</span>
            </div>

            <div class="mt-2">
              <label for="cancel-reason" class="mb-1 block text-sm font-medium">
                Cancellation Reason <span class="text-red-500">*</span>
              </label>
              <UiTextarea
                id="cancel-reason"
                v-model="cancelReason"
                placeholder="Please explain why you're cancelling this order..."
                class="w-full resize-none"
                :class="{ 'border-red-500 focus:ring-red-500': reasonError }"
                :rows="3"
                maxlength="200"
              />
              <div v-if="reasonError" class="mt-1 text-xs text-red-500">
                {{ reasonError }}
              </div>
              <div class="mt-1 flex justify-end text-xs text-muted-foreground">
                {{ cancelReason.length }}/200
              </div>
            </div>
          </div>
        </template>
        <template #footer>
          <UiDialogFooter>
            <UiButton variant="outline" @click="closeCancel" :disabled="statusLoading">
              Cancel
            </UiButton>
            <UiButton
              variant="destructive"
              @click="confirmCancelOrder"
              :disabled="statusLoading || !isReasonValid"
            >
              {{ statusLoading ? "Processing..." : "Confirm" }}
            </UiButton>
          </UiDialogFooter>
        </template>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script lang="ts" setup>
  import { useExportOrders } from "~/composables/organization/orders/useExportOrders";
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import { Timestamp } from "firebase/firestore";
  import type {
    ExtendedOrder,
    ExtendedOrderItem,
  } from "~/composables/organization/orders/useFetchFilterOrders";
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
  const hideClose = ref(false);
  const expandedOrders = ref<string[]>([]);
  const cancelReason = ref("");
  const reasonError = ref("");

  // Inside <script setup>
  const { isMobileDevice, exportToPdf, exportToExcel } = useExportOrders();

  // Create a reactive property based on the function result
  const isMobileDeviceValue = ref(isMobileDevice());

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
  const fetchOrders = async (status: string) => {
    loading.value = true;
    try {
      const fetchedOrders = await fetchFilteredOrders(props.organizationID, status);
      orders.value = fetchedOrders;
      allOrders.value = status === "all" ? fetchedOrders : allOrders.value; // Store all orders if "all" selected
      selectedStatus.value = status;
    } catch (error) {
      console.error("Error fetching orders:", error);
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

  // Status styles
  const getStatusClass = (status: string) => {
    let baseClass = "text-xs px-2 py-1 rounded capitalize";
    if (status === "pending") return `${baseClass} bg-yellow-200 text-yellow-800`;
    if (status === "cancelled") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "completed") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "ready") return `${baseClass} bg-blue-200 text-blue-800`;
    if (status === "preparing") return `${baseClass} bg-purple-200 text-purple-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
  };

  const getPaymentClass = (status: string) => {
    let baseClass = "text-xs px-2 py-1 rounded capitalize";
    if (status === "paid") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "not_paid") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "partial") return `${baseClass} bg-yellow-200 text-yellow-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
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

  // View cancel order
  const viewCancelOrder = (order: ExtendedOrder) => {
    selectedOrder.value = order;
    viewCancelDialog.value = true;
  };

  // Compute subtotal
  const computeSubtotal = (orderItems: ExtendedOrderItem[] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce(
      (subtotal, item) => subtotal + item.priceWithCommission * item.quantity,
      0
    );
  };

  const confirmCancelOrder = async () => {
    // Validate reason first
    if (!validateReason()) {
      return;
    }

    statusLoading.value = true;
    if (selectedOrder.value && selectedOrder.value.id && selectedOrder.value.orderItems) {
      try {
        // Use the sanitized reason from the input
        await cancelOrder(
          selectedOrder.value.id,
          cancelReason.value.trim(),
          selectedOrder.value.orderItems
        );

        // Update order in list
        const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
        if (updatedOrder) {
          const index = orders.value.findIndex((order) => order.id === updatedOrder.id);
          if (index !== -1) {
            orders.value[index] = updatedOrder;
          }
          emit("update-commission");
        }
      } catch (error) {
        console.error("Error cancelling order:", error);
      }
    }

    // Reset and close
    closeCancel();
    statusLoading.value = false;
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

      // Update the order in the list
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
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
      // Show error notification
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

      // Update the order in the list
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
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
      // Show error notification
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

      // Update the order in the list
      const updatedOrder = await fetchOrderDetails(selectedOrder.value.id);
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
      // Show error notification
    } finally {
      statusLoading.value = false;
    }
  };

  // Compute whether reason is valid
  const isReasonValid = computed(() => {
    return cancelReason.value.trim().length >= 10 && !reasonError.value;
  });

  // Validate reason input against malicious content
  const validateReason = (): boolean => {
    // Reset error
    reasonError.value = "";

    // Check for minimum length
    if (cancelReason.value.trim().length < 10) {
      reasonError.value = "Please provide a reason with at least 10 characters";
      return false;
    }

    // Check for potentially dangerous content
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+=/i, // onclick, onload, etc.
      /data:/i, // data URIs
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(cancelReason.value)) {
        reasonError.value = "Invalid characters detected in reason";
        return false;
      }
    }

    return true;
  };

  const closeCancel = () => {
    viewCancelDialog.value = false;
    cancelReason.value = "";
    reasonError.value = "";
  };
</script>
