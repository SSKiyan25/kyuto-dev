<template>
  <div class="flex min-h-screen flex-col">
    <UiContainer class="relative flex flex-col items-center py-12 text-center lg:py-24">
      <!-- Animated badge -->
      <div class="relative">
        <UiBadge
          to="/products"
          variant="outline"
          class="group relative px-3 py-1.5 text-sm font-medium transition-all duration-300 hover:bg-primary/10 lg:py-2"
        >
          <span class="mr-1 animate-pulse text-primary">●</span>
          New Arrivals! Check out our latest collection
          <Icon
            class="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-y-1"
            name="lucide:arrow-down"
          />
        </UiBadge>
      </div>

      <!-- Improved heading with gradient text -->
      <h1
        class="mb-4 mt-7 text-3xl font-bold tracking-tight sm:mb-6 sm:mt-6 sm:text-5xl lg:text-center xl:text-6xl"
      >
        <span class="block">Official VSU Merchandise Collection</span>
        <span
          class="mt-2 block bg-gradient-to-r from-primary to-emerald-600 bg-clip-text text-transparent"
        >
          Proudly Represent Your School
        </span>
      </h1>

      <!-- Enhanced description with better typography and emphasis -->
      <p
        class="mx-auto max-w-[760px] text-sm leading-relaxed text-muted-foreground sm:text-xl lg:text-center"
      >
        Discover premium
        <span class="font-medium text-foreground">VSU-branded apparel and accessories</span>. From
        stylish t-shirts and hoodies to practical lanyards and stickers — show your
        <span class="font-medium text-primary">school spirit</span> with our official merchandise.
      </p>

      <!-- Call to action buttons -->
      <div class="mt-8 flex flex-col space-y-3 sm:flex-row sm:space-x-4 sm:space-y-0">
        <UiButton size="lg" class="group px-6" to="/products">
          Shop Now
          <Icon
            name="lucide:arrow-right"
            class="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
          />
        </UiButton>
        <UiButton variant="outline" size="lg" class="px-6" to="/stores"> Browse Stores </UiButton>
      </div>

      <!-- Trust badges (optional) -->
      <div
        class="mt-10 flex flex-row flex-wrap items-center justify-center gap-6 text-muted-foreground"
      >
        <div class="flex items-center">
          <Icon name="lucide:credit-card" class="mr-2 h-4 w-4" />
          <span class="text-xs sm:text-sm">Gcash Payment</span>
        </div>
        <div class="flex items-center">
          <Icon name="lucide:shield-check" class="mr-2 h-4 w-4" />
          <span class="text-xs sm:text-sm">Official Products</span>
        </div>
        <div class="flex items-center">
          <Icon name="lucide:star" class="mr-2 h-4 w-4" />
          <span class="text-xs sm:text-sm">Top Quality</span>
        </div>
      </div>
    </UiContainer>

    <ClientOnly>
      <UiGradientDivider class="sm:my-5" />
    </ClientOnly>
    <!-- Products -->

    <div class="mx-auto mb-20 flex w-11/12 flex-col pt-4 sm:pt-8">
      <div class="mb-4 flex w-full flex-col items-center justify-center space-y-2 sm:space-y-2">
        <h2 class="text-lg font-semibold sm:text-xl">Browse Our Collection</h2>
        <p class="text-center text-sm text-muted-foreground">
          Explore our wide range of official VSU merchandise. Click on any product to view more
          details.
        </p>
      </div>

      <!-- Filter bar -->
      <div class="mb-4 flex w-full flex-col space-y-3 sm:space-y-4">
        <!-- Primary filter controls - shared across both mobile and desktop -->
        <div
          class="flex w-full flex-col rounded-md bg-primary/90 p-4 text-primary-foreground shadow sm:flex-row sm:items-center sm:justify-between"
        >
          <!-- View options (All, New, Popular, etc.) -->
          <div class="flex flex-wrap items-center gap-2 sm:gap-3">
            <div v-for="(show, index) in showAs" :key="index">
              <button
                @click="toggleActive(index)"
                :class="[
                  'flex items-center rounded-md px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm',
                  show.isActive
                    ? 'bg-secondary text-secondary-foreground shadow-sm'
                    : 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20',
                ]"
              >
                {{ show.value }}
              </button>
            </div>
          </div>

          <!-- Action buttons - desktop only -->
          <div class="mt-3 hidden items-center space-x-2 sm:mt-0 sm:flex">
            <UiButton
              @click="toggleFilterCommands"
              variant="secondary"
              size="sm"
              class="flex items-center justify-center gap-1.5 py-1.5"
            >
              <span>Filters</span>
              <Icon name="lucide:filter" class="h-4 w-4" />
              <span
                v-if="selectedCategories.length > 0"
                class="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground"
              >
                {{ selectedCategories.length }}
              </span>
            </UiButton>

            <UiButton
              @click="refreshProducts"
              variant="ghost"
              size="icon"
              class="h-9 w-9 text-white"
              title="Refresh Products"
            >
              <Icon
                :class="{ 'animate-spin': loadingProducts }"
                name="lucide:refresh-cw"
                class="h-4 w-4"
              />
            </UiButton>
          </div>

          <!-- Mobile action buttons row -->
          <div class="mt-3 flex w-full items-center justify-between space-x-2 sm:mt-0 sm:hidden">
            <UiButton
              @click="refreshProducts"
              variant="ghost"
              size="sm"
              class="h-9 text-white"
              title="Refresh Products"
            >
              <Icon
                :class="{ 'animate-spin': loadingProducts }"
                name="lucide:refresh-cw"
                class="mr-1 h-4 w-4"
              />
              <span>Refresh</span>
            </UiButton>

            <div class="flex items-center space-x-2">
              <UiButton variant="secondary" size="xs" class="text-xs" @click="resetFilters">
                Reset
              </UiButton>
              <UiButton variant="secondary" size="xs" class="text-xs" @click="applyFilters">
                Apply
              </UiButton>
            </div>
          </div>
        </div>

        <!-- Mobile filter section - always visible on mobile, hidden on desktop -->
        <div class="block rounded-md border bg-card p-4 shadow-sm sm:hidden">
          <div class="mb-4 flex items-center justify-between">
            <h3 class="text-sm font-medium">Filters</h3>
            <span class="text-xs text-muted-foreground">
              {{
                selectedCategories.length > 0
                  ? `${selectedCategories.length} selected`
                  : "No filters"
              }}
            </span>
          </div>

          <!-- Mobile Category Filter -->
          <div class="mb-4">
            <h4 class="mb-2 text-xs font-medium text-muted-foreground">Categories</h4>
            <div class="flex flex-wrap gap-2">
              <button
                v-for="c in filterCategories"
                :key="c.key"
                @click="toggleCategory(c.key)"
                :class="[
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  selectedCategories.includes(c.key)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
                ]"
              >
                {{ c.title }}
              </button>
            </div>
          </div>

          <!-- Mobile Price Sort -->
          <div class="mb-2">
            <h4 class="mb-2 text-xs font-medium text-muted-foreground">Price Order</h4>
            <div class="flex gap-2">
              <button
                v-for="option in [
                  { value: 'none', label: 'Default' },
                  { value: 'lowest', label: 'Low to High' },
                  { value: 'highest', label: 'High to Low' },
                ]"
                :key="option.value"
                @click="sortPrice = option.value"
                :class="[
                  'rounded-full px-3 py-1 text-xs transition-colors',
                  sortPrice === option.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary/70',
                ]"
              >
                {{ option.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Desktop expanded filter panel -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="transform -translate-y-2 opacity-0"
          enter-to-class="transform translate-y-0 opacity-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="transform translate-y-0 opacity-100"
          leave-to-class="transform -translate-y-2 opacity-0"
        >
          <div
            v-if="showFilterCommands"
            class="hidden rounded-md border bg-card p-4 shadow-sm sm:block"
          >
            <div class="flex flex-col space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0">
              <!-- Filter Category -->
              <div class="flex flex-col space-y-2">
                <h3 class="text-sm font-medium">Categories</h3>
                <UiDropdownMenu>
                  <UiDropdownMenuTrigger as-child>
                    <UiButton variant="outline" class="w-full justify-between text-sm sm:w-auto">
                      <span>{{
                        selectedCategories.length > 0
                          ? `${selectedCategories.length} selected`
                          : "Select categories"
                      }}</span>
                      <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
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
                          @update:checked="toggleCategory(c.key)"
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
              </div>

              <!-- Sort by Price -->
              <div class="flex flex-col space-y-2">
                <h3 class="text-sm font-medium">Price Order</h3>
                <UiDropdownMenu>
                  <UiDropdownMenuTrigger as-child>
                    <UiButton variant="outline" class="w-full justify-between text-sm sm:w-auto">
                      <span>{{
                        sortPrice === "none"
                          ? "Sort by price"
                          : sortPrice === "lowest"
                            ? "Price: Low to High"
                            : "Price: High to Low"
                      }}</span>
                      <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
                    </UiButton>
                  </UiDropdownMenuTrigger>
                  <UiDropdownMenuContent class="w-48">
                    <UiDropdownMenuRadioGroup v-model="sortPrice">
                      <UiDropdownMenuRadioItem
                        value="none"
                        title="Default order"
                        text-value="none"
                      />
                      <UiDropdownMenuRadioItem
                        value="lowest"
                        title="Price: Low to High"
                        text-value="lowest"
                      />
                      <UiDropdownMenuRadioItem
                        value="highest"
                        title="Price: High to Low"
                        text-value="highest"
                      />
                    </UiDropdownMenuRadioGroup>
                  </UiDropdownMenuContent>
                </UiDropdownMenu>
              </div>

              <!-- Apply/Reset buttons -->
              <div class="flex items-end space-x-2 sm:ml-auto">
                <UiButton variant="outline" size="sm" @click="resetFilters" class="text-sm">
                  Reset
                </UiButton>
                <UiButton variant="default" size="sm" class="text-sm" @click="applyFilters">
                  Apply Filters
                </UiButton>
              </div>
            </div>
          </div>
        </transition>
      </div>

      <!-- Products Container -->
      <div class="flex-grow">
        <div
          class="mt-4 flex flex-row flex-wrap justify-center gap-1 sm:mt-6 sm:justify-start sm:gap-3 sm:px-9"
        >
          <template v-if="loadingProducts">
            <div v-for="i in 5" :key="i" class="flex flex-col items-center space-x-4">
              <div
                class="flex max-h-[32rem] max-w-[16rem] flex-col rounded-md border border-secondary p-2 sm:max-h-[40rem] sm:max-w-[24rem]"
              >
                <div class="flex justify-center border-b p-2">
                  <div class="h-32 w-32 overflow-hidden sm:h-52 sm:w-52">
                    <UiSkeleton loading class="h-full w-full rounded-sm" />
                  </div>
                </div>
                <div class="flex w-full flex-col items-start pt-1">
                  <UiSkeleton loading class="h-4 w-24 rounded-sm" />
                  <UiSkeleton loading class="mt-2 h-6 w-32 rounded-sm" />
                  <UiSkeleton loading class="mt-1 h-4 w-16 rounded-sm" />
                </div>
              </div>
            </div>
          </template>
          <template v-else>
            <div v-for="(product, i) in products" :key="i">
              <NuxtLink :to="`/product/${product.id}`" @click="handleProductClick(product.id)">
                <div
                  class="flex max-h-[32rem] max-w-[16rem] flex-col rounded-sm border p-2 hover:shadow-lg sm:max-h-[40rem] sm:max-w-[24rem]"
                >
                  <div class="flex justify-center border-b p-2">
                    <div class="h-32 w-32 overflow-hidden sm:h-52 sm:w-52">
                      <img
                        :src="product.featuredPhotoURL"
                        :alt="product.name"
                        class="h-full w-full transform object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                      />
                    </div>
                  </div>
                  <div class="flex w-full flex-col items-start pt-1">
                    <span class="text-[12px] text-muted-foreground sm:text-sm"
                      >₱{{ calculatePriceWithCommission(product.price).toFixed(2) }}</span
                    >
                    <p class="w-full truncate pt-2 text-[12px] font-semibold sm:text-sm">
                      {{ product.name }}
                    </p>
                    <div
                      class="flex w-full flex-row justify-between pt-4 text-[10px] opacity-50 sm:text-[12px]"
                    >
                      <span>{{ productViewCounts[product.id] || 0 }} views</span>
                      <span>{{ product.totalSales }} sales</span>
                    </div>
                  </div>
                </div>
              </NuxtLink>
            </div>
            <template v-if="products.length === 0">
              <div class="flex h-32 w-full flex-col items-center justify-center">
                <p>No Available Products.</p>
              </div>
            </template>
          </template>
          <div class="mt-8 flex w-full items-center justify-center gap-4">
            <UiButton
              :disabled="currentPage === 1"
              @click="prevPage"
              variant="outline"
              class="flex items-center gap-2 px-4 py-2 transition-all duration-200 hover:bg-secondary/20"
              :class="{ 'cursor-not-allowed opacity-50': currentPage === 1 }"
            >
              <Icon :name="prevIcon" class="h-4 w-4" />
              <span class="text-sm font-medium">Previous</span>
            </UiButton>

            <div class="flex items-center text-sm">
              <span class="font-medium text-foreground">{{ currentPage }}</span>
              <span class="mx-2 text-muted-foreground">/</span>
              <span class="text-muted-foreground">{{ totalPages || 1 }}</span>
            </div>

            <UiButton
              :disabled="currentPage === totalPages"
              @click="nextPage"
              variant="outline"
              class="flex items-center gap-2 px-4 py-2 transition-all duration-200 hover:bg-secondary/20"
              :class="{ 'cursor-not-allowed opacity-50': currentPage === totalPages }"
            >
              <span class="text-sm font-medium">Next</span>
              <Icon :name="nextIcon" class="h-4 w-4" />
            </UiButton>
          </div>
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
  import type { Account as User } from "~/types/models/Account";

  const { products, fetchProducts, clearCache } = useViewProducts();
  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  const { addView, countViews } = useAddProductViews();

  const currentPage = ref(1);
  const totalPages = ref(1);

  const prevIcon = "lucide:chevron-left";
  const nextIcon = "lucide:chevron-right";
  const loadingProducts = ref(false);
  const productViewCounts = reactive<Record<string, number>>({});

  const handleProductClick = (productID: string) => {
    // console.log("Product clicked:", productID);
    addView(productID);
  };

  const fetchProductViewCounts = async () => {
    // console.log("Fetching product view counts...");
    if (!products.value || products.value.length === 0) {
      // console.log("No products found to fetch view counts.");
      return;
    }

    for (const product of products.value) {
      const viewCount = await countViews(product.id);
      productViewCounts[product.id] = viewCount;
      // console.log(`Product ID: ${product.id}, View Count: ${viewCount}`);
    }
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
      10,
      currentPage.value
    );
    totalPages.value = Math.ceil(totalProducts / 10);
    // console.log("Total Pages in script:", totalPages.value);
    loadingProducts.value = false;
  };

  onMounted(async () => {
    await updateProducts();
    await fetchProductViewCounts();
    await fetchCommissionRate();
  });

  const refreshProducts = async () => {
    if (loadingProducts.value) return;

    loadingProducts.value = true;
    try {
      clearCache();
      await fetchProducts();
    } catch (error) {
      console.error("Error refreshing products:", error);
    } finally {
      loadingProducts.value = false;
    }
  };

  const toggleCategory = (key: string) => {
    if (selectedCategories.value.includes(key)) {
      selectedCategories.value.splice(selectedCategories.value.indexOf(key), 1);
    } else {
      selectedCategories.value.push(key);
    }
  };

  const nextPage = () => {
    if (currentPage.value < totalPages.value) {
      console.log("Current Page:", currentPage.value);
      currentPage.value++;
      updateProducts();
    }
  };

  const prevPage = () => {
    if (currentPage.value > 1) {
      console.log("Current Page:", currentPage.value);
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

  const resetFilters = () => {
    selectedCategories.value = [];
    sortPrice.value = "none";
    showAs.value.forEach((item, i) => {
      item.isActive = i === 0; // Set "All" to active
    });
    applyFilters();
  };

  watch([selectedCategories, sortPrice, showAs], applyFilters);
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
