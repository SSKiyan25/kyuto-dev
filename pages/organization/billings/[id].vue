<template>
  <div class="mb-12 space-y-6 p-4 sm:p-6">
    <!-- Organization Header - Made responsive -->
    <div class="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <div class="flex items-center gap-3 sm:gap-4">
        <img
          :src="organization?.logoImageURL || '/placeholder-img.jpg'"
          class="h-12 w-12 shrink-0 rounded-md object-cover sm:h-16 sm:w-16"
        />
        <div>
          <h1 class="text-xl font-bold sm:text-2xl">{{ organization?.name }}</h1>
          <p class="text-xs text-gray-500 sm:text-sm">{{ organization?.contactEmail }}</p>
        </div>
      </div>
      <div class="mt-2 flex justify-end sm:mt-0">
        <UiButton
          @click="refreshData"
          :disabled="isRefreshing"
          class="flex items-center px-3 py-2 sm:p-4"
        >
          <Icon
            name="lucide:refresh-cw"
            class="mr-1 h-4 w-4 sm:mr-2"
            :class="{ 'animate-spin': isRefreshing }"
          />
          <span class="text-sm">Refresh</span>
        </UiButton>
      </div>
    </div>

    <!-- Commission Summary - Improved mobile layout -->
    <div v-if="financials" class="xs:grid-cols-2 grid grid-cols-1 gap-3 sm:gap-4 md:grid-cols-4">
      <AdminCommissionStatCard
        title="Total Commission"
        :value="financials.totalDue + financials.totalPaid"
        icon="lucide:activity"
      />
      <AdminCommissionStatCard
        title="Paid Amount"
        :value="financials.totalPaid"
        icon="lucide:check-circle"
        variant="success"
      />
      <AdminCommissionStatCard
        title="Pending Amount"
        :value="financials.totalDue"
        icon="lucide:clock"
        variant="warning"
      />
      <AdminCommissionStatCard
        title="Last Payment"
        :value="lastPaymentDate"
        icon="lucide:calendar"
        variant="neutral"
      />
    </div>
    <div v-else class="text-center text-gray-500">Loading financial data...</div>

    <!-- Commission History -->
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Payment History</UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
        <!-- Search Box -->
        <div class="mb-6 flex items-center">
          <div class="w-full md:max-w-sm">
            <UiVeeInput
              v-model="search"
              label="Keyword"
              placeholder="Search..."
              icon="lucide:search"
            />
          </div>
        </div>

        <!-- Desktop Table View (hidden on mobile) -->
        <div class="hidden md:block">
          <UiDatatable :data="filteredCommission" :options="options" />
        </div>

        <!-- Mobile Card View (visible only on mobile) -->
        <div class="space-y-4 md:hidden">
          <div
            v-for="(payment, index) in filteredCommission"
            :key="index"
            class="rounded-lg border bg-card/50 p-3"
          >
            <div class="mb-2 flex items-start justify-between">
              <div class="font-medium">
                {{ useDateFormat(payment.dateCreated, "MMM DD, YYYY").value }}
              </div>
              <div class="font-bold text-primary">{{ formatCurrency(payment.amount) }}</div>
            </div>

            <div class="grid grid-cols-2 gap-y-2 text-sm">
              <div class="flex items-center gap-1 text-muted-foreground">
                <Icon name="lucide:credit-card" class="h-3.5 w-3.5" />
                <span>Method:</span>
              </div>
              <div class="text-right font-medium capitalize">
                {{ payment.method }}
              </div>

              <div class="flex items-center gap-1 text-muted-foreground">
                <Icon name="lucide:hash" class="h-3.5 w-3.5" />
                <span>Reference:</span>
              </div>
              <div class="max-w-[140px] truncate text-right font-medium">
                {{ payment.reference }}
              </div>
            </div>
          </div>

          <!-- Empty State for Mobile -->
          <div
            v-if="filteredCommission.length === 0"
            class="py-4 text-center text-muted-foreground"
          >
            <Icon name="lucide:x-circle" class="mx-auto mb-2 h-8 w-8" />
            <p>No payment records found</p>
          </div>
        </div>

        <!-- Total section (shown on both mobile and desktop) -->
        <div v-if="commissionHistory?.length" class="mt-4 border-t pt-4">
          <div class="flex items-center justify-between">
            <p class="font-medium">Total Paid:</p>
            <p class="font-medium">
              {{ formatCurrency(totalPaid) }}
            </p>
          </div>
        </div>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
  import { useCommission } from "~/composables/admin/useCommission";
  import type { CommissionPayment } from "~/composables/admin/useCommission";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";
  import type { Config } from "datatables.net";

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });

  const search = ref("");
  const isRefreshing = ref(false);
  const route = useRoute();
  const organizationId = route.params.id as string;
  const paymentModal = ref();
  const { getOrganizationById, getOrganizationFinancials } = useOrganization();
  const { getCommissionHistory, clearCache } = useCommission();

  const organization = ref<OrganizationWithId | null>(null);
  const financials = ref<{ totalPaid: number; totalDue: number } | null>(null);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PH", {
      style: "currency",
      currency: "PHP",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
      .format(value)
      .replace("PHP", "₱");
  };

  // Fetch organization data
  const fetchOrganization = async () => {
    try {
      organization.value = await getOrganizationById(organizationId);
      console.log("Organization Data:", organization.value);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  };

  // Fetch financial data
  const fetchFinancials = async () => {
    try {
      financials.value = await getOrganizationFinancials(organizationId);
      // console.log("Financial Data:", financials.value);
    } catch (error) {
      console.error("Error fetching financial data:", error);
    }
  };

  // Fetch commission history
  const { data: commissionHistory, refresh: refreshCommissionHistory } = await useAsyncData<
    CommissionPayment[]
  >("commission-history", async () => {
    const history = await getCommissionHistory(organizationId);
    return history || [];
  });

  const filteredCommission = computed(() => {
    if (!search.value) return commissionHistory.value || [];
    const query = search.value.toLowerCase();
    return (
      commissionHistory.value?.filter(
        (payment) =>
          payment.reference.toLowerCase().includes(query) ||
          payment.method.toLowerCase().includes(query)
      ) || []
    );
  });

  const totalPaid = computed(
    () => commissionHistory.value?.reduce((acc, curr) => acc + curr.amount, 0) || 0
  );

  const lastPaymentDate = computed(() => {
    if (!commissionHistory.value?.length) return "N/A";
    const last = commissionHistory.value[0];
    return useDateFormat(last.dateCreated, "MMM DD, YYYY").value;
  });

  const refreshData = async () => {
    if (isRefreshing.value) return; // Prevent multiple clicks
    isRefreshing.value = true;

    try {
      clearCache();
      await fetchOrganization();
      await fetchFinancials();
      await refreshCommissionHistory();
    } catch (error) {
      console.error("Error refreshing data:", error);
    } finally {
      isRefreshing.value = false; // Re-enable the button
    }
  };

  onMounted(() => {
    fetchOrganization();
    fetchFinancials();
  });

  const options: Config = {
    dom: `<'overflow-hidden rounded-lg border border-border bg-background'<'overflow-auto't>>`,
    paging: false,
    columns: [
      {
        title: "Date",
        data: "dateCreated",
        render: (data: Date) => useDateFormat(data, "MMM DD, YYYY").value,
      },
      { title: "Method", data: "method" },
      { title: "Reference", data: "reference" },
      {
        title: "Amount",
        data: "amount",
        className: "font-medium",
        render: (data: number) => formatCurrency(data),
      },
    ],
    order: [[0, "desc"]],
    responsive: true,
    autoWidth: true,
    language: {
      search: "",
      searchPlaceholder: "Search payments...",
    },
  };
</script>

<style scoped>
  @media (max-width: 640px) {
    :deep(.ui-card-header) {
      padding-top: 0.75rem;
      padding-bottom: 0.75rem;
    }

    :deep(.ui-card-content) {
      padding: 0.75rem;
    }
  }
</style>
