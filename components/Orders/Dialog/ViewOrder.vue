<template>
  <UiDialog :open="isOpen" @update:open="$emit('update:isOpen', $event)">
    <UiDialogContent class="overflow-hidden p-0 sm:max-w-[800px]">
      <div class="border-b bg-primary/10 px-6 py-4">
        <UiDialogTitle class="text-xl font-bold">Order Details</UiDialogTitle>
        <UiDialogDescription class="text-sm opacity-80">
          View your complete order information
        </UiDialogDescription>
      </div>

      <div class="max-h-[calc(80vh-120px)] overflow-y-auto px-4 py-4 sm:px-6">
        <!-- Order Header with Status -->
        <div
          class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div class="text-xs uppercase tracking-wide text-muted-foreground">Reference</div>
            <div class="font-mono text-base font-medium">{{ order?.uniqRefNumber }}</div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="rounded-full px-3 py-1.5 text-xs font-medium"
              :class="{
                'bg-yellow-100 text-yellow-800': order?.orderStatus === 'pending',
                'bg-blue-100 text-blue-800': order?.orderStatus === 'preparing',
                'bg-amber-100 text-amber-800': order?.orderStatus === 'ready',
                'bg-green-100 text-green-800': order?.orderStatus === 'completed',
                'bg-red-100 text-red-800': order?.orderStatus === 'cancelled',
              }"
            >
              <span class="capitalize">{{ order?.orderStatus }}</span>
            </div>

            <div
              class="rounded-full px-3 py-1.5 text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': order?.paymentStatus === 'not_paid',
                'bg-green-100 text-green-800': order?.paymentStatus === 'paid',
                'bg-gray-100 text-gray-800': !order?.paymentStatus,
              }"
            >
              <span class="capitalize">{{ order?.paymentStatus }}</span>
            </div>
          </div>
        </div>

        <!-- Organization -->
        <div class="mb-6 rounded-lg bg-secondary/30 p-4">
          <div class="flex items-center gap-2">
            <Icon name="lucide:store" class="h-4 w-4 text-primary" />
            <span class="text-sm font-medium">{{ order?.organizationName }}</span>
          </div>

          <div class="mt-3 flex flex-col justify-between sm:flex-row">
            <div>
              <div class="text-xs text-muted-foreground">Order Date</div>
              <div class="text-sm">{{ formatDate(order?.dateOrdered) }}</div>
            </div>

            <div>
              <div class="text-xs text-muted-foreground">Total Amount</div>
              <div class="text-lg font-bold text-primary">₱{{ order?.totalPrice.toFixed(2) }}</div>
            </div>
          </div>
        </div>

        <!-- Items List -->
        <div>
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon name="lucide:shopping-cart" class="h-5 w-5" />
            Order Items
          </h3>

          <div class="space-y-4">
            <div
              v-for="item in order?.orderItems"
              :key="item.productID"
              class="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm"
            >
              <div class="flex items-center gap-3 p-3">
                <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted/50">
                  <img
                    :src="item.productDetails?.featuredPhotoURL || '/placeholder-img.jpg'"
                    alt="Product Image"
                    class="h-full w-full object-cover"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ item.productDetails?.name }}
                  </div>

                  <div class="mt-1 text-xs text-muted-foreground">
                    <span class="inline-flex items-center gap-1">
                      <span>Variation:</span>
                      <span class="font-medium">{{ item.variationDetails?.value }}</span>
                    </span>

                    <span
                      v-if="item.isPreOrder"
                      class="ml-2 inline-flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800"
                    >
                      <Icon name="lucide:clock" class="h-3 w-3" />
                      Pre-Order
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-sm font-semibold">
                    ₱{{ item.priceWithCommission.toFixed(2) }}
                  </div>
                  <div class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</div>
                  <div class="text-xs font-medium text-primary">
                    ₱{{ (item.priceWithCommission * item.quantity).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="mt-8 border-t pt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Subtotal</span>
            <span class="text-sm">₱{{ order?.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="mt-4 flex items-center justify-between border-t pt-2">
            <span class="font-medium">Total</span>
            <span class="text-lg font-bold">₱{{ order?.totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Remarks if available -->
        <div v-if="order?.remarks" class="mt-6 rounded-md bg-muted/30 p-3">
          <div class="mb-1 text-xs font-medium text-muted-foreground">Remarks</div>
          <p class="text-sm">{{ order.remarks }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t bg-secondary/30 p-4">
        <UiButton variant="outline" @click="closeDialog">
          <Icon name="lucide:x" class="mr-2 h-4 w-4" />
          Close
        </UiButton>

        <UiButton
          variant="default"
          v-if="order?.orderStatus === 'pending'"
          @click="handleCancelOrder"
        >
          <Icon name="lucide:file-x" class="mr-2 h-4 w-4" />
          Cancel Order
        </UiButton>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
  import type { Order } from "~/types/models/Order";

  const props = defineProps<{
    isOpen: boolean;
    order:
      | (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string })
      | null;
  }>();

  const emit = defineEmits<{
    (e: "update:isOpen", value: boolean): void;
    (e: "cancelOrder", orderId: string): void;
  }>();

  const closeDialog = () => {
    emit("update:isOpen", false);
  };

  const handleCancelOrder = () => {
    if (props.order) {
      emit("cancelOrder", props.order.id);
      closeDialog();
    }
  };

  // Utility function to format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp !== "object" || !timestamp.seconds) {
      return "N/A";
    }

    try {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
</script>
