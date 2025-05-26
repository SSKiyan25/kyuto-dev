<template>
  <div class="w-full">
    <!-- Desktop table (hidden on mobile) -->
    <div class="hidden overflow-x-auto pb-2 md:block">
      <UiTable>
        <UiTableCaption>List of your product's variations order summary</UiTableCaption>
        <UiTableHeader>
          <UiTableRow>
            <UiTableHead class="whitespace-nowrap">Variation Name</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Price</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Stocks</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Reserved</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Pre-Ordered</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Fulfilled</UiTableHead>
            <UiTableHead class="whitespace-nowrap">Cancelled</UiTableHead>
          </UiTableRow>
        </UiTableHeader>
        <UiTableBody class="last:border-b">
          <UiTableRow v-for="summary in summaries" :key="summary.variationName">
            <UiTableCell>{{ summary.variationName }}</UiTableCell>
            <UiTableCell>₱ {{ summary.price }}</UiTableCell>
            <UiTableCell>{{ summary.remainingStocks }}</UiTableCell>
            <UiTableCell>{{ summary.reservedStocks }}</UiTableCell>
            <UiTableCell>{{ summary.preOrderStocks }}</UiTableCell>
            <UiTableCell>{{ summary.completedOrders }}</UiTableCell>
            <UiTableCell>{{ summary.cancelledOrders }}</UiTableCell>
          </UiTableRow>
        </UiTableBody>
        <UiTableFooter class="opacity-70">
          <UiTableRow>
            <UiTableCell>Total</UiTableCell>
            <UiTableCell></UiTableCell>
            <UiTableCell>{{ totals.remainingStocks }}</UiTableCell>
            <UiTableCell>{{ totals.reservedStocks }}</UiTableCell>
            <UiTableCell>{{ totals.preOrderStocks }}</UiTableCell>
            <UiTableCell>{{ totals.completedOrders }}</UiTableCell>
            <UiTableCell>{{ totals.cancelledOrders }}</UiTableCell>
          </UiTableRow>
        </UiTableFooter>
      </UiTable>
    </div>

    <!-- Mobile cards (visible only on mobile) -->
    <div class="block space-y-4 md:hidden">
      <p class="mb-2 text-center text-sm text-muted-foreground">Variations order summary</p>

      <!-- Variation cards -->
      <div
        v-for="summary in summaries"
        :key="summary.variationName"
        class="rounded-lg border p-3 shadow-sm"
      >
        <h3 class="mb-2 border-b pb-2 text-base font-medium">{{ summary.variationName }}</h3>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-muted-foreground">Price:</span>
            <span class="font-medium">₱ {{ summary.price }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Stocks:</span>
            <span class="font-medium">{{ summary.remainingStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Reserved:</span>
            <span class="font-medium">{{ summary.reservedStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Pre-Ordered:</span>
            <span class="font-medium">{{ summary.preOrderStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Fulfilled:</span>
            <span class="font-medium">{{ summary.completedOrders }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Cancelled:</span>
            <span class="font-medium">{{ summary.cancelledOrders }}</span>
          </div>
        </div>
      </div>

      <!-- Totals card -->
      <div class="rounded-lg border bg-secondary/20 p-3 shadow-sm">
        <h3 class="mb-2 border-b pb-2 text-base font-medium">Totals</h3>

        <div class="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-muted-foreground">Stocks:</span>
            <span class="font-medium">{{ totals.remainingStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Reserved:</span>
            <span class="font-medium">{{ totals.reservedStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Pre-Ordered:</span>
            <span class="font-medium">{{ totals.preOrderStocks }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Fulfilled:</span>
            <span class="font-medium">{{ totals.completedOrders }}</span>
          </div>

          <div>
            <span class="text-muted-foreground">Cancelled:</span>
            <span class="font-medium">{{ totals.cancelledOrders }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  interface VariationSummary {
    variationName: string;
    price: string;
    remainingStocks: number;
    reservedStocks: number;
    preOrderStocks: number;
    completedOrders: number;
    cancelledOrders: number;
  }

  const props = defineProps<{
    summaries: VariationSummary[];
  }>();

  const totals = computed(() => {
    return {
      remainingStocks: props.summaries.reduce((acc, summary) => acc + summary.remainingStocks, 0),
      reservedStocks: props.summaries.reduce((acc, summary) => acc + summary.reservedStocks, 0),
      preOrderStocks: props.summaries.reduce((acc, summary) => acc + summary.preOrderStocks, 0),
      completedOrders: props.summaries.reduce((acc, summary) => acc + summary.completedOrders, 0),
      cancelledOrders: props.summaries.reduce((acc, summary) => acc + summary.cancelledOrders, 0),
    };
  });
</script>
