<template>
  <div class="flex h-screen w-full flex-col px-8 py-4">
    <ADUserOrderMore />
    <div class="flex h-screen w-full flex-col space-y-1 pt-12">
      <div class="flex flex-row items-center justify-between">
        <span class="text-lg font-semibold">Your Latest Order</span>
        <UiButton @click="refreshLatestOrder()" variant="ghost">
          <span>Refresh</span>
          <Icon name="lucide:refresh-cw" class="size-4 hover:animate-spin" />
        </UiButton>
      </div>
      <div class="flex w-full flex-row items-center bg-secondary p-4 shadow-md">
        <template v-if="recentOrder">
          <div class="flex w-full flex-col space-y-1">
            <p class="text-lg font-bold">
              Reference Number: <span class="text-primary">{{ recentOrder.uniqRefNumber }}</span>
            </p>
            <p class="text-[12px] opacity-70">
              Ordered on:
              <span class="text-primary">{{ formatDate(recentOrder.dateOrdered) }}</span>
            </p>
            <div class="py-8">
              <UiStepper class="flex w-full items-start gap-2">
                <UiStepperItem
                  v-for="step in steps"
                  :key="step.step"
                  :state="getStepState(step.step)"
                  class="group relative flex w-full flex-col items-center justify-center text-secondary-foreground"
                  :step="step.step"
                >
                  <UiStepperSeparator
                    v-if="step.step != steps[steps.length - 1].step"
                    class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-secondary-foreground/20 group-data-[state=completed]:bg-primary"
                  />
                  <UiStepperTrigger as-child>
                    <UiButton
                      :variant="
                        getStepState(step.step) == 'completed' ||
                        getStepState(step.step) == 'active'
                          ? 'default'
                          : getStepState(step.step) == 'cancelled'
                            ? 'destructive'
                            : 'outline'
                      "
                      size="icon"
                      class="z-10 rounded-full"
                      :class="[
                        getStepState(step.step) == 'active' &&
                          'ring-2 ring-ring ring-offset-2 ring-offset-background',
                        recentOrder.orderStatus === 'cancelled' &&
                          getStepState(step.step) == 'active' &&
                          'bg-destructive',
                      ]"
                      :disabled="true"
                    >
                      <TransitionScale mode="out-in" :scale="0.8">
                        <Icon
                          v-if="getStepState(step.step) == 'completed'"
                          name="lucide:check"
                          class="size-5"
                        />
                        <Icon
                          v-if="getStepState(step.step) == 'active'"
                          name="lucide:circle"
                          class="size-5"
                        />
                        <Icon
                          v-if="getStepState(step.step) == 'cancelled'"
                          name="lucide:x"
                          class="size-5"
                        />
                        <Icon
                          v-if="getStepState(step.step) == 'inactive'"
                          name="lucide:dot"
                          class="size-10"
                        />
                      </TransitionScale>
                    </UiButton>
                  </UiStepperTrigger>

                  <div class="mt-5 flex flex-col items-center text-center">
                    <UiStepperTitle
                      :class="[
                        getStepState(step.step) == 'active' && 'text-primary',
                        recentOrder.orderStatus === 'cancelled' && 'text-destructive',
                      ]"
                      class="text-sm font-semibold transition lg:text-base"
                      >{{ step.title }}</UiStepperTitle
                    >
                    <UiStepperDescription
                      :class="[
                        getStepState(step.step) == 'active' && 'text-primary',
                        recentOrder.orderStatus === 'cancelled' && 'text-destructive',
                      ]"
                      class="sr-only text-xs text-muted-foreground transition md:not-sr-only lg:text-sm"
                      >{{ step.description }}</UiStepperDescription
                    >
                  </div>
                </UiStepperItem>
              </UiStepper>
            </div>

            <div class="flex w-full flex-row justify-between pt-2 text-sm opacity-70">
              <p class="">
                Total Payment: <span class="text-primary">{{ recentOrder.totalPrice }}</span>
              </p>
              <p class="">
                Organization: <span class="text-primary">{{ recentOrder.organizationName }}</span>
              </p>
            </div>
            <div v-if="recentOrder.remarks" class="pt-2 text-center">
              <p class="text-[12px] text-muted-foreground">Remarks: {{ recentOrder.remarks }}</p>
            </div>
          </div>
        </template>
      </div>
      <div class="mb-24 flex flex-col py-8">
        <div class="flex flex-row opacity-70">
          <template v-for="(status, i) in statuses" :key="i">
            <UiButton :variant="statusVariant(status.value)" @click="filterOrders(status.value)">{{
              status.status
            }}</UiButton>
          </template>
        </div>
        <UiDivider />
        <div class="flex w-full flex-row items-center justify-between pt-3">
          <div class="w-1/2">
            <UiVeeInput
              type="text"
              placeholder="Search your order"
              icon="lucide:search"
              v-model="search"
            />
          </div>
          <!-- <UiButton variant="outline">
            <Icon name="lucide:list-filter" class="size-4" />
            <span>Filter</span>
          </UiButton> -->
        </div>
        <UiTanStackTable
          @ready="table = $event"
          ref="tableRef"
          :showPagination="false"
          :show-select="false"
          :search="search"
          :data="filteredOrders"
          :columns="columns"
          :page-size="rowsPerPage"
          @page-size-change="handlePageSizeChange"
          class="mt-5 rounded-md border"
        >
          <template #empty>
            <div class="flex w-full flex-col items-center justify-center gap-5 py-5">
              <Icon name="lucide:database" class="h-12 w-12 text-muted-foreground" />
              <span class="mt-2">No data available.</span>
            </div>
          </template>
        </UiTanStackTable>
      </div>
      <div class="min-h-24"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/user/useFetchOrders";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { ButtonVariant } from "~/types/Button";
  import type { Order, OrderItem } from "~/types/models/Order";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const breadcrumbs = [
    { label: "Building Your Application", link: "#" },
    { label: "Data Fetching", link: "#" },
  ];

  const recentOrder = ref<Order | null>(null);
  const orders = ref<Order[]>([]);
  const filteredOrders = ref<Order[]>([]);
  const selectedStatus = ref<string>("all");
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
  const rowsPerPage = ref<number>(10);

  const { fetchUserOrders, fetchLatestOrder, fetchOrders, cancelOrder } = useFetchOrders();

  const filterOrders = (status: string) => {
    selectedStatus.value = status;
    if (status === "all") {
      filteredOrders.value = orders.value;
    } else if (status === "not_paid") {
      filteredOrders.value = orders.value.filter((order) => order.paymentStatus === status);
    } else {
      filteredOrders.value = orders.value.filter((order) => order.orderStatus === status);
    }
  };

  // Fetch and log user orders
  fetchUserOrders(userID.value).then((userOrders) => {
    console.log("User Orders:", userOrders);
    orders.value = userOrders;
    filterOrders(selectedStatus.value);
  });

  const refreshLatestOrder = () => {
    fetchLatestOrder(userID.value).then((latestOrder) => {
      console.log("Latest Order:", latestOrder);
      recentOrder.value = latestOrder;
    });
  };
  // Fetch and log the latest pending order
  refreshLatestOrder();

  // Fetch and log all orders with filters
  fetchOrders(userID.value, "all", "", rowsPerPage.value).then((allOrders) => {
    console.log("All Orders:", allOrders);
    orders.value = allOrders;
    filterOrders(selectedStatus.value);
  });

  const steps = computed(() => {
    if (!recentOrder.value) return [];
    const status = recentOrder.value.orderStatus;
    if (status === "pending") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        {
          step: 2,
          title: "Preparing",
          description: "Your order is being double-checked and prepared",
        },
        { step: 3, title: "Ready", description: "Your order is ready for pickup" },
        { step: 4, title: "Claimed", description: "Your order has been claimed" },
      ];
    } else if (status === "preparing") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        {
          step: 2,
          title: "Preparing",
          description: "Your order is being double-checked and prepared",
        },
        { step: 3, title: "Ready", description: "Your order is ready for pickup" },
        { step: 4, title: "Claimed", description: "Your order has been claimed" },
      ];
    } else if (status === "cancelled") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        { step: 2, title: "Cancelled", description: "Your order has been cancelled" },
      ];
    } else if (status === "ready") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        {
          step: 2,
          title: "Preparing",
          description: "Your order is being double-checked and prepared",
        },
        { step: 3, title: "Ready", description: "Your order is ready for pickup" },
        { step: 4, title: "Claimed", description: "Your order has been claimed" },
      ];
    } else if (status === "claimed") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        {
          step: 2,
          title: "Preparing",
          description: "Your order is being double-checked and prepared",
        },
        { step: 3, title: "Ready", description: "Your order is ready for pickup" },
        { step: 4, title: "Claimed", description: "Your order has been claimed" },
      ];
    }
    return [];
  });

  const getStepState = (step: number) => {
    const status = recentOrder.value?.orderStatus;
    if (status === "cancelled" && step === 2) return "cancelled";
    if (status === "pending" && step === 1) return "active";
    if (status === "preparing" && step === 2) return "active";
    if (status === "ready" && step === 3) return "active";
    if (status === "claimed" && step === 4) return "active";
    const currentStep = steps.value.find((s) => s.title.toLowerCase() === status);
    console.log("status", status);
    console.log("currentStep", currentStep);
    if (currentStep && step < currentStep.step) return "completed";
    return "inactive";
  };

  const statusVariant = (status: string) => {
    return selectedStatus.value === status ? "linkHover1" : "linkHover2";
  };

  const statuses: { status: string; value: string; variant: ButtonVariant }[] = [
    {
      status: "All",
      value: "all",
      variant: "linkHover1",
    },
    {
      status: "Unpaid",
      value: "not_paid",
      variant: "linkHover2",
    },
    {
      status: "Completed",
      value: "completed",
      variant: "linkHover2",
    },
    {
      status: "Cancelled",
      value: "cancelled",
      variant: "linkHover2",
    },
  ];

  const tableRef = ref();
  const table = ref<Table<Order> | null>(null);
  const search = ref("");

  const handlePageSizeChange = (newPageSize: number) => {
    rowsPerPage.value = newPageSize;
    fetchOrders(userID.value, selectedStatus.value, "", rowsPerPage.value).then((newOrders) => {
      console.log("New Orders:", newOrders);
      orders.value = newOrders;
      filterOrders(selectedStatus.value);
    });
  };

  watch(
    () => table.value?.getState().pagination.pageSize,
    (newPageSize) => {
      if (newPageSize) {
        handlePageSizeChange(newPageSize);
      }
    }
  );

  const columns: ColumnDef<Order>[] = [
    { accessorKey: "uniqRefNumber", header: "Order Ref Number", enableHiding: true },
    {
      accessorKey: "orderStatus",
      header: "Order Status",
      enableHiding: true,
      cell: ({ row }) => {
        const status = row.original.orderStatus;
        let variant = "default";
        if (status === "pending") variant = "secondary";
        else if (status === "preparing") variant = "outline";
        else if (status === "claimed") variant = "default";
        else if (status === "cancelled") variant = "destructive";
        return h(resolveComponent("UiBadge"), { variant }, { default: () => status });
      },
    },
    {
      accessorKey: "dateOrdered",
      header: "Date",
      enableHiding: true,
      cell: ({ row }) => formatDate(row.original.dateOrdered),
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
              "View Order",
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Track Status" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:eye", class: "mr-2" }),
              "Track Status",
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Cancel Order" }, () => [
              h(resolveComponent("Icon"), { name: "lucide:file-x", class: "mr-2" }),
              "Cancel Order",
            ]),
          ]),
        ]);
      },
    },
  ];

  // Utility function to format date
  const formatDate = (timestamp: any): string => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };
</script>

<style></style>
