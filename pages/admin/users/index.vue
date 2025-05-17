<template>
  <div class="space-y-6">
    <div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <AdminOrganizationStatCard
        title="Total Accounts"
        :value="totalAccounts"
        icon="heroicons:users"
        trend="up"
        :percentage="12.5"
      />
      <AdminOrganizationStatCard
        title="Active Accounts"
        :value="activeAccounts"
        icon="heroicons:user-circle"
        trend="neutral"
      />
      <AdminOrganizationStatCard
        title="Archived Accounts"
        :value="archivedAccounts"
        icon="heroicons:archive-box"
        trend="down"
        :percentage="8.2"
      />
      <AdminOrganizationStatCard
        title="Admin Accounts"
        :value="adminAccounts"
        icon="heroicons:shield-check"
      />
    </div>

    <UiCard>
      <UiCardHeader>
        <UiCardTitle>Account Management</UiCardTitle>
        <UiCardDescription>Manage registered user accounts</UiCardDescription>
      </UiCardHeader>
      <UiCardContent>
        <div class="mb-6 flex flex-wrap items-center gap-3">
          <UiButton
            v-for="status in statuses"
            :key="status.value"
            :variant="status.variant"
            size="sm"
            @click="() => fetchAccountsByStatus(status.value)"
          >
            {{ status.status }}
          </UiButton>
        </div>

        <UiDatatable :options="options" :columns="columns" :data="filteredAccounts">
          <template #status="{ cellData }: { cellData: Account }">
            <span
              :class="[
                cellData.isArchived ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800',
                'rounded-full px-2 py-1 text-xs font-medium capitalize',
              ]"
            >
              {{ cellData.isArchived ? "archived" : "active" }}
            </span>
          </template>

          <template #actions="{ cellData }: { cellData: Account }">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton class="h-7 text-xs" size="sm">Actions</UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-40">
                <UiDropdownMenuItem @click="viewAccount(cellData)">
                  <Icon name="heroicons:eye" class="mr-2 h-4 w-4" />
                  View
                </UiDropdownMenuItem>
                <UiDropdownMenuItem @click="editAccount(cellData)">
                  <Icon name="heroicons:pencil-square" class="mr-2 h-4 w-4" />
                  Edit
                </UiDropdownMenuItem>
                <UiDropdownMenuItem
                  @click="toggleArchiveAccount(cellData)"
                  :class="cellData.isArchived ? 'text-green-600' : 'text-red-600'"
                >
                  <Icon name="heroicons:archive-box" class="mr-2 h-4 w-4" />
                  {{ cellData.isArchived ? "Unarchive" : "Archive" }}
                </UiDropdownMenuItem>
                <UiDropdownMenuItem @click="handleResetPassword(cellData.email)">
                  <Icon name="heroicons:lock-closed" class="mr-2 h-4 w-4" />
                  Reset Password
                </UiDropdownMenuItem>
                <UiDropdownMenuItem
                  @click="handleDisableAccount(cellData.id, !cellData.disabled)"
                  :class="cellData.disabled ? 'text-green-600' : 'text-red-600'"
                >
                  <Icon name="heroicons:user-off" class="mr-2 h-4 w-4" />
                  {{ cellData.disabled ? "Enable Account" : "Disable Account" }}
                </UiDropdownMenuItem>
                <UiDropdownMenuItem class="text-red-600" @click="deleteAccountFunction(cellData)">
                  <Icon name="heroicons:trash" class="mr-2 h-4 w-4" />
                  Delete
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </template>
        </UiDatatable>
      </UiCardContent>
    </UiCard>
  </div>
</template>

