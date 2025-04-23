<template>
  <div class="space-y-6 p-6">
    <!-- Organization Header -->
    <div class="mb-8 flex items-center justify-between">
      <div class="flex items-center gap-4">
        <img
          :src="organization?.logoImageURL || '/placeholder-img.jpg'"
          class="h-16 w-16 rounded-md object-cover"
        />
        <div>
          <h1 class="text-2xl font-bold">{{ organization?.name }}</h1>
          <p class="text-sm text-gray-500">{{ organization?.contactEmail }}</p>
        </div>
      </div>
      <div class="flex flex-row space-x-2">
        <UiButton @click="handleNewPayment">
          <Icon name="lucide:plus" class="mr-2" />
          Record Payment
        </UiButton>
        <UiButton @click="refreshData" class="p-4"> Refresh </UiButton>
      </div>
      <AdminCommissionAddPayment
        ref="paymentModal"
        :organization-name="organization?.name || ''"
        :unpaid-amount="financials?.totalDue || 0"
        :organization-id="organizationId"
        @submit="handlePaymentSuccess"
      />
    </div>

    <!-- Commission Summary -->
    <div v-if="financials" class="grid grid-cols-2 gap-4 md:grid-cols-4">
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

    <!-- Commission History Table -->
    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Payment History</UiCardTitle>
      </UiCardHeader>
      <UiCardContent>
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
        <UiDatatable :data="filteredCommission" :options="options" />
        <div v-if="commissionHistory?.length" class="border-t pt-4">
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
    layout: "admin",
    middleware: ["auth-admin"],
  });

  interface StatusSlotProps {
    cellData: CommissionPayment;
  }

  const search = ref("");

  const route = useRoute();
  const organizationId = route.params.id as string;
  const paymentModal = ref();
  const { getOrganizationById, getOrganizationFinancials } = useOrganization();
  const { getCommissionHistory } = useCommission();

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
      .replace("PHP", "₱"); // Replace ISO code with ₱ symbol
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
      console.log("Financial Data:", financials.value);
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

  const handleNewPayment = () => {
    paymentModal.value?.open();
  };

  const refreshData = async () => {
    await fetchOrganization();
    await fetchFinancials();
    await refreshCommissionHistory();
  };

  onMounted(() => {
    fetchOrganization();
    fetchFinancials();
  });

  const handlePaymentSuccess = async () => {
    // Fetch updated data after a successful payment
    fetchOrganization();
    await fetchFinancials();
  };

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
