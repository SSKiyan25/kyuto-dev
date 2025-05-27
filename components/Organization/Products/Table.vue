<script setup lang="ts">
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { RouterLink } from "vue-router";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { Product } from "~/types/models/Product";

  // Define a type that represents what we actually receive
  type TableProduct = Partial<Product> & {
    id: string;
    date: string;
    price: number;
    stock: number;
  };

  const props = defineProps<{
    data: TableProduct[];
    isLoading: boolean;
    windowWidth: number;
    search: string;
    organizationIDLink: string;
  }>();

  const emit = defineEmits<{
    (e: "view-details", product: TableProduct): void;
    (e: "add-discount", productId: string, name: string): void;
    (e: "archive-product", productId: string): void;
    (e: "table-ready", table: Table<TableProduct>): void;
  }>();

  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  onMounted(() => {
    // Fetch commission rate on mount
    fetchCommissionRate();
  });
  const forceRefresh = ref(0);
  const tableRef = ref();
  const table = ref<Table<TableProduct> | null>(null);

  // COLUMNS DEFINITION
  const columns: ColumnDef<TableProduct>[] = [
    {
      accessorKey: "name",
      header: "Name",
      enableHiding: false,
      cell: ({ row }) => {
        const isSmallScreen = props.windowWidth < 768;
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
        const status = row.original.status || "";
        let variant = "default";

        if (status === "Draft") {
          variant = "outline";
        } else if (status === "Archived") {
          variant = "destructive";
        }

        const isSmallScreen = props.windowWidth < 768;
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
        const category = row.original.category || "";
        const isSmallScreen = props.windowWidth < 768;
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
        const price = Number(row.original.price || 0);
        const formattedPrice = `₱${calculatePriceWithCommission(price).toFixed(2)}`;
        const isSmallScreen = props.windowWidth < 768;
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
        const stock = row.original.stock || "-";
        const isSmallScreen = props.windowWidth < 768;
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
        const date = row.original.date || "-";
        const isSmallScreen = props.windowWidth < 768;
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
        const isSmallScreen = props.windowWidth < 768;

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
            h(
              resolveComponent("UiDropdownMenuItem"),
              {
                title: "View Details",
                onClick: () => emit("view-details", row.original),
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
                onClick: () => emit("add-discount", productId, row.original.name as string),
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
              { title: "Archive", onClick: () => emit("archive-product", productId) },
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

  // Visible columns based on screen size
  const visibleColumns = computed(() => {
    console.log(
      "Current window width:",
      props.windowWidth,
      "Is desktop?",
      props.windowWidth >= 768
    );
    const _ = forceRefresh.value;
    if (props.windowWidth >= 768) {
      console.log("Returning all columns for desktop:", columns.length);
      return columns;
    } else {
      const mobileColumns = columns.filter((column) => {
        const key = "accessorKey" in column ? column.accessorKey : "";
        return key === "name" || key === "price" || key === "actions";
      });
      return mobileColumns;
    }
  });

  // Handle table ready event
  function onTableReady(tableInstance: Table<TableProduct>) {
    table.value = tableInstance;
    emit("table-ready", tableInstance);
  }
</script>

<template>
  <div class="w-full">
    <!-- Mobile view notice -->
    <div
      v-if="windowWidth < 768"
      class="mb-2 w-full rounded-md border bg-muted/80 p-2 text-xs sm:text-sm"
    >
      <Icon name="lucide:info" class="mr-1 inline-block h-3 w-3 sm:h-4 sm:w-4" />
      Some columns are hidden. Tap <span class="font-semibold">View Details</span> to see all
      information.
    </div>

    <div class="-mx-2 overflow-x-hidden px-2 sm:mx-0 sm:px-0">
      <UiTanStackTable
        @ready="onTableReady"
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
          <div class="flex w-full flex-col items-center justify-center gap-3 py-6 sm:gap-4 sm:py-8">
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
          <div class="flex w-full flex-col items-center justify-center gap-3 py-6 sm:gap-4 sm:py-8">
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
</template>
