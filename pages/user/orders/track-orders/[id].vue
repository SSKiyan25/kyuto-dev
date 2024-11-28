<template>
  <div class="flex h-screen w-full flex-col px-8 py-4">
    <ADUserOrderMore />
    <div class="flex h-screen w-full flex-col space-y-1 pt-12">
      <div class="flex flex-row items-center justify-between">
        <span class="text-lg font-semibold">Your Latest Order</span>
        <UiButton variant="ghost">
          <span>Refresh</span>
          <Icon name="lucide:refresh-cw" class="size-4" />
        </UiButton>
      </div>
      <div class="flex w-full flex-row items-center bg-secondary p-4 shadow-md">
        <div class="flex w-full flex-col space-y-1">
          <p class="text-lg font-bold">
            Reference Number: <span class="text-primary">{{ recentOrder.refNumber }}</span>
          </p>
          <p class="text-[12px] opacity-70">{{ recentOrder.description }}</p>
          <div class="py-8">
            <UiStepper class="flex w-full items-start gap-2">
              <UiStepperItem
                v-for="step in steps"
                :key="step.step"
                v-slot="{ state }"
                class="group relative flex w-full flex-col items-center justify-center text-secondary-foreground"
                :step="step.step"
              >
                <UiStepperSeparator
                  v-if="step.step != steps[steps.length - 1].step"
                  class="absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-secondary-foreground/20 group-data-[state=completed]:bg-primary"
                />
                <UiStepperTrigger as-child>
                  <UiButton
                    :variant="state == 'completed' || state == 'active' ? 'default' : 'outline'"
                    size="icon"
                    class="z-10 rounded-full"
                    :class="[
                      state == 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                    ]"
                  >
                    <TransitionScale mode="out-in" :scale="0.8">
                      <Icon v-if="state == 'completed'" name="lucide:check" class="size-5" />
                      <Icon v-if="state == 'active'" name="lucide:circle" class="size-5" />
                      <Icon v-if="state == 'inactive'" name="lucide:dot" class="size-10" />
                    </TransitionScale>
                  </UiButton>
                </UiStepperTrigger>

                <div class="mt-5 flex flex-col items-center text-center">
                  <UiStepperTitle
                    :class="[state == 'active' && 'text-primary']"
                    class="text-sm font-semibold transition lg:text-base"
                    >{{ step.title }}</UiStepperTitle
                  >
                  <UiStepperDescription
                    :class="[state == 'active' && 'text-primary']"
                    class="sr-only text-xs text-muted-foreground transition md:not-sr-only lg:text-sm"
                    >{{ step.description }}</UiStepperDescription
                  >
                </div>
              </UiStepperItem>
            </UiStepper>
          </div>

          <div class="flex w-full flex-row justify-between pt-2 text-sm opacity-70">
            <p class="">
              Total Payment: <span class="text-primary">{{ recentOrder.totalPayment }}</span>
            </p>
            <p class="">
              Organization: <span class="text-primary">{{ recentOrder.organizationName }}</span>
            </p>
          </div>
        </div>
      </div>
      <div class="mb-24 flex flex-col py-8 opacity-70">
        <div class="flex flex-row">
          <template v-for="(status, i) in statuses" :key="i">
            <UiButton :variant="status.variant">{{ status.status }}</UiButton>
          </template>
        </div>
        <UiDivider />
        <div class="flex w-full flex-row items-center justify-between pt-3">
          <div class="w-1/4">
            <UiVeeInput
              type="text"
              placeholder="Search your order"
              icon="lucide:search"
              v-model="search"
            />
          </div>
          <UiButton variant="outline">
            <Icon name="lucide:list-filter" class="size-4" />
            <span>Filter</span>
          </UiButton>
        </div>
        <UiTanStackTable
          @ready="table = $event"
          ref="tableRef"
          show-select
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
        </UiTanStackTable>
      </div>
      <div class="min-h-24"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { ButtonVariant } from "~/types/Button";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const breadcrumbs = [
    { label: "Building Your Application", link: "#" },
    { label: "Data Fetching", link: "#" },
  ];

  const route = useRoute();
  const userID = computed(() => route.params.id as string);

  // Dummy data for recent order
  const recentOrder = {
    refNumber: "#123456789",
    status: "Pending",
    totalPayment: "$150.00",
    organizationName: "Verch Corp",
    description:
      "This is a unique reference number for tracking your order. Please keep it safe as proof to claim your order.",
  };

  const steps = [
    {
      step: 1,
      title: "Pending Order",
      description: "Order request received",
    },
    {
      step: 2,
      title: "Preparing your order",
      description: "Your order is being double-checked and prepared",
    },
    {
      step: 3,
      title: "Claim your order!",
      description: "Your order is ready for pickup",
    },
  ];

  const statuses: { status: string; variant: ButtonVariant }[] = [
    {
      status: "All",
      variant: "linkHover1",
    },
    {
      status: "Unpaid",
      variant: "linkHover2",
    },
    {
      status: "Completed",
      variant: "linkHover2",
    },
    {
      status: "Cancelled",
      variant: "linkHover2",
    },
  ];

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
  ];
</script>

<style></style>
