<template>
  <div
    class="flex flex-col justify-center space-y-8 px-4 pb-16 pt-8 sm:px-8 sm:pt-12 md:px-12 md:pt-16 lg:px-16"
  >
    <!-- Search section -->
    <div class="mx-auto w-full max-w-xl px-2 sm:max-w-full">
      <div class="flex items-center justify-center">
        <UiVeeInput
          v-model="searchTerm"
          label="Search for stores"
          class="w-full"
          inputClass="p-2.5 sm:p-8.5"
          placeholder="Search for organization stores..."
          type="search"
          icon="lucide:search"
          @keyup.enter="handleSearch"
        >
          <!-- Icon will be handled by the component -->
        </UiVeeInput>
      </div>
      <div class="mt-2 text-center text-xs text-gray-500">
        Press <strong>Enter</strong> to search for an organization.
      </div>
      <div v-if="isLoading" class="mt-2 text-center text-sm text-gray-500">
        Searching organizations...
      </div>
    </div>

    <!-- Organization listing section -->
    <div class="flex w-full flex-col space-y-4">
      <div class="flex items-center justify-between border-b-2 pb-2">
        <span class="text-base font-semibold sm:text-lg">Organization Stores</span>
        <UiButton :disabled="isRefreshing" @click="refreshOrganizations" class="text-xs">
          <template #default>
            <span v-if="isRefreshing">Refreshing...</span>
            <span v-else>Refresh</span>
          </template>
        </UiButton>
      </div>

      <div v-if="error" class="p-4 text-red-500">Error: {{ error.message }}</div>

      <div v-else-if="!isLoading && organizations.length === 0" class="p-4 text-center">
        No organizations found
      </div>

      <div v-else class="flex flex-col space-y-6 pt-2">
        <div
          v-for="store in organizations"
          :key="store.id"
          class="group flex flex-col space-y-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md sm:flex-row sm:space-x-4 sm:space-y-0 sm:p-6 md:space-x-8 md:p-8"
        >
          <!-- Store logo - centered on mobile, left-aligned on larger screens -->
          <NuxtLink
            :to="`/stores/${store.id}`"
            class="flex flex-shrink-0 justify-center sm:justify-start"
          >
            <div
              class="relative overflow-hidden rounded-lg transition-transform duration-300 group-hover:scale-[1.02]"
            >
              <img
                :src="store.logoImageURL || '/logo-verch.webp'"
                :alt="store.name"
                class="h-40 w-40 rounded-lg object-cover shadow-sm transition-transform duration-300 sm:h-24 sm:w-24"
              />
              <div
                class="absolute inset-0 bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              ></div>
            </div>
          </NuxtLink>

          <!-- Store details - centered on mobile, left-aligned with full width on larger screens -->
          <div class="flex w-full flex-col space-y-2 text-center sm:text-left">
            <span class="text-lg font-semibold tracking-tight sm:text-xl">{{ store.name }}</span>
            <span v-if="store.description" class="text-sm text-gray-600 sm:text-base">{{
              store.description
            }}</span>
            <span
              v-if="store.address"
              class="flex items-center justify-center text-xs text-gray-500 sm:justify-start sm:text-sm"
            >
              <Icon name="lucide:map-pin" class="mr-1 h-3 w-3 text-gray-400" />
              {{ store.address }}
            </span>

            <!-- Visit store link - centered on mobile, right-aligned on larger screens -->
            <div class="mt-4 flex items-center justify-center sm:mt-auto sm:justify-end">
              <NuxtLink
                :to="`/stores/${store.id}`"
                class="flex items-center space-x-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20 sm:bg-transparent sm:text-blue-600 sm:hover:text-blue-800 sm:hover:underline"
              >
                <span>Visit Store</span>
                <Icon name="lucide:arrow-right" class="h-4 w-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { debounce } from "lodash-es";

  const searchTerm = ref("");
  const isLoading = ref(false);
  const isRefreshing = ref(false);
  const error = ref<Error | null>(null);
  const organizations = ref<
    Array<{
      id: string;
      name: string;
      description?: string;
      address?: string;
      logoImageURL?: string;
    }>
  >([]);

  const { searchOrganizations, clearCache } = useOrganization();

  const isValidSearchTerm = (term: string): boolean => {
    const regex = /^[^<@#`'"%;\\\[\]{}|&$*^~:/?!+=\r\n]*$/;
    return regex.test(term);
  };

  // Debounced search with 300ms delay
  const debouncedSearch = debounce(async (term: string) => {
    if (!isValidSearchTerm(term)) {
      error.value = new Error("Invalid characters in search term.");
      organizations.value = [];

      // Reset error and reload default organizations after 3-5 seconds
      setTimeout(async () => {
        error.value = null;
        clearCache();
        const defaultResults = await searchOrganizations("");
        organizations.value = defaultResults.map((org) => ({
          id: org.id,
          name: org.name || "",
          description: org.description,
          address: org.address,
          logoImageURL: org.logoImageURL,
        }));
      }, 3000);

      return;
    }

    try {
      isLoading.value = true;
      const results = await searchOrganizations(term);
      organizations.value = results.map((org) => ({
        id: org.id,
        name: org.name || "",
        description: org.description,
        address: org.address,
        logoImageURL: org.logoImageURL,
      }));
    } catch (err) {
      error.value = err as Error;
      organizations.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 300);

  const handleSearch = () => {
    debouncedSearch(searchTerm.value);
  };

  // Refresh organizations
  const refreshOrganizations = async () => {
    if (isRefreshing.value) return; // Prevent spamming
    isRefreshing.value = true;

    try {
      clearCache(); // Clear cache before refreshing
      isLoading.value = true;
      const refreshedResults = await searchOrganizations("");
      organizations.value = refreshedResults.map((org) => ({
        id: org.id,
        name: org.name || "",
        description: org.description,
        address: org.address,
        logoImageURL: org.logoImageURL,
      }));
    } catch (err) {
      error.value = err as Error;
    } finally {
      isRefreshing.value = false;
      isLoading.value = false;
    }
  };

  // Initial load
  onMounted(async () => {
    try {
      isLoading.value = true;
      const initialResults = await searchOrganizations("");
      organizations.value = initialResults.map((org) => ({
        id: org.id,
        name: org.name || "",
        description: org.description,
        address: org.address,
        logoImageURL: org.logoImageURL,
      }));
    } catch (err) {
      error.value = err as Error;
    } finally {
      isLoading.value = false;
    }
  });
</script>
