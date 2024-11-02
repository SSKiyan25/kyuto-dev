<script lang="ts" setup>
  import { feature } from "@unovis/ts/components/topojson-map/style";
  import { collection, doc, getDoc } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Product } from "~/types/models/Product";

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard", icon: "lucide:newspaper" },
    { label: "All Products", link: "/organization/products", icon: "lucide:package" },
    {
      label: "Edit Product",
      icon: "lucide:file-pen-line",
      disabled: true,
    },
  ];

  definePageMeta({
    layout: "no-nav",
    middleware: ["auth"],
  });

  const changeCategory = ref(false);
  const changeStatus = ref(false);
  const changeFeaturedImage = ref(false);
  const addMoreImages = ref(false);

  const categories = ["T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];
  const status = ["Draft", "Publish"];

  // Edit Functions
  const route = useRoute();
  const productID = computed(() => route.params.id);
  console.log("current product: ", productID);

  // Fetch Product
  const db = useFirestore();
  const productRef = computed(() =>
    productID.value ? doc(collection(db, "products"), productID.value as string) : null
  );
  const { data: product } = useDocument<Partial<Product>>(productRef);
  const productData = reactive({
    name: "",
    category: "",
    status: "",
    description: "",
    featuredPhoto: "",
    photos: [] as string[],
  });

  watchEffect(() => {
    if (product.value) {
      productData.name = product.value.name || "";
      productData.category = product.value.category || "";
      productData.status = product.value.status || "";
      productData.description = product.value.description || "";
      productData.featuredPhoto = product.value.featuredPhoto || "";
      productData.photos = product.value.photos || [];
    }
  });

  console.log("Product in Edit Page: ", product);
</script>

<template>
  <div class="mb-32 flex h-screen w-full flex-col items-start py-20 pl-20">
    <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
    <form>
      <div class="w-[86rem]">
        <!-- Product Details -->
        <div
          class="mx-auto mt-12 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-2xl font-semibold">Product Details</span>
            <p class="text-sm opacity-60">Edit the details of your product and save the changes.</p>
          </div>
          <UiGradientDivider class="mt-4" />
          <div class="flex w-full flex-col gap-4 pl-4 pt-4">
            <fieldset>
              <UiVeeInput
                name="name"
                label="Name"
                class="w-11/12"
                v-model="productData.name"
                required
              />
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-row items-center gap-2">
                  <span class="font-semibold text-muted-foreground">Current Category: </span>
                  <span class="font-semibold">{{ productData.category }}</span>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <span class="text-[12px] text-muted-foreground"
                    >Do you want to change category?</span
                  >
                  <input type="checkbox" v-model="changeCategory" id="changeCategory" />
                </div>

                <div v-if="changeCategory" class="w-4/12">
                  <TransitionSlide>
                    <UiVeeSelect label="Category" name="category">
                      <option disabled value="Category">Select Category</option>
                      <option
                        v-for="category in categories"
                        :key="category"
                        :value="category"
                        :disabled="category === productData.category"
                      >
                        {{ category }}
                      </option>
                    </UiVeeSelect>
                  </TransitionSlide>
                </div>
              </div>
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-row items-center gap-2">
                  <span class="font-semibold text-muted-foreground">Status:</span>
                  <span class="font-semibold">{{ productData.status }}</span>
                </div>
                <div class="flex flex-row items-center gap-2">
                  <span class="text-[12px] text-muted-foreground"
                    >Do you want to change status?</span
                  >
                  <input type="checkbox" v-model="changeStatus" id="changeStatus" />
                </div>

                <div v-if="changeStatus" class="w-4/12">
                  <TransitionSlide>
                    <UiVeeSelect label="Status" name="status">
                      <option disabled value="Status">Select Status</option>
                      <option
                        v-for="stat in status"
                        :key="stat"
                        :value="stat"
                        :disabled="stat === productData.status"
                      >
                        {{ stat }}
                      </option>
                    </UiVeeSelect>
                  </TransitionSlide>
                </div>
              </div>
              <UiVeeTextarea
                label="Description"
                name="description"
                class="w-11/12 pt-4"
                v-model="productData.description"
              />
            </fieldset>
          </div>
        </div>
        <!-- Product Images -->
        <div
          class="mx-auto my-4 mb-24 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-2xl font-semibold"> Images</span>
            <p class="text-sm opacity-60">
              You can change your product images here. Make sure to upload high-quality images.
            </p>
          </div>
          <UiGradientDivider class="mt-4" />
          <div class="flex w-full flex-col gap-4 pl-4 pt-4">
            <fieldset>
              <div class="flex flex-col gap-2">
                <span class="font-semibold">Current Featured Photo</span>
                <UiDrawer>
                  <UiDrawerTrigger as-child>
                    <img
                      :src="productData.featuredPhoto"
                      alt="Product Image"
                      class="h-auto w-64 cursor-pointer hover:opacity-50 hover:shadow"
                    />
                  </UiDrawerTrigger>
                  <UiDrawerContent>
                    <div class="mx-auto w-full max-w-screen-md rounded-t-lg p-4 pb-10">
                      <UiDrawerTitle class="mb-1.5"> Current Featured Photo</UiDrawerTitle>
                      <UiDrawerDescription>
                        You can change the featured photo after you click the checkbox.
                      </UiDrawerDescription>
                      <div class="min-h-[400px] pt-4">
                        <img
                          :src="productData.featuredPhoto"
                          alt="Product Image"
                          class="h-auto w-full"
                        />
                      </div>
                      <UiDrawerClose class="absolute right-4 top-3 h-7 w-7" asChild>
                        <UiButton variant="ghost" class="opacity-50 hover:opacity-100">
                          <Icon name="lucide:x" />
                        </UiButton>
                      </UiDrawerClose>
                    </div>
                  </UiDrawerContent>
                </UiDrawer>

                <div class="flex flex-row items-center gap-2">
                  <span class="text-[12px] text-muted-foreground"
                    >Do you want to change the photo?</span
                  >
                  <input type="checkbox" v-model="changeFeaturedImage" id="changeFeaturedImage" />
                </div>
                <div v-if="changeFeaturedImage">
                  <fieldset>
                    <UiVeeFileInput
                      label="Upload Featured Image"
                      name="featured_image"
                      accept="image/*"
                      hint="Max file size: 10MB"
                    />
                  </fieldset>
                </div>
              </div>
              <UiDivider class="py-4" />
              <div class="flex flex-col">
                <span class="font-semibold">Product Gallery</span>
                <p class="text-[12px] text-muted-foreground">
                  You can change the product gallery images here. Click the photo if you want to
                  remove.
                </p>
                <div class="flex flex-row flex-wrap justify-center gap-4 py-8">
                  <div v-for="photo in productData.photos" :key="photo">
                    <UiDrawer>
                      <UiDrawerTrigger as-child>
                        <img
                          :src="photo"
                          alt="Product Image"
                          class="h-auto max-w-64 cursor-pointer hover:opacity-50 hover:shadow"
                        />
                      </UiDrawerTrigger>
                      <UiDrawerContent>
                        <div class="mx-auto w-full max-w-screen-md rounded-t-lg">
                          <UiDrawerTitle class="mb-1.5 text-center"
                            >Are you sure to remove this photo?</UiDrawerTitle
                          >
                          <UiDrawerDescription> </UiDrawerDescription>
                          <div class="relative min-h-[400px] pt-4">
                            <img :src="photo" alt="Product Image" class="h-auto w-full" />
                          </div>
                          <UiDrawerClose as-child>
                            <div class="flex flex-row items-center justify-center py-4">
                              <UiButton variant="outline" class="opacity-50 hover:opacity-100">
                                Cancel
                              </UiButton>
                              <UiButton variant="destructive">Remove</UiButton>
                            </div>
                          </UiDrawerClose>
                        </div>
                      </UiDrawerContent>
                    </UiDrawer>
                  </div>
                </div>
                <div class="flex flex-row items-center gap-1 pb-4">
                  <span class="text-[12px] text-muted-foreground">Add more images?</span>

                  <input type="checkbox" v-model="addMoreImages" id="addMoreImages" />
                </div>
                <div v-if="addMoreImages" class="pb-8">
                  <fieldset>
                    <UiVeeFileInput
                      label="Upload More Images"
                      name="gallery_images"
                      accept="image/*"
                      hint="Max file size: 10MB"
                      multiple
                    />
                  </fieldset>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </form>
  </div>
</template>

<style></style>
