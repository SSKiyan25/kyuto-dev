<template>
  <div class="mb-24 flex w-full flex-col p-14">
    <div class="flex flex-row space-x-2">
      <div class="flex w-1/3 flex-col space-y-1 pr-2">
        <div class="pt-2">
          <span class="text-wrap break-words text-4xl font-bold">{{ store?.name }}</span>
          <p class="text-md text-wrap break-words pl-2 pt-4 opacity-80">{{ store?.description }}</p>
          <p class="text-md text-wrap break-words pl-4 pt-4">{{ store?.address }}</p>
        </div>
      </div>
      <div class="flex w-2/3 flex-col">
        <div class="flex h-[512px] w-full justify-center">
          <img :src="store?.coverImageURL" alt="Store Image" class="rounded-lg object-cover" />
        </div>
      </div>
    </div>
    <UiDivider class="my-6" />

    <div class="flex flex-col space-y-2">
      <div class="flex flex-row items-center space-x-1 opacity-80">
        <Icon name="lucide:box" class="size-6" />
        <p class="text-lg font-medium">Products from this store</p>
      </div>
      <div class="mt-4 flex flex-row flex-wrap gap-1 sm:mt-6 sm:gap-6 sm:px-9">
        <div
          v-for="product in products"
          :key="product.id"
          class="flex flex-col items-center space-x-4"
          v-if="products.length > 0"
        >
          <NuxtLink
            :to="`/product/${product.id}`"
            @click="handleProductClick(product.id as string)"
          >
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
                <span class="text-[12px] text-muted-foreground sm:text-sm">
                  ₱{{ calculatePriceWithCommission(Number(product.price)).toFixed(2) }}
                </span>
                <p class="w-full truncate pt-2 text-[12px] font-semibold sm:text-sm">
                  {{ product.name }}
                </p>
                <div
                  class="flex w-full flex-row justify-between pt-4 text-[10px] opacity-50 sm:text-[12px]"
                >
                  <span>{{ productViewCounts[product.id as string] || 0 }} views</span>
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
      </div>
    </div>
    <UiDivider class="my-6" />
    <div class="flex flex-col space-y-2">
      <div class="flex flex-col items-center justify-center space-y-2">
        <img
          :src="store?.logoImageURL"
          alt="Store Image"
          class="h-28 w-28 rounded-lg object-cover"
        />
        <p class="text-lg font-medium uppercase opacity-70">Photos from this store</p>
      </div>
      <div class="my-4 flex justify-center px-8">
        <div class="h-auto rounded-sm bg-muted px-2 py-8">
          <Carousel v-bind="config">
            <Slide v-for="(photo, index) in store?.imagesURL" :key="index">
              <img
                :src="photo.url"
                alt="Product Photo"
                class="h-auto w-96 rounded-sm object-cover"
              />
            </Slide>
            <template #addons>
              <Navigation />
            </template>
          </Carousel>
        </div>
      </div>
    </div>
    <UiDivider class="my-6" />
    <div class="flex flex-col space-y-2">
      <div class="flex flex-col items-center justify-center space-y-2">
        <img
          :src="store?.logoImageURL"
          alt="Store Image"
          class="h-28 w-28 rounded-lg object-cover"
        />
        <p class="text-lg font-medium uppercase opacity-70">
          Address Images Reference from this store
        </p>
      </div>
      <div class="my-4 flex justify-center px-8">
        <div class="h-auto rounded-sm bg-muted px-2 py-8">
          <Carousel v-bind="config">
            <Slide v-for="(photo, index) in store?.addressImagesURL" :key="index">
              <img
                :src="photo.url"
                alt="Product Photo"
                class="h-auto w-96 rounded-sm object-cover"
              />
            </Slide>
            <template #addons>
              <Navigation />
            </template>
          </Carousel>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAddProductViews } from "~/composables/useAddProductViews";
  import { Carousel, Navigation, Slide } from "vue3-carousel";
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

  const config = computed(() => ({
    height: 300,
    itemsToShow: itemsToShow.value,
    gap: 15,
    autoplay: 3000,
    wrapAround: true,
    pauseAutoplayOnHover: true,
  }));
</script>

<style scoped>
  .carousel {
    --vc-nav-background: rgba(255, 255, 255, 0.7);
    --vc-nav-border-radius: 100%;
  }
</style>
