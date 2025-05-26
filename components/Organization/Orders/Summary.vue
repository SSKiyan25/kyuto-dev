<template>
  <div class="my-4 w-full">
    <div class="mb-2 flex items-center space-x-2">
      <Icon name="lucide:briefcase" class="h-5 w-5 text-muted-foreground" />
      <span class="text-sm font-medium md:text-base">Orders Summary</span>
    </div>

    <div
      class="grid grid-cols-2 gap-3 rounded-md bg-secondary p-4 shadow-md sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4"
    >
      <!-- Total Orders -->
      <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
        <span class="text-xs text-muted-foreground">Total Orders</span>
        <span v-if="!loading" class="text-sm font-semibold">
          {{ summary.totalOrders }}
        </span>
        <Icon
          v-if="loading"
          name="lucide:loader-circle"
          class="h-4 w-4 animate-spin text-primary"
        />
      </div>

      <!-- Pending Orders -->
      <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
        <span class="text-xs text-muted-foreground">Pending Orders</span>
        <span v-if="!loading" class="text-sm font-semibold">
          {{ summary.pendingOrders }}
        </span>
        <Icon
          v-if="loading"
          name="lucide:loader-circle"
          class="h-4 w-4 animate-spin text-primary"
        />
      </div>

      <!-- Fulfilled Orders -->
      <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
        <span class="text-xs text-muted-foreground">Fulfilled Orders</span>
        <span v-if="!loading" class="text-sm font-semibold">
          {{ summary.completedOrders }}
        </span>
        <Icon
          v-if="loading"
          name="lucide:loader-circle"
          class="h-4 w-4 animate-spin text-primary"
        />
      </div>

      <!-- Cancelled Orders -->
      <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
        <span class="text-xs text-muted-foreground">Cancelled Orders</span>
        <span v-if="!loading" class="text-sm font-semibold">
          {{ summary.cancelledOrders }}
        </span>
        <Icon
          v-if="loading"
          name="lucide:loader-circle"
          class="h-4 w-4 animate-spin text-primary"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface OrderSummary {
    totalOrders: number;
    pendingOrders: number;
    completedOrders: number;
    cancelledOrders: number;
  }

  defineProps<{
    summary: OrderSummary;
    loading: boolean;
  }>();
</script>
