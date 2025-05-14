<template>
  <Transition name="fade">
    <div
      v-if="isPageLoading"
      class="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center gap-4 rounded-lg bg-card p-6 shadow-lg">
        <Icon name="lucide:loader-circle" class="h-12 w-12 animate-spin text-primary" />
        <div class="text-center">
          <h3 class="text-lg font-medium">Loading Your Orders</h3>
          <p class="text-sm text-muted-foreground">Please wait while we fetch your order data...</p>
        </div>
      </div>
    </div>
  </Transition>
  <div class="flex h-screen w-full flex-col px-4 py-4 sm:px-8">
    <!-- Order Insights Banner -->
    <div class="mb-6 w-full">
      <div
        class="relative w-full overflow-hidden rounded-lg border border-border/40 bg-gradient-to-br from-amber-500/90 to-yellow-600/80 shadow-md"
      >
        <div class="absolute inset-0 opacity-10">
          <div class="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-white/30 blur-xl"></div>
          <div class="absolute -left-10 bottom-5 h-10 w-10 rounded-full bg-white/20 blur-lg"></div>
        </div>

        <div class="relative flex flex-col items-center justify-between p-4 sm:flex-row">
          <div class="flex max-w-full flex-col space-y-1 sm:max-w-[70%]">
            <h3 class="text-sm font-bold leading-tight text-white sm:text-lg">
              Order Status Dashboard
            </h3>
            <p class="text-[10px] leading-tight text-white/90 sm:text-xs">
              You have {{ filteredOrders.length }} order{{
                filteredOrders.length !== 1 ? "s" : ""
              }}
              in total. {{ getPendingOrdersCount() }} pending and
              {{ getCompletedOrdersCount() }} completed.
            </p>
            <div class="flex flex-row gap-2 pt-2">
              <UiButton
                to="/products"
                size="sm"
                class="group h-8 bg-white/90 px-3 text-amber-600 hover:bg-white"
              >
                <span class="text-[10px] sm:text-xs">Shop More</span>
                <Icon name="lucide:shopping-bag" class="ml-1 h-3 w-3" />
              </UiButton>
              <UiButton
                @click="
                  refreshLatestOrder();
                  fetchUserOrders(userID);
                "
                variant="outline"
                size="sm"
                class="group h-8 border-white/30 bg-transparent px-3 text-white hover:bg-white/20"
              >
                <span class="text-[10px] sm:text-xs">Refresh Orders</span>
                <Icon name="lucide:refresh-cw" class="ml-1 h-3 w-3" />
              </UiButton>
            </div>
          </div>

          <div class="ml-0 mt-3 flex justify-center sm:ml-2 sm:mt-0">
            <div class="flex space-x-2">
              <!-- Pending Orders Stat -->
              <div
                class="flex min-w-[70px] flex-col items-center justify-center rounded-lg bg-white/15 p-2 backdrop-blur-sm"
              >
                <span class="text-xs font-medium text-white/80">Pending</span>
                <span class="text-xl font-bold text-white">{{ getPendingOrdersCount() }}</span>
              </div>

              <!-- Completed Orders Stat -->
              <div
                class="flex min-w-[70px] flex-col items-center justify-center rounded-lg bg-white/15 p-2 backdrop-blur-sm"
              >
                <span class="text-xs font-medium text-white/80">Completed</span>
                <span class="text-xl font-bold text-white">{{ getCompletedOrdersCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex w-full flex-col space-y-1 pt-4 sm:pt-6">
      <div class="flex flex-row items-center justify-between">
        <span class="text-md font-semibold sm:text-lg">Your Latest Order</span>
        <UiButton @click="refreshLatestOrder()" variant="ghost" size="sm">
          <span class="text-sm">Refresh</span>
          <Icon name="lucide:refresh-cw" class="ml-1.5 h-4 w-4 hover:animate-spin" />
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
        <div class="mb-4 w-full">
          <div class="relative">
            <div class="hide-scrollbar flex overflow-x-auto pb-2">
              <div class="flex space-x-2">
                <template v-for="(status, i) in statuses" :key="i">
                  <UiButton
                    :variant="statusVariant(status.value)"
                    @click="filterOrders(status.value)"
                    class="flex-shrink-0 whitespace-nowrap text-[11px] sm:text-sm"
                  >
                    <span>{{ status.status }}</span>
                    <Icon
                      v-if="selectedStatus === status.value"
                      name="lucide:check"
                      class="ml-1 h-3 w-3"
                    />
                  </UiButton>
                </template>
              </div>
            </div>
            <!-- Scroll indicators -->
            <div
              class="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-background to-transparent sm:hidden"
            ></div>
          </div>
        </div>
        <UiDivider />
        <div class="flex w-full flex-row items-center justify-between pt-3"></div>
        <div class="w-full overflow-x-auto sm:w-full">
          <Suspense>
            <template #default>
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
            </template>
            <template #fallback>
              <div class="flex w-full items-center justify-center py-8">
                <div class="flex flex-col items-center gap-3">
                  <Icon
                    name="lucide:loader-circle"
                    class="h-8 w-8 animate-spin text-primary sm:h-10 sm:w-10"
                  />
                  <span class="text-sm text-muted-foreground">Loading orders data...</span>
                </div>
              </div>
            </template>
          </Suspense>
        </div>
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
    <UiDialogContent class="overflow-hidden p-0 sm:max-w-[800px]">
      <div class="border-b bg-primary/10 px-6 py-4">
        <UiDialogTitle class="text-xl font-bold">Order Details</UiDialogTitle>
        <UiDialogDescription class="text-sm opacity-80">
          View your complete order information
        </UiDialogDescription>
      </div>

      <div class="max-h-[calc(80vh-120px)] overflow-y-auto px-4 py-4 sm:px-6">
        <!-- Order Header with Status -->
        <div
          class="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center"
        >
          <div>
            <div class="text-xs uppercase tracking-wide text-muted-foreground">Reference</div>
            <div class="font-mono text-base font-medium">{{ selectedOrder?.uniqRefNumber }}</div>
          </div>

          <div class="flex items-center gap-3">
            <div
              class="rounded-full px-3 py-1.5 text-xs font-medium"
              :class="{
                'bg-yellow-100 text-yellow-800': selectedOrder?.orderStatus === 'pending',
                'bg-blue-100 text-blue-800': selectedOrder?.orderStatus === 'preparing',
                'bg-amber-100 text-amber-800': selectedOrder?.orderStatus === 'ready',
                'bg-green-100 text-green-800': selectedOrder?.orderStatus === 'completed',
                'bg-red-100 text-red-800': selectedOrder?.orderStatus === 'cancelled',
              }"
            >
              <span class="capitalize">{{ selectedOrder?.orderStatus }}</span>
            </div>

            <div
              class="rounded-full px-3 py-1.5 text-xs font-medium"
              :class="{
                'bg-red-100 text-red-800': selectedOrder?.paymentStatus === 'not_paid',
                'bg-green-100 text-green-800': selectedOrder?.paymentStatus === 'paid',
                'bg-gray-100 text-gray-800': !selectedOrder?.paymentStatus,
              }"
            >
              <span class="capitalize">{{ selectedOrder?.paymentStatus }}</span>
            </div>
          </div>
        </div>

        <!-- Organization -->
        <div class="mb-6 rounded-lg bg-secondary/30 p-4">
          <div class="flex items-center gap-2">
            <Icon name="lucide:store" class="h-4 w-4 text-primary" />
            <span class="text-sm font-medium">{{ selectedOrder?.organizationName }}</span>
          </div>

          <div class="mt-3 flex flex-col justify-between sm:flex-row">
            <div>
              <div class="text-xs text-muted-foreground">Order Date</div>
              <div class="text-sm">{{ formatDate(selectedOrder?.dateOrdered) }}</div>
            </div>

            <div>
              <div class="text-xs text-muted-foreground">Total Amount</div>
              <div class="text-lg font-bold text-primary">
                ₱{{ selectedOrder?.totalPrice.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>

        <!-- Items List -->
        <div>
          <h3 class="mb-4 flex items-center gap-2 text-lg font-semibold">
            <Icon name="lucide:shopping-cart" class="h-5 w-5" />
            Order Items
          </h3>

          <div class="space-y-4">
            <div
              v-for="item in selectedOrder?.orderItems"
              :key="item.productID"
              class="overflow-hidden rounded-lg border transition-shadow hover:shadow-sm"
            >
              <div class="flex items-center gap-3 p-3">
                <div class="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-muted/50">
                  <img
                    :src="item.productDetails?.featuredPhotoURL || '/placeholder-img.jpg'"
                    alt="Product Image"
                    class="h-full w-full object-cover"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <div class="truncate text-sm font-medium">
                    {{ item.productDetails?.name }}
                  </div>

                  <div class="mt-1 text-xs text-muted-foreground">
                    <span class="inline-flex items-center gap-1">
                      <span>Variation:</span>
                      <span class="font-medium">{{ item.variationDetails?.value }}</span>
                    </span>

                    <span
                      v-if="item.isPreOrder"
                      class="ml-2 inline-flex items-center gap-1 rounded-sm bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-800"
                    >
                      <Icon name="lucide:clock" class="h-3 w-3" />
                      Pre-Order
                    </span>
                  </div>
                </div>

                <div class="text-right">
                  <div class="text-sm font-semibold">
                    ₱{{ item.priceWithCommission.toFixed(2) }}
                  </div>
                  <div class="text-xs text-muted-foreground">Qty: {{ item.quantity }}</div>
                  <div class="text-xs font-medium text-primary">
                    ₱{{ (item.priceWithCommission * item.quantity).toFixed(2) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Order Summary -->
        <div class="mt-8 border-t pt-4">
          <div class="flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Subtotal</span>
            <span class="text-sm">₱{{ selectedOrder?.totalPrice.toFixed(2) }}</span>
          </div>
          <div class="mt-2 flex items-center justify-between">
            <span class="text-sm text-muted-foreground">Delivery Fee</span>
            <span class="text-sm">₱0.00</span>
          </div>
          <div class="mt-4 flex items-center justify-between border-t pt-2">
            <span class="font-medium">Total</span>
            <span class="text-lg font-bold">₱{{ selectedOrder?.totalPrice.toFixed(2) }}</span>
          </div>
        </div>

        <!-- Remarks if available -->
        <div v-if="selectedOrder?.remarks" class="mt-6 rounded-md bg-muted/30 p-3">
          <div class="mb-1 text-xs font-medium text-muted-foreground">Remarks</div>
          <p class="text-sm">{{ selectedOrder.remarks }}</p>
        </div>
      </div>

      <div class="flex justify-end gap-2 border-t bg-secondary/30 p-4">
        <UiButton variant="outline" @click="closeViewOrderDialog">
          <Icon name="lucide:x" class="mr-2 h-4 w-4" />
          Close
        </UiButton>

        <UiButton
          variant="default"
          v-if="selectedOrder?.orderStatus === 'pending'"
          @click="
            selectedOrderID = selectedOrder?.id;
            cancelOrderDialog = true;
            closeViewOrderDialog();
          "
        >
          <Icon name="lucide:file-x" class="mr-2 h-4 w-4" />
          Cancel Order
        </UiButton>
      </div>
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
    middleware: "user-auth",
    layout: "user",
  });
  const isPageLoading = ref(false);
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

  onMounted(async () => {
    try {
      isPageLoading.value = true;

      // Use Promise.all to fetch data in parallel
      const [userOrders, allOrders] = await Promise.all([
        fetchUserOrders(userID.value),
        fetchOrders(userID.value, "all", ""),
      ]);

      orders.value = userOrders;
      filterOrders(selectedStatus.value);

      await refreshLatestOrder();

      handleResize();
      window.addEventListener("resize", handleResize);
    } catch (error) {
      console.error("Error loading order data:", error);
      useToast().toast({
        title: "Error",
        description: "Failed to load order data. Please try again.",
        duration: 5000,
        icon: "lucide:x",
      });
    } finally {
      // Always hide the loading overlay when done
      isPageLoading.value = false;
    }
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
    if (!selectedOrderID.value) {
      cancelOrderDialog.value = false;
      return;
    }

    try {
      await cancelOrder(selectedOrderID.value, cancelRemarks.value);

      useToast().toast({
        title: "Order Cancelled",
        description: "The order has been cancelled successfully.",
        duration: 5000,
        icon: "lucide:check",
      });

      // Refresh orders after cancellation
      try {
        const userOrders = await fetchUserOrders(userID.value);
        orders.value = userOrders;
        filterOrders(selectedStatus.value);
      } catch (error) {
        console.error("Error refreshing orders:", error);
      }

      cancelRemarks.value = "";
    } catch (error) {
      console.error("Error cancelling order:", error);
      useToast().toast({
        title: "Error",
        description: "There was an error cancelling the order.",
        duration: 5000,
        icon: "lucide:x",
      });
    } finally {
      cancelOrderDialog.value = false;
    }
  };

  const viewOrderDialog = ref(false);
  const selectedOrder = ref<
    (Order & { id: string; orderItems: ExtendedOrderItem[]; organizationName: string }) | null
  >(null);

  const openViewOrderDialog = async (orderID: string) => {
    try {
      // Find the order in the current orders array
      const order = orders.value.find((order) => order.id === orderID);

      if (!order) {
        console.error("Order not found:", orderID);
        useToast().toast({
          title: "Error",
          description: "Order not found.",
          duration: 5000,
          icon: "lucide:x",
        });
        return;
      }

      // Fetch order items with error handling
      let orderItems: ExtendedOrderItem[] = [];
      try {
        orderItems = await fetchOrderItems(orderID);
      } catch (error) {
        console.error("Error fetching order items:", error);
        orderItems = []; // Fallback to empty array
      }

      // Extract the organization name from the first order item
      const organizationName =
        orderItems.length > 0
          ? orderItems[0].organizationName || "Unknown Organization"
          : "Unknown Organization";

      // Set the selected order
      selectedOrder.value = { ...order, orderItems, organizationName };
      viewOrderDialog.value = true;
    } catch (error) {
      console.error("Error opening view order dialog:", error);
      useToast().toast({
        title: "Error",
        description: "Failed to load order details.",
        duration: 5000,
        icon: "lucide:x",
      });
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
      className: "hidden sm:table-cell",
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
        renderer: function (api: any, rowIdx: number, columns: any): false | HTMLElement {
          // Convert columns to array if it's not already
          const columnsArray = Array.isArray(columns) ? columns : Array.from(columns);

          // Filter hidden columns
          const hiddenColumns = columnsArray.filter((column: any) => column.hidden);

          if (hiddenColumns.length === 0) {
            return false;
          }

          // Create HTML elements to return a proper Node instead of string
          const container = document.createElement("div");
          container.className = "p-3 bg-muted/50";

          // Create content for each hidden column
          hiddenColumns.forEach((column: any) => {
            const row = document.createElement("div");
            row.className = "flex justify-between py-2 border-b";

            const title = document.createElement("span");
            title.className = "font-medium mr-2";
            title.textContent = column.title.replace(/<[^>]*>/g, "") + ":";

            const data = document.createElement("span");
            data.innerHTML = column.data || "";

            row.appendChild(title);
            row.appendChild(data);
            container.appendChild(row);
          });

          return container;
        },
      },
    },
    autoWidth: false,
    select: true,
    // Define responsive priorities for columns
    columnDefs: [
      { responsivePriority: 1, targets: [0, 5] }, // Reference Number and Actions - always show
      { responsivePriority: 2, targets: [1] }, // Order Status - show if space allows
      { responsivePriority: 3, targets: [2, 3, 4] }, // Payment, Date, Total - hide first on small screens
    ],
    // Set language options for better mobile display
    language: {
      paginate: {
        previous: "←",
        next: "→",
      },
      search: "",
      searchPlaceholder: "Search...",
    },
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

  // Add to your script section
  const getPendingOrdersCount = () => {
    return orders.value.filter(
      (order) =>
        order.orderStatus === "pending" ||
        order.orderStatus === "preparing" ||
        order.orderStatus === "ready"
    ).length;
  };

  const getCompletedOrdersCount = () => {
    return orders.value.filter((order) => order.orderStatus === "completed").length;
  };

  // Utility function to format date
  const formatDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp !== "object" || !timestamp.seconds) {
      return "N/A";
    }

    try {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };
</script>

<style scoped>
  /* Custom styles for responsive table */
  :deep(.dataTable) {
    width: 100% !important;
    font-size: 12px;
  }

  @media (min-width: 640px) {
    :deep(.dataTable) {
      font-size: 14px;
    }
  }

  /* Improved mobile action buttons */
  :deep(.buttons-collection) {
    min-width: auto !important;
    padding: 0.25rem 0.5rem !important;
    font-size: 0.75rem !important;
  }

  /* Better styling for responsive details rows */
  :deep(.dtr-details) {
    width: 100%;
    padding: 0.75rem !important;
    background-color: rgba(var(--color-muted), 0.5) !important;
  }

  :deep(.dtr-title) {
    font-weight: 500;
    min-width: 120px;
    color: rgba(var(--color-muted-foreground), 0.9) !important;
  }

  :deep(.dtr-data) {
    text-align: right;
    font-weight: 400;
  }

  /* Mobile pagination and search controls */
  @media (max-width: 640px) {
    :deep(.dataTables_wrapper .dataTables_length, .dataTables_wrapper .dataTables_filter) {
      float: none;
      text-align: left;
      margin-bottom: 0.5rem;
    }

    :deep(.dataTables_wrapper .dataTables_filter input) {
      width: 100%;
      margin-left: 0;
      margin-top: 0.25rem;
    }

    :deep(.dataTables_info) {
      padding-top: 0.5em;
      font-size: 0.75rem;
    }

    :deep(.dataTables_paginate .paginate_button) {
      padding: 0.25em 0.5em !important;
      font-size: 0.75rem;
    }

    /* Make sure the actions dropdown doesn't get cut off */
    :deep(.dropdown-menu-content) {
      z-index: 100;
    }

    /* Improve table cell spacing */
    :deep(table.dataTable tbody td) {
      padding: 0.5rem 0.75rem !important;
    }
  }

  /* Better DOM structure styling */
  :deep(.dt-buttons) {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
    margin-bottom: 0.5rem;
  }

  :deep(.dt-button) {
    font-size: 0.75rem;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    background-color: rgb(var(--color-secondary)) !important;
    border: 1px solid rgb(var(--color-border)) !important;
    color: rgb(var(--color-secondary-foreground)) !important;
  }

  :deep(.dt-button:hover) {
    background-color: rgb(var(--color-secondary-foreground) / 0.1) !important;
  }

  /* Hide scrollbars but keep functionality */
  .hide-scrollbar {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Additional responsive improvements */
  @media (max-width: 640px) {
    :deep(.dataTables_wrapper) {
      padding: 0 !important;
    }

    /* Smaller action buttons on mobile */
    :deep(.dropdown-menu-trigger) {
      padding-left: 0.5rem !important;
      padding-right: 0.5rem !important;
    }
  }
</style>
