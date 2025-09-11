<template>
  <UiDialog :open="open" @update:open="$emit('update:open', $event)">
    <UiDialogContent
      class="bg-card sm:max-h-[750px] sm:max-w-[750px]"
      :title="`Order: ${order?.uniqRefNumber || ''}`"
      :hideClose="statusLoading"
    >
      <template #content>
        <div class="relative flex max-h-[600px] flex-col gap-5 overflow-y-auto">
          <!-- Loading overlays -->
          <div
            v-if="orderDetailsLoading"
            class="absolute inset-0 z-50 flex h-full flex-col items-center justify-center bg-secondary-foreground/5 backdrop-blur-sm"
          >
            <Icon name="lucide:loader-circle" class="h-12 w-12 animate-spin text-primary" />
            <p class="mt-2 text-sm font-medium">Loading order details...</p>
          </div>
          <div
            v-if="statusLoading"
            class="absolute inset-0 z-50 flex h-full flex-col items-center justify-center bg-secondary-foreground/10 backdrop-blur-sm"
          >
            <Icon name="lucide:loader-circle" class="h-20 w-20 animate-spin text-primary" />
            <p class="mt-4 font-medium">Updating order status...</p>
          </div>

          <!-- Order details -->
          <div class="flex flex-col gap-5">
            <!-- Status badges - improved spacing and alignment -->
            <div class="flex flex-wrap items-center gap-2">
              <div :class="getStatusClass(order?.orderStatus || '')">
                <Icon name="lucide:box" class="mr-1 h-3 w-3" />
                {{ order?.orderStatus }}
              </div>
              <div :class="getPaymentClass(order?.paymentStatus || '')">
                <Icon name="lucide:credit-card" class="mr-1 h-3 w-3" />
                {{ order?.paymentStatus === "not_paid" ? "Unpaid" : order?.paymentStatus }}
              </div>
              <div class="rounded bg-secondary px-2 py-1 text-xs text-secondary-foreground">
                <Icon name="lucide:calendar" class="mr-1 h-3 w-3" />
                {{ formatDate(order?.dateOrdered) }}
              </div>
            </div>

            <!-- Customer info - Redesigned with better layout -->
            <div class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:user" class="h-4 w-4 text-primary" />
                Customer Information
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Name</p>
                  <p class="text-sm">
                    {{
                      [order?.buyerAccountDetails?.firstname, order?.buyerAccountDetails?.lastname]
                        .filter(Boolean)
                        .join(" ") || "N/A"
                    }}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Email</p>
                  <p class="text-sm">{{ order?.buyerAccountDetails?.email || "N/A" }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Phone</p>
                  <p class="text-sm">{{ order?.buyerAccountDetails?.phoneNumber || "N/A" }}</p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Student ID</p>
                  <p class="text-sm">{{ order?.buyerAccountDetails?.studentID || "N/A" }}</p>
                </div>
              </div>
            </div>

            <!-- Order items - Redesigned with better card and spacing -->
            <div class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:shopping-cart" class="h-4 w-4 text-primary" />
                Order Items
              </h3>
              <div class="rounded-md border bg-card">
                <div class="space-y-1">
                  <div
                    v-for="(item, i) in order?.orderItems"
                    :key="item.productID"
                    class="flex items-start p-3"
                    :class="i !== 0 ? 'border-t' : ''"
                  >
                    <div class="flex-1 pr-4">
                      <p class="font-medium">
                        {{ item.productDetails?.name || "Unknown Product" }}
                      </p>
                      <div class="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                        <span
                          v-if="item.variationDetails?.value"
                          class="rounded-full bg-muted px-2 py-0.5"
                        >
                          {{ item.variationDetails.value }}
                        </span>
                        <span
                          v-if="item.isPreOrder"
                          class="rounded-full bg-amber-100 px-2 py-0.5 text-amber-800"
                        >
                          Pre-Order
                        </span>
                        <span class="rounded-full bg-muted px-2 py-0.5">
                          Qty: {{ item.quantity }}
                        </span>
                      </div>
                    </div>
                    <div class="text-right">
                      <p class="font-medium">
                        ₱{{ (item.priceWithCommission * item.quantity).toFixed(2) }}
                      </p>
                      <p class="mt-1 text-xs text-muted-foreground">
                        ₱{{ item.priceWithCommission.toFixed(2) }} each
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Order summary - Improved with better spacing and alignment -->
                <div class="border-t bg-muted/20 p-3">
                  <div class="space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Subtotal:</span>
                      <span
                        >₱{{
                          order && order.orderItems
                            ? computeSubtotal(order.orderItems).toFixed(2)
                            : "0.00"
                        }}</span
                      >
                    </div>
                    <div v-if="order?.discountValue" class="flex justify-between text-sm">
                      <span class="text-muted-foreground">Discount:</span>
                      <span class="text-red-600">-₱{{ order.discountValue.toFixed(2) }}</span>
                    </div>
                    <div class="flex justify-between pt-2 text-base font-bold">
                      <span>Total:</span>
                      <span>₱{{ order ? Number(order.totalPrice).toFixed(2) : "0.00" }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Payment info - Redesigned with better visual hierarchy -->
            <div class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:credit-card" class="h-4 w-4 text-primary" />
                Payment Information
              </h3>
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Method</p>
                  <p class="flex items-center gap-1.5 text-sm capitalize">
                    <Icon
                      :name="getPaymentMethodIcon(order?.paymentMethod)"
                      class="h-4 w-4 text-muted-foreground"
                    />
                    {{ order?.paymentMethod || "N/A" }}
                  </p>
                </div>
                <div class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Status</p>
                  <p
                    class="flex items-center gap-1.5 text-sm"
                    :class="getPaymentTextClass(order?.paymentStatus || '')"
                  >
                    <Icon :name="getPaymentStatusIcon(order?.paymentStatus)" class="h-4 w-4" />
                    {{
                      order?.paymentStatus === "not_paid" ? "Unpaid" : order?.paymentStatus || "N/A"
                    }}
                  </p>
                </div>
                <div v-if="order?.datePaid" class="space-y-1">
                  <p class="text-xs font-medium text-muted-foreground">Payment Date</p>
                  <p class="text-sm">{{ formatDate(order.datePaid, true) }}</p>
                </div>
              </div>
            </div>

            <!-- Remarks section - If available -->
            <div v-if="order?.remarks" class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:message-square" class="h-4 w-4 text-primary" />
                Order Remarks
              </h3>
              <p class="rounded bg-muted/30 p-2 text-sm italic text-muted-foreground">
                "{{ order.remarks }}"
              </p>
            </div>

            <!-- Order Timeline - Redesigned with better visual hierarchy -->
            <div class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:history" class="h-4 w-4 text-primary" />
                Order Timeline
              </h3>
              <div class="relative pl-5">
                <!-- Vertical timeline line -->
                <div class="absolute left-[9px] top-0 h-full w-0.5 bg-muted"></div>

                <!-- Timeline items -->
                <div v-if="order && timeline.length > 0" class="space-y-3">
                  <div v-for="(item, index) in timeline" :key="index" class="relative pb-3">
                    <!-- Timeline dot -->
                    <div
                      class="absolute -left-5 mt-1.5 h-4 w-4 rounded-full border-2 border-background bg-primary"
                    ></div>

                    <!-- Timeline content -->
                    <div class="ml-2">
                      <p class="font-medium">{{ item.label }}</p>
                      <p class="text-xs text-muted-foreground">{{ formatDate(item.date, true) }}</p>
                    </div>
                  </div>
                </div>

                <!-- Status history items -->
                <div
                  v-if="order?.statusHistory && order.statusHistory.length > 0"
                  class="mt-4 border-t pt-4"
                >
                  <h4 class="mb-2 text-sm font-medium">Status History</h4>
                  <div
                    v-for="(item, index) in order.statusHistory"
                    :key="`history-${index}`"
                    class="relative pb-3"
                  >
                    <!-- Timeline dot -->
                    <div
                      class="absolute -left-5 mt-1.5 h-3 w-3 rounded-full border border-background bg-secondary"
                    ></div>

                    <!-- Timeline content -->
                    <div class="ml-2">
                      <p class="text-sm font-medium capitalize">
                        {{ item.status.replace("_", " ") }}
                        <span v-if="item.previousStatus" class="text-xs text-muted-foreground">
                          from {{ item.previousStatus.replace("_", " ") }}
                        </span>
                      </p>
                      <p class="text-xs text-muted-foreground">{{ formatDate(item.date, true) }}</p>
                      <p v-if="item.remarks" class="mt-1 text-xs italic text-muted-foreground">
                        "{{ item.remarks }}"
                      </p>
                    </div>
                  </div>
                </div>

                <div
                  v-if="
                    !order ||
                    ((!timeline || timeline.length === 0) &&
                      (!order.statusHistory || order.statusHistory.length === 0))
                  "
                  class="text-sm text-muted-foreground"
                >
                  No timeline data available.
                </div>
              </div>
            </div>

            <!-- Status change actions - Improved with better spacing -->
            <div class="rounded-lg border bg-card/50 p-4 shadow-sm">
              <h3 class="mb-3 flex items-center gap-2 text-base font-medium text-foreground">
                <Icon name="lucide:settings" class="h-4 w-4 text-primary" />
                Order Actions
              </h3>

              <div
                v-if="order?.orderStatus === 'cancelled'"
                class="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-600"
              >
                <div class="flex items-start gap-2">
                  <Icon name="lucide:alert-circle" class="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <p>This order has been cancelled and cannot be modified.</p>
                </div>
              </div>

              <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <!-- Ready button -->
                <UiButton
                  v-if="order?.orderStatus === 'pending'"
                  variant="outline"
                  class="w-full justify-start"
                  size="sm"
                  @click="$emit('markAsReady')"
                >
                  <Icon name="lucide:package-check" class="mr-2 h-4 w-4" />
                  Mark as Ready
                </UiButton>

                <!-- Claimed button -->
                <UiButton
                  v-if="order?.orderStatus === 'ready'"
                  variant="outline"
                  class="w-full justify-start"
                  size="sm"
                  @click="$emit('markAsClaimed')"
                >
                  <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                  Mark as Claimed
                </UiButton>

                <!-- Paid button -->
                <UiButton
                  v-if="order?.paymentStatus !== 'paid' && order?.orderStatus !== 'cancelled'"
                  variant="outline"
                  class="w-full justify-start"
                  size="sm"
                  @click="$emit('markAsPaid')"
                >
                  <Icon name="lucide:credit-card" class="mr-2 h-4 w-4" />
                  Mark as Paid
                </UiButton>

                <!-- Cancel button -->
                <UiButton
                  v-if="order?.orderStatus !== 'cancelled' && order?.orderStatus !== 'completed'"
                  variant="destructive"
                  class="w-full justify-start"
                  size="sm"
                  @click="$emit('viewCancelOrder', order!)"
                >
                  <Icon name="lucide:x-circle" class="mr-2 h-4 w-4" />
                  Cancel Order
                </UiButton>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <UiButton @click="$emit('close')" :disabled="statusLoading">Close</UiButton>
      </template>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { useFetchFilterOrders } from "~/composables/organization/orders/useFetchFilterOrders";
  import { useOrderUtils } from "~/utils/useOrderUtils";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";

  // Import all the functions we need
  const { computeSubtotal, getPaymentClass, getStatusClass, getPaymentTextClass } = useOrderUtils();

  const { getOrderTimeline } = useFetchFilterOrders();

  const props = defineProps<{
    open: boolean;
    order: ExtendedOrder | null;
    statusLoading: boolean;
    orderDetailsLoading: boolean;
  }>();

  defineEmits<{
    close: [];
    markAsReady: [];
    markAsPaid: [];
    markAsClaimed: [];
    viewCancelOrder: [order: ExtendedOrder];
    "update:open": [value: boolean];
  }>();

  // Format date with optional time display
  const formatDate = (timestamp: any, includeTime = false): string => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp?.toDate) {
      // Handle Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      // Handle string or number
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("en-US", options);
  };

  // Get appropriate payment method icon
  const getPaymentMethodIcon = (method: string | undefined): string => {
    if (!method) return "lucide:credit-card";

    const methodLower = method.toLowerCase();
    if (methodLower.includes("cash")) return "lucide:banknote";
    if (methodLower.includes("gcash")) return "lucide:smartphone";
    if (methodLower.includes("bank")) return "lucide:building-bank";
    if (methodLower.includes("paypal")) return "lucide:paypal";

    return "lucide:credit-card";
  };

  // Get appropriate payment status icon
  const getPaymentStatusIcon = (status: string | undefined): string => {
    if (!status) return "lucide:help-circle";

    if (status === "paid") return "lucide:check-circle";
    if (status === "not_paid") return "lucide:x-circle";
    if (status === "partial") return "lucide:circle-dot";

    return "lucide:help-circle";
  };

  // Computed for order timeline
  const timeline = computed(() => {
    if (!props.order) return [];
    return getOrderTimeline(props.order);
  });
</script>
