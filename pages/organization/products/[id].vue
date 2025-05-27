<script setup lang="ts">
  import { archiveProduct, fetchProducts } from "~/composables/organization/useProducts";
  import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
  import type { RowData, Table } from "@tanstack/vue-table";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Product as ProductType } from "~/types/models/Product";
  import type { DocumentData } from "firebase/firestore";

  // Define TableProduct type to match what's expected in Table.vue
  type TableProduct = Partial<ProductType> & {
    id: string;
    date: string;
    price: number;
    stock: number;
  };

  declare module "@tanstack/vue-table" {
    interface ColumnMeta<TData extends RowData, TValue> {
      responsive?: boolean;
    }
  }

  declare module "vue" {
    interface ComponentCustomProperties {
      $slots: {
        loading: () => any;
        empty: () => any;
      };
    }
  }

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });

  const toast = useToast();
  const route = useRoute();
  const organizationIDLink = computed(() => route.params.id as string);
  const orgIDLink = route.params.id as string;
  const productCache = useProductCacheStore();

  // Build breadcrumbs
  const crumbs: Crumbs[] = [
    {
      label: "Dashboard",
      link: `/organization/dashboard/${orgIDLink}`,
      icon: "lucide:newspaper",
    },
    {
      label: "All Products",
      link: `/organization/products/${organizationIDLink}`,
      icon: "lucide:package",
      disabled: true,
    },
  ];

  // Filters
  const filterBy = ref("All");
  const filterOptions = ["All", "Publish", "Draft", "Archived"];
  const defaultCategory = ref("All");
  const categories = ["All", "T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];

  // Table
  const table = ref<Table<TableProduct> | null>(null);
  const search = ref("");

  // For responsive design
  const selectedProduct = ref<TableProduct | null>(null);
  const showDetailDialog = ref(false);
  const windowWidth = ref(0);
  const isLoading = ref(false);

  // For discount dialog
  const openAddDiscount = ref(false);
  const productName = ref("");
  const productSelected = ref<string>("");

  // Track current page for pagination and caching
  const currentPage = ref(0);

  // Add function to handle viewing details
  const handleViewDetails = (product: TableProduct) => {
    selectedProduct.value = product;
    showDetailDialog.value = true;
  };

  // Track window size - set initial value after component is mounted
  onMounted(() => {
    windowWidth.value = window.innerWidth;
    fetchAndSetProducts();
    window.addEventListener("resize", updateWindowWidth);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateWindowWidth);
  });

  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth;
    forceRefresh.value++;
  };

  const forceRefresh = ref(0);

  const data = ref<TableProduct[]>([]);
  const lastVisible = ref<QueryDocumentSnapshot<DocumentData> | null>(null);

  // Get copy of the products with caching
  const fetchAndSetProducts = async (reset = false, forceRefresh = false) => {
    isLoading.value = true;

    try {
      if (orgIDLink) {
        const pageSize = table.value?.getState().pagination.pageSize || 10;

        // Reset page counter if needed
        if (reset) {
          currentPage.value = 0;
        }

        const result = await fetchProducts(
          pageSize,
          filterBy.value,
          defaultCategory.value,
          reset ? null : lastVisible.value,
          orgIDLink,
          currentPage.value,
          !forceRefresh // Use cache only if not forcing refresh
        );

        const newData = result.products.map((product) => ({
          id: product.id,
          photo: product.featuredPhotoURL,
          name: product.name,
          category: product.category,
          price: product.price || 0, // Ensure price is always a number
          stock: product.stock || 0, // Ensure stock is always a number
          status: product.status,
          date:
            product.dateCreated instanceof Timestamp
              ? product.dateCreated.toDate().toISOString().split("T")[0]
              : "",
        })) as TableProduct[];

        if (reset) {
          data.value = newData;
        } else {
          const existingIds = new Set(data.value.map((product) => product.id));
          const uniqueNewData = newData.filter((product) => !existingIds.has(product.id));
          data.value = [...data.value, ...uniqueNewData];

          // Increment page number when loading more
          if (!reset && uniqueNewData.length > 0) {
            currentPage.value++;
          }
        }

        lastVisible.value = result.lastVisible;
      }
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.toast({
        title: "Error",
        description: "Failed to load products. Please try again.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
      data.value = [];
    } finally {
      isLoading.value = false;
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      await archiveProduct(productId);
      toast.toast({
        title: "Product Archived",
        description: "The product has been archived successfully.",
        variant: "success",
        icon: "lucide:check",
      });
      await fetchAndSetProducts(true, true); // Refresh the product list with force refresh
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "An error occurred while archiving the product.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    }
  };

  // Handle table updates
  const handleTableReady = (tableInstance: Table<TableProduct>) => {
    table.value = tableInstance;
  };

  // Handle manual refresh - force refresh from server
  const handleManualRefresh = async () => {
    await fetchAndSetProducts(true, true);
    toast.toast({
      title: "Refreshed",
      description: "Product list has been refreshed from the server.",
      variant: "success",
      icon: "lucide:refresh-cw",
    });
  };

  // Watch for filter changes - these should reset and force a refresh
  watch([filterBy, defaultCategory], () => fetchAndSetProducts(true, true), {
    immediate: true,
  });

  // Watch for page size changes - reset and force a refresh
  watch(
    () => table.value?.getState().pagination.pageSize,
    () => fetchAndSetProducts(true, true)
  );

  // Watch for page index changes - load more data if needed
  watch(
    () => table.value?.getState().pagination.pageIndex,
    () => fetchAndSetProducts(false, false) // Don't reset, use cache if available
  );

  // Simplified function to open discount dialog
  const openAddDiscountDialog = (productId: string, name: string) => {
    productSelected.value = productId;
    productName.value = name;
    openAddDiscount.value = true;
  };

  onMounted(fetchAndSetProducts);
</script>

<template>
  <div class="flex w-full flex-col p-3 sm:p-6 md:p-8">
    <!-- Page Header with Breadcrumbs and Search -->
    <OrganizationProductsPageHeader :crumbs="crumbs" v-model:search="search">
      <!-- Add refresh button in the header -->
      <UiButton
        variant="outline"
        size="sm"
        class="ml-auto"
        @click="handleManualRefresh"
        :disabled="isLoading"
      >
        <Icon
          name="lucide:refresh-cw"
          class="mr-1 h-4 w-4"
          :class="{ 'animate-spin': isLoading }"
        />
        Refresh
      </UiButton>
    </OrganizationProductsPageHeader>

    <!-- Filter Section -->
    <OrganizationProductsFilters
      v-model:filter-by="filterBy"
      :filter-options="filterOptions"
      v-model:default-category="defaultCategory"
      :categories="categories"
      :organization-i-d-link="organizationIDLink"
    />

    <!-- Main Content Section  -->
    <div class="flex h-auto w-full flex-col items-start rounded-lg bg-muted p-2 shadow sm:p-4">
      <div class="mb-3 flex flex-col items-start gap-1 sm:mb-4">
        <span class="text-lg font-semibold sm:text-xl md:text-2xl">Products</span>
        <p class="text-xs opacity-60 sm:text-sm">
          Manage your products and view their sales performance.
        </p>
      </div>

      <!-- Table Component -->
      <OrganizationProductsTable
        :data="data"
        :is-loading="isLoading"
        :window-width="windowWidth"
        :search="search"
        :organization-i-d-link="organizationIDLink"
        @view-details="handleViewDetails"
        @add-discount="openAddDiscountDialog"
        @archive-product="handleArchiveProduct"
        @table-ready="handleTableReady"
      />
    </div>

    <!-- Spacer - Reduced on mobile -->
    <div class="min-h-8 sm:min-h-16 md:min-h-32"></div>

    <!-- Product Detail Dialog Component -->
    <OrganizationProductsDetailDialog v-model:open="showDetailDialog" :product="selectedProduct" />

    <!-- Discount Dialog Component -->
    <OrganizationProductsDiscountDialog
      v-model:open="openAddDiscount"
      :product-id="productSelected"
      :product-name="productName"
      @discount-added="fetchAndSetProducts(true, true)"
    />
  </div>
</template>
