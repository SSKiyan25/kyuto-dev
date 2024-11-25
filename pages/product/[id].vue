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
            <span>Views: 0</span>
          </div>
          <p
            v-if="product.description"
            class="text-md text-wrap py-4 text-justify indent-8 opacity-60"
          >
            {{ product.description }}
          </p>
          <div class="flex flex-col">
            <span class="pb-4 text-sm font-semibold text-muted-foreground"
              >Price: {{ priceRange }}</span
            >
            <span class="text-xl font-semibold">Variations</span>
            <div class="flex flex-row flex-wrap gap-4 px-4 pt-4">
              <div v-for="(vari, i) in variations" :key="i">
                <UiButton class="cursor-default opacity-90" v-wave>
                  {{ vari.value }} | ₱{{ vari.price }}
                </UiButton>
              </div>
            </div>
          </div>
          <p class="text-sm text-muted-foreground">This Product has a discount for its members!</p>
          <div class="flex flex-row items-center gap-2 pt-8">
            <!-- Pre-Order -->
            <UiDrawer>
              <UiDrawerTrigger as-child>
                <UiButton class="w-1/2" size="lg" variant="outline" v-wave @click="handlePreOrder">
                  <Icon name="lucide:shopping-cart" />
                  Pre-Order
                </UiButton>
              </UiDrawerTrigger>
              <UiDrawerContent>
                <div class="min-w-md mx-auto w-full rounded-t-lg p-4 pb-10">
                  <UiDrawerTitle class="text-center font-semibold uppercase">
                    <Icon name="lucide:shopping-cart" />
                    Pre-Order
                  </UiDrawerTitle>
                  <UiDrawerDescription>
                    <p class="pt-2 text-center">
                      Select the variation you want to pre-order. This will be added to your cart as
                      well.
                    </p>
                  </UiDrawerDescription>
                  <div class="relative">
                    <!-- Variation -->
                    <span class="my-5 pl-5 text-lg font-semibold">Choose Variation</span>
                    <UiDivider class="px-5" />
                    <div class="flex flex-row flex-wrap justify-center gap-4 px-16 py-4">
                      <div v-for="(vari, i) in variations" :key="i">
                        <UiButton
                          @click="selectVariation(vari, 'preOrder')"
                          :class="{
                            'bg-primary text-white': selectedVariationPreOrder?.id === vari.id,
                            'border-primary bg-white text-primary':
                              selectedVariationPreOrder?.id !== vari.id,
                          }"
                        >
                          <span v-if="vari.value === 'None'">{{ product.name }} </span>
                          <span v-else> {{ vari.value }} </span>
                        </UiButton>
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div class="flex w-full flex-row items-center justify-center py-4">
                      <span class="pr-2">Quantity:</span>
                      <form>
                        <fieldset>
                          <UiNumberField
                            :min="1"
                            :max="1000"
                            :disabled="!selectedVariationPreOrder"
                            v-model="quantityPreOrder"
                          >
                            <UiNumberFieldInput
                              :disabled="!selectedVariationPreOrder"
                              placeholder="0"
                            />
                            <UiNumberFieldDecrement class="border-l" />
                            <UiNumberFieldIncrement class="border-l" />
                          </UiNumberField>
                        </fieldset>
                      </form>
                    </div>

                    <!-- Buttons -->
                    <div class="flex flex-row items-center justify-center gap-4 pb-12 pt-4">
                      <UiDrawerClose>
                        <UiButton variant="outline" size="lg" v-wave> Cancel </UiButton>
                      </UiDrawerClose>
                      <UiButton
                        size="lg"
                        :disabled="!selectedVariationPreOrder || quantityPreOrder === 0"
                        v-wave
                        @click="submitAddToCart(true)"
                      >
                        Add to Cart
                      </UiButton>
                    </div>
                  </div>
                </div>
              </UiDrawerContent>
            </UiDrawer>
            <!-- Add to Cart -->
            <UiDrawer>
              <UiDrawerTrigger as-child>
                <UiButton
                  class="w-1/2"
                  size="lg"
                  variant="destructive"
                  v-wave
                  @click="handleAddToCart"
                >
                  <Icon name="lucide:baggage-claim" />
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
                      <div v-for="(vari, i) in variations" :key="i">
                        <UiButton
                          @click="selectVariation(vari, 'addToCart')"
                          :disabled="vari.remainingStocks === 0"
                          :class="{
                            'bg-primary text-white': selectedVariationAddToCart?.id === vari.id,
                            'border-primary bg-white text-primary':
                              selectedVariationAddToCart?.id !== vari.id,
                          }"
                        >
                          <span v-if="vari.value === 'None'"
                            >{{ product.name }} | {{ vari.remainingStocks }}</span
                          >
                          <span v-else> {{ vari.value }} | {{ vari.remainingStocks }} </span>
                        </UiButton>
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div class="flex w-full flex-row items-center justify-center py-4">
                      <span class="pr-2">Quantity:</span>
                      <form>
                        <fieldset>
                          <UiNumberField
                            :min="1"
                            :max="selectedVariationAddToCart?.remainingStocks"
                            :disabled="!selectedVariationAddToCart"
                            v-model="quantityAddToCart"
                          >
                            <UiNumberFieldInput
                              :disabled="!selectedVariationAddToCart"
                              placeholder="0"
                            />
                            <UiNumberFieldDecrement class="border-l" />
                            <UiNumberFieldIncrement class="border-l" />
                          </UiNumberField>
                        </fieldset>
                      </form>
                    </div>

                    <!-- Buttons -->
                    <div class="flex flex-row items-center justify-center gap-4 pb-12 pt-4">
                      <UiDrawerClose>
                        <UiButton variant="outline" size="lg" v-wave> Cancel </UiButton>
                      </UiDrawerClose>
                      <UiButton
                        size="lg"
                        v-wave
                        :disabled="!selectedVariationAddToCart || quantityAddToCart === 0"
                        @click="submitAddToCart(false)"
                      >
                        <Icon name="lucide:shopping-cart" />
                        Add to Cart
                      </UiButton>
                    </div>
                  </div>
                </div>
              </UiDrawerContent>
            </UiDrawer>
          </div>
          <p class="text-center text-[12px] text-muted-foreground">
            After adding to cart you can process it to checkout.
          </p>
        </div>
      </div>
    </div>
    <div v-else>Loading...</div>
    <!-- More Products from Organization -->

    <UiDivider class="my-10" />
    <div v-if="orgProducts.length === 0">No products available</div>
    <div v-else class="flex h-auto w-full flex-col">
      <span class="text-lg font-medium">More Products from this Organization</span>
      <div class="mt-6 flex flex-row flex-wrap gap-6 px-9">
        <div v-for="(orgProduct, i) in orgProducts" :key="i">
          <NuxtLink :to="`/product/${orgProduct.id}`">
            <div
              class="flex max-h-[40rem] max-w-[24rem] flex-col rounded-sm border p-2 hover:shadow-lg"
            >
              <div class="flex justify-center border-b p-2">
                <div class="h-52 w-52 overflow-hidden">
                  <img
                    :src="orgProduct.featuredPhotoURL"
                    :alt="orgProduct.name"
                    class="h-full w-full transform object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                </div>
              </div>
              <div class="flex w-full flex-col items-start pt-1">
                <span class="text-sm text-muted-foreground">P{{ orgProduct.price }}</span>
                <p class="w-full truncate pt-2">
                  {{ orgProduct.name }}
                </p>
                <div class="flex w-full flex-row justify-between pt-4 text-[12px] opacity-50">
                  <span>0 views</span>
                  <span>{{ orgProduct.totalSales }} sales</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground"> {{ currentMessage }}</span>
        <!-- Add a GIF here -->
      </div>
    </div>
    <div class="h-96">.</div>
  </div>
