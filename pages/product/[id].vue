<template>
  <div class="flex h-screen w-full flex-col items-start p-12">
    <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
    <div v-if="product" class="mt-8 grid w-full grid-cols-2 gap-4">
      <!-- Product Gallery -->
      <div class="h-auto rounded-sm bg-muted px-2 py-8">
        <Carousel id="gallery" :items-to-show="1" :wrap-around="false" v-model="currentSlide">
          <Slide v-for="(photo, index) in allPhotos" :key="index">
            <img :src="photo" alt="Product Photo" class="h-auto w-96 rounded-sm object-cover" />
          </Slide>
        </Carousel>
        <Carousel
          id="thumbnails"
          :items-to-show="4"
          :wrap-around="true"
          v-model="currentSlide"
          ref="carousel"
        >
          <Slide v-for="(photo, index) in allPhotos" :key="index">
            <div class="carousel__item overflow-hidden" @click="slideTo(index)">
              <img
                :src="photo"
                alt="Thumbnail"
                class="mx-1 my-4 h-20 w-28 rounded-sm object-cover hover:shadow-md"
              />
            </div>
          </Slide>
        </Carousel>
      </div>
      <!-- Product Details -->
      <div class="flex w-full flex-col">
        <div class="flex w-full flex-col space-y-4">
          <h1 class="w-full text-wrap text-4xl font-semibold">{{ product.name }}</h1>
          <div class="flex flex-row items-center space-x-1">
            <Icon name="lucide:building-2" />
            <span class="pr-4">{{ product.organization }}</span>
            <Icon name="lucide:credit-card" class="" />
            <span class="pr-4"> Sales: {{ product.totalSales }}</span>
            <Icon name="lucide:eye" />
            <span>Views: {{ product.views }}</span>
          </div>
          <p class="text-md text-wrap py-4 text-justify indent-8 opacity-60">
            {{ product.description }}
          </p>
          <div class="flex flex-col">
            <span class="text-xl font-semibold">Variations</span>
            <div class="flex flex-row flex-wrap gap-4 px-4 pt-4">
              <div v-for="(vari, i) in product.variations" :key="i">
                <UiButton class="cursor-default opacity-90">
                  {{ vari.value }} | ₱{{ vari.currentPrice }}
                </UiButton>
              </div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">This Product has a discount for its members!</p>
          <div class="flex flex-row items-center gap-2 pt-8">
            <!-- Add to Cart -->
            <UiDrawer>
              <UiDrawerTrigger as-child>
                <UiButton class="w-1/2" size="lg" variant="outline" v-wave @click="handleAddToCart">
                  <Icon name="lucide:shopping-cart" />
                  Add to Cart
                </UiButton>
              </UiDrawerTrigger>
              <UiDrawerContent>
                <div class="min-w-md mx-auto w-full rounded-t-lg p-4 pb-10">
                  <UiDrawerTitle class="text-center font-semibold uppercase">
                    <Icon name="lucide:shopping-cart" />
                    Add to Cart
                  </UiDrawerTitle>
                  <UiDrawerDescription>
                    <p class="pt-2 text-center">
                      Select the variation you want to add to your cart. You can adjust the quantity
                      in the cart.
                    </p>
                  </UiDrawerDescription>
                  <div class="relative">
                    <!-- Variation -->
                    <span class="my-5 pl-5 text-lg font-semibold">Choose Variation</span>
                    <UiDivider class="px-5" />
                    <div class="flex flex-row flex-wrap justify-center gap-4 px-16 py-4">
                      <div v-for="(vari, i) in product.variations" :key="i">
                        <UiButton> {{ vari.value }} | {{ vari.stocks }}</UiButton>
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div class="flex w-full flex-row items-center justify-center py-4">
                      <span class="pr-2">Quantity:</span>
                      <form>
                        <fieldset>
                          <UiNumberField :min="0" :max="1000">
                            <UiNumberFieldInput placeholder="0" />
                            <UiNumberFieldDecrement class="border-l" />
                            <UiNumberFieldIncrement class="border-l" />
                          </UiNumberField>
                        </fieldset>
                      </form>
                    </div>

                    <!-- Buttons -->
                    <div class="flex flex-row items-center justify-center gap-4 pb-12 pt-4">
                      <UiDrawerClose>
                        <UiButton variant="outline" size="lg" v-wave>
                          <Icon name="lucide:x" />
                          Cancel
                        </UiButton>
                      </UiDrawerClose>
                      <UiButton size="lg" v-wave>
                        <Icon name="lucide:shopping-cart" />
                        Add to Cart
                      </UiButton>
                    </div>
                  </div>
                </div>
              </UiDrawerContent>
            </UiDrawer>
            <UiButton class="w-1/2" size="lg" variant="destructive" v-wave>
              <Icon name="lucide:credit-card" />
              Buy Now</UiButton
            >
          </div>
        </div>
      </div>
    </div>
    <div v-else>Loading...</div>
    <!-- Recommended Products -->
    <UiDivider class="my-10" />
    <div class="flex h-auto w-full flex-col">
      <span class="text-lg font-medium">Recommendations For You</span>
      <div class="mt-6 flex flex-row flex-wrap gap-6 px-9">
        <div v-for="(product, i) in products" :key="i">
          <NuxtLink :to="`/product/${product.name}`">
            <div
              class="flex max-h-[40rem] max-w-[24rem] flex-col rounded-sm border p-2 hover:shadow-lg"
            >
              <div class="flex justify-center border-b p-2">
                <div class="h-52 w-52 overflow-hidden">
                  <img
                    :src="product.image"
                    :alt="product.name"
                    class="h-full w-full transform object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                </div>
              </div>
              <div class="flex w-full flex-col items-start pt-1">
                <span class="text-sm text-muted-foreground">P{{ product.price }}</span>
                <p class="w-full truncate pt-2">
                  {{ product.name }}
                </p>
                <div class="flex w-full flex-row justify-between pt-4 text-[12px] opacity-50">
                  <span>{{ product.views }} views</span>
                  <span>{{ product.totalSales }} sales</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>
    <div class="h-96">.</div>
  </div>
</template>

<script lang="ts" setup>
  import { Carousel, Slide } from "vue3-carousel";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  import "vue3-carousel/dist/carousel.css";

  const currentSlide = ref(0);
  const user = useCurrentUser();
  const router = useRouter();

  const slideTo = (val: number) => {
    currentSlide.value = val;
  };

  const crumbs: Crumbs[] = [
    { label: "Home", link: "/" },
    { label: "All Products", link: "/" },
    { label: "Product", link: "/organization/#", disabled: true },
  ];

  const { product } = useProduct();
  const { products } = useProductValues();

  const allPhotos = computed(() => {
    return product ? [product.featuredPhoto, ...(product.photos ?? [])] : [];
  });

  const handleAddToCart = () => {
    if (!user.value) {
      router.push("/login");
    } else {
      // Trigger the drawer
      const drawerTrigger = document.querySelector("[data-drawer-trigger]");
      if (drawerTrigger) {
        (drawerTrigger as HTMLElement).click();
      }
    }
  };
</script>
