<script setup lang="ts">
  import { useOrganizationValues } from "~/composables/organization/useOrganizationValues";
  import { fetchProducts } from "~/composables/organization/useProducts";
  import { QueryDocumentSnapshot, Timestamp } from "firebase/firestore";
  import { RouterLink } from "vue-router";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { DocumentData } from "firebase/firestore";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard", icon: "lucide:newspaper" },
    { label: "All Products", link: "/organization/products", icon: "lucide:package" },
  ];

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

  const data = ref<Partial<Product>[]>([]);
  const lastVisible = ref<QueryDocumentSnapshot<DocumentData> | null>(null);
  const columns: ColumnDef<Partial<Product>>[] = [
    { accessorKey: "name", header: "Name", enableHiding: true },
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

        return h(resolveComponent("UiBadge"), { variant, class: "capitalize" }, () => [status]);
      },
      enableHiding: true,
    },
    { accessorKey: "category", header: "Category", enableHiding: true },
    { accessorKey: "price", header: "Price", enableHiding: true },
    { accessorKey: "stock", header: "Stock", enableHiding: true },
    { accessorKey: "date", header: "Date", enableHiding: true },
    {
      accessorKey: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const productId = row.original.id;
        return h(resolveComponent("UiDropdownMenu"), {}, () => [
          h(resolveComponent("UiDropdownMenuTrigger"), { asChild: true }, () => [
            h(
              resolveComponent("UiButton"),
              { variant: "ghost", size: "icon", class: "w-9 h-9" },
              () => [
                h(resolveComponent("Icon"), {
                  name: "lucide:more-horizontal",
                  class: "h-4 w-4",
                }),
              ]
            ),
          ]),
          h(resolveComponent("UiDropdownMenuContent"), () => [
            h(resolveComponent("UiDropdownMenuItem"), { title: "View" }, () => [
              h(RouterLink, { to: `/organization/products/product/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:view", class: "mr-2 h-4 w-4" }),
                "View",
              ]),
            ]),
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
            h(resolveComponent("UiDropdownMenuItem"), { title: "Archive" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:file-x", class: "mr-2 h-4 w-4" }),
              "Archive",
            ]),
          ]),
        ]);
      },
    },
  ];

  const { organizationID } = await useOrganizationValues();
  console.log("Organization ID: ", organizationID.value);

  const fetchAndSetProducts = async (reset = false) => {
    if (organizationID.value) {
      const pageSize = table.value?.getState().pagination.pageSize || 10;
      const result = await fetchProducts(
        organizationID.value,
        pageSize,
        filterBy.value,
        defaultCategory.value,
        reset ? null : lastVisible.value
      );
      console.log("Products in script:", result.products);
      if (reset) {
        data.value = result.products.map((product) => ({
          id: product.id,
          photo: product.featuredPhoto,
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
      } else {
        data.value = [
          ...data.value,
          ...result.products.map((product) => ({
            id: product.id,
            photo: product.featuredPhoto,
            name: product.name,
            category: product.category,
            price: product.price,
            stock: product.stock,
            status: product.status,
            date:
              product.dateCreated instanceof Timestamp
                ? product.dateCreated.toDate().toISOString().split("T")[0]
                : "",
          })),
        ];
      }
      lastVisible.value = result.lastVisible;
      console.log("Data: ", data.value);
    }
  };

  watch([organizationID, filterBy, defaultCategory], () => fetchAndSetProducts(true), {
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

  onMounted(fetchAndSetProducts);
</script>

<template>
  <div class="flex h-screen w-full flex-col p-8">
    <div class="flex flex-row items-center justify-between">
      <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
      <div class="flex flex-row items-center gap-4">
        <!-- Search -->
        <UiInput
          type="search"
          v-model="search"
          placeholder="Search Product"
          class="w-full md:w-96"
        />
      </div>
    </div>
    <div class="flex flex-row items-center justify-between pb-4 pt-8">
      <!-- Show products depending on status -->
      <div>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton size="sm" variant="secondary" class="flex flex-row items-center"
              >Show: <span class="font-medium opacity-70">{{ filterBy }}</span>
              <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
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
      <div class="flex flex-row items-center gap-4">
        <!-- Filter by category -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton size="sm" variant="secondary" class="flex flex-row items-center"
              >Filter by
              <Icon name="lucide:list-filter" class="h-4 w-4" />
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
        <UiButton to="/organization/products/add" class="flex flex-row items-center">
          <Icon name="lucide:circle-plus" class="size-4" />Add Product
        </UiButton>
      </div>
    </div>
    <div class="flex h-auto w-full flex-col items-start bg-muted p-4 shadow">
      <div class="flex flex-col items-start gap-1">
        <span class="text-2xl font-semibold">Products</span>
        <p class="text-sm opacity-60">Manage your products and view their sales performance.</p>
      </div>
      <!-- Table -->
      <div class="w-full">
        <UiTanStackTable
          @ready="table = $event"
          ref="tableRef"
          :search="search"
          :data="data"
          :columns="columns"
          :showPagination="false"
          :showRowsPerPage="true"
          class="mt-5 flex w-full rounded-md border"
        >
          <template #empty>
            <div class="flex w-full flex-col items-center justify-center gap-5 py-5">
              <Icon name="lucide:database" class="h-12 w-12 text-muted-foreground" />
              <span class="mt-2">No data available.</span>
            </div>
          </template>
        </UiTanStackTable>
        <div class="flex items-end justify-end">
          <span class="text-sm text-muted-foreground">Total Products: {{ data.length }}</span>
        </div>
      </div>
    </div>
    <!-- Dont remove -->
    <div class="min-h-32 text-secondary"></div>
  </div>
</template>
