<template>
  <div class="mb-6 w-full">
    <div
      class="relative w-full overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-amber-500/90 to-yellow-600/80 shadow-md"
    >
      <!-- Decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div class="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/30 blur-xl"></div>
        <div class="absolute -left-10 bottom-5 h-10 w-10 rounded-full bg-white/20 blur-lg"></div>
      </div>

      <div class="relative flex flex-col items-center justify-between p-4 sm:flex-row">
        <!-- Left side: Title and description -->
        <div class="flex max-w-full flex-col space-y-1 sm:max-w-[70%]">
          <h3 class="text-sm font-bold leading-tight text-white sm:text-lg">
            Order Status Dashboard
          </h3>
          <p class="text-[10px] leading-tight text-white/90 sm:text-xs">
            You have {{ totalOrdersCount }} order{{ totalOrdersCount !== 1 ? "s" : "" }} in total.
            {{ pendingOrdersCount }} pending and {{ completedOrdersCount }} completed.
          </p>
          <div class="flex flex-row gap-2 pt-2">
            <UiButton
              to="/products"
              size="sm"
              class="group h-8 bg-white/90 px-3 text-amber-600 hover:bg-white"
            >
              <span class="text-[10px] sm:text-xs">Shop More</span>
              <Icon name="lucide:shopping-bag" class="ml-1 h-3 w-3" />
            </UiButton>
            <UiButton
              @click="$emit('refreshOrders')"
              variant="outline"
              size="sm"
              class="group h-8 border-white/30 bg-transparent px-3 text-white hover:bg-white/20"
            >
              <span class="text-[10px] sm:text-xs">Refresh Orders</span>
              <Icon name="lucide:refresh-cw" class="ml-1 h-3 w-3" />
            </UiButton>
          </div>
        </div>

        <!-- Right side: Stats cards -->
        <div class="ml-0 mt-3 flex justify-center sm:ml-2 sm:mt-0">
          <div class="flex space-x-2">
            <!-- Pending Orders Stat -->
            <div
              class="flex min-w-[70px] flex-col items-center justify-center rounded-lg bg-white/15 p-2 backdrop-blur-sm"
            >
              <span class="text-xs font-medium text-white/80">Pending</span>
              <span class="text-xl font-bold text-white">{{ pendingOrdersCount }}</span>
            </div>

            <!-- Completed Orders Stat -->
            <div
              class="flex min-w-[70px] flex-col items-center justify-center rounded-lg bg-white/15 p-2 backdrop-blur-sm"
            >
              <span class="text-xs font-medium text-white/80">Completed</span>
              <span class="text-xl font-bold text-white">{{ completedOrdersCount }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  defineProps<{
    totalOrdersCount: number;
    pendingOrdersCount: number;
    completedOrdersCount: number;
  }>();

  defineEmits<{
    (e: "refreshOrders"): void;
  }>();
</script>
