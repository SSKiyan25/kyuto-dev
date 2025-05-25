<template>
  <div class="relative w-full" ref="searchContainer">
    <div class="flex items-center justify-center">
      <UiVeeInput
        v-model="searchTerm"
        label="Search for products"
        class="w-full"
        inputClass="p-2.5 sm:p-3.5"
        placeholder="Search by product name..."
        type="search"
        icon="lucide:search"
        @focus="showResults = true"
        @keydown.enter="handleSearch"
      >
        <template #trailingIcon>
          <button
            type="button"
            @click="handleSearch"
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
      <!-- Loading indicator - show while typing or searching -->
      <div v-if="isLoading || isTyping" class="p-3 text-center text-sm">
        <div class="flex items-center justify-center gap-2">
          <span
            class="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"
          ></span>
          <span>{{ isTyping ? "Typing..." : "Searching..." }}</span>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="p-3 text-sm text-red-500">{{ error }}</div>

      <!-- Empty results - only show after typing has stopped and search completed -->
      <div
        v-else-if="results.length === 0 && !isTyping && searchTerm.length >= 2"
        class="p-3 text-sm text-muted-foreground"
      >
        No products found matching "<span class="font-medium">{{ searchTerm }}</span
        >"
      </div>

      <!-- Starting to type message -->
      <div v-else-if="searchTerm.length < 2" class="p-3 text-sm text-muted-foreground">
        Type at least 2 characters to search
      </div>

      <!-- Results list -->
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
            alt="Product image"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium sm:text-base">{{ product.name }}</p>
            <p class="text-xs text-muted-foreground sm:text-sm">
              {{ product.category || "Uncategorized" }}
            </p>
          </div>
          <div v-if="product.price !== undefined" class="text-right">
            <p class="text-sm font-semibold text-primary">₱{{ product.price.toFixed(2) }}</p>
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
    price?: number;
    relevanceScore?: number;
  }

  interface SearchProductResult {
    id: string;
    relevanceScore: number;
    name?: string;
    category?: string;
    featuredPhotoURL?: string;
    price?: number;
  }

  const emit = defineEmits(["select"]);
  const router = useRouter();

  const searchTerm = ref("");
  const showResults = ref(false);
  const isLoading = ref(false);
  const isTyping = ref(false);
  const typingTimer = ref<NodeJS.Timeout | null>(null);
  const error = ref<string | null>(null);
  const results = ref<ProductSearchResult[]>([]);
  const searchContainer = ref<HTMLElement | null>(null);

  const { searchProducts } = useProductSearch();

  // Handle search when user clicks search button or presses enter
  const handleSearch = () => {
    if (searchTerm.value.trim()) {
      const product = results.value.length > 0 ? results.value[0] : null;
      if (product) {
        selectProduct(product);
      } else {
        showResults.value = false;
      }
    }
  };

  const performSearch = debounce(async (term: string) => {
    try {
      // Don't search for very short terms
      if (!term.trim() || term.length < 2) {
        results.value = [];
        isLoading.value = false;
        return;
      }

      isLoading.value = true;
      error.value = null;

      const products = (await searchProducts(term)) as SearchProductResult[];
      results.value = products.map((p) => ({
        id: p.id,
        name: p.name || "Unnamed Product",
        category: p.category || "Uncategorized",
        featuredPhotoURL: p.featuredPhotoURL,
        price: p.price,
        relevanceScore: p.relevanceScore,
      }));
    } catch (err) {
      console.error("Search error:", err);
      error.value = "Failed to search products";
      results.value = [];
    } finally {
      isLoading.value = false;
    }
  }, 500); // Increased debounce time for better UX

  const selectProduct = (product: ProductSearchResult) => {
    emit("select", product);
    showResults.value = false;
    searchTerm.value = "";
  };

  onClickOutside(searchContainer, () => {
    showResults.value = false;
  });

  watch(searchTerm, (newVal) => {
    if (newVal) {
      showResults.value = true;

      // Set typing status immediately when the user types
      isTyping.value = true;

      // Clear any existing typing timer
      if (typingTimer.value) {
        clearTimeout(typingTimer.value);
      }

      // Set a timer to clear the typing status after a short delay
      typingTimer.value = setTimeout(() => {
        isTyping.value = false;
      }, 600); // Slightly longer than debounce time
    }

    // Reset results when search is cleared
    if (!newVal.trim()) {
      results.value = [];
    }

    performSearch(newVal);
  });

  // Clear timer on component unmount
  onUnmounted(() => {
    if (typingTimer.value) {
      clearTimeout(typingTimer.value);
    }
  });
</script>
