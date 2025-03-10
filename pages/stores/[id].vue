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
        <div class="flex h-[512px] w-full">
          <img
            src="/images/category/polo-shirt.jpg"
            alt="Store Image"
            class="rounded-lg object-cover"
          />
        </div>
      </div>
    </div>
    <UiDivider class="my-6" />
    <div class="flex flex-col space-y-2">
      <div class="flex flex-col items-center justify-center space-y-2">
        <img :src="store?.iconURL" alt="Store Image" class="h-28 w-28 rounded-lg object-cover" />
        <p class="text-lg font-medium uppercase opacity-70">Photos from this store</p>
      </div>
      <div class="my-4 flex justify-center px-8">
        <div class="h-auto rounded-sm bg-muted px-2 py-8">
          <Carousel v-bind="config">
            <Slide v-for="(photo, index) in allPhotos" :key="index">
              <img :src="photo" alt="Product Photo" class="h-auto w-96 rounded-sm object-cover" />
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
      <div class="flex flex-row items-center space-x-1 opacity-80">
        <Icon name="lucide:box" class="size-6" />
        <p class="text-lg font-medium">Products from this store</p>
      </div>
      <div class="mt-4 flex flex-row flex-wrap gap-1 sm:mt-6 sm:gap-6 sm:px-9">
        <div
          v-for="product in products"
          :key="product.name"
          class="flex flex-col items-center space-x-4"
          v-if="products.length > 0"
        >
          <NuxtLink :to="`/product/${product.name}`">
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
                  ₱{{
                    product.variations && product.variations.length > 0
                      ? product.variations[0].price
                      : "N/A"
                  }}
                </span>
                <p class="w-full truncate pt-2 text-[12px] font-semibold sm:text-sm">
                  {{ product.name }}
                </p>
                <div
                  class="flex w-full flex-row justify-between pt-4 text-[10px] opacity-50 sm:text-[12px]"
                >
                  <span>0 views</span>
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
  </div>
</template>

<script lang="ts" setup>
  import { Carousel, Slide } from "vue3-carousel";
  import type { Organization } from "~/types/models/Organization";
  import type { Product, Variation } from "~/types/models/Product";

  import "vue3-carousel/dist/carousel.css";

  const route = useRoute();
  const storeId = route.params.id;
  const store = ref<Partial<Organization> | null>(null);
  const products = ref<Partial<Product & { variations: Partial<Variation>[] }>[]>([]);

  const currentSlide = ref(0);
  const allPhotos = ref<string[]>([]);

  const slideTo = (val: number) => {
    currentSlide.value = val;
  };

  onMounted(() => {
    // Mock data for demonstration purposes
    const mockStores: Partial<Organization>[] = [
      {
        name: "Tech Haven",
        description: "Your one-stop shop for the latest in tech gadgets and accessories.",
        address: "123 Tech Street, Silicon Valley, CA",
        iconURL: "/logo-verch.webp",
        imagesURL: ["/images/category/polo-shirt.jpg", "/images/category/hoodie.png"],
      },
      {
        name: "Fashion Fiesta",
        description: "Trendy and affordable fashion for all seasons.",
        address: "456 Fashion Ave, New York, NY",
        iconURL: "/logo-verch-2.png",
        imagesURL: ["/images/category/polo-shirt.jpg", "/images/category/hoodie.png"],
      },
    ];

    const mockProducts: Partial<Product & { variations: Partial<Variation>[] }>[] = [
      {
        name: "Smartphone",
        totalSales: 150,
        featuredPhotoURL: "/images/category/hoodie.png",
        variations: [{ price: 999 }],
      },
      {
        name: "Laptop",
        totalSales: 75,
        featuredPhotoURL: "/images/category/polo-shirt.jpg",
        variations: [{ price: 1999 }],
      },
      {
        name: "Headphones",
        totalSales: 300,
        featuredPhotoURL: "/images/category/hoodie.png",
        variations: [{ price: 199 }],
      },
      {
        name: "Smartwatch",
        totalSales: 200,
        featuredPhotoURL: "/images/category/polo-shirt.jpg",
        variations: [{ price: 299 }],
      },
    ];

    store.value = mockStores.find((s) => s.name === storeId) || null;
    products.value = mockProducts;
    allPhotos.value = store.value?.imagesURL || [];
  });

  const config = {
    height: 200,
    itemsToShow: 2,
    gap: 5,
    autoplay: 4000,
    wrapAround: true,
    pauseAutoplayOnHover: true,
  };
</script>
