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
          <UiSelect v-model="filters.status" class="w-40">
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="overdue">Overdue</option>
            <option value="inactive">Inactive</option>
          </UiSelect>
        </div>
      </div>
      <UiDatatable :options="options" @ready="tableRef = $event">
        <template #actions="{ cellData }: { cellData: Organization }">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-6 text-[10px] sm:h-7 sm:text-xs"> Actions </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-32">
              <UiDropdownMenuItem @click="viewOrganization(cellData)"> View </UiDropdownMenuItem>
              <UiDropdownMenuItem>Transactions</UiDropdownMenuItem>
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
  import { faker } from "@faker-js/faker";
  import DataTable from "datatables.net";
  import { collection, getDocs, query, where } from "firebase/firestore";
  import type { CommissionRate } from "~/types/models/CommissionRate";
  import type { Config } from "datatables.net";

  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });

  const db = useFirestore();
  const toast = useToast();

  type Organization = {
    id: number;
    name: string;
    dateCreated: string;
    transactions: {
      total: number;
      paid: number;
      unpaid: number;
      totalAmount: number;
      paidAmount: number;
      unpaidAmount: number;
    };
    status: "active" | "overdue" | "inactive";
  };

  const tableRef = shallowRef<InstanceType<typeof DataTable<Organization[]>> | null>(null);
  const userDialog = ref(false);
  const commissionDialog = ref(false);
  const selectedOrganization = ref<Organization | null>(null);

  const filters = reactive({
    status: "",
  });

  // Summary statistics
  const summaryStats = reactive({
    totalOrgs: 0,
    paidTransactions: 0,
    unpaidAmount: 0,
    totalAmount: 0,
  });

  const viewOrganization = (organization: Organization) => {
    console.log("View Organization:", organization);
  };

  const resetPassword = (organization: Organization) => {
    console.log("Reset Password for:", organization);
  };

  const archiveOrganization = (organization: Organization) => {
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

  onMounted(() => {
    fetchComissionRate();
  });

  // Generate more realistic mock data
  const generateMockData = () => {
    const data = Array.from({ length: 100 }, (_, index) => {
      const totalTransactions = faker.number.int({ min: 5, max: 500 });
      const paidTransactions = faker.number.int({ min: 0, max: totalTransactions });
      const totalAmount = faker.number.float({ min: 1000, max: 50000, fractionDigits: 2 });
      const paidPercentage = paidTransactions / totalTransactions;

      return {
        id: index + 1,
        name: faker.company.name(),
        dateCreated: useDateFormat(faker.date.past().toISOString(), "MMMM DD, YYYY").value,
        transactions: {
          total: totalTransactions,
          paid: paidTransactions,
          unpaid: totalTransactions - paidTransactions,
          totalAmount: totalAmount,
          paidAmount: parseFloat((totalAmount * paidPercentage).toFixed(2)),
          unpaidAmount: parseFloat((totalAmount * (1 - paidPercentage)).toFixed(2)),
        },
        status: paidPercentage === 1 ? "active" : paidPercentage < 0.5 ? "overdue" : "inactive",
      };
    });

    // Update summary stats
    summaryStats.totalOrgs = data.length;
    summaryStats.paidTransactions = data.reduce((sum, org) => sum + org.transactions.paid, 0);
    summaryStats.unpaidAmount = data.reduce((sum, org) => sum + org.transactions.unpaidAmount, 0);
    summaryStats.totalAmount = data.reduce((sum, org) => sum + org.transactions.totalAmount, 0);

    return data;
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
          return `
          <div class="flex flex-col">
            <span class="font-medium">${data}</span>
            <span class="text-xs text-gray-500">${row.dateCreated}</span>
          </div>
        `;
        },
      },
      {
        title: "Transactions",
        data: "transactions",
        render: (data) => {
          const paidPercentage = Math.round((data.paid / data.total) * 100);
          return `
          <div class="flex flex-col gap-1 min-w-[200px]">
            <div class="flex justify-between text-xs">
              <span>${data.paid}/${data.total} (${paidPercentage}%)</span>
              <span class="font-medium">₱${data.paidAmount.toLocaleString()}</span>
            </div>
            <div class="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                class="h-full ${paidPercentage >= 80 ? "bg-green-500" : paidPercentage >= 50 ? "bg-yellow-500" : "bg-red-500"}" 
                style="width: ${paidPercentage}%"
              ></div>
            </div>
            <div class="flex justify-between text-xs text-gray-500">
              <span>Unpaid: ${data.unpaid}</span>
              <span>₱${data.unpaidAmount.toLocaleString()}</span>
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
      await new Promise((resolve) => setTimeout(resolve, 800));
      const res = generateMockData();

      // Apply filters
      let filteredData = res;
      if (filters.status) {
        filteredData = res.filter((org) => org.status === filters.status);
      }

      callback({
        draw: Number(data.draw),
        data: filteredData.slice(data.start, data.start + data.length),
        recordsTotal: res.length,
        recordsFiltered: filteredData.length,
      });
    },
  };

  // Watch for filter changes
  watch(
    () => filters.status,
    () => {
      tableRef.value?.ajax.reload();
    }
  );
</script>
