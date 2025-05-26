<template>
  <div
    class="flex flex-col justify-center space-y-6 p-4 sm:space-y-8 sm:p-8 md:space-y-12 md:p-12 lg:p-16"
  >
    <!-- Header section with description -->
    <div class="mb-2 mt-8 flex w-full flex-col items-center justify-center space-y-2 sm:space-y-3">
      <h2 class="text-xl font-bold uppercase sm:text-4xl">All Products</h2>
      <p class="max-w-4xl text-center text-sm text-muted-foreground sm:text-base">
        Explore our wide range of official merchandise. Find the perfect items for yourself or as
        gifts.
      </p>
    </div>

    <!-- Product Search -->
    <ProductSearch @select="handleProductSelect" class="mx-auto w-full max-w-full" />

    <!-- Products section -->
    <div class="flex flex-col space-y-4">
      <!-- Filter bar - sleek horizontal design -->
      <div class="flex flex-col space-y-4 rounded-lg border bg-card p-4 shadow-sm">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <!-- Category chips - horizontally scrollable on mobile -->
          <div class="-mx-2 overflow-x-auto px-2 pb-2">
            <div class="flex flex-row items-center space-x-2">
              <div v-for="(show, index) in showAs" :key="index">
                <button
                  @click="toggleActive(index)"
                  :class="[
                    'whitespace-nowrap rounded-full px-4 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                    show.isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-secondary/30 hover:bg-secondary/50',
                  ]"
                >
                  {{ show.value }}
                </button>
              </div>
            </div>
          </div>

          <!-- Filter buttons group -->
          <div class="flex flex-wrap items-center gap-2">
            <!-- Category filter -->
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton variant="outline" size="sm" class="text-xs sm:text-sm">
                  Categories
                  <Icon name="lucide:chevron-down" class="ml-1.5 h-3.5 w-3.5" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-56">
                <UiDropdownMenuLabel label="Product Categories" />
                <UiDropdownMenuSeparator />
                <div class="max-h-[240px] overflow-y-auto py-1">
                  <template v-for="c in filterCategories" :key="c.key">
                    <UiDropdownMenuCheckboxItem
                      :checked="selectedCategories.includes(c.key)"
                      @select="(e: any) => e.preventDefault()"
                      @update:checked="
                        selectedCategories.includes(c.key)
                          ? selectedCategories.splice(selectedCategories.indexOf(c.key), 1)
                          : selectedCategories.push(c.key)
                      "
                    >
                      <div class="flex items-center gap-2">
                        <span>{{ c.title }}</span>
                      </div>
                    </UiDropdownMenuCheckboxItem>
                  </template>
                </div>
                <UiDropdownMenuSeparator />
                <div class="flex items-center justify-between p-2">
                  <UiButton
                    variant="ghost"
                    size="sm"
                    class="text-xs"
                    @click="selectedCategories = []"
                  >
                    Clear All
                  </UiButton>
                </div>
              </UiDropdownMenuContent>
            </UiDropdownMenu>

            <!-- Price sort -->
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton variant="outline" size="sm" class="text-xs sm:text-sm">
                  <span>{{
                    sortPrice === "none"
                      ? "Price"
                      : sortPrice === "lowest"
                        ? "Price: Low to High"
                        : "Price: High to Low"
                  }}</span>
                  <Icon name="lucide:chevron-down" class="ml-1.5 h-3.5 w-3.5" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-40">
                <UiDropdownMenuLabel label="Sort by Price" />
                <UiDropdownMenuSeparator />
                <UiDropdownMenuRadioGroup v-model="sortPrice">
                  <UiDropdownMenuRadioItem value="none" title="Default" text-value="none" />
                  <UiDropdownMenuRadioItem value="lowest" title="Low to High" text-value="lowest" />
                  <UiDropdownMenuRadioItem
                    value="highest"
                    title="High to Low"
                    text-value="highest"
                  />
                </UiDropdownMenuRadioGroup>
              </UiDropdownMenuContent>
            </UiDropdownMenu>

            <!-- Apply filters button -->
            <UiButton
              @click="applyFilters"
              size="sm"
              variant="default"
              class="text-xs sm:text-sm"
              :disabled="loadingProducts"
            >
              <Icon name="lucide:filter" class="mr-1.5 h-3.5 w-3.5" />
              <span class="hidden sm:inline">Apply Filters</span>
              <span class="inline sm:hidden">Apply</span>
            </UiButton>

            <!-- Refresh button -->
            <UiButton @click="refreshProducts" variant="ghost" size="icon" class="h-7 w-7">
              <Icon
                :class="{ 'animate-spin': loadingProducts }"
                name="lucide:refresh-cw"
                class="h-3 w-3"
              />
              <span class="sr-only">Refresh</span>
            </UiButton>
          </div>
        </div>

        <!-- Active filters display -->
        <div v-if="selectedCategories.length > 0" class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-muted-foreground">Active filters:</span>
          <div v-for="key in selectedCategories" :key="key" class="flex items-center">
            <span
              class="inline-flex items-center rounded-full bg-secondary/20 px-2.5 py-0.5 text-xs"
            >
              {{ filterCategories.find((c) => c.key === key)?.title }}
              <button
                @click="removeCategory(key)"
                class="ml-1 text-muted-foreground hover:text-foreground"
              >
                <Icon name="lucide:x" class="h-3 w-3" />
              </button>
            </span>
          </div>
          <button
            @click="clearFilters"
            class="text-xs text-primary hover:text-primary/80 hover:underline"
          >
            Clear all
          </button>
        </div>
      </div>

      <!-- Products Grid -->
      <div class="py-4">
        <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <template v-if="loadingProducts">
            <div v-for="i in 10" :key="i" class="flex flex-col items-center">
              <div class="flex h-full w-full flex-col rounded-lg border p-3">
                <div class="aspect-square w-full overflow-hidden rounded-md bg-secondary/20">
                  <UiSkeleton loading class="h-full w-full" />
                </div>
                <div class="flex w-full flex-col items-start pt-3">
                  <UiSkeleton loading class="h-4 w-24 rounded-sm" />
                  <UiSkeleton loading class="mt-2 h-5 w-32 rounded-sm" />
                  <UiSkeleton loading class="mt-2 h-4 w-16 rounded-sm" />
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="(product, i) in products" :key="i" class="flex h-full">
              <NuxtLink
                :to="`/product/${product.id}`"
                @click="handleProductClick(product.id)"
                class="h-full w-full"
              >
                <div
                  class="flex h-full w-full flex-col rounded-lg border bg-card p-3 transition-all duration-200 hover:shadow-md"
                >
                  <div class="aspect-square w-full overflow-hidden rounded-md bg-secondary/5">
                    <img
                      :src="product.featuredPhotoURL || '/placeholder-product.jpg'"
                      :alt="product.name"
                      class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <div class="flex w-full flex-col items-start pt-3">
                    <p class="line-clamp-2 text-sm font-medium sm:text-base">
                      {{ product.name }}
                    </p>
                    <p class="mt-1 text-sm font-semibold text-primary">
                      ₱{{ calculatePriceWithCommission(product.price).toFixed(2) }}
                    </p>
                    <div
                      class="mt-auto flex w-full flex-row justify-between pt-2 text-xs text-muted-foreground"
                    >
                      <span>{{ productViewCounts[product.id] || 0 }} views</span>
                      <span>{{ product.totalSales || 0 }} sold</span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <template v-if="products.length === 0">
              <div class="col-span-full flex h-40 flex-col items-center justify-center">
                <Icon name="lucide:package-x" class="mb-2 h-10 w-10 text-muted-foreground" />
                <p class="text-sm text-muted-foreground">No products found</p>
                <p v-if="selectedCategories.length > 0" class="mt-1 text-xs text-muted-foreground">
                  Try adjusting your filters
                </p>
              </div>
            </template>
          </template>
        </div>

        <!-- Pagination -->
        <div class="mt-8 flex items-center justify-center space-x-2">
          <UiButton
            :disabled="currentPage === 1"
            @click="prevPage"
            variant="outline"
            size="sm"
            class="flex items-center gap-1"
          >
            <Icon name="lucide:chevron-left" class="h-4 w-4" />
            <span>Previous</span>
          </UiButton>

          <div class="text-sm">Page {{ currentPage }} of {{ totalPages || 1 }}</div>

          <UiButton
            :disabled="currentPage === totalPages"
            @click="nextPage"
            variant="outline"
            size="sm"
            class="flex items-center gap-1"
          >
            <span>Next</span>
            <Icon name="lucide:chevron-right" class="h-4 w-4" />
          </UiButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAddProductViews } from "~/composables/useAddProductViews";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { useViewProducts } from "~/composables/useViewProducts";
  import type { ProductSearchResult } from "~/types/models/Product";

  const { products, loading, fetchProducts, clearCache } = useViewProducts();
  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  const { addView, countViews } = useAddProductViews();

  const currentPage = ref(1);
  const totalPages = ref(1);
  const itemsPerPage = 10;
  const loadingProducts = ref(false);
  const productViewCounts = reactive<Record<string, number>>({});

  const handleProductSelect = (product: ProductSearchResult) => {
    // Handle navigation or other actions
    navigateTo(`/product/${product.id}`);
  };

  const handleProductClick = (productID: string) => {
    // console.log("Product clicked:", productID);
    addView(productID);
  };

  const removeCategory = (key: string) => {
    const index = selectedCategories.value.indexOf(key);
    if (index !== -1) {
      selectedCategories.value.splice(index, 1);
    }
  };

  const clearFilters = () => {
    selectedCategories.value = [];
    applyFilters();
  };

  const fetchProductViewCounts = async () => {
    // console.log("Fetching product view counts...");

    if (!products.value || products.value.length === 0) {
      console.log("No products found to fetch view counts.");
      return;
    }

    for (const product of products.value) {
      const viewCount = await countViews(product.id);
      productViewCounts[product.id] = viewCount;
      // console.log(`Product ID: ${product.id}, View Count: ${viewCount}`);
    }
  };

  const getFilterParams = () => {
    const activeFilter = showAs.value.find((item) => item.isActive);
    const sortBy = activeFilter ? activeFilter.name : "all";
    const selectedCategoryTitles = selectedCategories.value
      .map((key) => {
        const category = filterCategories.find((c) => c.key === key);
        return category ? category.title : "";
      })
      .filter((title) => title !== "");

    return {
      sortBy,
      selectedCategoryTitles,
      sortPrice: sortPrice.value,
    };
  };

  const updateProducts = async () => {
    loadingProducts.value = true;
    // console.log("Current Page in script:", currentPage.value);
    const activeFilter = showAs.value.find((item) => item.isActive);
    const sortBy = activeFilter ? activeFilter.name : "all";
    const selectedCategoryTitles = selectedCategories.value
      .map((key) => {
        const category = filterCategories.find((c) => c.key === key);
        return category ? category.title : "";
      })
      .filter((title) => title !== "");
    const { totalProducts } = await fetchProducts(
      sortBy,
      selectedCategoryTitles,
      sortPrice.value,
      itemsPerPage,
      currentPage.value
    );
    totalPages.value = Math.ceil(totalProducts / 10);
    await fetchProductViewCounts();
    // console.log("Total Pages in script:", totalPages.value);
    loadingProducts.value = false;
  };

  onMounted(async () => {
    await updateProducts();
    await fetchCommissionRate();
  });

  const refreshProducts = async () => {
    if (loadingProducts.value) return;

    loadingProducts.value = true;
    try {
      clearCache();
      currentPage.value = 1;

      // Get the current filter settings
      const { sortBy, selectedCategoryTitles, sortPrice } = getFilterParams();

      // Call fetchProducts with all required arguments
      await fetchProducts(
        sortBy,
        selectedCategoryTitles,
        sortPrice,
        itemsPerPage,
        currentPage.value
      );

      await fetchProductViewCounts();
    } catch (error) {
      console.error("Error refreshing products:", error);
    } finally {
      loadingProducts.value = false;
    }
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      // console.log("Current Page:", currentPage.value);
      currentPage.value++;
      updateProducts();
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      // console.log("Current Page:", currentPage.value);
      currentPage.value--;
      updateProducts();
    }
  };

  const showAs = ref<{ value: string; isActive: boolean; name: string }[]>([
    { value: "All", isActive: true, name: "all" },
    { value: "New", isActive: false, name: "new" },
    { value: "Popular", isActive: false, name: "popular" },
    { value: "Top-Sales", isActive: false, name: "top-sales" },
  ]);

  const filterCategories = [
    { key: "1", title: "T-shirt" },
    { key: "2", title: "Polo-Shirt" },
    { key: "3", title: "Hoodie" },
    { key: "4", title: "Lanyard" },
    { key: "5", title: "Sticker" },
    { key: "6", title: "Umbrella" },
    { key: "7", title: "Totebag" },
    { key: "8", title: "Fan" },
    { key: "9", title: "Mug" },
    { key: "10", title: "Others" },
  ];

  const selectedCategories = ref<string[]>([]);
  const sortPrice = ref<string>("none");

  const toggleActive = (index: number) => {
    showAs.value.forEach((item, i) => {
      item.isActive = i === index;
    });
    applyFilters();
  };

  const showFilterCommands = ref(false);

  const toggleFilterCommands = () => {
    showFilterCommands.value = !showFilterCommands.value;
  };

  const applyFilters = () => {
    clearCache();
    currentPage.value = 1;
    updateProducts();
  };
</script>

<style scoped>
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.5s ease;
  }
  .slide-fade-enter,
  .slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
  }
  .slide-fade-enter-to,
  .slide-fade-leave {
    transform: translateY(0);
    opacity: 1;
  }
</style>