<script lang="ts" setup>
  import { useAdminAccounts } from "~/composables/admin/useAccounts";
  import type { ButtonVariant } from "~/types/Button";
  import type { Account } from "~/types/models/Account";
  import type { Config, ConfigColumns } from "datatables.net";

  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });

  const { fetchAccounts, toggleArchive, deleteAccount, resetPassword, disableAccount } =
    useAdminAccounts();
  const accounts = ref<Partial<Account>[]>([]);
  const selectedStatus = ref<string>("active");
  const loading = ref(false);

  // Stat computations
  const totalAccounts = computed(() => accounts.value.length);
  const activeAccounts = computed(() => accounts.value.filter((a) => !a.isArchived).length);
  const archivedAccounts = computed(() => accounts.value.filter((a) => a.isArchived).length);
  const adminAccounts = computed(() => accounts.value.filter((a) => a.role === "admin").length);

  const filteredAccounts = computed(() => {
    if (selectedStatus.value === "active") {
      return accounts.value.filter((a) => !a.isArchived);
    } else if (selectedStatus.value === "archived") {
      return accounts.value.filter((a) => a.isArchived);
    } else {
      return accounts.value; // Return all accounts for "all" status
    }
  });

  // Status filters
  const statuses: { status: string; value: string; variant: ButtonVariant }[] = [
    {
      status: "All",
      value: "all",
      variant: "linkHover1",
    },
    {
      status: "Active",
      value: "active",
      variant: "linkHover2",
    },
    {
      status: "Archived",
      value: "archived",
      variant: "linkHover2",
    },
  ];
  // Table configuration
  const columns: ConfigColumns[] = [
    {
      title: "Name",
      data: "firstname",
      render: (_, __, row) => `${row.firstname} ${row.lastname}`,
    },
    { title: "Email", data: "email" },
    {
      title: "Role",
      data: "role",
      render: (data: string) => `
      <span class="px-2 py-1 rounded bg-blue-100 text-blue-800 text-xs font-medium">
        ${data}
      </span>
    `,
    },
    {
      title: "Has Organization",
      data: "hasOrganization",
      render: (data: boolean) => `
      <span class="px-2 py-1 rounded ${data ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"} text-xs font-medium">
        ${data ? "Yes" : "No"}
      </span>
    `,
    },
    {
      title: "Status",
      data: "isArchived",
      render: "#status",
    },
    {
      title: "Account Access",
      data: "disabled",
      render: (data: boolean) => `
    <span class="px-2 py-1 rounded ${data ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"} text-xs font-medium">
      ${data ? "Disabled" : "Enabled"}
    </span>
  `,
    },
    {
      title: "Registered",
      data: "dateCreated",
      render: (data: Date) =>
        new Date(data).toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
    },
    {
      data: null,
      title: "",
      className: "no-export",
      searchable: false,
      orderable: false,
      render: "#actions",
      responsivePriority: 1,
    },
  ];

  const options: Config = {
    buttons: [
      {
        extend: "colvis",
        text: "Columns",
        columns: ":not(.no-export)",
      },
      {
        extend: "copy",
        exportOptions: { columns: ":not(.no-export)" },
      },
      {
        extend: "excel",
        exportOptions: { columns: ":not(.no-export)" },
      },
      {
        extend: "pdf",
        exportOptions: { columns: ":not(.no-export)" },
      },
      {
        extend: "print",
        exportOptions: { columns: ":not(.no-export)" },
      },
    ],
    dom: `Q<'flex flex-col lg:flex-row w-full lg:items-start lg:justify-between gap-5 mb-5'Bf>
        <'border rounded-lg't>
        <'flex flex-col lg:flex-row gap-5 lg:items-center lg:justify-between pt-3 p-5'li>
        <''p>`,
    responsive: true,
    autoWidth: true,
    select: true,
    ordering: true,
    order: [[3, "desc"]],
  };

  // Data fetching
  const fetchAccountsByStatus = async (status: string = "active") => {
    loading.value = true;
    try {
      const allAccounts = await fetchAccounts(); // Fetch all accounts from the composable
      accounts.value = allAccounts.filter((account) => {
        if (status === "archived") return account.isArchived;
        if (status === "active") return !account.isArchived;
        return true; // Return all accounts for "all" status
      });
      selectedStatus.value = status;
    } catch (error) {
      console.error("Error fetching accounts:", error);
    } finally {
      loading.value = false;
    }
  };

  // Initial load
  onMounted(() => {
    fetchAccountsByStatus();
  });

  // Actions
  const viewAccount = (account: Account) => {
    // navigateTo(`/admin/accounts/${account.id}`);
  };

  const editAccount = (account: Account) => {
    // Implement edit logic
  };

  const toggleArchiveAccount = async (account: Account) => {
    try {
      await toggleArchive(account.id, !account.isArchived); // Call the composable function
      await fetchAccountsByStatus(selectedStatus.value); // Refresh the accounts list
      console.log("Account status updated successfully");
    } catch (error) {
      console.error("Error updating account status:", error);
    }
  };

  const deleteAccountFunction = async (account: Account) => {
    if (confirm(`Are you sure you want to delete ${account.email}?`)) {
      try {
        await deleteAccount(account.id); // Call the composable function
        await fetchAccountsByStatus(selectedStatus.value); // Refresh the accounts list
        console.log("Account deleted successfully");
      } catch (error) {
        console.error("Error deleting account:", error);
      }
    }
  };

  const handleResetPassword = async (email: string) => {
    if (confirm(`Are you sure you want to reset the password for ${email}?`)) {
      try {
        const response = await resetPassword(email); // Call the composable function
        console.log("Password reset link:", response.resetLink);
        alert(`Password reset link sent to ${email}`);
      } catch (error) {
        console.error("Error resetting password:", error);
        alert("Failed to reset password. Please try again.");
      }
    }
  };

  const handleDisableAccount = async (uid: string, disabled: boolean) => {
    const action = disabled ? "disable" : "enable";
    if (confirm(`Are you sure you want to ${action} this account?`)) {
      try {
        await disableAccount(uid, disabled); // Call the composable function
        await fetchAccountsByStatus(selectedStatus.value); // Refresh the accounts list
        console.log(`Account ${action}d successfully`);
      } catch (error) {
        console.error(`Error ${action}ing account:`, error);
        alert(`Failed to ${action} account. Please try again.`);
      }
    }
  };
</script>

<!-- <style scoped>
  :deep(.dataTables_wrapper) {
    @apply w-full overflow-auto;
  }

  :deep(.dt-buttons) {
    @apply flex flex-wrap gap-2;
  }
</style> -->