</template>

<script lang="ts" setup>
  import { useAddToCart } from "~/composables/useAddToCart";
  import { useOrganizationProducts } from "~/composables/useOrganizationProducts";
  import { collection, doc } from "firebase/firestore";
  import { Carousel, Slide } from "vue3-carousel";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { EnhancedProduct } from "~/composables/useOrganizationProducts";
  import type { Product, Variation } from "~/types/models/Product";

  import "vue3-carousel/dist/carousel.css";

  const currentSlide = ref(0);
  const user = useCurrentUser();
  const db = useFirestore();
  const router = useRouter();
  const currentMessage = ref("Adding to your cart");
  let messageIndex: number = 0;
  const toast = useToast();

  const slideTo = (val: number) => {
    currentSlide.value = val;
  };

  const crumbs: Crumbs[] = [
    { label: "Home", link: "/", icon: "lucide:house" },
    { label: "All Products", link: "/", icon: "lucide:box" },
    { label: "Product", link: "/", disabled: true, icon: "lucide:shirt" },
  ];

  const updateMessage = () => {
    const dots = ".".repeat((messageIndex % 3) + 1);
    currentMessage.value = `Adding to your cart${dots}`;
    messageIndex = (messageIndex + 1) % 3;
  };

  const route = useRoute();
  const productID = computed(() => route.params.id as string);
  const productRef = computed(() =>
    productID.value ? doc(collection(db, "products"), productID.value as string) : null
  );
  const { data: product, pending } = useDocument<Partial<Product>>(productRef);
  console.log("Data: ", product);
  const allPhotos = computed(() => {
    const prod = unref(product);
    return prod ? [prod.featuredPhotoURL, ...(prod.photosURL ?? [])] : [];
  });

  const variationsRef = computed(() =>
    productID ? collection(doc(db, "products", productID.value as string), "variations") : null
  );
  const { data: variationsSnapshot } = useCollection(variationsRef);

  console.log("variationsSnapshot", variationsSnapshot);

  const variations = computed(() => {
    if (!variationsSnapshot.value) {
      return [];
    }
    return variationsSnapshot.value.map((doc) => {
      console.log("doc", doc); // Debugging log
      return {
        id: doc.id,
        ...doc,
      };
    }) as (Variation & { id: string })[];
  });

  // watch(productID, fetchVariations, { immediate: true });
  const priceRange = computed(() => {
    if (variations.value.length === 0) return "";
    const prices = variations.value.map((v) => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    return minPrice === maxPrice ? `₱${minPrice}` : `₱${minPrice} - ₱${maxPrice}`;
  });
  // console.log("Variations: ", variations.value);
  // console.log("Price range: ", priceRange.value);

  const selectedVariationAddToCart = ref<(Variation & { id: string }) | null>(null);
  const quantityAddToCart = ref(1);

  const selectedVariationPreOrder = ref<(Variation & { id: string }) | null>(null);
  const quantityPreOrder = ref(1);

  const selectVariation = (
    variation: Variation & { id: string },
    type: "addToCart" | "preOrder"
  ) => {
    if (type === "addToCart") {
      if (selectedVariationAddToCart.value?.id === variation.id) {
        selectedVariationAddToCart.value = null;
      } else {
        selectedVariationAddToCart.value = variation;
      }
    } else {
      if (selectedVariationPreOrder.value?.id === variation.id) {
        selectedVariationPreOrder.value = null;
      } else {
        selectedVariationPreOrder.value = variation;
      }
    }
  };

  const { addToCart, loading, error } = useAddToCart();

  const handleAddToCart = async () => {
    if (!user.value) {
      router.push("/login");
    } else {
      const drawerTrigger = document.querySelector("[data-drawer-trigger]");
      if (drawerTrigger) {
        (drawerTrigger as HTMLElement).click();
      }
    }
  };

  const submitAddToCart = async (preOrder: boolean) => {
    if (!user.value) {
      router.push("/login");
    } else {
      const selectedVariation = preOrder
        ? selectedVariationPreOrder.value
        : selectedVariationAddToCart.value;
      const quantity = preOrder ? quantityPreOrder.value : quantityAddToCart.value;

      if (selectedVariation) {
        loading.value = true;
        console.log("Adding to cart...");
        console.log("Selected Variation: ", selectedVariation);
        console.log("Quantity: ", quantity);
        // Trigger the drawer
        if (!preOrder) {
          if (quantity > selectedVariation.remainingStocks) {
            toast.toast({
              title: "Error",
              description: "Quantity exceeds the available stocks.",
              variant: "destructive",
              icon: "lucide:alert-circle",
            });
            loading.value = false;
            return;
          }
        }
        await addToCart(
          user.value.uid,
          productID.value as string,
          selectedVariation.id,
          quantity,
          preOrder
        );
        toast.toast({
          title: "Added to Cart",
          description: "Product has been added to your cart.",
          variant: "success",
          icon: "lucide:badge-check",
        });
        loading.value = false;

        router.push(`/user/cart/${user.value.uid}`);
      }
    }
  };

  const handlePreOrder = async () => {
    if (!user.value) {
      router.push("/login");
    } else {
      const drawerTrigger = document.querySelector("[data-drawer-trigger]");
      if (drawerTrigger) {
        (drawerTrigger as HTMLElement).click();
      }
    }
  };

  // Organization Products
  const orgProducts = ref<EnhancedProduct[]>([]);
  watch(
    product,
    async () => {
      if (product.value?.organizationID) {
        const { products, fetchOrganizationProducts } = useOrganizationProducts(
          product.value.organizationID,
          productID.value as string
        );
        try {
          await fetchOrganizationProducts();
          orgProducts.value = products.value.map((p) => ({
            ...p,
            id: p.id,
            price: p.price,
          }));
        } catch (error) {
          console.error("Error fetching organization products:", error);
        }
      }
    },
    { immediate: true }
  );

  // Set interval to update the loading message
  watch(loading, (newVal) => {
    if (newVal) {
      const interval = setInterval(updateMessage, 1000);
      watch(loading, (newVal) => {
        if (!newVal) {
          clearInterval(interval);
        }
      });
    }
  });
</script>
