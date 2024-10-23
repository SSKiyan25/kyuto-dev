<script setup lang="ts">
  import { useOrganizationValues } from "~/composables/organization/useOrganizationValues";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });
  const { organizationData, organizationLoading, organizationID } = useOrganizationValues();

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard" },
    { label: "All Products", link: "/organization/products" },
  ];

  // Filters
  const filterBy = ref("All");
  const filterOptions = ["All", "Active", "Draft", "Archived"];

  const defaultCategory = ref("All");
  const categories = ["All", "T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];

  const date = ref();

  // Table
  const tableRef = ref();
  const table = ref<Table<Partial<Product>> | null>(null);
  const search = ref("");

  type Product = {
    photo: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    date: string;
  };

  const data: Partial<Product>[] = [
    {
      photo: "/assets/images/sample-product.png",
      name: "Sample Product",
      category: "T-shirt",
      price: 100,
      stock: 100,
      status: "Active",
      date: "2021-10-10",
    },
    {
      photo: "/assets/images/sample-product.png",
      name: "Sample Product - 2",
      category: "Lanyard",
      price: 100,
      stock: 100,
      status: "Draft",
      date: "2021-10-11",
    },
    {
      photo: "/assets/images/sample-product.png",
      name: "Sample Product - 3",
      category: "Others",
      price: 100,
      stock: 100,
      status: "Archived",
      date: "2021-10-9",
    },
  ];

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
              h(resolveComponent("Icon"), { name: "lucide:view", class: "mr-2 h-4 w-4" }),
              "View",
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Edit" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:pencil", class: "mr-2 h-4 w-4" }),
              "Edit",
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Delete" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:delete", class: "mr-2 h-4 w-4" }),
              "Delete",
            ]),
          ]),
        ]);
      },
    },
  ];
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
              >Show:
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
    <div class="flex min-h-[36rem] w-full flex-col items-start bg-muted p-4 shadow">
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
          class="mt-5 flex w-full rounded-md border"
        >
          <template #empty>
            <div class="flex w-full flex-col items-center justify-center gap-5 py-5">
              <Icon name="lucide:database" class="h-12 w-12 text-muted-foreground" />
              <span class="mt-2">No data available.</span>
            </div>
          </template>
        </UiTanStackTable>
      </div>
    </div>
  </div>
</template>
