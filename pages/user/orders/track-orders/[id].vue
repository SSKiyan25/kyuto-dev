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
  <!-- Cancel Order Dialog -->
  <UiAlertDialog v-model:open="cancelOrderDialog">
    <UiAlertDialogContent class="bg-secondary">
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          This action cannot be undone. Please state your reason for cancelling your order.
          <UiInput v-model="cancelRemarks" type="text" placeholder="Enter reason" class="mt-4" />
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="cancelOrderDialog = false">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction
          @click="confirmCancelOrder"
          :disabled="cancelRemarks === ''"
          variant="destructive"
          >Confirm</UiAlertDialogAction
        >
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>

  <UiDialog v-model:open="viewOrderDialog">
    <UiDialogContent
      class="sm:max-w-[800px]"
      title="Order Details"
      description="Your order details"
    >
      <template #content>
        <div class="max-h-96 space-y-4 overflow-y-auto px-8 py-2">
          <div>
            <h3 class="text-lg font-semibold">Order Reference Number</h3>
            <p class="text-sm">{{ selectedOrder?.uniqRefNumber }}</p>
          </div>
          <div>
            <h3 class="text-md font-semibold">Total Price</h3>
            <p class="text-sm text-muted-foreground">₱{{ selectedOrder?.totalPrice.toFixed(2) }}</p>
          </div>
          <div>
            <h3 class="text-md font-semibold">Organization Name</h3>
            <p class="text-sm text-muted-foreground">{{ selectedOrder?.organizationName }}</p>
          </div>
          <div>
            <h3 class="text-md font-semibold">Order Status</h3>
            <p class="text-sm text-muted-foreground">{{ selectedOrder?.orderStatus }}</p>
          </div>
          <div>
            <h3 class="text-md font-semibold">Payment Status</h3>
            <p class="text-sm text-muted-foreground">{{ selectedOrder?.paymentStatus }}</p>
          </div>
          <UiDivider class="my-2" />
          <div>
            <h3 class="text-lg font-semibold">Order Items</h3>
            <div
              v-for="item in selectedOrder?.orderItems"
              :key="item.productID"
              class="mt-4 flex flex-row justify-between space-x-4 text-sm"
            >
              <div class="flex flex-row space-x-4">
                <img
                  :src="item.productDetails?.featuredPhotoURL || '/placeholder-img.jpg'"
                  alt="Product Image"
                  class="h-12 w-12 object-cover"
                />
                <div class="flex flex-col">
                  <p class="font-semibold text-muted-foreground">
                    Product Name:
                    <span class="text-secondary-foreground">{{ item.productDetails?.name }}</span>
                  </p>
                  <p class="font-semibold text-muted-foreground">
                    Variation:
                    <span class="text-secondary-foreground">{{
                      item.variationDetails?.value
                    }}</span>
                  </p>
                  <p v-if="item.isPreOrder" class="font-semibold">Pre-Ordered</p>
                </div>
              </div>
              <div class="flex flex-col">
                <p class="font-semibold text-muted-foreground">
                  Quantity: <span class="text-secondary-foreground">{{ item.quantity }}</span>
                </p>
                <p class="font-semibold text-muted-foreground">
                  Price: <span class="text-secondary-foreground">₱{{ item.price.toFixed(2) }}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end">
          <UiButton variant="destructive" @click="closeViewOrderDialog">Close</UiButton>
        </div>
      </template>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { useFetchOrders } from "~/composables/user/useFetchOrders";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Order, OrderItem } from "~/types/models/Order";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const recentOrder = ref<Order | null>(null);
  const orders = ref<(Order & { id: string })[]>([]);
  const filteredOrders = ref<(Order & { id: string })[]>([]);
  const selectedStatus = ref<string>("all");
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
  const rowsPerPage = ref<number>(10);

  const { fetchUserOrders, fetchLatestOrder, fetchOrders, cancelOrder, fetchOrderItems } =
    useFetchOrders();

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
    } else if (status === "completed") {
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
  const table = ref<Table<Order & { id: string }> | null>(null);
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

  const cancelOrderDialog = ref(false);
  const cancelRemarks = ref("");
  const selectedOrderID = ref<string | null>(null);

  const confirmCancelOrder = async () => {
    if (selectedOrderID.value) {
      try {
        console.log("Cancelling order:", selectedOrderID.value);
        console.log("Remarks:", cancelRemarks.value);
        await cancelOrder(selectedOrderID.value, cancelRemarks.value);
        useToast().toast({
          title: "Order Cancelled",
          description: "The order has been cancelled successfully.",
          duration: 5000,
          icon: "lucide:check",
        });
        // Refresh orders after cancellation
        fetchUserOrders(userID.value).then((userOrders) => {
          orders.value = userOrders;
          filterOrders(selectedStatus.value);
        });
        cancelRemarks.value = "";
      } catch (error) {
        console.error("Error cancelling order: ", error);
        useToast().toast({
          title: "Error",
          description: "There was an error cancelling the order.",
          duration: 5000,
          icon: "lucide:x",
        });
      }
    }
    cancelOrderDialog.value = false;
  };

  const viewOrderDialog = ref(false);
  const selectedOrder = ref<(Order & { id: string; orderItems: ExtendedOrderItem[] }) | null>(null);

  const openViewOrderDialog = async (orderID: string) => {
    const order = orders.value.find((order) => order.id === orderID);
    if (order) {
      const orderItems = await fetchOrderItems(orderID);
      selectedOrder.value = { ...order, orderItems };
      viewOrderDialog.value = true;
    }
  };
  const closeViewOrderDialog = () => {
    viewOrderDialog.value = false;
    selectedOrder.value = null;
  };

  const columns: ColumnDef<Order & { id: string }>[] = [
    { accessorKey: "uniqRefNumber", header: "Order Ref Number", enableHiding: true },
    {
      accessorKey: "orderStatus",
      header: "Order Status",
      enableHiding: true,
      cell: ({ row }) => {
        const status = row.original.orderStatus;
        let variant = "default";
        let displayText = status;

        if (status === "pending") {
          variant = "secondary";
          displayText = "Pending";
        } else if (status === "preparing") {
          variant = "outline";
          displayText = "Preparing";
        } else if (status === "ready") {
          variant = "secondary";
          displayText = "Ready";
        } else if (status === "claimed") {
          variant = "default";
          displayText = "Claimed";
        } else if (status === "cancelled") {
          variant = "destructive";
          displayText = "Cancelled";
        }

        return h(resolveComponent("UiBadge"), { variant }, { default: () => displayText });
      },
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      enableHiding: true,
      cell: ({ row }) => {
        const status = row.original.paymentStatus;
        let variant = "default";
        let displayText = status;

        if (status === "not_paid") {
          variant = "destructive";
          displayText = "Not Paid";
        } else if (status === "paid") {
          variant = "default";
          displayText = "Paid";
        } else if (status === "cancelled") {
          variant = "destructive";
          displayText = "Cancelled";
        }

        return h(resolveComponent("UiBadge"), { variant }, { default: () => displayText });
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
      cell: ({ row }) => `₱${row.original.totalPrice.toFixed(2)}`,
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
            h(
              resolveComponent("UiDropdownMenuItem"),
              { title: "View Order", onClick: () => openViewOrderDialog(row.original.id) },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:view", class: "mr-2" }),
                "View Order",
              ]
            ),
            h(
              resolveComponent("UiDropdownMenuItem"),
              {
                title: "Cancel Order",
                onClick: () => {
                  selectedOrderID.value = row.original.id;
                  cancelOrderDialog.value = true;
                },
              },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:file-x", class: "mr-2" }),
                "Cancel Order",
              ]
            ),
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
