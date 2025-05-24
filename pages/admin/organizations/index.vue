<template>
  <div class="flex w-full flex-col space-y-8 px-8 pb-24 pt-8">
    <!-- Summary Cards Section -->
    <div class="grid grid-cols-1 gap-4 md:grid-cols-4">
      <AdminOrganizationStatCard
        title="Total Organizations"
        :value="summaryStats.totalOrgs"
        icon="lucide:building"
      />
      <AdminOrganizationStatCard
        title="Paid Transactions"
        :value="summaryStats.paidTransactions"
        icon="lucide:credit-card"
        trend="up"
      />
      <AdminOrganizationStatCard
        title="Unpaid Balance"
        :value="`₱${summaryStats.unpaidAmount.toLocaleString()}`"
        icon="lucide:alert-circle"
        variant="warning"
      />
      <AdminOrganizationStatCard
        title="Total Revenue"
        :value="`₱${summaryStats.totalAmount.toLocaleString()}`"
        icon="lucide:banknote"
      />
    </div>

    <div class="flex w-full flex-row items-center space-x-8">
      <!-- Add Organization Card -->
      <div class="flex w-1/2 flex-col items-center justify-center rounded-sm border p-16">
        <Icon name="lucide:worm" class="mb-2 h-8 w-8" />
        <h1 class="text-3xl font-semibold">Add New Organization</h1>
        <p class="text-sm text-gray-500">Startup Account</p>
        <UiButton size="sm" class="mt-4" @click="userDialog = true">Add Now</UiButton>
        <AdminOrganizationAdd v-model="userDialog" @success="handleOrganizationAdded" />
      </div>
      <!-- Change Commission Rate Card -->
      <div class="flex w-1/2 flex-col items-center justify-center rounded-sm border p-16">
        <Icon name="lucide:philippine-peso" class="mb-2 h-8 w-8" />
        <h1 class="text-3xl font-semibold">Change Commission Rate</h1>
        <p class="text-sm text-gray-500">Current Commission Rate: {{ currentRate?.rate || 0 }}%</p>
        <UiButton size="sm" class="mt-4" @click="commissionDialog = true">Click Here</UiButton>
        <AdminOrganizationCommission
          v-model="commissionDialog"
          @success="handleRateUpdated"
          :current-rate="currentRate?.rate || 0"
        />
      </div>
    </div>

    <!-- Organizations Table -->
    <div class="flex flex-col space-y-2 px-4">
      <div class="flex flex-row items-center justify-between">
        <h1 class="text-2xl font-semibold">Organizations</h1>
        <div class="flex gap-2">
          <UiButton size="sm" variant="outline" @click="refreshData" :disabled="isRefreshing">
            <Icon v-if="isRefreshing" name="lucide:loader-2" class="mr-1 h-4 w-4 animate-spin" />
            <Icon v-else name="lucide:refresh-cw" class="mr-1 h-4 w-4" />
            {{ isRefreshing ? "Refreshing..." : "Refresh" }}
          </UiButton>
          <UiSelect v-model="filters.paymentStatus" class="w-40">
            <UiSelectTrigger class="w-full">
              <UiSelectValue placeholder="All Status" />
            </UiSelectTrigger>
            <UiSelectContent>
              <UiSelectGroup>
                <UiSelectItem value="all" text="All Status" />
                <UiSelectItem value="active" text="Active" />
                <UiSelectItem value="overdue" text="Overdue" />
                <UiSelectItem value="inactive" text="Inactive" />
              </UiSelectGroup>
            </UiSelectContent>
          </UiSelect>
        </div>
      </div>
      <UiDatatable :options="options" @ready="tableRef = $event">
        <template #actions="{ cellData }: { cellData: OrganizationWithId }">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-6 text-[10px] sm:h-7 sm:text-xs"> Actions </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-32">
              <UiDropdownMenuItem @click="viewOrganization(cellData)">
                View Details
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @click="manageFees(cellData)">Manage Fees</UiDropdownMenuItem>
              <UiDropdownMenuItem @click="resetPassword(cellData)">
                Reset Password
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @click="archiveOrganization(cellData)">
                Archive
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </template>
      </UiDatatable>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import DataTable from "datatables.net";
  import { collection, getDocs, query, where } from "firebase/firestore";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";
  import type { CommissionRate } from "~/types/models/CommissionRate";
  import type { Config } from "datatables.net";

  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });

  const db = useFirestore();
  const toast = useToast();

  const tableRef = shallowRef<InstanceType<typeof DataTable<OrganizationWithId[]>> | null>(null);
  const { getAllOrganizations, getOrganizationFinancials } = useOrganization();
  const userDialog = ref(false);
  const commissionDialog = ref(false);
  const isRefreshing = ref(false);

  const filters = reactive({
    paymentStatus: "all", // Changed from empty string to "all"
  });
  // Summary statistics
  const summaryStats = reactive({
    totalOrgs: 0,
    paidTransactions: 0,
    unpaidAmount: 0,
    totalAmount: 0,
  });

  const computeSummaryStats = async () => {
    try {
      const allOrgs = await getAllOrganizations();

      // Initialize summary stats
      summaryStats.totalOrgs = allOrgs.length;
      summaryStats.paidTransactions = 0;
      summaryStats.unpaidAmount = 0;
      summaryStats.totalAmount = 0;

      for (const org of allOrgs) {
        const financials = await getOrganizationFinancials(org.id);

        // Update stats
        summaryStats.paidTransactions += financials.totalPaid;
        summaryStats.unpaidAmount += financials.totalDue;
        summaryStats.totalAmount += financials.totalPaid + financials.totalDue;
      }

      console.log("Summary Stats:", summaryStats);
      return summaryStats;
    } catch (error) {
      console.error("Error computing summary stats:", error);
      throw error;
    }
  };

  const viewOrganization = (organization: OrganizationWithId) => {
    console.log("View Organization:", organization);
  };

  const manageFees = (organization: OrganizationWithId) => {
    console.log("Manage Fees for:", organization);
    console.log("Organization ID:", organization.id);
    navigateTo(`/admin/organizations/commission/${organization.id}`);
  };

  const resetPassword = (organization: OrganizationWithId) => {
    console.log("Reset Password for:", organization);
  };

  const archiveOrganization = (organization: OrganizationWithId) => {
    console.log("Archive Organization:", organization);
  };

  const handleOrganizationAdded = (newOrganization: any) => {
    tableRef.value?.ajax.reload();
  };

  const rateRef = collection(db, "commissionRate");

  const currentRate = ref<Partial<CommissionRate> | null>(null);
  const fetchComissionRate = async () => {
    try {
      const q = query(rateRef, where("status", "==", "active"));
      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const rateDoc = querySnapshot.docs[0];
        currentRate.value = rateDoc.data() as Partial<CommissionRate>;
        console.log("Current Rate:", currentRate.value);
      }
    } catch (error) {
      console.error("Error fetching commission rate:", error);
    }
  };
  const handleRateUpdated = () => {
    fetchComissionRate();
    toast.toast({
      title: "Success",
      description: `Commission rate updated to ${currentRate.value?.rate}%`,
      variant: "success",
    });
  };

  const refreshData = async () => {
    try {
      isRefreshing.value = true;

      // Clear the organization cache
      const { clearCache } = useOrganization();
      clearCache();

      // Refresh the table data
      tableRef.value?.ajax.reload();

      // Recalculate summary stats
      await computeSummaryStats();

      toast.toast({
        title: "Refreshed",
        description: "Organization data has been refreshed",
        variant: "success",
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
      toast.toast({
        title: "Error",
        description: "Failed to refresh organization data",
        variant: "destructive",
      });
    } finally {
      isRefreshing.value = false;
    }
  };

  onMounted(() => {
    fetchComissionRate();
    computeSummaryStats();
  });

  const calculatePaymentStatus = (commissionData: { totalPaid: number; totalDue: number }) => {
    const total = commissionData.totalPaid + commissionData.totalDue;
    if (total === 0) return "no-commissions";

    const paidPercentage = (commissionData.totalPaid / total) * 100;

    return paidPercentage >= 100 ? "paid" : "partial";
  };

  const options: Config = {
    dom: `<'relative'r<'flex flex-col gap-4 md:flex-row md:items-center justify-between mb-5'fB><'overflow-auto border rounded-md't><'mt-4 px-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4'<l><'flex flex-col gap-4 md:flex-row md:items-center md:gap-8'<i><p>>>>`,
    pagingType: "full",
    language: {
      info: "<p class='inline-flex gap-1'><span class='font-medium text-foreground'>_START_-_END_</span> of <span class='font-medium text-foreground'>_TOTAL_</span></p>",
      lengthMenu: "<span class='font-medium text-foreground'>Rows per page</span> _MENU_",
      search: "",
      searchPlaceholder: "Search...",
    },
    lengthMenu: [7, 25, 50, 75, 100],
    order: [[2, "asc"]],
    buttons: [
      {
        extend: "colvis",
        text: "View",
        columns: ":not(.no-column)",
      },
      {
        extend: "print",
        text: "Print",
        title: `Organizations - ${useDateFormat(new Date(), "MMM DD, YYYY").value}`,
        exportOptions: {
          columns: ":not(.no-export)",
          trim: true,
          stripHtml: true,
          format: {
            body: (data: any) => {
              const htmlString = data.outerHTML;
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlString, "text/html");
              return htmlString ? doc?.body?.textContent : data;
            },
          },
        },
      },
      {
        text: "Add Organization",
        action: () => {
          userDialog.value = true;
        },
      },
    ],
    columns: [
      { title: "ID", data: "id", visible: false },
      {
        title: "Organization",
        data: "name",
        render: (data, type, row) => {
          const dateCreated = useDateFormat(row.dateCreated, "MMM DD, YYYY").value;
          return `
          <div class="flex flex-col">
            <span class="font-medium">${data}</span>
            <span class="text-xs text-gray-500">${dateCreated}</span>
          </div>
        `;
        },
      },
      {
        title: "Commission Fees",
        data: "commissionData",
        render: (data) => {
          const totalCommission = data.totalDue + data.totalPaid;
          const paidPercentage =
            totalCommission > 0 ? Math.round((data.totalPaid / totalCommission) * 100) : 0;

          // Determine status color based on payment percentage
          const statusClass =
            paidPercentage >= 80
              ? "bg-green-500"
              : paidPercentage >= 50
                ? "bg-yellow-500"
                : "bg-red-500";

          // Determine overall status for filtering
          const paymentStatus =
            paidPercentage >= 80 ? "paid" : paidPercentage >= 50 ? "partial" : "not_paid";

          return `
          <div class="flex flex-col gap-1 min-w-[200px]" data-payment-status="${paymentStatus}">
            <div class="flex justify-between text-xs">
              <span>${data.totalPaid.toLocaleString()}/${totalCommission.toLocaleString()} (${paidPercentage}%)</span>
              <span class="font-medium">₱${data.totalPaid.toLocaleString()}</span>
            </div>
            <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full ${statusClass}" 
                style="width: ${paidPercentage}%"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>Unpaid:</span>
              <span>₱${data.totalDue.toLocaleString()}</span>
            </div>
          </div>
        `;
        },
      },
      {
        title: "Status",
        data: "status",
        render: (data: unknown) => {
          // Define type-safe status classes
          const statusClasses: Record<"active" | "overdue" | "inactive", string> = {
            active: "bg-green-100 text-green-800",
            overdue: "bg-yellow-100 text-yellow-800",
            inactive: "bg-gray-100 text-gray-800",
          };

          // Type guard to ensure data is valid
          const isValidStatus = (status: unknown): status is keyof typeof statusClasses => {
            return typeof status === "string" && status in statusClasses;
          };

          // Default class if status is invalid
          const defaultClass = "bg-gray-100 text-gray-800";

          // Safely access the class
          const statusClass = isValidStatus(data) ? statusClasses[data] : defaultClass;
          const displayText = isValidStatus(data)
            ? data.charAt(0).toUpperCase() + data.slice(1)
            : "Unknown";

          return `
          <span class="px-2 py-1 rounded-full text-xs font-medium ${statusClass}">
            ${displayText}
          </span>
          `;
        },
      },
      {
        title: "Actions",
        data: null,
        orderable: false,
        searchable: false,
        render: "#actions",
      },
    ],
    serverSide: true,
    processing: true,
    async ajax(data: any, callback: any) {
      try {
        const allOrgs = await getAllOrganizations();
        console.log("Total orgs fetched:", allOrgs.length);

        const orgsWithFinancials = await Promise.all(
          allOrgs.map(async (org) => {
            const commissionData = await getOrganizationFinancials(org.id);

            // Calculate payment status
            const paymentStatus = calculatePaymentStatus(commissionData);

            // For debugging
            console.log(`Org: ${org.name}, Payment Status: ${paymentStatus}`);

            // Calculate status based on payment status or other criteria
            const status =
              paymentStatus === "paid"
                ? "active"
                : paymentStatus === "partial"
                  ? "overdue"
                  : "inactive";

            return {
              ...org,
              commissionData,
              paymentStatus,
              status,
            };
          })
        );

        console.log("Filter selected:", filters.paymentStatus);
        console.log("Orgs with financials:", orgsWithFinancials.length);

        // Apply filters - SIMPLIFIED LOGIC
        let filteredData = orgsWithFinancials;
        if (filters.paymentStatus && filters.paymentStatus !== "all") {
          filteredData = filteredData.filter((org) => org.status === filters.paymentStatus);
          console.log(`After filtering for ${filters.paymentStatus}:`, filteredData.length);
        }

        // Apply search
        if (data.search.value) {
          const searchTerm = data.search.value.toLowerCase();
          filteredData = filteredData.filter(
            (org) =>
              org.name?.toLowerCase().includes(searchTerm) ||
              org.contactEmail?.toLowerCase().includes(searchTerm)
          );
        }

        callback({
          draw: Number(data.draw),
          data: filteredData.slice(data.start, data.start + data.length),
          recordsTotal: allOrgs.length,
          recordsFiltered: filteredData.length,
        });
      } catch (error) {
        console.error("Error loading data:", error);
        callback({ error: "Failed to load organization data" });
      }
    },
  };

  // Watch for filter changes
  watch(
    () => filters.paymentStatus,
    () => {
      tableRef.value?.ajax.reload();
    }
  );
</script>
