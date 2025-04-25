<template>
  <div class="flex flex-col justify-center space-y-12 px-16 pb-32 pt-16">
    <div>
      <div class="flex items-center justify-center">
        <UiVeeInput
          v-model="searchTerm"
          label="Search for stores"
          class="peer p-6 pe-9"
          placeholder="Search..."
          type="search"
          icon="lucide:search"
          @keyup.enter="handleSearch"
        >
          <!-- Keep trailing icon button -->
        </UiVeeInput>
      </div>
      <div class="mt-2 text-center text-xs text-gray-500">
        Press <strong>Enter</strong> to search for an organization.
      </div>
      <div v-if="isLoading" class="mt-2 text-center text-sm text-gray-500">
        Searching organizations...
      </div>
    </div>

    <div class="flex flex-col space-y-4">
      <div class="flex items-center justify-between border-b-2">
        <span class="text-lg font-semibold">Organization Stores</span>
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

      <div v-else class="flex flex-col space-y-4 pt-4">
        <div
          v-for="store in organizations"
          :key="store.id"
          class="flex flex-row space-x-8 rounded-md border p-8"
        >
          <div class="flex-shrink-0">
            <img
              :src="store.logoImageURL || '/logo-verch.webp'"
              :alt="store.name"
              class="h-24 w-24 rounded-md"
            />
          </div>
          <div class="flex w-full flex-col space-y-1">
            <span class="text-lg font-semibold">{{ store.name }}</span>
            <span class="text-sm">{{ store.description }}</span>
            <span class="text-sm">{{ store.address }}</span>
            <div
              class="flex items-center justify-end space-x-2 hover:text-blue-600 hover:underline"
            >
              <NuxtLink :to="`/stores/${store.id}`" class="flex items-center space-x-2">
                <span>Visit Store</span>
                <Icon name="lucide:square-arrow-out-up-right" class="size-4" />
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
