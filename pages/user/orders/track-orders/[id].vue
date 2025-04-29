<template>
  <div class="flex h-screen w-full flex-col px-8 py-4">
    <ADUserOrderMore />
    <div class="flex h-screen w-full flex-col space-y-1 pt-12">
      <div class="flex flex-row items-center justify-between">
        <span class="text-md font-semibold sm:text-lg">Your Latest Order</span>
        <UiButton @click="refreshLatestOrder()" variant="ghost">
          <span>Refresh</span>
          <Icon name="lucide:refresh-cw" class="size-4 hover:animate-spin" />
        </UiButton>
      </div>
      <div class="flex w-full flex-row items-center bg-secondary p-4 shadow-md">
        <template v-if="recentOrder">
          <div class="flex w-full flex-col space-y-1">
            <p class="text-md font-bold sm:text-lg">
              Reference Number: <span class="text-primary">{{ recentOrder.uniqRefNumber }}</span>
            </p>
            <p class="text-[12px] opacity-70">
              Ordered on:
              <span class="text-primary">{{ formatDate(recentOrder.dateOrdered) }}</span>
            </p>
            <div class="py-8">
              <UiStepper
                :orientation="isMobile ? 'vertical' : 'horizontal'"
                class="mx-auto flex w-full flex-col justify-start gap-10 sm:max-w-full sm:flex-row sm:items-start sm:justify-center sm:gap-2"
              >
                <UiStepperItem
                  v-for="step in steps"
                  :key="step.step"
                  :state="getStepState(step.step)"
                  class="group relative flex w-full items-start gap-4 text-[12px] text-secondary-foreground sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:text-sm"
                  :step="step.step"
                >
                  <UiStepperSeparator
                    v-if="step.step != steps[steps.length - 1].step"
                    :class="
                      isMobile
                        ? 'absolute left-[18px] top-[38px] block h-[105%] w-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary'
                        : 'absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-secondary-foreground/20 group-data-[state=completed]:bg-primary'
                    "
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
                      ]"
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

                  <div class="mt-0 flex flex-col sm:mt-5 sm:items-center sm:text-center">
                    <UiStepperTitle
                      :class="[
                        getStepState(step.step) == 'active' && 'text-primary',
                        recentOrder.orderStatus === 'cancelled' && 'text-destructive',
                      ]"
                      class="text-sm font-semibold transition sm:text-base"
                      >{{ step.title }}
                    </UiStepperTitle>
                    <UiStepperDescription
                      :class="[
                        getStepState(step.step) == 'active' && 'text-primary',
                        recentOrder.orderStatus === 'cancelled' && 'text-destructive',
                      ]"
                      class="text-xs text-muted-foreground transition sm:text-sm"
                    >
                      {{ step.description }}
                    </UiStepperDescription>
                  </div>
                </UiStepperItem>
              </UiStepper>
            </div>

            <div
              class="flex w-full flex-row justify-between pt-2 text-[12px] opacity-70 sm:text-sm"
            >
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
        <div class="flex w-[300px] flex-row overflow-x-auto opacity-70 sm:w-full">
          <template v-for="(status, i) in statuses" :key="i">
            <UiButton
              :variant="statusVariant(status.value)"
              @click="filterOrders(status.value)"
              class="text-[12px] sm:text-sm"
              >{{ status.status }}</UiButton
            >
          </template>
        </div>
        <UiDivider />
        <div class="flex w-full flex-row items-center justify-between pt-3"></div>
        <div class="w-[300px] overflow-x-auto sm:w-full">
          <UiDatatable
            :options="options"
            :columns="columns"
            :data="filteredOrders"
            class="text-[12px] sm:text-sm"
          >
            <template #actions="{ cellData }: { cellData: Order & { id: string } }">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger as-child>
                  <UiButton class="h-6 text-[10px] sm:h-7 sm:text-xs"> Actions </UiButton>
                </UiDropdownMenuTrigger>
                <UiDropdownMenuContent class="w-32">
                  <UiDropdownMenuItem @click="openViewOrderDialog(cellData.id)">
                    <Icon name="lucide:view" class="mr-2" />
                    View Order
                  </UiDropdownMenuItem>
                  <UiDropdownMenuItem
                    @click="
                      selectedOrderID = cellData.id;
                      cancelOrderDialog = true;
                    "
                  >
                    <Icon name="lucide:file-x" class="mr-2" />
                    Cancel Order
                  </UiDropdownMenuItem>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </template>
          </UiDatatable>
        </div>
        <!-- <MockOrderTable /> -->
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
          <UiInput
            v-model="cancelRemarks"
            type="text"
            placeholder="Enter reason"
            class="mt-4"
            :class="{ 'border-red-500': !isValidCancelRemarks }"
          />
          <p v-if="!isValidCancelRemarks" class="mt-2 text-sm text-red-500">
            Remarks must be under 150 characters and cannot contain invalid characters.
          </p>
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="cancelOrderDialog = false">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction
          @click="confirmCancelOrder"
          :disabled="!isValidCancelRemarks"
          variant="destructive"
        >
          Confirm
        </UiAlertDialogAction>
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
        <div class="max-h-128 space-y-4 overflow-y-auto px-8 py-2">
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
            <p class="text-sm capitalize text-muted-foreground">{{ selectedOrder?.orderStatus }}</p>
          </div>
          <div>
            <h3 class="text-md font-semibold">Payment Status</h3>
            <p class="text-sm capitalize text-muted-foreground">
              {{ selectedOrder?.paymentStatus }}
            </p>
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
                  Price:
                  <span class="text-secondary-foreground"
                    >₱{{ item.priceWithCommission.toFixed(2) }}</span
                  >
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
  import type { ExtendedOrderItem } from "~/composables/user/useFetchOrders";
  import type { ButtonVariant } from "~/types/Button";
  import type { Order, OrderItem } from "~/types/models/Order";
  import type { Config, ConfigColumns } from "datatables.net";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const recentOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);
  const orders = ref<(Order & { id: string })[]>([]);
  const filteredOrders = ref<(Order & { id: string })[]>([]);
  const selectedStatus = ref<string>("all");
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
  // console.log("User ID:", userID.value);

  const isMobile = ref(false);

  const handleResize = () => {
    isMobile.value = window.innerWidth < 640;
  };

  onMounted(() => {
    // Fetch and log user orders
    fetchUserOrders(userID.value).then((userOrders) => {
      // console.log("User Orders:", userOrders);
      orders.value = userOrders;
      filterOrders(selectedStatus.value);
    });

    refreshLatestOrder();

    // Fetch and log all orders with filters
    fetchOrders(userID.value, "all", "").then((allOrders) => {
      // console.log("All Orders:", allOrders);
      orders.value = allOrders;
      filterOrders(selectedStatus.value);
    });

    handleResize();
    window.addEventListener("resize", handleResize);
  });

  onUnmounted(() => {
    window.removeEventListener("resize", handleResize);
  });

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

  const refreshLatestOrder = () => {
    fetchLatestOrder(userID.value).then((latestOrder) => {
      if (latestOrder) {
        recentOrder.value = latestOrder;
      } else {
        recentOrder.value = null;
      }
      // console.log("Latest Order:", recentOrder.value);
    });
  };

  // Fetch and log the latest pending order
  refreshLatestOrder();

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
      status: "Pending",
      value: "pending",
      variant: "linkHover2",
    },
    {
      status: "Preparing",
      value: "preparing",
      variant: "linkHover2",
    },
    {
      status: "Ready",
      value: "ready",
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

  const cancelOrderDialog = ref(false);
  const cancelRemarks = ref("");
  const selectedOrderID = ref<string | null>(null);

  const disallowedCharactersRegex = /^[^<@#`'"%;\\\[\]{}|&$*^~:/+=\r\n]*$/;

  const isValidCancelRemarks = computed(() => {
    return cancelRemarks.value.length <= 150 && disallowedCharactersRegex.test(cancelRemarks.value);
  });

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
  const selectedOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);

  const openViewOrderDialog = async (orderID: string) => {
    const order = orders.value.find((order) => order.id === orderID);
    if (order) {
      const orderItems = await fetchOrderItems(orderID);

      // Extract the organization name from the first order item (assuming all items belong to the same organization)
      const organizationName =
        orderItems.length > 0
          ? orderItems[0].organizationName || "Unknown Organization"
          : "Unknown Organization";

      selectedOrder.value = { ...order, orderItems, organizationName };
      viewOrderDialog.value = true;
    }
  };

  const closeViewOrderDialog = () => {
    viewOrderDialog.value = false;
    selectedOrder.value = null;
  };

  const columns: ConfigColumns[] = [
    {
      title: "<span class='text-[10px] sm:text-sm'>Reference Number</span>",
      data: "uniqRefNumber",
      responsivePriority: 1,
      render: (data: string) => `<span class="text-[10px] sm:text-sm">${data}</span>`,
    },
    {
      title: "<span class='text-[10px] sm:text-sm'>Order Status</span>",
      data: "orderStatus",
      responsivePriority: 2,
      render: (data: string) => {
        let colorClass = "bg-gray-200 text-gray-800";
        if (data === "pending") {
          colorClass = "bg-yellow-200 text-yellow-800";
        } else if (data === "cancelled") {
          colorClass = "bg-red-200 text-red-800";
        } else if (data === "completed") {
          colorClass = "bg-green-200 text-green-800";
        }
        return `
      <div class="flex items-center gap-3 text-[10px] sm:text-sm">
        <div class="flex cursor-pointer items-center gap-2">
          <span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>
        </div>
      </div>`;
      },
    },
    {
      title: "<span class='text-[10px] sm:text-sm'>Payment Status</span>",
      data: "paymentStatus",
      responsivePriority: 2,
      // className: "hidden sm:table-cell",
      render: (data: string) => {
        let colorClass = "bg-gray-200 text-gray-800";
        if (data === "not_paid") {
          colorClass = "bg-red-200 text-red-800";
        } else if (data === "paid") {
          colorClass = "bg-green-200 text-green-800";
        } else if (data === "cancelled") {
          colorClass = "bg-red-200 text-red-800";
        }
        return `
      <div class="flex flex-row items-center gap-3 text-[10px] sm:text-sm">
        <div class="flex cursor-pointer items-center gap-2">
          <span class="px-2 py-1 rounded ${colorClass} capitalize">${data}</span>
        </div>
      </div>`;
      },
    },
    {
      title: "<span class='text-[10px] sm:text-sm'>Date</span>",
      data: "dateOrdered",
      responsivePriority: 2,
      // className: "hidden sm:table-cell",
      render: (data: any) => `<span class="text-[10px] sm:text-sm">${formatDate(data)}</span>`,
    },
    {
      title: "<span class='text-[10px] sm:text-sm'>Total Payment</span>",
      data: "totalPrice",
      responsivePriority: 2,
      // className: "hidden sm:table-cell",
      render: (data: number) => `<span class="text-[10px] sm:text-sm">₱${data.toFixed(2)}</span>`,
    },
    {
      data: null,
      title: "<span class='text-[10px] sm:text-sm'></span>",
      className: "no-export",
      searchable: false,
      orderable: false,
      name: "actions",
      responsivePriority: 1,
      render: "#actions",
    },
  ];

  const options: Config = {
    dom: "Q<'flex flex-col sm:flex-row w-full sm:items-start sm:justify-between gap-5 mb-5'Bf><'border rounded-lg't><'flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between pt-3 p-2'li><''p>",
    responsive: {
      details: {
        type: "column",
        target: "tr",
      },
    },
    autoWidth: true,
    select: true,
    buttons: [
      {
        extend: "colvis",
        text: "Columns",
        columns: ":not(.no-export)",
      },
      {
        extend: "copy",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
      {
        extend: "pdf",
        exportOptions: {
          columns: ":not(.no-export)",
        },
      },
    ],
  };

  // Utility function to format date
  const formatDate = (timestamp: any): string => {
    const date = new Date(timestamp.seconds * 1000 + timestamp.nanoseconds / 1000000);
    return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  };
</script>
