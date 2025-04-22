<template>
  <div class="container mx-auto space-y-8 p-6">
    <header>
      <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Danger Zone Settings</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">
        Critical operations that cannot be undone. Proceed with caution.
      </p>
    </header>

    <div class="space-y-6">
      <!-- Delete Products Section -->
      <section
        class="rounded-lg border border-red-200 bg-red-50 p-6 dark:border-red-800 dark:bg-red-900/20"
      >
        <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-red-700 dark:text-red-300">
              Delete All Products
            </h2>
            <p class="text-sm text-red-600 dark:text-red-400">
              This will permanently remove all products, variations, and associated images. Affects
              all organizations under this account.
            </p>
          </div>
          <UiAlertDialog>
            <UiAlertDialogTrigger as-child>
              <UiButton
                variant="destructive"
                :loading="isLoading"
                @click="modalDeleteProducts = true"
              >
                <Icon name="lucide:trash-2" class="h-5 w-5" />
                Delete Products
              </UiButton>
            </UiAlertDialogTrigger>
            <UiAlertDialogContent v-if="modalDeleteProducts">
              <div class="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                  aria-hidden="true"
                >
                  <Icon name="lucide:circle-alert" class="size-4 opacity-80" />
                </div>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>Are you sure?</UiAlertDialogTitle>
                  <UiAlertDialogDescription>
                    Are you sure you want all the products? All your data will be removed.
                  </UiAlertDialogDescription>
                </UiAlertDialogHeader>
              </div>
              <UiAlertDialogFooter>
                <UiAlertDialogCancel @click="modalDeleteProducts = false"
                  >Cancel</UiAlertDialogCancel
                >
                <UiAlertDialogAction @click="handleDeleteProducts">Confirm</UiAlertDialogAction>
              </UiAlertDialogFooter>
            </UiAlertDialogContent>
          </UiAlertDialog>
        </div>
      </section>

      <!-- Delete Orders Section -->
      <section
        class="rounded-lg border border-orange-200 bg-orange-50 p-6 dark:border-orange-800 dark:bg-orange-900/20"
      >
        <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-orange-700 dark:text-orange-300">
              Purge Order History
            </h2>
            <p class="text-sm text-orange-600 dark:text-orange-400">
              Permanently delete all order records, transaction logs, and customer purchase history.
            </p>
          </div>
          <UiAlertDialog>
            <UiAlertDialogTrigger as-child>
              <UiButton
                variant="destructive"
                :loading="isDeletingOrders"
                @click="modalDeleteOrders = true"
              >
                <Icon name="lucide:trash-2" class="h-5 w-5" />
                Purge Orders
              </UiButton>
            </UiAlertDialogTrigger>
            <UiAlertDialogContent v-if="modalDeleteOrders">
              <div class="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                  aria-hidden="true"
                >
                  <Icon name="lucide:circle-alert" class="size-4 opacity-80" />
                </div>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>Are you sure?</UiAlertDialogTitle>
                  <UiAlertDialogDescription>
                    Are you sure you want to delete all orders? This action cannot be undone.
                  </UiAlertDialogDescription>
                </UiAlertDialogHeader>
              </div>
              <UiAlertDialogFooter>
                <UiAlertDialogCancel @click="modalDeleteOrders = false">Cancel</UiAlertDialogCancel>
                <UiAlertDialogAction @click="handleDeleteOrders">Confirm</UiAlertDialogAction>
              </UiAlertDialogFooter>
            </UiAlertDialogContent>
          </UiAlertDialog>
        </div>
      </section>

      <!-- Delete Organization Section -->
      <section
        class="rounded-lg border border-purple-200 bg-purple-50 p-6 dark:border-purple-800 dark:bg-purple-900/20"
      >
        <div class="flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div class="space-y-1">
            <h2 class="text-xl font-semibold text-purple-700 dark:text-purple-300">
              Delete Organizations
            </h2>
            <p class="text-sm text-purple-600 dark:text-purple-400">
              Permanently remove the organizations and all its associated data including accounts,
              and informations.
            </p>
          </div>
          <UiAlertDialog>
            <UiAlertDialogTrigger as-child>
              <UiButton
                variant="destructive"
                :loading="isDeletingOrganizations"
                @click="modalDeleteOrganizations = true"
              >
                <Icon name="lucide:trash-2" class="h-5 w-5" />
                Delete Organization
              </UiButton>
            </UiAlertDialogTrigger>
            <UiAlertDialogContent v-if="modalDeleteOrganizations">
              <div class="flex flex-col gap-2 max-sm:items-center sm:flex-row sm:gap-4">
                <div
                  class="flex size-9 shrink-0 items-center justify-center rounded-full border border-border"
                  aria-hidden="true"
                >
                  <Icon name="lucide:circle-alert" class="size-4 opacity-80" />
                </div>
                <UiAlertDialogHeader>
                  <UiAlertDialogTitle>Are you sure?</UiAlertDialogTitle>
                  <UiAlertDialogDescription>
                    Are you sure you want to delete the organizations? This action cannot be undone.
                  </UiAlertDialogDescription>
                </UiAlertDialogHeader>
              </div>
              <UiAlertDialogFooter>
                <UiAlertDialogCancel @click="modalDeleteOrganizations = false"
                  >Cancel</UiAlertDialogCancel
                >
                <UiAlertDialogAction @click="handleDeleteOrganizations"
                  >Confirm</UiAlertDialogAction
                >
              </UiAlertDialogFooter>
            </UiAlertDialogContent>
          </UiAlertDialog>
        </div>
      </section>
    </div>
  </div>
  <!-- Loading Overlay -->
  <div
    v-if="isLoading || isDeletingOrders || isDeletingOrganizations"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50"
  >
    <div class="flex flex-col items-center">
      <div
        class="loader h-12 w-12 animate-spin rounded-full border-4 border-white border-t-transparent"
      ></div>
      <p class="mt-4 text-white">Deleting... Please wait.</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useDeleteOrders } from "~/composables/admin/useDeleteOrders";
  import { useDeleteOrganizations } from "~/composables/admin/useDeleteOrganizations";
  import { useDeleteProducts } from "~/composables/admin/useDeleteProducts";

  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });
  //const testLoading = ref(true);

  const { isLoading, deleteAllProducts, deleteAllProductViews } = useDeleteProducts();
  const { isLoading: isDeletingOrders, deleteAllOrders } = useDeleteOrders();
  const {
    isLoading: isDeletingOrganizations,
    deleteAllOrganizations,
    deleteAllCommissionPayments,
  } = useDeleteOrganizations();

  const modalDeleteProducts = ref(false);
  const modalDeleteOrders = ref(false);
  const modalDeleteOrganizations = ref(false);

  const handleDeleteProducts = async () => {
    try {
      await deleteAllProducts();
      await deleteAllProductViews();
      modalDeleteProducts.value = false;
      alert("All products have been successfully deleted.");
    } catch (error) {
      console.error("Failed to delete products:", error);
      alert("An error occurred while deleting products.");
    }
  };

  const handleDeleteOrders = async () => {
    try {
      await deleteAllOrders();
      alert("All orders have been successfully deleted.");
    } catch (error) {
      console.error("Failed to delete orders:", error);
      alert("An error occurred while deleting orders.");
    }
  };

  const handleDeleteOrganizations = async () => {
    try {
      await deleteAllOrganizations();
      await deleteAllCommissionPayments();
      alert("All organizations have been successfully deleted.");
    } catch (error) {
      console.error("Failed to delete organizations:", error);
      alert("An error occurred while deleting organizations.");
    }
  };
</script>
