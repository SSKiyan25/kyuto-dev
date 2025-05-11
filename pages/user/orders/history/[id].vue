<template>
  <div class="flex h-screen w-full flex-col">
    <!-- <span class="text-lg font-bold">Order History</span>
    <p class="text-[12px] text-muted-foreground">View all your orders here</p>
    <div class="w-1/3 pt-4">
      <UiVeeInput
        type="text"
        placeholder="Search your order"
        icon="lucide:search"
        v-model="search"
      />
    </div>
    <UiTanStackTable
      @ready="table = $event"
      ref="tableRef"
      :show-select="false"
      :search="search"
      :data="data"
      :columns="columns"
      class="mt-5 rounded-md border"
    >
      <template #empty>
        <div class="flex w-full flex-col items-center justify-center gap-5 py-5">
          <Icon name="lucide:database" class="h-12 w-12 text-muted-foreground" />
          <span class="mt-2">No data available.</span>
        </div>
      </template>
    </UiTanStackTable> -->
    <ADComingSoon />
  </div>
</template>

<script lang="ts" setup>
  import type { ColumnDef, Table } from "@tanstack/vue-table";

  definePageMeta({
    middleware: "user-auth",
    layout: "user",
  });
  const route = useRoute();
  const userID = computed(() => route.params.id as string);

  // Dummy data for the table
  type Order = {
    uniqRefNumber: string;
    orderStatus: string;
    dateOrdered: Date;
    totalPrice: number;
  };

  const tableRef = ref();
  const table = ref<Table<Order> | null>(null);
  const search = ref("");

  const data: Order[] = [
    {
      uniqRefNumber: "ORD123456",
      orderStatus: "Pending",
      dateOrdered: new Date("2023-01-01"),
      totalPrice: 150.0,
    },
    {
      uniqRefNumber: "ORD123457",
      orderStatus: "Processing",
      dateOrdered: new Date("2023-01-02"),
      totalPrice: 200.0,
    },
    {
      uniqRefNumber: "ORD123458",
      orderStatus: "Claimed",
      dateOrdered: new Date("2023-01-03"),
      totalPrice: 250.0,
    },
    {
      uniqRefNumber: "ORD123459",
      orderStatus: "Cancelled",
      dateOrdered: new Date("2023-01-04"),
      totalPrice: 100.0,
    },
  ];

  const columns: ColumnDef<Order>[] = [
    { accessorKey: "uniqRefNumber", header: "Order Ref Number", enableHiding: true },
    {
      accessorKey: "orderStatus",
      header: "Order Status",
      enableHiding: true,
      cell: ({ row }) => {
        const status = row.original.orderStatus;
        let variant = "default";
        if (status === "Pending") variant = "secondary";
        else if (status === "Claimed") variant = "default";
        else if (status === "Cancelled") variant = "destructive";
        return h(resolveComponent("UiBadge"), { variant }, { default: () => status });
      },
    },
    {
      accessorKey: "dateOrdered",
      header: "Date",
      enableHiding: true,
      cell: ({ row }) => row.original.dateOrdered.toLocaleDateString(),
    },
    {
      accessorKey: "totalPrice",
      header: "Total Payment",
      enableHiding: true,
      cell: ({ row }) => `$${row.original.totalPrice.toFixed(2)}`,
    },
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
          h(resolveComponent("UiDropdownMenuContent"), {}, () => [
            h(resolveComponent("UiDropdownMenuItem"), { title: "View Order" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:view", class: "mr-2" }),
              "View Order Summary",
            ]),
          ]),
        ]);
      },
    },
  ];
</script>

<style></style>
