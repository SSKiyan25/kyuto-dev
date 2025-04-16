<!-- components/ProductSearch.vue -->
<template>
  <div class="relative" ref="searchContainer">
    <div class="flex items-center justify-center">
      <UiVeeInput
        v-model="searchTerm"
        label="Search for products"
        class="peer p-6 pe-9"
        placeholder="Search..."
        type="search"
        icon="lucide:search"
        @focus="showResults = true"
      >
        <template #trailingIcon>
          <button
            type="button"
            class="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md border border-transparent text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Icon name="lucide:arrow-right" class="size-4" />
          </button>
        </template>
      </UiVeeInput>
    </div>

    <!-- Search Results Overlay -->
    <div
      v-if="showResults && searchTerm"
      class="absolute left-0 right-0 top-full z-50 mt-2 max-h-96 overflow-y-auto rounded-md border bg-background shadow-lg"
    >
      <div v-if="isLoading" class="p-4 text-center text-sm">Searching...</div>
      <div v-else-if="error" class="p-4 text-sm text-red-500">{{ error }}</div>
      <div v-else-if="results.length === 0" class="p-4 text-sm text-muted-foreground">
        No products found
      </div>
      <div v-else>
        <div
          v-for="product in results"
          :key="product.id"
          class="flex cursor-pointer items-center gap-4 p-4 transition-colors hover:bg-accent/50"
          @click="selectProduct(product)"
        >
          <img
            :src="product.featuredPhotoURL || '/placeholder-product.jpg'"
            class="h-12 w-12 rounded-md object-cover"
          />
          <div>
            <p class="font-medium">{{ product.name }}</p>
            <p class="text-sm text-muted-foreground">{{ product.category }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { debounce } from "lodash-es";

  interface ProductSearchResult {
    id: string;
    name: string;
    category?: string;
    featuredPhotoURL?: string;
  }

  const emit = defineEmits(["select"]);

  const searchTerm = ref("");
  const showResults = ref(false);
  const isLoading = ref(false);
  const error = ref<string | null>(null);
  const results = ref<ProductSearchResult[]>([]);
  const searchContainer = ref<HTMLElement | null>(null);

  const { searchProducts } = useProductSearch();

  const performSearch = debounce(async (term: string) => {
    try {
      isLoading.value = true;
      error.value = null;

      if (!term.trim()) {
        results.value = [];
        return;
      }

      const products = await searchProducts(term);
      results.value = products.map((p) => ({
        id: p.id,
        name: (p as ProductSearchResult).name,
        category: (p as ProductSearchResult).category,
        featuredPhotoURL: (p as ProductSearchResult).featuredPhotoURL,
      }));
    } catch (err) {
      error.value = "Failed to search products";
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 300);

  const selectProduct = (product: ProductSearchResult) => {
    emit("select", product);
    showResults.value = false;
    searchTerm.value = "";
  };

  onClickOutside(searchContainer, () => {
    showResults.value = false;
  });

  watch(searchTerm, (newVal) => {
    if (newVal) showResults.value = true;
    performSearch(newVal);
  });
</script>
