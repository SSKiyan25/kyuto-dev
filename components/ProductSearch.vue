<template>
  <div class="relative w-full" ref="searchContainer">
    <div class="flex items-center justify-center">
      <UiVeeInput
        v-model="searchTerm"
        label="Search for products"
        class="w-full"
        inputClass="p-2.5 sm:p-3.5"
        placeholder="Search for products..."
        type="search"
        icon="lucide:search"
        @focus="showResults = true"
      >
        <template #trailingIcon>
          <button
            type="button"
            class="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md border border-transparent text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
          >
            <Icon name="lucide:arrow-right" class="size-4" />
          </button>
        </template>
      </UiVeeInput>
    </div>

    <!-- Search Results Overlay -->
    <div
      v-if="showResults && searchTerm"
      class="absolute left-0 right-0 top-full z-50 mt-2 max-h-60 overflow-y-auto rounded-md border bg-background shadow-lg sm:max-h-96"
    >
      <div v-if="isLoading" class="p-3 text-center text-sm">Searching...</div>
      <div v-else-if="error" class="p-3 text-sm text-red-500">{{ error }}</div>
      <div v-else-if="results.length === 0" class="p-3 text-sm text-muted-foreground">
        No products found
      </div>
      <div v-else>
        <div
          v-for="product in results"
          :key="product.id"
          class="flex cursor-pointer items-center gap-3 p-3 transition-colors hover:bg-accent/50 sm:gap-4 sm:p-4"
          @click="selectProduct(product)"
        >
          <img
            :src="product.featuredPhotoURL || '/placeholder-product.jpg'"
            class="h-10 w-10 rounded-md object-cover sm:h-12 sm:w-12"
          />
          <div>
            <p class="truncate text-sm font-medium sm:text-base">{{ product.name }}</p>
            <p class="text-xs text-muted-foreground sm:text-sm">{{ product.category }}</p>
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
