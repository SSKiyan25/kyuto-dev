<template>
  <div class="mb-12 max-w-full space-y-6 overflow-hidden">
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
        <h1 class="text-xl font-bold sm:text-2xl">Sales Analytics</h1>
        <OrganizationAnalyticsExportButton v-if="analytics" type="summary" :data="analytics" />
        <UiButton
          variant="outline"
          :disabled="isRefreshing"
          @click.prevent="refresh"
          class="w-full sm:w-auto"
        >
          <Icon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
            :class="{ 'animate-spin': isRefreshing }"
          />
          Refresh
        </UiButton>
      </div>

      <UiSkeleton class="h-8 w-1/3" />
      <UiSkeleton class="h-8 w-full" />
      <UiSkeleton class="h-8 w-full" />
      <UiSkeleton class="h-8 w-full" />
      <div class="text-center text-lg font-semibold">Fetching data...</div>
    </div>

    <!-- Error State -->
    <div v-else-if="status === 'error'" class="rounded-lg bg-muted/20 p-4 text-center sm:p-6">
      <div class="flex flex-col items-center justify-center gap-2">
        <Icon name="lucide:alert-circle" class="size-10 text-destructive/70" />
        <h3 class="text-base font-semibold">Unable to Load Analytics</h3>
        <p class="max-w-md text-sm text-muted-foreground">
          There was a problem loading your analytics data. Please try refreshing the page.
        </p>
        <UiButton variant="outline" class="mt-4" @click="refresh">
          <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
          Try Again
        </UiButton>
      </div>
    </div>

    <!-- Data Loaded -->
    <template v-else-if="analytics">
      <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center sm:gap-0">
        <h1 class="text-xl font-bold sm:text-2xl">Sales Analytics</h1>
        <UiButton
          variant="outline"
          :disabled="isRefreshing"
          @click="refresh"
          class="w-full sm:w-auto"
        >
          <Icon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
            :class="{ 'animate-spin': isRefreshing }"
          />
          Refresh
        </UiButton>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <UiCard class="min-w-0">
          <UiCardHeader class="pb-2">
            <UiCardTitle class="text-sm font-medium">Total Revenue</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="break-words text-xl font-bold sm:text-2xl">
              {{ formatCurrency(analytics.totalRevenue) }}
            </div>
          </UiCardContent>
        </UiCard>
        <UiCard class="min-w-0">
          <UiCardHeader class="pb-2">
            <UiCardTitle class="text-sm font-medium">Total Orders</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="text-xl font-bold sm:text-2xl">
              {{ analytics.totalOrders.toLocaleString() }}
            </div>
          </UiCardContent>
        </UiCard>
        <UiCard class="min-w-0 sm:col-span-2 md:col-span-1">
          <UiCardHeader class="pb-2">
            <UiCardTitle class="text-sm font-medium">Total Product Views</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="text-xl font-bold sm:text-2xl">
              {{ analytics.totalProductsViewed.toLocaleString() }}
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <!-- Sales Chart -->
      <div class="w-full overflow-x-auto">
        <UiCard class="min-w-0">
          <UiCardHeader>
            <div class="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <UiCardTitle class="text-md font-medium">Sales Trend</UiCardTitle>
              <div class="flex flex-wrap items-center gap-2">
                <OrganizationAnalyticsExportButton
                  v-if="chartData.length > 0"
                  type="sales"
                  :data="chartData"
                  :chart-ref="salesChartRef"
                  :time-range="selectedTimeRange"
                />
                <div class="flex items-center gap-2">
                  <label for="timeRange" class="whitespace-nowrap text-sm font-medium"
                    >Time Range:</label
                  >
                  <select
                    v-model="selectedTimeRange"
                    id="timeRange"
                    class="w-full rounded border px-2 py-1 text-sm sm:w-auto"
                  >
                    <option value="30days">Last 30 Days</option>
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="quarter">This Quarter</option>
                    <option value="year">This Year</option>
                  </select>
                </div>
              </div>
            </div>
          </UiCardHeader>
          <UiCardContent class="overflow-x-auto">
            <div v-if="chartData.length > 0" class="min-w-[300px]" ref="salesChartRef">
              <UiChartBar
                :data="chartData"
                index="date"
                :categories="['Revenue', 'Orders']"
                :y-formatter="(tick) => (typeof tick === 'number' ? formatCurrency(tick) : '')"
                :showLegend="true"
              />
            </div>
            <div v-else class="flex flex-col items-center justify-center py-8 text-center">
              <Icon name="lucide:bar-chart" class="mb-3 h-12 w-12 text-muted-foreground/50" />
              <h3 class="text-base font-medium">No Sales Data Available</h3>
              <p class="mt-2 max-w-md text-sm text-muted-foreground">
                There are no sales recorded for the selected time period. Try selecting a different
                time range or check back later.
              </p>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <!-- Order Type Comparison -->
      <div class="w-full space-y-4 pt-4">
        <!-- Chart Title -->
        <div class="flex items-center justify-between px-2">
          <h2 class="text-lg font-bold sm:text-xl">
            Comparison of Pre-Orders and Direct Order Items
          </h2>
          <OrganizationAnalyticsExportButton
            v-if="comparisonData.length > 0 && hasOrderData"
            type="comparison"
            :data="comparisonData"
            :chart-ref="comparisonChartRef"
          />
        </div>

        <!-- Chart -->
        <div
          v-if="comparisonData.length > 0 && hasOrderData"
          class="flex justify-center"
          ref="comparisonChartRef"
        >
          <UiChartDonut
            index="name"
            :category="'Total'"
            :data="comparisonData"
            type="pie"
            class="h-64 w-64 sm:h-80 sm:w-80 md:h-96 md:w-96"
          />
        </div>

        <!-- No Data State -->
        <div v-else class="flex flex-col items-center justify-center px-4 py-8 text-center">
          <Icon name="lucide:pie-chart" class="mb-3 h-12 w-12 text-muted-foreground/50" />
          <h3 class="text-base font-medium">No Order Data Available</h3>
          <p class="mt-2 max-w-md text-sm text-muted-foreground">
            There are no orders to compare. Start selling products to see the comparison between
            pre-orders and direct orders.
          </p>
        </div>

        <!-- Description -->
        <p class="px-4 text-center text-sm text-gray-500">
          This chart compares the total number of pre-orders and direct order items for your
          organization.
        </p>
      </div>

      <!-- Top Products Table - Mobile Friendly Version -->
      <div class="w-full overflow-hidden">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle class="text-sm font-medium">Top Performing Products</UiCardTitle>
            <OrganizationAnalyticsExportButton
              v-if="analytics?.popularProducts?.length > 0"
              type="products"
              :data="analytics.popularProducts"
            />
          </UiCardHeader>
          <UiCardContent>
            <div v-if="analytics.popularProducts && analytics.popularProducts.length > 0">
              <!-- Desktop Table View (hidden on mobile) -->
              <div class="-mx-4 hidden overflow-x-auto sm:mx-0 sm:block">
                <div class="min-w-full px-4 sm:px-0">
                  <UiTable>
                    <UiTableHeader>
                      <UiTableRow>
                        <UiTableHead class="w-1/3">Product Name</UiTableHead>
                        <UiTableHead class="text-right">Views</UiTableHead>
                        <UiTableHead class="text-right">Orders</UiTableHead>
                        <UiTableHead class="text-right">Quantity</UiTableHead>
                        <UiTableHead class="text-right">Revenue</UiTableHead>
                      </UiTableRow>
                    </UiTableHeader>
                    <UiTableBody>
                      <UiTableRow
                        v-for="product in analytics.popularProducts"
                        :key="product.productID"
                      >
                        <UiTableCell class="max-w-[150px] truncate font-medium sm:max-w-[250px]">
                          {{ product.name }}
                        </UiTableCell>
                        <UiTableCell class="text-right">
                          {{ product.viewCount.toLocaleString() }}
                        </UiTableCell>
                        <UiTableCell class="text-right">
                          {{ product.orderCount.toLocaleString() }}
                        </UiTableCell>
                        <UiTableCell class="text-right">
                          {{ product.totalQuantitySold.toLocaleString() }}
                        </UiTableCell>
                        <UiTableCell class="text-right">
                          {{ formatCurrency(product.totalRevenue) }}
                        </UiTableCell>
                      </UiTableRow>
                    </UiTableBody>
                  </UiTable>
                </div>
              </div>

              <!-- Mobile Card View (visible only on mobile) -->
              <div class="space-y-3 sm:hidden">
                <div
                  v-for="product in analytics.popularProducts"
                  :key="product.productID"
                  class="rounded-lg border bg-card/50 p-3"
                >
                  <h3 class="mb-2 truncate text-sm font-medium">{{ product.name }}</h3>
                  <div class="grid grid-cols-2 gap-y-2 text-xs">
                    <div class="flex items-center gap-1">
                      <Icon name="lucide:eye" class="h-3.5 w-3.5 text-muted-foreground" />
                      <span class="text-muted-foreground">Views:</span>
                    </div>
                    <div class="text-right font-medium">
                      {{ product.viewCount.toLocaleString() }}
                    </div>

                    <div class="flex items-center gap-1">
                      <Icon name="lucide:shopping-cart" class="h-3.5 w-3.5 text-muted-foreground" />
                      <span class="text-muted-foreground">Orders:</span>
                    </div>
                    <div class="text-right font-medium">
                      {{ product.orderCount.toLocaleString() }}
                    </div>

                    <div class="flex items-center gap-1">
                      <Icon name="lucide:package" class="h-3.5 w-3.5 text-muted-foreground" />
                      <span class="text-muted-foreground">Quantity:</span>
                    </div>
                    <div class="text-right font-medium">
                      {{ product.totalQuantitySold.toLocaleString() }}
                    </div>

                    <div class="flex items-center gap-1">
                      <Icon name="lucide:banknote" class="h-3.5 w-3.5 text-muted-foreground" />
                      <span class="text-muted-foreground">Revenue:</span>
                    </div>
                    <div class="text-right font-medium text-primary">
                      {{ formatCurrency(product.totalRevenue) }}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- No Data State (remains unchanged) -->
            <div v-else class="flex flex-col items-center justify-center py-8 text-center">
              <Icon name="lucide:package" class="mb-3 h-12 w-12 text-muted-foreground/50" />
              <h3 class="text-base font-medium">No Product Data Available</h3>
              <p class="mt-2 max-w-md text-sm text-muted-foreground">
                There are no products with sales data to display yet. As your products start
                generating views and sales, they will appear here.
              </p>
            </div>
          </UiCardContent>
        </UiCard>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { useOrganizationAnalytics } from "~/composables/organization/useAnalytics";

  const props = defineProps<{
    organizationID: string;
  }>();

  type ProductAnalytics = {
    productID: string;
    name: string;
    viewCount: number;
    totalQuantitySold: number;
    orderCount: number;
    totalRevenue: number;
    conversionRate: number;
  };

  type SalesOverTime = {
    date: string;
    revenue: number;
    count: number;
  };

  type AnalyticsData = {
    totalRevenue: number;
    totalOrders: number;
    totalProductsViewed: number;
    popularProducts: ProductAnalytics[];
  };

  // Use the composable
  const { getOrganizationAnalytics, getComparisonForPreAndDirectOrders, getSalesOverTime } =
    useOrganizationAnalytics();

  // Reactive state for analytics data
  const analytics = ref<AnalyticsData | null>(null);
  const salesOverTimeData = ref<SalesOverTime[]>([]);
  const comparisonData = ref<{ name: string; Total: number }[]>([]);
  const status = ref<"pending" | "success" | "error">("pending");
  const isRefreshing = ref(false);
  const selectedTimeRange = ref("30days");

  const salesChartRef = ref(null);
  const comparisonChartRef = ref(null);

  // Check if comparison data has any orders
  const hasOrderData = computed(() => {
    if (!comparisonData.value || comparisonData.value.length === 0) return false;
    const totalOrders = comparisonData.value.reduce((sum, item) => sum + item.Total, 0);
    return totalOrders > 0;
  });

  const fetchAnalytics = async () => {
    try {
      // Check if data is already cached
      const cachedData = await getOrganizationAnalytics(props.organizationID);
      if (cachedData) {
        analytics.value = cachedData as AnalyticsData;
        status.value = "success";
        return;
      }

      // If no cached data, fetch from the server
      status.value = "pending";
      analytics.value = (await getOrganizationAnalytics(props.organizationID)) as AnalyticsData;
      status.value = "success";
    } catch (error) {
      console.error("Failed to fetch analytics data:", error);
      status.value = "error";
    }
  };

  const fetchSalesOverTime = async () => {
    try {
      status.value = "pending";
      const salesData = await getSalesOverTime(props.organizationID, selectedTimeRange.value);
      salesOverTimeData.value = salesData; // Cache the result
      status.value = "success";
    } catch (error) {
      console.error("Failed to fetch sales over time data:", error);
      salesOverTimeData.value = []; // Reset on error
      status.value = "error";
    }
  };

  const fetchComparisonData = async () => {
    try {
      status.value = "pending";
      const result = await getComparisonForPreAndDirectOrders(props.organizationID);
      comparisonData.value = [
        { name: "Pre-Orders Items", Total: result.preOrderCount },
        { name: "Direct Orders Items", Total: result.directOrderCount },
      ];
      status.value = "success";
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
      status.value = "error";
    }
  };

  // Refresh function
  const refresh = async () => {
    if (isRefreshing.value) return; // Prevent spamming
    isRefreshing.value = true;
    await fetchAnalytics();
    await fetchSalesOverTime();
    await fetchComparisonData();
    isRefreshing.value = false;
  };

  watch(selectedTimeRange, async () => {
    await fetchSalesOverTime();
  });

  onMounted(() => {
    fetchAnalytics();
    fetchSalesOverTime();
    fetchComparisonData();
  });

  // Format sales data for the chart
  const chartData = computed(() => {
    return (
      salesOverTimeData.value.map((d) => {
        let formattedDate;

        // Format the date based on the selected time range
        switch (selectedTimeRange.value) {
          case "30days":
          case "week":
            formattedDate = new Date(d.date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            });
            break;
          case "month":
            formattedDate = new Date(d.date).toLocaleDateString("en-PH", {
              month: "short",
              day: "numeric",
            });
            break;
          case "quarter":
            formattedDate = new Date(d.date).toLocaleDateString("en-PH", {
              month: "short",
            });
            break;
          case "year":
            formattedDate = new Date(d.date).toLocaleDateString("en-PH", {
              month: "short",
              year: "numeric",
            });
            break;
          default:
            formattedDate = d.date; // Fallback to the raw date
        }

        return {
          date: formattedDate,
          Revenue: Number(d.revenue.toFixed(2)),
          Orders: d.count,
        };
      }) || []
    );
  });

  // Utility function to format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };
</script>

<style scoped>
  .chart-container {
    width: 100%;
    height: 300px;
  }
</style>
