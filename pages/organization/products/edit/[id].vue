<script lang="ts" setup>
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
  const { data: product, pending, error, promise } = useDocument<Partial<Product>>(productRef);
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
              <UiVeeInput name="name" label="Name" class="w-11/12" required />
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-row items-center gap-2">
                  <span class="font-semibold">Category</span>
                  <span class="text-sm text-muted-foreground">Do you want to change category?</span>
                  <input type="checkbox" v-model="changeCategory" id="changeCategory" />
                </div>
                <div v-if="changeCategory" class="w-4/12">
                  <TransitionSlide>
                    <UiVeeSelect label="Category" name="category">
                      <option disabled value="Category">Category</option>
                      <option v-for="category in categories" :key="category" :value="category">
                        {{ category }}
                      </option>
                    </UiVeeSelect>
                  </TransitionSlide>
                </div>
              </div>
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-row items-center gap-2">
                  <span class="font-semibold">Status</span>
                  <span class="text-sm text-muted-foreground">Do you want to change status?</span>
                  <input type="checkbox" v-model="changeStatus" id="changeStatus" />
                </div>
                <div v-if="changeStatus" class="w-4/12">
                  <TransitionSlide>
                    <UiVeeSelect label="Status" name="status">
                      <option disabled value="Status">Status</option>
                      <option v-for="stat in status" :key="stat" :value="stat">
                        {{ stat }}
                      </option>
                    </UiVeeSelect>
                  </TransitionSlide>
                </div>
              </div>
              <UiVeeTextarea label="Description" name="description" class="w-11/12 pt-4" />
            </fieldset>
          </div>
        </div>
        <!-- Product Images -->
        <div
          class="mx-auto my-4 mb-4 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
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
                <span class="font-semibold">Current Featured Image</span>
                <img
                  src="/assets/images/sample-product.png"
                  alt="Product Image"
                  class="h-auto w-32"
                />
                <div class="flex flex-row items-center gap-2">
                  <span class="text-[12px] text-muted-foreground">Do you want to change?</span>
                  <input type="checkbox" v-model="changeFeaturedImage" id="changeFeaturedImage" />
                </div>
                <div v-if="changeFeaturedImage">
                  <UiVeeFileInput
                    label="Upload Featured Image"
                    name="featured_image"
                    accept="image/*"
                    hint="Max file size: 10MB"
                  />
                </div>
              </div>
              <UiDivider class="py-4" />
              <div class="flex flex-col gap-2">
                <span class="font-semibold">Product Gallery</span>
              </div>
            </fieldset>
          </div>
        </div>
      </div>
    </form>
  </div>
  <div class="min-h-36"></div>
</template>

<style></style>
