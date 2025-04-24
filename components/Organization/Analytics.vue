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

  const fetchAnalytics = async () => {
    try {
      // Check if data is already cached
      const cachedData = await getOrganizationAnalytics(props.organizationID);
      if (cachedData) {
        analytics.value = cachedData as AnalyticsData;
        // console.log("Using cached analytics data:", analytics.value);
        status.value = "success";
        return;
      }

      // If no cached data, fetch from the server
      status.value = "pending";
      analytics.value = (await getOrganizationAnalytics(props.organizationID)) as AnalyticsData;
      // console.log("Fetched analytics data:", analytics.value);
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
          Revenue: d.revenue,
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

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div v-if="status === 'pending'" class="space-y-4">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Sales Analytics</h1>
        <UiButton variant="outline" :disabled="isRefreshing" @click.prevent="refresh">
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

    <!-- Data Loaded -->
    <template v-else-if="analytics">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold">Sales Analytics</h1>
        <UiButton variant="outline" :disabled="isRefreshing" @click="refresh">
          <Icon
            name="lucide:refresh-cw"
            class="mr-2 h-4 w-4"
            :class="{ 'animate-spin': isRefreshing }"
          />
          Refresh
        </UiButton>
      </div>

      <!-- Summary Cards -->
      <div class="grid gap-4 md:grid-cols-3">
        <UiCard>
          <UiCardHeader>
            <UiCardTitle class="text-sm font-medium">Total Revenue</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="text-2xl font-bold">
              {{ formatCurrency(analytics.totalRevenue) }}
            </div>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle class="text-sm font-medium">Total Orders</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="text-2xl font-bold">
              {{ analytics.totalOrders.toLocaleString() }}
            </div>
          </UiCardContent>
        </UiCard>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle class="text-sm font-medium">Total Product Views</UiCardTitle>
          </UiCardHeader>
          <UiCardContent>
            <div class="text-2xl font-bold">
              {{ analytics.totalProductsViewed.toLocaleString() }}
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <!-- Sales Chart -->
      <div>
        <UiCard>
          <UiCardHeader>
            <UiCardTitle class="text-md font-medium">Sales Trend</UiCardTitle>
            <div class="mb-4 flex items-center justify-end">
              <label for="timeRange" class="mr-2 text-sm font-medium">Time Range:</label>
              <select
                v-model="selectedTimeRange"
                id="timeRange"
                class="rounded border px-2 py-1 text-sm"
              >
                <option value="30days">Last 30 Days</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="quarter">This Quarter</option>
                <option value="year">This Year</option>
              </select>
            </div>
          </UiCardHeader>
          <UiCardContent>
            <UiChartBar
              :data="chartData"
              index="date"
              :categories="['Revenue', 'Orders']"
              :y-formatter="(tick) => (typeof tick === 'number' ? formatCurrency(tick) : '')"
              :showLegend="true"
            />
          </UiCardContent>
        </UiCard>
      </div>

      <div class="space-y-6 pt-4">
        <!-- Chart Title -->
        <h2 class="text-center text-xl font-bold">
          Comparison of Pre-Orders and Direct Order Items
        </h2>

        <!-- Chart -->
        <div class="flex justify-center">
          <UiChartDonut
            index="name"
            :category="'Total'"
            :data="comparisonData"
            type="pie"
            class="h-96 w-96"
          />
        </div>

        <!-- Description -->
        <p class="text-center text-sm text-gray-500">
          This chart compares the total number of pre-orders and direct order items for your
          organization.
        </p>
      </div>

      <!-- Top Products Table -->
      <UiCard>
        <UiCardHeader>
          <UiCardTitle class="text-sm font-medium">Top Performing Products</UiCardTitle>
        </UiCardHeader>
        <UiCardContent>
          <UiTable>
            <UiTableHeader>
              <UiTableRow>
                <UiTableHead>Product Name</UiTableHead>
                <UiTableHead class="text-right">Views</UiTableHead>
                <UiTableHead class="text-right">Total Orders</UiTableHead>
                <UiTableHead class="text-right">Quantity Sold</UiTableHead>
                <UiTableHead class="text-right">Revenue</UiTableHead>
              </UiTableRow>
            </UiTableHeader>
            <UiTableBody>
              <UiTableRow v-for="product in analytics.popularProducts" :key="product.productID">
                <UiTableCell class="font-medium">{{ product.name }}</UiTableCell>
                <UiTableCell class="text-right">{{
                  product.viewCount.toLocaleString()
                }}</UiTableCell>
                <UiTableCell class="text-right">{{
                  product.orderCount.toLocaleString()
                }}</UiTableCell>
                <UiTableCell class="text-right">{{
                  product.totalQuantitySold.toLocaleString()
                }}</UiTableCell>
                <UiTableCell class="text-right">{{
                  formatCurrency(product.totalRevenue)
                }}</UiTableCell>
              </UiTableRow>
            </UiTableBody>
          </UiTable>
        </UiCardContent>
      </UiCard>
    </template>

    <!-- Error State -->
    <div v-else class="text-destructive">
      Failed to load analytics data. Please try again later.
    </div>
  </div>
</template>

<style scoped>
  .chart-container {
    width: 100%;
    height: 300px;
  }
</style>
