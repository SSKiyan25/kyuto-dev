<template>
  <div class="flex h-screen w-full flex-col p-8">
    <div class="flex h-auto w-full flex-col items-start p-4">
      <div class="flex w-full flex-row items-center justify-between gap-1">
        <div class="flex flex-col space-y-2">
          <span class="text-2xl font-semibold">Orders</span>
          <span class="text-sm text-muted-foreground">
            View and manage all orders associated with your products.
          </span>
        </div>

        <UiDialog v-model:open="productsDialog">
          <UiDialogTrigger as-child>
            <UiButton>Choose a Product</UiButton>
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
      <div v-if="orders.length > 0 && selectedProduct" class="w-full">
        <div class="my-4 flex w-full flex-col justify-center">
          <span class="text-lg font-medium">{{ selectedProduct?.name }}</span>
          <UiDivider class="my-2" />
          <div>
            <UiTable>
              <UiTableCaption>List of your product's variations order summary</UiTableCaption>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead>Variation Name</UiTableHead>
                  <UiTableHead>Price</UiTableHead>
                  <UiTableHead>Remaining Stocks</UiTableHead>
                  <UiTableHead>Pending Orders</UiTableHead>
                  <UiTableHead>Fulfilled Orders</UiTableHead>
                  <UiTableHead>Cancelled Orders</UiTableHead>
                  <UiTableHead>Total Orders</UiTableHead>
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody class="last:border-b">
                <UiTableRow v-for="summary in variationSummaries" :key="summary.variationName">
                  <UiTableCell>{{ summary.variationName }}</UiTableCell>
                  <UiTableCell>₱ {{ summary.price }}</UiTableCell>
                  <UiTableCell>{{ summary.remainingStocks }}</UiTableCell>
                  <UiTableCell>{{ summary.pendingOrders }}</UiTableCell>
                  <UiTableCell>{{ summary.fulfilledOrders }}</UiTableCell>
                  <UiTableCell>{{ summary.cancelledOrders }}</UiTableCell>
                  <UiTableCell>{{ summary.totalOrders }}</UiTableCell>
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
                    variationSummaries.reduce((acc, summary) => acc + summary.pendingOrders, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.fulfilledOrders, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.cancelledOrders, 0)
                  }}</UiTableCell>
                  <UiTableCell>{{
                    variationSummaries.reduce((acc, summary) => acc + summary.totalOrders, 0)
                  }}</UiTableCell>
                </UiTableRow>
              </UiTableFooter>
            </UiTable>
          </div>
        </div>
      </div>
      <UiDivider class="my-4" />
      <!-- Display the overall order summary for the organization -->
      <div
        class="flex h-auto w-full flex-row flex-wrap gap-4 rounded-md bg-secondary p-4 shadow-md"
      >
        <div class="flex w-2/12 flex-row items-center space-x-2">
          <Icon name="lucide:briefcase" class="h-6 w-6 text-muted-foreground" />
          <span class="text-sm text-muted-foreground">Orders Summary</span>
        </div>
        <div class="h-12">
          <UiDivider orientation="vertical" class="bg-black" />
        </div>
        <div class="flex w-2/12 flex-col justify-center">
          <span class="text-[12px] text-muted-foreground">Total Orders</span>
          <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">{{
            organizationOrderSummary.totalOrders
          }}</span>
          <Icon
            v-if="loadingFetchingOrgOrdersSummary"
            name="lucide:loader-circle"
            class="h-4 w-4 animate-spin text-primary"
          />
        </div>
        <div class="h-12">
          <UiDivider orientation="vertical" class="bg-black" />
        </div>
        <div class="flex w-2/12 flex-col justify-center">
          <span class="text-[12px] text-muted-foreground">Pending Orders</span>
          <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">{{
            organizationOrderSummary.pendingOrders
          }}</span>
          <Icon
            v-if="loadingFetchingOrgOrdersSummary"
            name="lucide:loader-circle"
            class="h-4 w-4 animate-spin text-primary"
          />
        </div>
        <div class="h-12">
          <UiDivider orientation="vertical" class="bg-black" />
        </div>
        <div class="flex w-2/12 flex-col justify-center">
          <span class="text-[12px] text-muted-foreground">Fulfilled Orders</span>
          <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">{{
            organizationOrderSummary.fulfilledOrders
          }}</span>
          <Icon
            v-if="loadingFetchingOrgOrdersSummary"
            name="lucide:loader-circle"
            class="h-4 w-4 animate-spin text-primary"
          />
        </div>
        <div class="h-12">
          <UiDivider orientation="vertical" class="bg-black" />
        </div>
        <div class="flex w-2/12 flex-col justify-center">
          <span class="text-[12px] text-muted-foreground">Cancelled Orders</span>
          <span v-if="!loadingFetchingOrgOrdersSummary" class="text-sm font-semibold">{{
            organizationOrderSummary.cancelledOrders
          }}</span>
          <Icon
            v-if="loadingFetchingOrgOrdersSummary"
            name="lucide:loader-circle"
            class="h-4 w-4 animate-spin text-primary"
          />
        </div>
      </div>
      <OrganizationOrdersData v-if="organizationID" :organizationID="organizationID" />
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
    <div class="h-lvh">,</div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/organization/orders/useFetchOrders";
  import type { ExtendedOrder } from "~/composables/organization/orders/useFetchOrders";
  import type { Product, Variation } from "~/types/models/Product";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  type ExtendedProduct = Product & { id: string };

  const user = useCurrentUser();
  console.log("User uid", user.value?.uid);
  const products = ref<ExtendedProduct[]>([]);
  const selectedProduct = ref<ExtendedProduct | null>(null);
  const orders = ref<ExtendedOrder[]>([]);
  const organizationOrders = ref<ExtendedOrder[]>([]);
  const loadingFetchingOrgOrdersSummary = ref(false);
  const organizationID = ref<string | null>(null);

  // Test the useFetchOrders composable
  const { fetchOrganizationProducts, fetchProductOrders, fetchOrganizationOrders } =
    useFetchOrders();
  onMounted(async () => {
    if (user.value?.uid) {
      try {
        // Fetch products for the organization
        const fetchedProducts = await fetchOrganizationProducts(user.value.uid);
        products.value = fetchedProducts;
        console.log("Fetched Products:", products.value);
        // Fetch orders for the organization
        loadingFetchingOrgOrdersSummary.value = true;
        organizationID.value = fetchedProducts[0]?.organizationID;
        if (organizationID.value) {
          const fetchedOrganizationOrders = await fetchOrganizationOrders(organizationID.value);
          organizationOrders.value = fetchedOrganizationOrders;
          console.log("Fetched Organization Orders:", organizationOrders.value);
        }
        loadingFetchingOrgOrdersSummary.value = false;
      } catch (error) {
        console.error("Error fetching products:", error);
      }
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
        console.log("Fetched Orders for selected product:", orders.value);
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

  const variationSummaries = computed(() => {
    const summaries: Record<string, any> = {};
    orders.value.forEach((order) => {
      order.orderItems.forEach((item) => {
        if (!summaries[item.variationID]) {
          summaries[item.variationID] = {
            variationName: item.variationDetails?.value || "Unknown",
            price: item.price,
            remainingStocks: item.variationDetails?.remainingStocks || 0,
            pendingOrders: item.variationDetails?.pendingOrders || 0,
            fulfilledOrders: item.variationDetails?.fulfilledOrders || 0,
            cancelledOrders: item.variationDetails?.cancelledOrders || 0,
            totalOrders: 0,
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
      fulfilledOrders: 0,
      cancelledOrders: 0,
    };
    organizationOrders.value.forEach((order) => {
      summary.totalOrders += 1;
      if (order.orderStatus === "pending") {
        summary.pendingOrders += 1;
      } else if (order.orderStatus === "fulfilled") {
        summary.fulfilledOrders += 1;
      } else if (order.orderStatus === "cancelled") {
        summary.cancelledOrders += 1;
      }
    });
    return summary;
  });
</script>
