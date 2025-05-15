<script setup lang="ts">
  import {
    addDiscountToProduct,
    archiveProduct,
    fetchProducts,
    fetchVariations,
  } from "~/composables/organization/useProducts";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
  import { RouterLink } from "vue-router";
  import type { ColumnDef, RowData, Table } from "@tanstack/vue-table";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Variation } from "~/types/models/Product";
  import type { DocumentData } from "firebase/firestore";

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

  // console.log("Organization ID Link:", organizationIDLink);
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

  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  // Filters
  const filterBy = ref("All");
  const filterOptions = ["All", "Publish", "Draft", "Archived"];
  const defaultCategory = ref("All");
  const categories = ["All", "T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];

  // Table
  const tableRef = ref();
  const table = ref<Table<Partial<Product>> | null>(null);
  const search = ref("");

  type Product = {
    id: string;
    photo: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    date: string;
  };

  // For responsive design
  const selectedProduct = ref<Partial<Product> | null>(null);
  const showDetailDialog = ref(false);
  const windowWidth = ref(0);
  const isLoading = ref(false);

  // Add function to handle viewing details
  const handleViewDetails = (product: Partial<Product>) => {
    selectedProduct.value = product;
    showDetailDialog.value = true;
  };

  // Track window size - set initial value after component is mounted
  onMounted(() => {
    windowWidth.value = window.innerWidth;
    fetchCommissionRate();
    fetchAndSetProducts();
    window.addEventListener("resize", updateWindowWidth);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateWindowWidth);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", updateWindowWidth);
  });

  const updateWindowWidth = () => {
    windowWidth.value = window.innerWidth;
    console.log("Window width:", windowWidth.value);
    forceRefresh.value++;
  };

  // REPLACE your visibleColumns computed property with this implementation
  const visibleColumns = computed(() => {
    console.log(
      "Current window width:",
      windowWidth.value,
      "Is desktop?",
      windowWidth.value >= 768
    );
    const _ = forceRefresh.value;
    if (windowWidth.value >= 768) {
      // FORCE ALL COLUMNS TO BE VISIBLE ON DESKTOP
      console.log("Returning all columns for desktop:", columns.length);
      return columns;
    } else {
      // FORCE ONLY NAME, PRICE AND ACTIONS TO BE VISIBLE ON MOBILE
      const mobileColumns = columns.filter((column) => {
        const key = "accessorKey" in column ? column.accessorKey : "";
        return key === "name" || key === "price" || key === "actions";
      });
      return mobileColumns;
    }
  });

  const forceRefresh = ref(0);

  const data = ref<Partial<Product>[]>([]);
  const lastVisible = ref<QueryDocumentSnapshot<DocumentData> | null>(null);

  const columns: ColumnDef<Partial<Product>>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableHiding: false,
      cell: ({ row }) => {
        // Truncate long names on mobile
        const isSmallScreen = windowWidth.value < 768;
        const name = row.original.name || "";
        return isSmallScreen && name.length > 15 ? `${name.substring(0, 15)}...` : name;
      },
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant = "default";

        if (status === "Draft") {
          variant = "outline";
        } else if (status === "Archived") {
          variant = "destructive";
        }

        // Use a smaller badge on mobile screens
        const isSmallScreen = windowWidth.value < 768;
        const badgeClass = isSmallScreen ? "capitalize text-xs" : "capitalize";

        return h(resolveComponent("UiBadge"), { variant, class: badgeClass }, () => [status]);
      },
      enableHiding: true,
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "category",
      header: "Category",
      enableHiding: true,
      cell: ({ row }) => {
        const category = row.original.category;
        // Use a smaller text on mobile screens
        const isSmallScreen = windowWidth.value < 768;
        return isSmallScreen ? h("span", { class: "text-xs" }, category) : category;
      },
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "price",
      header: "Price",
      enableHiding: true,
      cell: ({ row }) => {
        const formattedPrice = `₱${calculatePriceWithCommission(Number(row.original.price)).toFixed(2)}`;
        // Use a smaller text on mobile screens
        const isSmallScreen = windowWidth.value < 768;
        return isSmallScreen ? h("span", { class: "text-xs" }, formattedPrice) : formattedPrice;
      },
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "stock",
      header: "Remaining Stocks",
      enableHiding: true,
      cell: ({ row }) => {
        const stock = row.original.stock;
        // Use a smaller text on mobile screens
        const isSmallScreen = windowWidth.value < 768;
        return isSmallScreen ? h("span", { class: "text-xs" }, stock) : stock;
      },
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "date",
      header: "Date",
      enableHiding: true,
      cell: ({ row }) => {
        const date = row.original.date;
        // Use a smaller text on mobile screens
        const isSmallScreen = windowWidth.value < 768;
        return isSmallScreen ? h("span", { class: "text-xs" }, date) : date;
      },
      meta: {
        responsive: true,
      },
    },
    {
      accessorKey: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const productId = row.original.id;
        const isSmallScreen = windowWidth.value < 768; // MD breakpoint

        // Make the dropdown menu more compact
        return h(resolveComponent("UiDropdownMenu"), {}, () => [
          h(resolveComponent("UiDropdownMenuTrigger"), { asChild: true }, () => [
            h(
              resolveComponent("UiButton"),
              {
                variant: "ghost",
                size: isSmallScreen ? "sm" : "icon",
                class: isSmallScreen ? "w-9 h-9" : "w-9 h-9",
              },
              () => [
                h(resolveComponent("Icon"), {
                  name: "lucide:more-horizontal",
                  class: isSmallScreen ? "h-4 w-4" : "h-4 w-4",
                }),
              ]
            ),
          ]),
          h(resolveComponent("UiDropdownMenuContent"), { align: "end" }, () => [
            // View Details option only on mobile
            // isSmallScreen &&
            h(
              resolveComponent("UiDropdownMenuItem"),
              {
                title: "View Details",
                onClick: () => handleViewDetails(row.original),
              },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:eye", class: "mr-2 h-4 w-4" }),
                "View Details",
              ]
            ),
            h(
              resolveComponent("UiDropdownMenuItem"),
              {
                title: "Add Discount",
                onClick: () =>
                  openAddDiscountDialog(productId as string, row.original.name as string),
              },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:tag", class: "mr-2 h-4 w-4" }),
                "Add Discount",
              ]
            ),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Edit" }, () => [
              h(RouterLink, { to: `/organization/products/edit/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:pencil", class: "mr-2 h-4 w-4" }),
                "Edit",
              ]),
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Manage Inventory" }, () => [
              h(RouterLink, { to: `/organization/products/inventory/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:layers-3", class: "mr-2 h-4 w-4" }),
                "Manage Inventory",
              ]),
            ]),
            h(
              resolveComponent("UiDropdownMenuItem"),
              { title: "Archive", onClick: () => handleArchiveProduct(productId as string) },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:file-x", class: "mr-2 h-4 w-4" }),
                "Archive",
              ]
            ),
          ]),
        ]);
      },
    },
  ];

  // Get copy of the products
  const fetchAndSetProducts = async (reset = false) => {
    isLoading.value = true;

    try {
      if (orgIDLink) {
        const pageSize = table.value?.getState().pagination.pageSize || 10;
        const result = await fetchProducts(
          pageSize,
          filterBy.value,
          defaultCategory.value,
          reset ? null : lastVisible.value,
          orgIDLink
        );

        const newData = result.products.map((product) => ({
          id: product.id,
          photo: product.featuredPhotoURL,
          name: product.name,
          category: product.category,
          price: product.price,
          stock: product.stock,
          status: product.status,
          date:
            product.dateCreated instanceof Timestamp
              ? product.dateCreated.toDate().toISOString().split("T")[0]
              : "",
        }));

        if (reset) {
          data.value = newData;
        } else {
          const existingIds = new Set(data.value.map((product) => product.id));
          const uniqueNewData = newData.filter((product) => !existingIds.has(product.id));
          data.value = [...data.value, ...uniqueNewData];
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
      await fetchAndSetProducts(true); // Refresh the product list
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "An error occurred while archiving the product.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    }
  };

  watch([filterBy, defaultCategory], () => fetchAndSetProducts(true), {
    immediate: true,
  });

  watch(
    () => table.value?.getState().pagination.pageSize,
    () => fetchAndSetProducts(true)
  );

  watch(
    () => table.value?.getState().pagination.pageIndex,
    () => fetchAndSetProducts()
  );

  onMounted(() => {
    fetchCommissionRate();
  });

  const openAddDiscount = ref(false);
  const discountType = ref("percentage");
  const discountTarget = ref("member");
  const variations = ref<(Variation & { id: string })[]>([]);
  const productName = ref("");
  const productSelected = ref<string>("");
  const isCustomDiscount = computed(() => discountType.value === "custom");

  const discountTargetOptions = [
    { value: "member", text: "Member" },
    { value: "code", text: "Code" },
  ];

  const discountTypeOptions = [
    { value: "percentage", text: "Percentage" },
    { value: "custom", text: "Custom" },
  ];

  const { handleSubmit, resetForm, isSubmitting } = useForm({
    validationSchema: toTypedSchema(DiscountSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    const validCustomDiscountPrices = values.customDiscountPrices?.filter(
      (item) => item.price !== undefined
    ) as { id: string; price: number }[];

    try {
      await addDiscountToProduct(
        productSelected.value,
        values.discountType,
        values.discountTarget,
        values.discount,
        values.discountCode,
        validCustomDiscountPrices
      );
      toast.toast({
        title: "Discount added",
        description: "The discount has been added successfully.",
        variant: "success",
        icon: "lucide:check",
      });
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: `An error occurred while adding the discount: ${error.message}`,
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
      console.error("Error adding discount:", error);
    }

    closeDiscountDialog(true);
    discountTarget.value = "member";
    discountType.value = "percentage";
    productSelected.value = "";
  });

  const openAddDiscountDialog = async (productId: string, name: string) => {
    const variationsResult = await fetchVariations(productId);
    variations.value = variationsResult;
    productSelected.value = productId;
    productName.value = name;
    console.log("Fetched Variations:", variations.value);

    openAddDiscount.value = true;
  };

  const closeDiscountDialog = (save: boolean) => {
    openAddDiscount.value = false;
  };

  onMounted(fetchAndSetProducts);
</script>

<template>
  <div class="flex w-full flex-col p-3 sm:p-6 md:p-8">
    <!-- Header Section -->
    <div class="mb-4 flex flex-col justify-between gap-3 sm:mb-6 sm:flex-row sm:items-center">
      <div class="overflow-x-auto pb-2 sm:pb-0">
        <UiBreadcrumbs class="justify-center" :items="crumbs" />
      </div>
      <div class="w-full sm:w-auto">
        <!-- Search -->
        <UiInput type="search" v-model="search" placeholder="Search Product" class="w-full" />
      </div>
    </div>

    <!-- Filter Section - Reduce padding and gap on mobile -->
    <div
      class="flex flex-col justify-between gap-3 pb-3 pt-1 sm:flex-row sm:items-center sm:gap-4 sm:pb-4 sm:pt-4"
    >
      <!-- Show products depending on status -->
      <div class="w-full sm:w-auto">
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton
              size="sm"
              variant="secondary"
              class="flex w-full flex-row items-center justify-between sm:w-auto sm:justify-start"
            >
              <span class="truncate"
                >Show: <span class="font-medium opacity-70">{{ filterBy }}</span></span
              >
              <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4 flex-shrink-0" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuLabel label="Filter by:" />
            <UiDropdownMenuRadioGroup v-model="filterBy">
              <UiDropdownMenuRadioItem
                v-for="item in filterOptions"
                :key="item"
                :value="item"
                :title="item"
                :text-value="item"
              />
            </UiDropdownMenuRadioGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>

      <!-- Filter Options -->
      <div class="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-4">
        <!-- Filter by category -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton
              size="sm"
              variant="secondary"
              class="flex w-full flex-row items-center justify-between sm:w-auto"
            >
              <span class="truncate">Filter by</span>
              <Icon name="lucide:list-filter" class="ml-2 h-4 w-4 flex-shrink-0" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuLabel label="Filter by:" />
            <UiDropdownMenuRadioGroup v-model="defaultCategory">
              <UiDropdownMenuRadioItem
                v-for="item in categories"
                :key="item"
                :value="item"
                :title="item"
                :text-value="item"
              />
            </UiDropdownMenuRadioGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>

        <UiButton
          :to="`/organization/products/add/${organizationIDLink}`"
          class="flex flex-row items-center justify-center"
        >
          <Icon name="lucide:circle-plus" class="mr-2 size-4 flex-shrink-0" />
          <span class="truncate">Add Product</span>
        </UiButton>
      </div>
    </div>

    <!-- Main Content Section  -->
    <div class="flex h-auto w-full flex-col items-start rounded-lg bg-muted p-2 shadow sm:p-4">
      <div class="mb-3 flex flex-col items-start gap-1 sm:mb-4">
        <span class="text-lg font-semibold sm:text-xl md:text-2xl">Products</span>
        <p class="text-xs opacity-60 sm:text-sm">
          Manage your products and view their sales performance.
        </p>
      </div>

      <!-- Mobile view notice -->
      <div
        v-if="windowWidth < 768"
        class="mb-2 w-full rounded-md border bg-muted/80 p-2 text-xs sm:text-sm"
      >
        <Icon name="lucide:info" class="mr-1 inline-block h-3 w-3 sm:h-4 sm:w-4" />
        Some columns are hidden. Tap <span class="font-semibold">View Details</span> to see all
        information.
      </div>

      <!-- Table  -->
      <div class="w-full">
        <div class="-mx-2 overflow-x-hidden px-2 sm:mx-0 sm:px-0">
          <UiTanStackTable
            @ready="table = $event"
            :key="windowWidth >= 768 ? 'desktop' : 'mobile'"
            ref="tableRef"
            :search="search"
            :data="data"
            :columns="visibleColumns"
            :showPagination="false"
            :showRowsPerPage="true"
            :loading="isLoading"
            rowsPerPageText="Total items:"
            class="mt-2 flex w-full rounded-md border sm:mt-4"
          >
            <template #loading>
              <div
                class="flex w-full flex-col items-center justify-center gap-3 py-6 sm:gap-4 sm:py-8"
              >
                <div class="flex flex-col items-center">
                  <Icon
                    name="lucide:loader-circle"
                    class="h-8 w-8 animate-spin text-primary sm:h-10 sm:w-10 md:h-12 md:w-12"
                  />
                  <span class="mt-3 text-xs sm:text-sm md:text-base">Loading products...</span>
                </div>
              </div>
            </template>

            <template #empty>
              <div
                class="flex w-full flex-col items-center justify-center gap-3 py-6 sm:gap-4 sm:py-8"
              >
                <Icon
                  name="lucide:database"
                  class="h-8 w-8 text-muted-foreground sm:h-10 sm:w-10 md:h-12 md:w-12"
                />
                <span class="text-xs sm:text-sm md:text-base">No products available.</span>
                <UiButton
                  size="sm"
                  :to="`/organization/products/add/${organizationIDLink}`"
                  variant="outline"
                  class="mt-1"
                >
                  <Icon name="lucide:plus" class="mr-1 h-3 w-3 sm:mr-2 sm:h-4 sm:w-4" />
                  Add Your First Product
                </UiButton>
              </div>
            </template>
          </UiTanStackTable>
        </div>

        <div class="mt-2 flex items-end justify-end sm:mt-3">
          <span class="text-xs text-muted-foreground sm:text-sm">
            Total Products: {{ data.length }}
          </span>
        </div>
      </div>

      <!-- Product Detail Dialog - mobile friendly -->
      <UiDialog v-model:open="showDetailDialog">
        <UiDialogContent
          class="max-h-[95vh] w-[95vw] max-w-[350px] overflow-y-auto sm:max-w-[450px]"
        >
          <UiDialogHeader>
            <UiDialogTitle>Product Details</UiDialogTitle>
            <UiDialogDescription class="text-xs sm:text-sm">
              Overview of the product and its details.
            </UiDialogDescription>
          </UiDialogHeader>

          <div v-if="selectedProduct" class="space-y-4 pt-2">
            <div class="flex flex-col gap-1">
              <h3 class="text-base font-semibold sm:text-lg">{{ selectedProduct.name }}</h3>
              <UiBadge
                :variant="
                  selectedProduct.status === 'Draft'
                    ? 'outline'
                    : selectedProduct.status === 'Archived'
                      ? 'destructive'
                      : 'default'
                "
                class="w-fit capitalize"
              >
                {{ selectedProduct.status }}
              </UiBadge>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground sm:text-sm">Category</p>
                <p class="text-sm font-medium sm:text-base">{{ selectedProduct.category }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground sm:text-sm">Price</p>
                <p class="text-sm font-medium sm:text-base">
                  ₱{{ calculatePriceWithCommission(Number(selectedProduct.price)).toFixed(2) }}
                </p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground sm:text-sm">Remaining Stock</p>
                <p class="text-sm font-medium sm:text-base">{{ selectedProduct.stock }}</p>
              </div>
              <div class="space-y-1">
                <p class="text-xs text-muted-foreground sm:text-sm">Added on</p>
                <p class="text-sm font-medium sm:text-base">{{ selectedProduct.date }}</p>
              </div>
            </div>

            <UiDialogFooter class="flex-col gap-2 pt-2 sm:flex-row sm:gap-0">
              <UiButton
                variant="outline"
                @click="showDetailDialog = false"
                class="w-full sm:w-auto"
              >
                Close
              </UiButton>
              <UiButton
                :to="`/organization/products/edit/${selectedProduct.id}`"
                class="w-full sm:w-auto"
              >
                Edit Product
              </UiButton>
            </UiDialogFooter>
          </div>
        </UiDialogContent>
      </UiDialog>
    </div>

    <!-- Spacer - Reduced on mobile -->
    <div class="min-h-8 sm:min-h-16 md:min-h-32"></div>
  </div>

  <!-- Discount Dialog - Make more compact on mobile -->
  <UiDialog v-model:open="openAddDiscount">
    <UiDialogContent class="max-h-[95vh] w-[95vw] overflow-y-auto bg-secondary sm:max-w-[650px]">
      <UiDialogHeader>
        <UiDialogTitle>Add Discount</UiDialogTitle>
        <UiDialogDescription class="text-xs sm:text-sm">
          Add a discount to your product. If a discount is already applied, it will be replaced.
        </UiDialogDescription>
      </UiDialogHeader>
      <div class="text-base font-semibold sm:text-lg">{{ productName }}</div>
      <form @submit.prevent="onSubmit">
        <div class="space-y-3 p-2 sm:space-y-4 sm:p-4">
          <UiVeeRadioGroup name="discountTarget" label="Discount Target" v-model="discountTarget">
            <template v-for="(opt, i) in discountTargetOptions" :key="i">
              <div class="mb-2 flex items-center gap-2 sm:gap-3">
                <UiRadioGroupItem
                  :value="opt.value"
                  :id="opt.value"
                  :checked="discountTarget === opt.value"
                  @change="discountTarget = opt.value"
                  :disabled="isSubmitting"
                />
                <UiLabel :for="opt.value" class="text-sm sm:text-base">{{ opt.text }}</UiLabel>
              </div>
            </template>
          </UiVeeRadioGroup>
          <UiVeeRadioGroup name="discountType" label="Discount Type" v-model="discountType">
            <template v-for="(opt, i) in discountTypeOptions" :key="i">
              <div class="mb-2 flex items-center gap-2 sm:gap-3">
                <UiRadioGroupItem
                  :value="opt.value"
                  :id="opt.value"
                  :checked="discountType === opt.value"
                  @change="discountType = opt.value"
                  :disabled="isSubmitting"
                />
                <UiLabel :for="opt.value" class="text-sm sm:text-base">{{ opt.text }}</UiLabel>
              </div>
            </template>
          </UiVeeRadioGroup>
          <div>
            <UiVeeInput
              name="discount"
              label="Discount"
              placeholder="10%"
              :min="0"
              :max="100"
              :disabled="isCustomDiscount || isSubmitting"
              v-percentage
            />
            <span v-if="isCustomDiscount" class="text-xs text-secondary-foreground/60 sm:text-sm">
              Disabled when Custom is selected
            </span>
          </div>
          <UiVeeInput
            v-if="discountTarget === 'code'"
            name="discountCode"
            label="Discount Code"
            placeholder="SUMMER10"
            :disabled="isSubmitting"
          />
          <div v-if="discountType === 'custom'" class="space-y-3 sm:space-y-4">
            <div v-for="(variation, index) in variations" :key="variation.id" class="flex flex-col">
              <UiVeeInput
                :name="'customDiscountPrices[' + index + '].id'"
                :label="'Variation ' + (index + 1) + ' ID'"
                :placeholder="'Variation ID'"
                v-model="variation.id"
                hidden
              />
              <UiVeeInput
                :name="'customDiscountPrices[' + index + '].price'"
                :label="'Variation ' + (index + 1) + ' Price'"
                :placeholder="variation.price.toString()"
                :max="variation.price"
                :disabled="isSubmitting"
                :min="0"
              />
            </div>
          </div>

          <UiDialogFooter class="flex-col gap-2 pt-2 sm:flex-row sm:gap-0">
            <UiButton
              variant="outline"
              :disabled="isSubmitting"
              @click="closeDiscountDialog(false)"
              class="w-full sm:w-auto"
            >
              Cancel
            </UiButton>
            <UiButton :loading="isSubmitting" type="submit" class="w-full sm:w-auto">
              Save
            </UiButton>
          </UiDialogFooter>
        </div>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>
