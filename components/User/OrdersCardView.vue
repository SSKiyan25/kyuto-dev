<template>
  <div>
    <div v-if="orders.length === 0" class="p-4 text-center">
      <p class="text-sm text-muted-foreground">No orders found</p>
    </div>

    <div v-for="order in orders" :key="order.id" class="mb-3 rounded border bg-white shadow-sm">
      <!-- Super Simple Header -->
      <div class="flex items-center justify-between border-b p-2">
        <div>
          <div class="text-xs text-muted-foreground">Ref #</div>
          <div class="font-mono text-xs">{{ order.uniqRefNumber }}</div>
        </div>
        <span
          class="rounded-full px-2 py-0.5 text-xs capitalize"
          :class="{
            'bg-yellow-100 text-yellow-800': order.orderStatus === 'pending',
            'bg-blue-100 text-blue-800': order.orderStatus === 'preparing',
            'bg-amber-100 text-amber-800': order.orderStatus === 'ready',
            'bg-green-100 text-green-800': order.orderStatus === 'completed',
            'bg-red-100 text-red-800': order.orderStatus === 'cancelled',
          }"
          >{{ order.orderStatus }}</span
        >
      </div>

      <!-- Simple Content -->
      <div class="p-2">
        <div class="grid grid-cols-2 gap-2 text-xs">
          <div>
            <div class="text-muted-foreground">Date</div>
            <div>{{ formatMobileDate(order.dateOrdered) }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Amount</div>
            <div class="font-medium">₱{{ order.totalPrice.toFixed(2) }}</div>
          </div>
        </div>
      </div>

      <!-- Minimal Actions -->
      <div class="grid grid-cols-2 border-t">
        <button class="border-r py-2 text-xs text-primary" @click="$emit('view-order', order.id)">
          View
        </button>
        <button
          v-if="order.orderStatus === 'pending'"
          class="py-2 text-xs text-destructive"
          @click="$emit('cancel-order', order.id)"
        >
          Cancel
        </button>
        <div v-else class="py-2 text-center text-xs text-muted-foreground">
          {{ order.orderStatus === "cancelled" ? "Cancelled" : "Processing" }}
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { Order } from "~/types/models/Order";

  defineProps<{
    orders: (Order & { id: string })[];
  }>();

  defineEmits<{
    (e: "view-order", orderId: string): void;
    (e: "cancel-order", orderId: string): void;
  }>();

  // Ultra-simplified date format for mobile
  const formatMobileDate = (timestamp: any): string => {
    if (!timestamp || !timestamp.seconds) return "N/A";
    try {
      const date = new Date(timestamp.seconds * 1000);
      return date.toLocaleDateString();
    } catch (error) {
      return "N/A";
    }
  };
</script>
