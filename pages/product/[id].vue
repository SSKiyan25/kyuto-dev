<template>
  <div class="container mx-auto flex min-h-screen w-full flex-col px-4 py-6 sm:py-12">
    <!-- Breadcrumbs -->
    <UiBreadcrumbs class="mb-4 text-[12px] sm:text-sm" :items="crumbs" />

    <!-- Product Loading State -->
    <div v-if="pending" class="flex w-full flex-col items-center justify-center py-16">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
        <Icon name="lucide:shopping-bag" class="h-8 w-8 animate-pulse text-primary/70" />
      </div>
      <p class="mt-4 text-sm text-muted-foreground">Loading product details...</p>
    </div>

    <!-- Product Not Found -->
    <div v-else-if="!product" class="flex w-full flex-col items-center justify-center py-16">
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
        <Icon name="lucide:x" class="h-8 w-8 text-destructive" />
      </div>
      <h3 class="mt-4 text-lg font-semibold">Product Not Found</h3>
      <p class="mt-2 text-sm text-muted-foreground">
        The product you're looking for doesn't exist or has been removed.
      </p>
      <UiButton to="/products" variant="outline" class="mt-6">
        <Icon name="lucide:arrow-left" class="mr-2 h-4 w-4" />
        Browse Products
      </UiButton>
    </div>

    <!-- Product Details -->
    <div v-else class="grid w-full gap-8 sm:mt-4 sm:grid-cols-2 lg:gap-12">
      <!-- Product Gallery -->
      <div
        class="flex flex-col overflow-hidden rounded-lg border border-border/40 bg-card shadow-sm"
      >
        <Carousel
          id="gallery"
          :items-to-show="1"
          :wrap-around="true"
          v-model="currentSlide"
          class="bg-muted"
        >
          <Slide
            v-for="(photo, index) in allPhotos"
            :key="index"
            class="flex h-[300px] items-center justify-center px-2 py-2 sm:h-[400px]"
          >
            <img
              :src="photo"
              alt="Product Photo"
              class="h-full max-h-full w-auto max-w-full rounded-md object-contain"
              @error="
                (e) => {
                  if (e.target) (e.target as HTMLImageElement).src = '/placeholder-image.png';
                }
              "
            />
          </Slide>

          <!-- Navigation Arrows -->
          <template #addons>
            <div class="absolute left-2 top-1/2 z-10 -translate-y-1/2">
              <button
                @click="currentSlide = (currentSlide - 1 + allPhotos.length) % allPhotos.length"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-sm hover:bg-white"
              >
                <Icon name="lucide:chevron-left" class="h-5 w-5" />
              </button>
            </div>
            <div class="absolute right-2 top-1/2 z-10 -translate-y-1/2">
              <button
                @click="currentSlide = (currentSlide + 1) % allPhotos.length"
                class="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 text-gray-800 shadow-sm hover:bg-white"
              >
                <Icon name="lucide:chevron-right" class="h-5 w-5" />
              </button>
            </div>
          </template>
        </Carousel>

        <!-- Thumbnails -->
        <div class="bg-card p-4">
          <div class="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
            <div
              v-for="(photo, index) in allPhotos"
              :key="index"
              @click="slideTo(index)"
              class="flex-shrink-0 cursor-pointer overflow-hidden rounded-md border"
              :class="
                currentSlide === index ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
              "
            >
              <img
                :src="photo"
                alt="Thumbnail"
                class="h-16 w-16 object-cover transition-all duration-200"
                @error="
                  (e) => {
                    if (e.target) (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }
                "
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Product Info -->
      <div class="flex w-full flex-col space-y-6">
        <!-- Product Header -->
        <div>
          <span
            class="inline-block rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
          >
            {{ orgName }}
          </span>
          <h1 class="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">{{ product.name }}</h1>

          <!-- Stats -->
          <div
            class="mt-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground sm:text-sm"
          >
            <div class="flex items-center gap-1">
              <Icon name="lucide:shopping-bag" class="h-4 w-4" />
              <span>{{ product.totalSales }} sales</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon name="lucide:eye" class="h-4 w-4" />
              <span>{{ productViewCounts[product.id] || 0 }} views</span>
            </div>
          </div>
        </div>

        <!-- Price -->
        <div class="rounded-lg bg-muted/30 p-4">
          <div class="flex flex-wrap items-baseline gap-2">
            <span class="text-xl font-bold text-primary sm:text-2xl">{{ priceRange }}</span>
            <span v-if="product.isDiscounted" class="text-sm text-muted-foreground">
              <Icon name="lucide:badge-percent" class="mb-0.5 mr-1 inline h-3.5 w-3.5" />
              Special discount for members
            </span>
          </div>
        </div>

        <!-- Description -->
        <div v-if="product.description" class="rounded-lg border border-border/40 bg-card p-4">
          <h2 class="mb-2 text-sm font-medium">Description</h2>
          <p class="text-sm leading-relaxed text-muted-foreground">
            {{ product.description }}
          </p>
        </div>

        <!-- Variations -->
        <div class="rounded-lg border border-border/40 bg-card p-4">
          <h2 class="mb-3 text-sm font-medium">Variations</h2>
          <div class="flex flex-wrap gap-2">
            <div
              v-for="(vari, i) in variations"
              :key="i"
              class="inline-flex rounded-md border border-border/60 bg-background px-3 py-1.5 text-sm"
            >
              <span>{{ vari.value }}</span>
              <span class="ml-1.5 font-semibold text-primary">
                ₱{{ calculatePriceWithCommission(vari.price).toFixed(2) }}
              </span>
              <span v-if="vari.remainingStocks > 0" class="ml-2 text-xs text-muted-foreground">
                ({{ vari.remainingStocks }} in stock)
              </span>
              <span v-else class="ml-2 text-xs text-destructive"> (Out of stock) </span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex flex-col gap-4 pt-2">
          <div class="flex flex-col gap-3 sm:flex-row">
            <!-- Pre-Order -->
            <UiDrawer>
              <UiDrawerTrigger as-child>
                <UiDrawerTrigger as-child>
                  <UiButton
                    class="h-12 w-full flex-1 p-2 text-base sm:h-auto sm:p-4"
                    size="lg"
                    variant="outline"
                    @click="handlePreOrder"
                  >
                    <Icon name="lucide:clock" class="mr-2 h-5 w-5" />
                    Pre-Order
                  </UiButton>
                </UiDrawerTrigger>
              </UiDrawerTrigger>
              <UiDrawerContent>
                <div class="mx-auto w-full max-w-md rounded-t-lg p-6">
                  <UiDrawerTitle
                    class="flex items-center justify-center gap-2 text-center font-semibold"
                  >
                    <Icon name="lucide:clock" class="h-5 w-5 text-amber-500" />
                    Pre-Order Item
                  </UiDrawerTitle>
                  <UiDrawerDescription class="text-center">
                    <p class="mt-2 text-sm">
                      Pre-order this item now and we'll notify you when it's available.
                    </p>
                  </UiDrawerDescription>

                  <div class="mt-6 space-y-6">
                    <!-- Variation -->
                    <div>
                      <h3 class="mb-3 font-medium">Choose Variation</h3>
                      <div class="flex flex-wrap justify-center gap-2">
                        <UiButton
                          v-for="(vari, i) in variations"
                          :key="i"
                          @click="selectVariation(vari, 'preOrder')"
                          :disabled="isSubmitting"
                          :variant="
                            selectedVariationPreOrder?.id === vari.id ? 'default' : 'outline'
                          "
                          class="min-w-20"
                        >
                          {{ vari.value === "None" ? product.name : vari.value }}
                        </UiButton>
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div>
                      <h3 class="mb-3 font-medium">Select Quantity</h3>
                      <div class="flex justify-center">
                        <UiNumberField
                          :min="1"
                          :max="1000"
                          :disabled="!selectedVariationPreOrder || isSubmitting"
                          v-model="quantityPreOrder"
                          class="w-32"
                        >
                          <UiNumberFieldInput
                            :disabled="!selectedVariationPreOrder || isSubmitting"
                            placeholder="0"
                          />
                          <UiNumberFieldDecrement class="border-l" />
                          <UiNumberFieldIncrement class="border-l" />
                        </UiNumberField>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-center gap-3 pt-4">
                      <UiDrawerClose>
                        <UiButton variant="outline" size="lg" :disabled="isSubmitting">
                          Cancel
                        </UiButton>
                      </UiDrawerClose>
                      <UiButton
                        size="lg"
                        :disabled="!selectedVariationPreOrder || quantityPreOrder === 0"
                        :loading="loadingButton"
                        @click="submitAddToCart(true)"
                        class="h-12 text-base sm:h-auto"
                      >
                        <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
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
                  class="h-12 w-full flex-1 p-2 text-base sm:h-auto sm:p-4"
                  size="lg"
                  @click="handleAddToCart"
                >
                  <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
                  Add to Cart
                </UiButton>
              </UiDrawerTrigger>
              <UiDrawerContent>
                <div class="mx-auto w-full max-w-md rounded-t-lg p-6">
                  <UiDrawerTitle
                    class="flex items-center justify-center gap-2 text-center font-semibold"
                  >
                    <Icon name="lucide:shopping-cart" class="h-5 w-5 text-primary" />
                    Add to Cart
                  </UiDrawerTitle>
                  <UiDrawerDescription class="text-center">
                    <p class="mt-2 text-sm">
                      Select the variation and quantity you'd like to purchase.
                    </p>
                  </UiDrawerDescription>

                  <div class="mt-6 space-y-6">
                    <!-- Variation -->
                    <div>
                      <h3 class="mb-3 font-medium">Choose Variation</h3>
                      <div class="flex flex-wrap justify-center gap-2">
                        <UiButton
                          v-for="(vari, i) in variations"
                          :key="i"
                          @click="selectVariation(vari, 'addToCart')"
                          :disabled="vari.remainingStocks === 0 || isSubmitting"
                          :variant="
                            selectedVariationAddToCart?.id === vari.id ? 'default' : 'outline'
                          "
                          class="min-w-20"
                        >
                          <span class="flex flex-col items-center">
                            <span>{{ vari.value === "None" ? product.name : vari.value }}</span>
                            <span class="text-xs text-muted-foreground">
                              ({{ vari.remainingStocks }} left)
                            </span>
                          </span>
                        </UiButton>
                      </div>
                    </div>

                    <!-- Quantity -->
                    <div>
                      <h3 class="mb-3 font-medium">Select Quantity</h3>
                      <div class="flex justify-center">
                        <UiNumberField
                          :min="1"
                          :max="selectedVariationAddToCart?.remainingStocks"
                          :disabled="!selectedVariationAddToCart || isSubmitting"
                          v-model="quantityAddToCart"
                          class="w-32"
                        >
                          <UiNumberFieldInput
                            :disabled="!selectedVariationAddToCart || isSubmitting"
                            placeholder="0"
                          />
                          <UiNumberFieldDecrement class="border-l" />
                          <UiNumberFieldIncrement class="border-l" />
                        </UiNumberField>
                      </div>

                      <div
                        v-if="selectedVariationAddToCart"
                        class="mt-4 flex items-center justify-center gap-2 rounded-md bg-muted p-2"
                      >
                        <span class="text-xs font-medium">Subtotal:</span>
                        <span class="text-sm font-bold text-primary">
                          ₱{{
                            (
                              calculatePriceWithCommission(selectedVariationAddToCart.price) *
                              quantityAddToCart
                            ).toFixed(2)
                          }}
                        </span>
                      </div>
                    </div>

                    <!-- Actions -->
                    <div class="flex justify-center gap-3 pt-4">
                      <UiDrawerClose>
                        <UiButton variant="outline" size="lg" :disabled="isSubmitting">
                          Cancel
                        </UiButton>
                      </UiDrawerClose>
                      <UiButton
                        size="lg"
                        :disabled="!selectedVariationAddToCart || quantityAddToCart === 0"
                        :loading="loadingButton"
                        @click="submitAddToCart(false)"
                        class="h-12 text-base sm:h-auto"
                      >
                        <Icon name="lucide:shopping-cart" class="mr-2 h-4 w-4" />
                        Add to Cart
                      </UiButton>
                    </div>
                  </div>
                </div>
              </UiDrawerContent>
            </UiDrawer>
          </div>

          <p class="text-center text-xs text-muted-foreground">
            <Icon name="lucide:info" class="mr-1 inline-block h-3 w-3" />
            Products will be added to your cart for later checkout
          </p>
        </div>
      </div>
    </div>

    <!-- Related Products Section -->
    <div v-if="product && orgProducts.length > 0" class="mt-16">
      <UiDivider />

      <div class="py-8">
        <h2 class="mb-6 text-xl font-semibold">More From {{ orgName }}</h2>

        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          <NuxtLink
            v-for="(orgProduct, i) in orgProducts"
            :key="i"
            :to="`/product/${orgProduct.id}`"
            @click="handleProductClick(orgProduct.id)"
            class="group overflow-hidden rounded-lg border border-border/40 bg-card transition-all duration-300 hover:border-primary/30 hover:shadow-md"
          >
            <div class="aspect-square w-full overflow-hidden bg-muted/30">
              <img
                :src="orgProduct.featuredPhotoURL"
                :alt="orgProduct.name"
                class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                @error="
                  (e) => {
                    if (e.target) (e.target as HTMLImageElement).src = '/placeholder-image.png';
                  }
                "
              />
            </div>

            <div class="p-3">
              <p class="line-clamp-2 min-h-[2.5rem] text-sm font-medium group-hover:text-primary">
                {{ orgProduct.name }}
              </p>

              <div class="mt-2 flex items-baseline justify-between">
                <span class="text-sm font-bold text-primary">
                  ₱{{ calculatePriceWithCommission(orgProduct.price).toFixed(2) }}
                </span>
                <span class="text-xs text-muted-foreground">
                  {{ orgProduct.totalSales }} sold
                </span>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
    </div>

    <!-- Loading Overlay -->
    <div
      v-if="loading"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div class="flex flex-col items-center justify-center gap-4 rounded-lg bg-card p-8 shadow-lg">
        <Icon name="lucide:loader-circle" class="h-12 w-12 animate-spin text-primary" />
        <span class="text-sm font-medium">{{ currentMessage }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAddProductViews } from "~/composables/useAddProductViews";
  import { useAddToCart } from "~/composables/useAddToCart";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { useOrganizationProducts } from "~/composables/useOrganizationProducts";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { collection, doc } from "firebase/firestore";
  import { Carousel, Slide } from "vue3-carousel";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Product, ProductWithId, Variation } from "~/types/models/Product";

  import "vue3-carousel/dist/carousel.css";

  const currentSlide = ref(0);
  const user = useCurrentUser();
  const db = useFirestore();
  const router = useRouter();
  const currentMessage = ref("Adding to your cart");
  const loadingButton = ref(false);
  let messageIndex: number = 0;
  const toast = useToast();

  const slideTo = (val: number) => {
    currentSlide.value = val;
  };

  const crumbs: Crumbs[] = [
    { label: "Home", link: "/", icon: "lucide:house" },
    { label: "All Products", link: "/products", icon: "lucide:box" },
    { label: "Product", link: "/", disabled: true, icon: "lucide:shirt" },
  ];

  const {
    commissionRate,
    fetchCommissionRate,
    clearCache: clearCommissionCache,
  } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  const { addView, countViews } = useAddProductViews();

  const updateMessage = () => {
    const dots = ".".repeat((messageIndex % 3) + 1);
    currentMessage.value = `Adding to your cart${dots}`;
    messageIndex = (messageIndex + 1) % 3;
  };

  const handleProductClick = (productID: string) => {
    // console.log("Product clicked:", productID);
    addView(productID);
  };

  const route = useRoute();
  const productID = computed(() => route.params.id as string);
  const productRef = computed(() =>
    productID.value ? doc(collection(db, "products"), productID.value as string) : null
  );
  const { data: product, pending } = useDocument<Partial<Product>>(productRef);
  // console.log("Data: ", product);
  const allPhotos = computed(() => {
    const prod = unref(product);
    return prod ? [prod.featuredPhotoURL, ...(prod.photosURL ?? [])] : [];
  });

  const variationsRef = computed(() =>
    productID ? collection(doc(db, "products", productID.value as string), "variations") : null
  );
  const { data: variationsSnapshot } = useCollection(variationsRef);

  const variations = computed(() => {
    if (!variationsSnapshot.value) {
      return [];
    }
    return variationsSnapshot.value.map((doc) => {
      return {
        id: doc.id,
        ...doc,
      };
    }) as (Variation & { id: string })[];
  });

  const priceRange = computed(() => {
    if (variations.value.length === 0) return "";

    // Map the prices with the commission applied
    const pricesWithCommission = variations.value.map((v) => calculatePriceWithCommission(v.price));
    const minPrice = Math.min(...pricesWithCommission);
    const maxPrice = Math.max(...pricesWithCommission);
    return minPrice === maxPrice
      ? `₱${minPrice.toFixed(2)}`
      : `₱${minPrice.toFixed(2)} - ₱${maxPrice.toFixed(2)}`;
  });

  const selectedVariationAddToCart = ref<(Variation & { id: string }) | null>(null);
  const quantityAddToCart = ref(1);

  const selectedVariationPreOrder = ref<(Variation & { id: string }) | null>(null);
  const quantityPreOrder = ref(1);

  const selectVariation = (
    variation: Variation & { id: string },
    type: "addToCart" | "preOrder"
  ) => {
    // console.log("Selected Variation: ", variation);
    // console.log("Type: ", type);
    if (type === "addToCart") {
      if (selectedVariationAddToCart.value?.id === variation.id) {
        selectedVariationAddToCart.value = null;
        quantityAddToCart.value = 0;
      } else {
        selectedVariationAddToCart.value = variation;
        quantityAddToCart.value = 1;
      }
    } else {
      if (selectedVariationPreOrder.value?.id === variation.id) {
        selectedVariationPreOrder.value = null;
        quantityPreOrder.value = 0;
      } else {
        selectedVariationPreOrder.value = variation;
        quantityPreOrder.value = 0;
      }
    }
    // console.log("selectedVariationAddToCart: ", selectedVariationAddToCart.value);
    // console.log("selectedVariationPreOrder: ", selectedVariationPreOrder.value);
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

  const isSubmitting = ref(false);

  const submitAddToCart = async (preOrder: boolean) => {
    if (!user.value) {
      router.push("/login");
    } else {
      const selectedVariation = preOrder
        ? selectedVariationPreOrder.value
        : selectedVariationAddToCart.value;
      const quantity = preOrder ? quantityPreOrder.value : quantityAddToCart.value;
      // console.log("Adding to cart...");
      // console.log("Selected Variation: ", selectedVariation);
      if (selectedVariation) {
        try {
          loadingButton.value = true;
          loading.value = true;
          isSubmitting.value = true;
          // console.log("Adding to cart...");
          // console.log("Selected Variation: ", selectedVariation);
          // console.log("Quantity: ", quantity);
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
              loadingButton.value = false;
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
          router.push(`/user/cart/${user.value.uid}`);
        } catch (error) {
          console.error("Error adding to cart:", error);
          toast.toast({
            title: "Error",
            description: "An error occurred while adding the product to your cart.",
            variant: "destructive",
            icon: "lucide:alert-circle",
          });
        } finally {
          isSubmitting.value = false;
          loading.value = false;
          loadingButton.value = false;
        }
      } else {
        toast.toast({
          title: "Error",
          description: "Please select a variation before adding to cart.",
          variant: "destructive",
          icon: "lucide:alert-circle",
        });
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
  const orgProducts = ref<ProductWithId[]>([]);
  const productViewCounts = reactive<Record<string, number>>({});
  const fetchProductViewCounts = async () => {
    // Fetch view count for the current product
    if (product.value?.id) {
      try {
        const viewCount = await countViews(product.value.id);
        productViewCounts[product.value.id] = viewCount;
        // console.log(`Current Product ID: ${product.value.id}, View Count: ${viewCount}`);
      } catch (error) {
        console.error(
          `Error fetching view count for Current Product ID: ${product.value.id}`,
          error
        );
      }
    }

    if (!orgProducts.value || orgProducts.value.length === 0) {
      // console.log("No products found to fetch view counts.");
      return;
    }

    for (const product of orgProducts.value) {
      const viewCount = await countViews(product.id);
      productViewCounts[product.id] = viewCount;
      // console.log(`Product ID: ${product.id}, View Count: ${viewCount}`);
    }
  };
  const orgName = ref<string | null>(null);
  watch(
    product,
    async () => {
      if (product.value?.organizationID) {
        const {
          products,
          fetchOrganizationProducts,
          organizationName,
          clearCache: clearOrgProductsCache,
        } = useOrganizationProducts(product.value.organizationID, productID.value as string);
        try {
          await fetchOrganizationProducts();
          orgProducts.value = products.value.map((p) => ({
            ...p,
            id: p.id,
            price: p.price,
            organization: p.organization,
          }));
          orgName.value = organizationName.value;
          await fetchProductViewCounts();
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

  // Clear cache and fetch fresh data on mount
  onMounted(async () => {
    clearCommissionCache();
    await fetchCommissionRate();

    if (product.value?.organizationID) {
      const { clearCache: clearOrgProductsCache, fetchOrganizationProducts } =
        useOrganizationProducts(product.value.organizationID, productID.value as string);

      clearOrgProductsCache();
      await fetchOrganizationProducts();
    }
  });
</script>
