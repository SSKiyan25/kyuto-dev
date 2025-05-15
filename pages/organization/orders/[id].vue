<template>
  <div class="mb-24 flex h-screen w-full flex-col p-2">
    <div class="flex h-auto flex-col items-start p-2 sm:p-4">
      <div class="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex flex-col space-y-2">
          <span class="text-xl font-semibold sm:text-2xl">Orders</span>
          <span class="text-xs text-muted-foreground sm:text-sm">
            View and manage all orders associated with your products.
          </span>
        </div>

        <UiDialog v-model:open="productsDialog">
          <UiDialogTrigger as-child>
            <UiButton class="mt-2 sm:mt-0">Choose a Product</UiButton>
          </UiDialogTrigger>
          <UiDialogContent
            class="overflow-y-auto sm:max-h-[600px] sm:max-w-[800px]"
            title="Your Products"
            description="Select a product to view and manage its associated orders."
          >
            <template #content>
              <div
                v-for="product in products"
                :key="product.id"
                :class="[
                  'flex flex-row items-center space-x-4 px-6 py-2',
                  {
                    'bg-primary/10': selectedProduct === product,
                    'hover:bg-secondary/50': selectedProduct !== product,
                  },
                ]"
                @click="selectedProduct = product"
              >
                <input
                  type="radio"
                  :value="product"
                  v-model="selectedProduct"
                  name="selectedProduct"
                  class="text-primary-600 form-radio h-4 w-4 transition duration-150 ease-in-out"
                />
                <div class="h-16 w-16 overflow-hidden">
                  <img
                    :src="product.featuredPhotoURL || '/placeholder-img.jpg'"
                    class="h-full w-full rounded-sm object-cover"
                  />
                </div>
                <div class="flex flex-col">
                  <span class="text-lg font-semibold">{{ product.name }}</span>
                  <span class="text-sm text-muted-foreground">
                    Total Orders:
                    <span class="text-secondary-foreground">{{ product.totalOrders || 0 }}</span>
                  </span>
                  <span class="text-sm text-muted-foreground">
                    Total Sales:
                    <span class="text-secondary-foreground">{{ product.totalSales || 0 }}</span>
                  </span>
                </div>
              </div>
            </template>
            <template #footer>
              <UiDialogFooter>
                <UiButton
                  @click="closeDialog(false)"
                  variant="outline"
                  type="button"
                  :disabled="loadingFetchProductOrders"
                  >Cancel</UiButton
                >
                <UiButton
                  @click="closeDialog(true)"
                  type="button"
                  :disabled="!selectedProduct || loadingFetchProductOrders"
                  >Choose</UiButton
                >
              </UiDialogFooter>
            </template>
          </UiDialogContent>
        </UiDialog>
      </div>
      <div v-if="!selectedProduct" class="w-full">
        <UiDivider class="my-4" />
        <div class="my-4 flex h-36 w-full flex-col items-center border py-4">
          <Icon name="lucide:briefcase" class="h-16 w-16 text-muted-foreground" />
          <span class="text-lg font-semibold">Select a product to view its orders</span>
        </div>
      </div>
      <div v-if="orders.length > 0 && selectedProduct" class="w-full">
        <div class="my-4 flex w-full flex-col justify-center">
          <span class="text-sm font-medium sm:text-lg">{{ selectedProduct?.name }}</span>
          <UiDivider class="my-2" />

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
                <UiTableRow v-for="summary in variationSummaries" :key="summary.variationName">
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
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.remainingStocks, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.reservedStocks, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.preOrderStocks, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.completedOrders, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.cancelledOrders, 0)
                  }}</UiTableCell>
                </UiTableRow>
              </UiTableFooter>
            </UiTable>
          </div>

          <!-- Mobile cards (visible only on mobile) -->
          <div class="block space-y-4 md:hidden">
            <p class="mb-2 text-center text-sm text-muted-foreground">Variations order summary</p>

            <!-- Variation cards -->
            <div
              v-for="summary in variationSummaries"
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
                  <span class="font-medium">
                    {{
                      variationSummaries.reduce((acc, summary) => acc + summary.remainingStocks, 0)
                    }}
                  </span>
                </div>

                <div>
                  <span class="text-muted-foreground">Reserved:</span>
                  <span class="font-medium">
                    {{
                      variationSummaries.reduce((acc, summary) => acc + summary.reservedStocks, 0)
                    }}
                  </span>
                </div>

                <div>
                  <span class="text-muted-foreground">Pre-Ordered:</span>
                  <span class="font-medium">
                    {{
                      variationSummaries.reduce((acc, summary) => acc + summary.preOrderStocks, 0)
                    }}
                  </span>
                </div>

                <div>
                  <span class="text-muted-foreground">Fulfilled:</span>
                  <span class="font-medium">
                    {{
                      variationSummaries.reduce((acc, summary) => acc + summary.completedOrders, 0)
                    }}
                  </span>
                </div>

                <div>
                  <span class="text-muted-foreground">Cancelled:</span>
                  <span class="font-medium">
                    {{
                      variationSummaries.reduce((acc, summary) => acc + summary.cancelledOrders, 0)
                    }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="mt-4 flex flex-col space-y-2 sm:flex-row sm:space-x-4 sm:space-y-0">
          <UiButton variant="outline" class="w-full sm:w-auto" @click="setPendingOrdersToPreparing">
            Set Pending Orders to Preparing
          </UiButton>
          <UiButton class="w-full bg-blue-400 sm:w-auto" @click="setPendingOrdersToReady">
            Set Pending Orders to Ready
          </UiButton>
        </div>
      </div>
      <UiDivider class="my-4" />

      <!-- Display the overall order summary for the organization -->
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
            <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">
              {{ organizationOrderSummary.totalOrders }}
            </span>
            <Icon
              v-if="loadingFetchingOrgOrdersSummary"
              name="lucide:loader-circle"
              class="h-4 w-4 animate-spin text-primary"
            />
          </div>

          <!-- Pending Orders -->
          <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
            <span class="text-xs text-muted-foreground">Pending Orders</span>
            <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">
              {{ organizationOrderSummary.pendingOrders }}
            </span>
            <Icon
              v-if="loadingFetchingOrgOrdersSummary"
              name="lucide:loader-circle"
              class="h-4 w-4 animate-spin text-primary"
            />
          </div>

          <!-- Fulfilled Orders -->
          <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
            <span class="text-xs text-muted-foreground">Fulfilled Orders</span>
            <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">
              {{ organizationOrderSummary.completedOrders }}
            </span>
            <Icon
              v-if="loadingFetchingOrgOrdersSummary"
              name="lucide:loader-circle"
              class="h-4 w-4 animate-spin text-primary"
            />
          </div>

          <!-- Cancelled Orders -->
          <div class="flex flex-col space-y-1 rounded-md bg-white/50 p-2">
            <span class="text-xs text-muted-foreground">Cancelled Orders</span>
            <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">
              {{ organizationOrderSummary.cancelledOrders }}
            </span>
            <Icon
              v-if="loadingFetchingOrgOrdersSummary"
              name="lucide:loader-circle"
              class="h-4 w-4 animate-spin text-primary"
            />
          </div>
        </div>
      </div>
      <UiDivider />
      <div class="pt-4">
        <span class="text-lg font-semibold">Commission Summary</span>
      </div>
      <div class="flex w-full flex-col gap-2 p-4">
        <!-- Paid and Total Commission -->
        <div class="flex justify-between text-xs sm:text-sm">
          <span>
            ₱{{ commissionData.paidCommission.toLocaleString() }} / ₱{{
              totalCommission.toLocaleString()
            }}
            ({{ paidPercentage.toFixed(2) }}%)
          </span>
          <span class="font-medium text-green-600">Paid</span>
        </div>

        <!-- Progress Bar -->
        <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
          <div class="h-full bg-green-500" :style="{ width: `${paidPercentage}%` }"></div>
        </div>

        <!-- Unpaid Commission -->
        <div class="flex justify-between text-xs text-gray-500 sm:text-sm">
          <span>Unpaid</span>
          <span>₱{{ commissionData.unpaidCommission.toLocaleString() }}</span>
        </div>
      </div>
      <div class="hidden w-full md:block">
        <OrganizationOrdersData
          v-if="orgIDparams"
          :organizationID="orgIDparams"
          @update-commission="fetchCommissionData"
        />
      </div>

      <div class="block md:hidden">
        <OrganizationMobileOrdersData
          v-if="orgIDparams"
          :organizationID="orgIDparams"
          @update-commission="fetchCommissionData"
        />
      </div>
    </div>

    <div
      v-if="loadingFetchProductOrders"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground">
          Fetching orders for selected product...
        </span>
        <!-- Add a GIF here -->
      </div>
    </div>

    <div
      v-if="loadingSetOrderStatus"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground">
          Updating order status...
        </span>
        <!-- Add a GIF here -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/organization/orders/useFetchOrders";
  import { useTrackCommission } from "~/composables/organization/useTrackCommission";
  import type {
    ExtendedOrder,
    ExtendedOrderItem,
  } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { Product, Variation } from "~/types/models/Product";

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });

  type ExtendedProduct = Product & { id: string };

  const products = ref<ExtendedProduct[]>([]);
  const selectedProduct = ref<ExtendedProduct | null>(null);
  const orders = ref<ExtendedOrder[]>([]);
  const organizationOrders = ref<ExtendedOrder[]>([]);
  const loadingFetchingOrgOrdersSummary = ref(false);
  const loadingSetOrderStatus = ref(false);
  const route = useRoute();

  const orgIDparams = computed(() => {
    const id = route.params.id;
    if (Array.isArray(id)) {
      return id[0];
    }
    return id;
  });
  // console.log("Organization ID from params:", orgIDparams.value);

  const { fetchOrganizationProducts, fetchProductOrders, fetchOrganizationOrders, setOrderStatus } =
    useFetchOrders();
  const { trackCommission } = useTrackCommission();

  const commissionData = ref({ paidCommission: 0, unpaidCommission: 0 });
  const totalCommission = computed(() => {
    return commissionData.value.paidCommission + commissionData.value.unpaidCommission;
  });
  const paidPercentage = computed(() =>
    totalCommission.value > 0
      ? (commissionData.value.paidCommission / totalCommission.value) * 100
      : 0
  );

  const fetchCommissionData = async () => {
    const { trackCommission } = useTrackCommission();
    commissionData.value = await trackCommission(orgIDparams.value);
  };

  onMounted(() => {
    fetchCommissionData();
  });

  onMounted(async () => {
    try {
      fetchCommissionData();

      // console.log("Calling trackCommission with orgID:", orgIDparams.value);

      if (!orgIDparams.value) {
        console.error("orgIDparams is undefined or null");
        return;
      }

      commissionData.value = await trackCommission(orgIDparams.value);

      // console.log("Commission Data:", commissionData.value);
      // console.log("orgIDparams:", orgIDparams.value);
    } catch (error) {
      console.error("Error in trackCommission:", error);
    }
  });

  onMounted(async () => {
    try {
      fetchCommissionData();
      // Fetch products for the organization using the organization ID from params
      const fetchedProducts = await fetchOrganizationProducts(orgIDparams.value);
      products.value = fetchedProducts;
      // console.log("Fetched Products:", products.value);

      // Fetch orders for the organization
      loadingFetchingOrgOrdersSummary.value = true;
      const fetchedOrganizationOrders = await fetchOrganizationOrders(orgIDparams.value);
      organizationOrders.value = fetchedOrganizationOrders;
      // console.log("Fetched Organization Orders:", organizationOrders.value);
    } catch (error) {
      console.error("Error fetching products or orders:", error);
    } finally {
      loadingFetchingOrgOrdersSummary.value = false;
    }
  });

  const productsDialog = ref(false);
  const loadingFetchProductOrders = ref(false);

  const closeDialog = async (save: boolean) => {
    loadingFetchProductOrders.value = true;
    productsDialog.value = false;
    if (save && selectedProduct.value) {
      try {
        const fetchedOrders = await fetchProductOrders(selectedProduct.value.id);
        orders.value = fetchedOrders;
        // console.log("Fetched Orders for selected product:", orders.value);
      } catch (error) {
        console.error("Error fetching orders for selected product:", error);
      } finally {
        loadingFetchProductOrders.value = false;
      }
    }
    useToast().toast({
      title: save ? "Product Chosen" : "Action Cancelled",
      description: `Product has been ${save ? "chosen" : "cancelled"}`,
      duration: 5000,
      icon: save ? "lucide:check" : "lucide:x",
    });
  };

  const setPendingOrdersToPreparing = async () => {
    if (selectedProduct.value) {
      loadingSetOrderStatus.value = true;
      try {
        await setOrderStatus(selectedProduct.value.id, "preparing");
        // console.log("Set pending orders to preparing");
      } catch (error) {
        console.error("Error setting orders to preparing:", error);
      } finally {
        loadingSetOrderStatus.value = false;
      }
    }
  };

  const setPendingOrdersToReady = async () => {
    if (selectedProduct.value) {
      loadingSetOrderStatus.value = true;
      try {
        await setOrderStatus(selectedProduct.value.id, "ready");
        // console.log("Set pending orders to ready");
      } catch (error) {
        console.error("Error setting orders to ready:", error);
      } finally {
        loadingSetOrderStatus.value = false;
      }
    }
  };

  const variationSummaries = computed(() => {
    const summaries: Record<string, any> = {};
    orders.value.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (!summaries[item.variationID]) {
          summaries[item.variationID] = {
            variationName: item.variationDetails?.value || "Unknown",
            price: Number(item.priceWithCommission).toFixed(2),
            remainingStocks: item.variationDetails?.remainingStocks || 0,
            reservedStocks: item.variationDetails?.reservedStocks || 0,
            preOrderStocks: item.variationDetails?.preOrderStocks || 0,
            completedOrders: item.variationDetails?.completedOrders || 0,
            cancelledOrders: item.variationDetails?.cancelledOrders || 0,
          };
        }
        summaries[item.variationID].totalOrders += item.quantity;
      });
    });
    return Object.values(summaries);
  });

  const organizationOrderSummary = computed(() => {
    const summary = {
      totalOrders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      cancelledOrders: 0,
    };
    organizationOrders.value.forEach((order) => {
      summary.totalOrders += 1;
      if (order.orderStatus === "pending") {
        summary.pendingOrders += 1;
      } else if (order.orderStatus === "completed") {
        summary.completedOrders += 1;
      } else if (order.orderStatus === "cancelled") {
        summary.cancelledOrders += 1;
      }
    });
    return summary;
  });
</script>
