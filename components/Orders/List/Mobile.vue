<template>
  <div class="block w-full sm:hidden">
    <!-- Header and Search -->
    <div class="mb-4">
      <!-- Search Box -->
      <div class="relative mb-4">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Icon name="lucide:search" class="h-4 w-4 text-muted-foreground" />
        </div>
        <input
          v-model="searchTerm"
          type="text"
          placeholder="Search by reference number..."
          class="w-full rounded-md border border-input bg-background py-2 pl-10 pr-4 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        />
        <button
          v-if="searchTerm"
          @click="searchTerm = ''"
          class="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3"
        >
          <Icon name="lucide:x" class="h-4 w-4 text-muted-foreground hover:text-foreground" />
        </button>
      </div>
    </div>

    <!-- Order Count -->
    <div class="mb-3 flex items-center justify-between">
      <p class="text-xs text-muted-foreground">
        {{ filteredOrders.length }} {{ filteredOrders.length === 1 ? "order" : "orders" }} found
      </p>

      <UiButton variant="ghost" size="sm" @click="searchTerm = ''" v-if="searchTerm">
        <Icon name="lucide:x" class="mr-1 h-3 w-3" />
        Clear search
      </UiButton>
    </div>

    <!-- Orders List -->
    <TransitionGroup name="fade" tag="div" class="flex flex-col space-y-3">
      <template v-if="filteredOrders.length > 0">
        <div
          v-for="order in paginatedOrders"
          :key="order.id"
          class="flex flex-col rounded-lg border border-border bg-card p-4 shadow-sm transition-all hover:shadow-md"
        >
          <!-- Order Header -->
          <div class="flex items-start justify-between">
            <div class="flex flex-col">
              <!-- Added order numbering badge -->
              <div class="mb-1 flex items-center">
                <span
                  class="mr-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[10px] font-medium text-primary"
                >
                  {{ getOrderIndex(order) }}
                </span>
                <h3 class="font-mono text-xs font-medium">{{ order.uniqRefNumber }}</h3>
              </div>
              <p class="mt-1 text-[10px] text-muted-foreground">
                {{ formatDate(order.dateOrdered) }}
              </p>
            </div>

            <!-- Status Badges -->
            <div class="flex flex-col items-end space-y-1.5">
              <!-- Order Status Badge with icon -->
              <div class="flex items-center gap-1">
                <span class="text-[9px] text-muted-foreground">Order:</span>
                <div
                  class="flex items-center rounded-full px-2 py-1 text-[10px] font-medium"
                  :class="getStatusClasses(order.orderStatus)"
                >
                  <Icon name="lucide:package" class="mr-1 h-2.5 w-2.5" />
                  <span class="capitalize">{{ order.orderStatus }}</span>
                </div>
              </div>

              <!-- Payment Status Badge with icon -->
              <div class="flex items-center gap-1">
                <span class="text-[9px] text-muted-foreground">Payment:</span>
                <div
                  class="flex items-center rounded-full px-2 py-1 text-[10px] font-medium"
                  :class="getPaymentStatusClasses(order.paymentStatus)"
                >
                  <Icon
                    :name="
                      order.paymentStatus === 'paid' ? 'lucide:check-circle' : 'lucide:credit-card'
                    "
                    class="mr-1 h-2.5 w-2.5"
                  />
                  <span class="capitalize">{{ order.paymentStatus || "not_paid" }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Order Details -->
          <div class="mt-3 flex items-center justify-between border-t border-border/50 pt-3">
            <div class="flex flex-col">
              <p class="text-xs font-semibold">₱{{ order.totalPrice.toFixed(2) }}</p>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <UiButton
                variant="outline"
                size="xs"
                @click="$emit('view-order', order.id)"
                class="h-8 px-2"
              >
                <Icon name="lucide:eye" class="mr-1 h-3 w-3" />
                View
              </UiButton>

              <UiButton
                v-if="order.orderStatus === 'pending'"
                variant="destructive"
                size="xs"
                @click="$emit('cancel-order', order.id)"
                class="h-8 px-2"
              >
                <Icon name="lucide:x" class="mr-1 h-3 w-3" />
                Cancel
              </UiButton>
            </div>
          </div>
        </div>
      </template>

      <!-- Empty State -->
      <div v-if="filteredOrders.length === 0" class="mt-4 flex flex-col items-center text-center">
        <div class="rounded-full bg-muted p-3">
          <Icon name="lucide:search-x" class="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 class="mt-2 text-sm font-medium">No orders found</h3>
        <p class="mt-1 text-xs text-muted-foreground">
          {{
            searchTerm
              ? "Try a different search term or clear the search."
              : "You have no orders yet."
          }}
        </p>
        <UiButton
          v-if="searchTerm"
          variant="outline"
          size="sm"
          @click="searchTerm = ''"
          class="mt-3"
        >
          Clear search
        </UiButton>
      </div>
    </TransitionGroup>
    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="mt-6 flex items-center justify-center gap-2">
      <UiButton
        variant="outline"
        size="sm"
        :disabled="currentPage === 1"
        @click="goToPage(currentPage - 1)"
        class="h-8 w-8 p-0"
      >
        <Icon name="lucide:chevron-left" class="h-4 w-4" />
      </UiButton>

      <!-- Page Number Buttons -->
      <div class="flex items-center gap-1">
        <template v-for="page in pageButtons" :key="page">
          <UiButton
            v-if="page !== '...'"
            :variant="currentPage === page ? 'default' : 'outline'"
            size="sm"
            @click="goToPage(page)"
            class="h-8 w-8 p-0"
          >
            {{ page }}
          </UiButton>
          <span v-else class="px-1 text-muted-foreground">...</span>
        </template>
      </div>

      <UiButton
        variant="outline"
        size="sm"
        :disabled="currentPage === totalPages"
        @click="goToPage(currentPage + 1)"
        class="h-8 w-8 p-0"
      >
        <Icon name="lucide:chevron-right" class="h-4 w-4" />
      </UiButton>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { Timestamp } from "firebase/firestore";
  import { computed, ref } from "vue";
  import type { Order } from "~/types/models/Order";

  const props = defineProps<{
    orders: (Order & { id: string })[];
    isLoading?: boolean;
  }>();

  const emit = defineEmits<{
    (e: "view-order", orderId: string): void;
    (e: "cancel-order", orderId: string): void;
  }>();

  // Search functionality
  const searchTerm = ref("");

  // Pagination
  const currentPage = ref(1);
  const pageSize = ref(5); // Number of orders per page

  // When search term changes, reset to first page
  watch(searchTerm, () => {
    currentPage.value = 1;
  });

  // Computed property for filtered orders
  const filteredOrders = computed(() => {
    // First filter the orders
    let result = props.orders;

    if (searchTerm.value.trim()) {
      const term = searchTerm.value.toLowerCase().trim();
      result = result.filter((order) => {
        return (
          order.uniqRefNumber?.toLowerCase().includes(term) ||
          order.orderStatus?.toLowerCase().includes(term) ||
          order.paymentStatus?.toLowerCase().includes(term)
        );
      });
    }

    // Then sort by date (newest first)
    return result.sort((a, b) => {
      // Safely handle timestamps for sorting
      const timestampA = a.dateOrdered instanceof Timestamp ? a.dateOrdered : null;
      const timestampB = b.dateOrdered instanceof Timestamp ? b.dateOrdered : null;

      // Convert to milliseconds for comparison or use 0 if not available
      const timeA = timestampA ? timestampA.toMillis() : 0;
      const timeB = timestampB ? timestampB.toMillis() : 0;

      return timeB - timeA; // Descending order (newest first)
    });
  });

  // Pagination computed properties
  const totalPages = computed(() => {
    return Math.max(1, Math.ceil(filteredOrders.value.length / pageSize.value));
  });

  const paginatedOrders = computed(() => {
    const startIndex = (currentPage.value - 1) * pageSize.value;
    const endIndex = startIndex + pageSize.value;
    return filteredOrders.value.slice(startIndex, endIndex);
  });

  // Generate page buttons with ellipsis for large page counts
  const pageButtons = computed(() => {
    const total = totalPages.value;
    const current = currentPage.value;

    // If 7 or fewer pages, show all
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }

    // Always show first, last, and pages around current
    let pages: (number | string)[] = [1]; // Explicitly specify the array can contain both numbers and strings

    // Logic for showing pages with ellipsis
    if (current <= 3) {
      // Near start: show 1,2,3,4,5,...,last
      pages.push(2, 3, 4, 5, "...", total);
    } else if (current >= total - 2) {
      // Near end: show 1,...,last-4,last-3,last-2,last-1,last
      pages.push("...", total - 4, total - 3, total - 2, total - 1, total);
    } else {
      // Middle: show 1,...,current-1,current,current+1,...,last
      pages.push("...", current - 1, current, current + 1, "...", total);
    }

    return pages;
  });

  // Navigation methods
  const goToPage = (page: number | string) => {
    // Only navigate if the page is a number
    if (typeof page === "number") {
      currentPage.value = Math.max(1, Math.min(page, totalPages.value));
      // Scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const getStatusClasses = (status: string): string => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "preparing":
        return "bg-blue-100 text-blue-800";
      case "ready":
        return "bg-amber-100 text-amber-800";
      case "completed":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getPaymentStatusClasses = (status: string): string => {
    switch (status) {
      case "paid":
        return "bg-green-100 text-green-800";
      case "not_paid":
        return "bg-red-100 text-red-800";
      case "partial":
        return "bg-amber-100 text-amber-800";
      case "cancelled":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-red-100 text-red-800"; // Default to not paid
    }
  };

  // Utility function to format date remains the same
  const formatDate = (timestamp: any): string => {
    if (!timestamp || typeof timestamp !== "object" || !timestamp.seconds) {
      return "N/A";
    }

    try {
      const date = new Date(timestamp.seconds * 1000 + (timestamp.nanoseconds || 0) / 1000000);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  // Calculate absolute order index (for numbering)
  const getOrderIndex = (order: Order & { id: string }): number => {
    const index = filteredOrders.value.findIndex((o) => o.id === order.id);
    // Show absolute position in the filtered list (1-based)
    return index + 1;
  };
</script>

<style scoped>
  .fade-enter-active,
  .fade-leave-active {
    transition:
      opacity 0.3s ease,
      transform 0.3s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    opacity: 0;
    transform: translateY(10px);
  }

  .fade-move {
    transition: transform 0.3s ease;
  }
</style>
