<template>
  <div class="mb-12 flex w-full flex-col px-4 py-6 sm:px-6 md:px-8 lg:px-14">
    <!-- Store Header -->
    <div class="flex flex-col space-y-6 lg:flex-row lg:space-x-8 lg:space-y-0">
      <!-- Cover image (full width on mobile) -->
      <div class="order-1 w-full overflow-hidden rounded-lg lg:order-2 lg:w-2/3">
        <img
          :src="store?.coverImageURL || '/display2.png'"
          alt="Store Cover Image"
          class="h-48 w-full rounded-lg object-cover shadow-md sm:h-64 md:h-80 lg:h-96"
        />
      </div>

      <!-- Store details (below image on mobile) -->
      <div class="order-2 flex w-full flex-col space-y-4 lg:order-1 lg:w-1/3">
        <div class="flex items-center space-x-4">
          <img
            :src="store?.logoImageURL || '/logo-verch.webp'"
            alt="Store Logo"
            class="h-16 w-16 rounded-full border-2 border-white object-cover shadow-sm sm:h-20 sm:w-20"
          />
          <div class="mt-3 sm:mt-0">
            <h1 class="line-clamp-2 text-xl font-bold leading-tight sm:text-2xl md:text-3xl">
              {{ store?.name }}
            </h1>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
          <p
            v-if="store?.description"
            class="mb-3 text-sm text-gray-600 dark:text-gray-300 sm:text-base"
          >
            {{ store?.description }}
          </p>

          <div v-if="store?.address" class="flex items-start space-x-2 text-sm text-gray-500">
            <Icon name="lucide:map-pin" class="mt-0.5 h-4 w-4 flex-shrink-0" />
            <span>{{ store?.address }}</span>
          </div>
        </div>
      </div>
    </div>

    <UiDivider class="my-8" />

    <!-- Products Section -->
    <div class="flex flex-col space-y-4">
      <div class="flex flex-row items-center space-x-2">
        <Icon name="lucide:shopping-bag" class="size-5 text-primary" />
        <h2 class="text-xl font-medium">Products</h2>
      </div>

      <!-- Products grid -->
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5">
        <div v-for="product in products" :key="product.id" v-if="products.length > 0">
          <NuxtLink
            :to="`/product/${product.id}`"
            @click="handleProductClick(product.id as string)"
            class="flex h-full flex-col overflow-hidden rounded-md border bg-white transition-all hover:shadow-md dark:border-gray-700 dark:bg-gray-800/50"
          >
            <div class="relative aspect-square overflow-hidden">
              <img
                :src="product.featuredPhotoURL || '/placeholder-product.jpg'"
                :alt="product.name"
                class="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>

            <div class="flex flex-1 flex-col p-3">
              <p class="line-clamp-2 text-sm font-medium">
                {{ product.name }}
              </p>
              <p class="mt-1 text-sm font-semibold text-primary">
                ₱{{ calculatePriceWithCommission(Number(product.price)).toFixed(2) }}
              </p>

              <div class="mt-auto flex w-full justify-between pt-2 text-xs text-gray-500">
                <span>{{ productViewCounts[product.id as string] || 0 }} views</span>
                <span>{{ product.totalSales || 0 }} sold</span>
              </div>
            </div>
          </NuxtLink>
        </div>

        <template v-if="products.length === 0">
          <div
            class="col-span-full flex h-32 items-center justify-center rounded-lg border border-dashed p-6 text-center text-gray-500"
          >
            <div>
              <Icon name="lucide:package-x" class="mx-auto mb-2 h-8 w-8 text-gray-400" />
              <p>No products available</p>
            </div>
          </div>
        </template>
      </div>
    </div>

    <UiDivider class="my-8" />

    <!-- Store Photos Section -->
    <div class="flex flex-col space-y-6">
      <div class="flex items-center justify-center space-x-2">
        <Icon name="lucide:image" class="h-5 w-5 text-primary" />
        <h2 class="text-xl font-medium">Store Gallery</h2>
      </div>

      <div class="overflow-hidden rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        <template v-if="store?.imagesURL && store.imagesURL.length > 0">
          <Carousel v-bind="galleryConfig" class="carousel-container">
            <Slide v-for="(photo, index) in store?.imagesURL" :key="index">
              <div class="carousel__item px-1">
                <img
                  :src="photo.url"
                  alt="Store Photo"
                  class="h-full w-full rounded-md object-cover"
                />
              </div>
            </Slide>
            <template #addons>
              <Navigation />
              <Pagination />
            </template>
          </Carousel>
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center py-8">
            <Icon name="lucide:image-off" class="mb-2 h-10 w-10 text-gray-400" />
            <p class="text-sm text-gray-500">No gallery images available</p>
          </div>
        </template>
      </div>
    </div>

    <UiDivider class="my-8" />

    <!-- Address Reference Images Section -->
    <div class="flex flex-col space-y-6">
      <div class="flex items-center justify-center space-x-2">
        <Icon name="lucide:map" class="h-5 w-5 text-primary" />
        <h2 class="text-xl font-medium">Location Reference</h2>
      </div>

      <div class="overflow-hidden rounded-lg bg-gray-50 p-4 dark:bg-gray-800/50">
        <template v-if="store?.addressImagesURL && store.addressImagesURL.length > 0">
          <Carousel v-bind="galleryConfig" class="carousel-container">
            <Slide v-for="(photo, index) in store?.addressImagesURL" :key="index">
              <div class="carousel__item px-1">
                <img
                  :src="photo.url"
                  alt="Location Photo"
                  class="h-full w-full rounded-md object-cover"
                />
              </div>
            </Slide>
            <template #addons>
              <Navigation />
              <Pagination />
            </template>
          </Carousel>
        </template>
        <template v-else>
          <div class="flex flex-col items-center justify-center py-8">
            <Icon name="lucide:map-off" class="mb-2 h-10 w-10 text-gray-400" />
            <p class="text-sm text-gray-500">No location reference images available</p>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAddProductViews } from "~/composables/useAddProductViews";
  import { Carousel, Navigation, Pagination, Slide } from "vue3-carousel";
  import type { Organization } from "~/types/models/Organization";
  import type { ProductWithId, Variation } from "~/types/models/Product";

  import "vue3-carousel/dist/carousel.css";

  const { getOrganizationById } = useOrganization();
  const { getProductsByOrganization } = useProduct();
  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  const { addView, countViews } = useAddProductViews();

  const route = useRoute();
  const storeId = route.params.id as string;
  const store = ref<Partial<Organization> | null>(null);
  const products = ref<Partial<ProductWithId & { variations: Partial<Variation>[] }>[]>([]);
  const productViewCounts = reactive<Record<string, number>>({});

  const currentSlide = ref(0);

  const handleProductClick = (productID: string) => {
    // console.log("Product clicked:", productID);
    addView(productID);
  };

  // Fetch organization data
  const { data: organizationData } = useAsyncData(`organization-${storeId}`, async () => {
    try {
      const org = await getOrganizationById(storeId);
      return org;
    } catch (error) {
      console.error("Error fetching organization:", error);
      return null;
    }
  });

  const { data: productData } = useAsyncData(`products-${storeId}`, async () => {
    try {
      return await getProductsByOrganization(storeId);
    } catch (error) {
      console.error("Product fetch error:", error);
      return [];
    }
  });

  const fetchProductViewCounts = async () => {
    // console.log("Fetching product view counts...");

    if (!products.value || products.value.length === 0) {
      console.log("No products found to fetch view counts.");
      return;
    }

    for (const product of products.value) {
      const viewCount = await countViews(product.id as string);
      productViewCounts[product.id as string] = viewCount;
      // console.log(`Product ID: ${product.id}, View Count: ${viewCount}`);
    }
  };

  watch([organizationData, productData], () => {
    if (organizationData.value) {
      store.value = organizationData.value;
      console.log("Fetched images:", store.value.imagesURL);
    }

    if (productData.value) {
      products.value = productData.value;
    }
  });

  onMounted(async () => {
    await fetchCommissionRate();
    await fetchProductViewCounts();
  });

  const itemsToShow = computed(() => {
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  });

  const galleryConfig = computed(() => ({
    height: 300,
    itemsToShow: 1,
    snapAlign: "center" as const,
    gap: 15,
    autoplay: 3000,
    wrapAround: true,
    pauseAutoplayOnHover: true,
    breakpoints: {
      640: {
        itemsToShow: 1,
      },
      768: {
        itemsToShow: 2,
      },
      1024: {
        itemsToShow: 3,
      },
    },
  }));

  useHead(() => {
    if (!store.value) {
      return {
        title: "Store Not Found",
        meta: [{ name: "description", content: "The requested store could not be found." }],
      };
    }

    const storeName = store.value.name || "Store";
    const storeDescription =
      store.value.description || `Visit ${storeName} and explore our products`;

    // Make sure image URL is absolute
    const storeImage = store.value.coverImageURL?.startsWith("http")
      ? store.value.coverImageURL
      : store.value.logoImageURL?.startsWith("http")
        ? store.value.logoImageURL
        : `${process.env.NUXT_PUBLIC_SITE_URL || "https://verch-vs.vercel.app"}${store.value.coverImageURL || store.value.logoImageURL || "/placeholder-image.png"}`;
    const storeUrl = `https://verch-vs.vercel.app/stores/${storeId}`;

    // Create a meta description that includes product count if available
    const metaDescription =
      products.value?.length > 0
        ? `${storeDescription}. Browse ${products.value.length} products from this store.`
        : storeDescription;

    return {
      title: storeName,
      meta: [
        // Basic meta tags
        { name: "description", content: metaDescription },

        // Open Graph tags for Facebook, LinkedIn, etc.
        { property: "og:type", content: "website" },
        { property: "og:title", content: storeName },
        { property: "og:description", content: metaDescription },
        { property: "og:image", content: storeImage },
        { property: "og:url", content: storeUrl },
        { property: "og:site_name", content: "Verch Marketplace" },

        // Add image dimensions
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },

        // Twitter Card tags
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: storeName },
        { name: "twitter:description", content: metaDescription },
        { name: "twitter:image", content: storeImage },
      ],
      link: [
        // Canonical URL to prevent duplicate content issues
        { rel: "canonical", href: storeUrl },
      ],
    };
  });
</script>

<style scoped>
  .carousel-container {
    --vc-pgn-active-color: var(--primary);
    --vc-pgn-width: 10px;
    --vc-pgn-height: 10px;
    --vc-pgn-margin: 4px;
    --vc-nav-color: var(--primary);
    --vc-nav-background: rgba(255, 255, 255, 0.9);
    --vc-nav-width: 30px;
    --vc-nav-height: 30px;
    --vc-nav-border-radius: 50%;
  }

  .carousel__item {
    height: 280px;
    width: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  @media (max-width: 640px) {
    .carousel__item {
      height: 240px;
    }
  }
</style>
