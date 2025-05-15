<template>
  <div class="flex w-full flex-col space-y-4">
    <div class="flex flex-row items-center justify-between">
      <span class="text-md font-semibold sm:text-lg">Your Latest Order</span>
      <UiButton @click="$emit('refresh')" variant="ghost" size="sm">
        <span class="text-sm">Refresh</span>
        <Icon name="lucide:refresh-cw" class="ml-1.5 h-4 w-4 hover:animate-spin" />
      </UiButton>
    </div>

    <div class="flex w-full flex-row items-center rounded-lg bg-secondary p-4 shadow-md">
      <template v-if="order">
        <div class="flex w-full flex-col space-y-1">
          <p class="text-md font-bold sm:text-lg">
            Reference Number: <span class="text-primary">{{ order.uniqRefNumber }}</span>
          </p>
          <p class="text-[12px] opacity-70">
            Ordered on:
            <span class="text-primary">{{ formatDate(order.dateOrdered) }}</span>
          </p>

          <div class="py-8">
            <OrderStatusStepper :order-status="order.orderStatus" :is-mobile="isMobile" />
          </div>

          <div class="flex w-full flex-row justify-between pt-2 text-[12px] opacity-70 sm:text-sm">
            <p class="">
              Total Payment: <span class="text-primary">{{ order.totalPrice }}</span>
            </p>
            <p class="">
              Organization: <span class="text-primary">{{ order.organizationName }}</span>
            </p>
          </div>

          <div v-if="order.remarks" class="pt-2 text-center">
            <p class="text-[12px] text-muted-foreground">Remarks: {{ order.remarks }}</p>
          </div>
        </div>
      </template>

      <div v-else class="flex w-full flex-col items-center justify-center py-12 text-center">
        <Icon name="lucide:package" class="mb-3 h-12 w-12 text-muted-foreground" />
        <h3 class="text-lg font-medium">No Recent Orders</h3>
        <p class="mt-1 text-sm text-muted-foreground">
          You don't have any recent orders to display.
        </p>
        <UiButton to="/products" variant="outline" class="mt-4"> Browse Products </UiButton>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
  import type { Order } from "~/types/models/Order";

  import OrderStatusStepper from "./Stepper.vue";

  const props = defineProps<{
    order:
      | (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string })
      | null;
    isMobile: boolean;
  }>();

  defineEmits<{
    (e: "refresh"): void;
  }>();

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
