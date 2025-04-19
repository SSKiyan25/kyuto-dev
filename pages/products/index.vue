<template>
  <div class="flex flex-col justify-center space-y-12 p-16">
    <ProductSearch @select="handleProductSelect" />
    <div class="flex flex-col space-y-4">
      <div class="border-b-2">
        <span class="text-lg font-semibold">Products</span>
      </div>
      <!-- Products -->
      <div class="mx-auto mb-24 flex min-h-lvh w-full flex-col">
        <div
          class="flex w-full flex-row flex-wrap items-center justify-between rounded-md bg-primary/90 p-4 text-primary-foreground shadow"
        >
          <div class="flex flex-row items-start justify-start gap-1.5 sm:gap-2">
            <div class="" v-for="(show, index) in showAs" :key="index">
              <button
                @click="toggleActive(index)"
                :class="[
                  'flex flex-row rounded-sm p-1 text-[11px] font-medium uppercase tracking-wider sm:p-2 sm:text-sm',
                  show.isActive
                    ? 'bg-secondary text-secondary-foreground'
                    : 'border text-primary-foreground opacity-90',
                ]"
              >
                {{ show.value }}
              </button>
            </div>
          </div>

          <UiButton
            @click="toggleFilterCommands"
            variant="secondary"
            size="sm"
            class="px-2 py-1 text-[10px] sm:mt-0 sm:px-4 sm:py-2 sm:text-sm"
          >
            Filter By
            <Icon name="lucide:list-filter" class="h-3 w-3 sm:h-4 sm:w-4" />
          </UiButton>
        </div>

        <!-- Filter Commands -->
        <transition name="slide-fade">
          <div
            v-if="showFilterCommands"
            class="flex flex-row justify-end space-x-2 rounded-sm p-2 shadow"
          >
            <!-- Filter Category -->
            <div class="">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger as-child>
                  <UiButton variant="outline" class="text-[12px] sm:text-sm">
                    Select Category
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </UiButton>
                </UiDropdownMenuTrigger>
                <UiDropdownMenuContent class="w-48">
                  <UiDropdownMenuLabel label="Categories" />
                  <UiDropdownMenuSeparator />
                  <template v-for="c in filterCategories" :key="c.key">
                    <UiDropdownMenuCheckboxItem
                      :checked="selectedCategories.includes(c.key)"
                      @select="(e: any) => e.preventDefault()"
                      class="mb-1"
                      @update:checked="
                        selectedCategories.includes(c.key)
                          ? selectedCategories.splice(selectedCategories.indexOf(c.key), 1)
                          : selectedCategories.push(c.key)
                      "
                    >
                      <div class="flex items-center gap-4">
                        <span>{{ c.title }}</span>
                      </div>
                    </UiDropdownMenuCheckboxItem>
                  </template>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
            <!-- Sort by Price -->
            <div class="flex flex-row items-center">
              <UiDropdownMenu>
                <UiDropdownMenuTrigger as-child>
                  <UiButton variant="outline" class="text-[12px] sm:text-sm">
                    Sort by price
                    <Icon name="lucide:chevron-down" class="h-4 w-4" />
                  </UiButton>
                </UiDropdownMenuTrigger>
                <UiDropdownMenuContent class="w-32">
                  <UiDropdownMenuLabel label="Order" />
                  <UiDropdownMenuSeparator />
                  <UiDropdownMenuRadioGroup v-model="sortPrice">
                    <UiDropdownMenuRadioItem value="none" title="None" text-value="none" />
                    <UiDropdownMenuRadioItem value="lowest" title="Lowest" text-value="lowest" />
                    <UiDropdownMenuRadioItem value="highest" title="Highest" text-value="highest" />
                  </UiDropdownMenuRadioGroup>
                </UiDropdownMenuContent>
              </UiDropdownMenu>
            </div>
            <!-- Price Range -->
            <div class="flex w-auto flex-row items-center pl-4"></div>
          </div>
        </transition>

        <!-- Products Container -->
        <div class="mt-4 flex flex-row flex-wrap gap-1 sm:mt-6 sm:gap-6 sm:px-9">
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
          <div class="flex w-full items-end justify-end space-x-4">
            <UiButton
              :disabled="currentPage === 1"
              @click="prevPage"
              class="flex items-center p-2 px-3"
            >
              <Icon :name="prevIcon" class="h-6 w-6" />
              <span class="text-[12px]">Previous</span>
            </UiButton>
            <UiButton
              :disabled="currentPage === totalPages"
              @click="nextPage"
              class="flex items-center p-2 px-3"
            >
              <span class="text-[12px]">Next</span>
              <Icon :name="nextIcon" class="h-6 w-6" />
            </UiButton>
          </div>
        </div>
        <div class="min-h-32">.</div>
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

  const { products, loading, fetchProducts } = useViewProducts();
  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  const { addView, countViews } = useAddProductViews();

  const currentPage = ref(1);
  const totalPages = ref(1);

  const prevIcon = "lucide:chevron-left";
  const nextIcon = "lucide:chevron-right";
  const loadingProducts = ref(false);
  const productViewCounts = reactive<Record<string, number>>({});

  const handleProductSelect = (product: ProductSearchResult) => {
    // Handle navigation or other actions
    navigateTo(`/products/${product.id}`);
  };

  const handleProductClick = (productID: string) => {
    // console.log("Product clicked:", productID);
    addView(productID);
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

  const updateProducts = async () => {
    loadingProducts.value = true;
    console.log("Current Page in script:", currentPage.value);
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
    console.log("Total Pages in script:", totalPages.value);
    loadingProducts.value = false;
  };

  onMounted(async () => {
    await updateProducts();
    await fetchProductViewCounts();
    await fetchCommissionRate();
  });

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

  const { categories } = useCategoryValues();
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

  const priceRangeMin = ref(0);
  const priceRangeMax = ref(0);

  // const applyFilters = () => {
  //   const activeFilter = showAs.value.find((item) => item.isActive);
  //   const sortBy = activeFilter ? activeFilter.name : "all";
  //   const selectedCategoryTitles = selectedCategories.value
  //     .map((key) => {
  //       const category = filterCategories.find((c) => c.key === key);
  //       return category ? category.title : "";
  //     })
  //     .filter((title) => title !== "");
  //   fetchProducts(sortBy, selectedCategoryTitles, sortPrice.value);
  // };

  const applyFilters = () => {
    currentPage.value = 1;
    updateProducts();
  };

  const clearFilters = () => {
    selectedCategories.value = [];
    sortPrice.value = "none";
    priceRangeMin.value = 0;
    priceRangeMax.value = 0;
    updateProducts();
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
