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

        <OrganizationOrdersProductSelector
          v-model:open="productsDialog"
          :products="products"
          :loading="loadingFetchProductOrders"
          @select="handleProductSelection"
        />
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

          <OrganizationOrdersVariationSummary :summaries="variationSummaries" />
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
      <OrganizationOrdersSummary
        :summary="organizationOrderSummary"
        :loading="loadingFetchingOrgOrdersSummary"
      />

      <UiDivider />

      <OrganizationOrdersCommissionSummary
        :paid-commission="commissionData.paidCommission"
        :unpaid-commission="commissionData.unpaidCommission"
      />

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

    <!-- Loading Overlay for Fetching Orders -->
    <div
      v-if="loadingFetchProductOrders"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground">
          Fetching orders for selected product...
        </span>
      </div>
    </div>

    <!-- Loading Overlay for Setting Order Status -->
    <div
      v-if="loadingSetOrderStatus"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground">
          Updating order status...
        </span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/organization/orders/useFetchOrders";
  import { useTrackCommission } from "~/composables/organization/useTrackCommission";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchFilterOrders";
  import type { Product } from "~/types/models/Product";

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

  const { fetchOrganizationProducts, fetchProductOrders, fetchOrganizationOrders, setOrderStatus } =
    useFetchOrders();
  const { trackCommission } = useTrackCommission();

  const commissionData = ref({ paidCommission: 0, unpaidCommission: 0 });
  const productsDialog = ref(false);
  const loadingFetchProductOrders = ref(false);

  const fetchCommissionData = async () => {
    commissionData.value = await trackCommission(orgIDparams.value);
  };

  const handleProductSelection = async (product: ExtendedProduct | null, save: boolean) => {
    loadingFetchProductOrders.value = true;
    productsDialog.value = false;

    if (save && product) {
      selectedProduct.value = product;
      try {
        const fetchedOrders = await fetchProductOrders(product.id);
        orders.value = fetchedOrders;
      } catch (error) {
        console.error("Error fetching orders for selected product:", error);
      } finally {
        loadingFetchProductOrders.value = false;
      }
    } else {
      loadingFetchProductOrders.value = false;
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

  onMounted(async () => {
    try {
      fetchCommissionData();

      if (!orgIDparams.value) {
        console.error("orgIDparams is undefined or null");
        return;
      }

      // Fetch products for the organization
      const fetchedProducts = await fetchOrganizationProducts(orgIDparams.value);
      products.value = fetchedProducts;

      // Fetch orders for the organization
      loadingFetchingOrgOrdersSummary.value = true;
      const fetchedOrganizationOrders = await fetchOrganizationOrders(orgIDparams.value);
      organizationOrders.value = fetchedOrganizationOrders;
    } catch (error) {
      console.error("Error fetching products or orders:", error);
    } finally {
      loadingFetchingOrgOrdersSummary.value = false;
    }
  });
</script>
