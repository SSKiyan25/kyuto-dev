<script lang="ts" setup>
  import { useOrganizationAnalytics } from "~/composables/organization/useAnalytics";

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });

  const route = useRoute();
  const organizationID = route.params.id as string;

  const { getComparisonForPreAndDirectOrders } = useOrganizationAnalytics();
  const comparisonData = ref<{ name: string; Total: number }[]>([]);
  const status = ref<"pending" | "success" | "error">("pending");

  // Fetch data for the chart
  const fetchComparisonData = async () => {
    try {
      status.value = "pending";
      const result = await getComparisonForPreAndDirectOrders(organizationID);
      comparisonData.value = [
        { name: "Pre-Orders Items", Total: result.preOrderCount },
        { name: "Direct Orders Items", Total: result.directOrderCount },
      ];
      status.value = "success";
    } catch (error) {
      console.error("Failed to fetch comparison data:", error);
      status.value = "error";
    }
  };

  onMounted(() => {
    fetchComparisonData();
  });
</script>

<template>
  <div class="mb-12 flex w-full flex-col space-y-6 p-4 sm:p-6 md:p-8 lg:p-12">
    <!-- Page Title -->
    <div>
      <span class="text-xl font-bold sm:text-2xl">Dashboard</span>
      <p class="text-sm text-gray-500">View your organization's performance and analytics.</p>
    </div>

    <!-- Analytics Component -->
    <OrganizationAnalytics :organizationID="organizationID" />
  </div>
</template>
