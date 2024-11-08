<script lang="ts" setup>
  import { useEditProduct } from "~/composables/organization/product/useEditProduct";
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
  const loading = ref(false);
  const toast = useToast();
  const newPhotos = ref<string[]>([]);
  const router = useRouter();

  const categories = ["T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];
  const status = ["Draft", "Publish"];
  const currentMessage = ref("Saving changes...");

  // Edit Functions
  const route = useRoute();
  const productID = computed(() => route.params.id);

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

  const changedName = ref("");
  const changedDescription = ref("");
  let initialLoad = true;

  watchEffect(() => {
    if (product.value) {
      productData.name = product.value.name || "";
      productData.category = product.value.category || "";
      productData.status = product.value.status || "";
      productData.description = product.value.description || "";
      productData.featuredPhoto = product.value.featuredPhoto || "";
      productData.photos = product.value.photos || [];
      if (initialLoad) {
        changedName.value = productData.name;
        changedDescription.value = productData.description;
        initialLoad = false;
      }
    }
  });

  const selectedCategory = ref(productData.category);
  const selectedStatus = ref(productData.status);

  // Add/Delete Images
  const numImages = computed(() => productData.photos.length + newPhotos.value.length);
  const canAddMoreImages = computed(() => numImages.value < 6);
  const combinedPhotos = computed(() => [...productData.photos, ...newPhotos.value]);
  const { removeImage, updateProduct } = useEditProduct();

  const handleRemoveImage = async (photoUrl: string) => {
    loading.value = true;
    console.log("Removing Image: ", photoUrl);
    if (newPhotos.value.includes(photoUrl)) {
      console.log("Removing from new photos...");
      newPhotos.value = newPhotos.value.filter((photo) => photo !== photoUrl);
    } else if (productID.value) {
      console.log("Removing from database...");
      await removeImage(productID.value as string, photoUrl);
      productData.photos = productData.photos.filter((photo) => photo !== photoUrl);
    }

    loading.value = false;
    toast.toast({
      title: "Image Removed",
      description: "The image has been removed successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
  };

  console.log("New Photos", newPhotos.value);

  const handleFeaturedFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const file = input.files[0];
    const fileUrl = URL.createObjectURL(file);

    productData.featuredPhoto = fileUrl;
  };

  const handleGalleryFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files) return;

    const files = Array.from(input.files);
    const fileUrls = files.map((file) => URL.createObjectURL(file));

    if (productData.photos.length + newPhotos.value.length + fileUrls.length > 5) {
      toast.toast({
        title: "Cannot Add More Images",
        description: "You can only add up to 5 images total.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
    }

    newPhotos.value.push(...fileUrls);
  };

  const validateFields = () => {
    const invalidChars = /[<@`#"]/;
    if (changedName.value.length > 72) {
      toast.toast({
        title: "Invalid Name",
        description: "The name cannot exceed 72 characters.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return false;
    }
    if (changedName.value.length == 0) {
      toast.toast({
        title: "Invalid Name",
        description: "The name cannot be empty.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return false;
    }
    if (invalidChars.test(changedName.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The name cannot contain <, @, `, or #.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return false;
    }
    if (changedDescription.value.length > 200) {
      toast.toast({
        title: "Invalid Description",
        description: "The description cannot exceed 200 characters.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return false;
    }
    if (invalidChars.test(changedDescription.value)) {
      toast.toast({
        title: "Invalid Description",
        description: "The description cannot contain <, @, `, or #.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return false;
    }
    return true;
  };

  // Update Product
  const handleSaveChanges = async () => {
    if (!validateFields()) {
      return;
    }

    loading.value = true;
    const updatedData: Partial<Product> = {};
    if (changeCategory.value) {
      updatedData.category = selectedCategory.value;
    }
    if (changeStatus.value) {
      updatedData.status = selectedStatus.value;
    }
    if (changeFeaturedImage.value) {
      updatedData.featuredPhoto = productData.featuredPhoto;
    }
    if (addMoreImages.value) {
      updatedData.photos = [...productData.photos, ...newPhotos.value];
    }
    if (productID.value) {
      updatedData.name = changedName.value;
      updatedData.description = changedDescription.value;
      await updateProduct(productID.value as string, updatedData);
    }

    console.log("Changed name:", changedName.value);
    console.log("Changed description:", changedDescription.value);
    console.log("Updated Data: ", updatedData);
    newPhotos.value = []; // Clear the new photos array after saving
    loading.value = false;
    toast.toast({
      title: "Changes Saved",
      description: "The changes have been saved successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
    router.push("/organization/products");
  };
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
              <UiLabel for="name">Product Name</UiLabel>
              <UiInput
                name="name"
                id="name"
                type="text"
                class="w-11/12"
                v-model="changedName"
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
                  <UiSelect label="Category" name="category" v-model="selectedCategory">
                    <UiSelectTrigger placeholder="Select Category" />
                    <UiSelectContent>
                      <UiSelectLabel>Categories</UiSelectLabel>
                      <UiSelectSeparator />
                      <UiSelectGroup>
                        <UiSelectItem
                          v-for="category in categories"
                          :key="category"
                          :value="category"
                          :text="category"
                        />
                      </UiSelectGroup>
                    </UiSelectContent>
                  </UiSelect>
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
                  <UiSelect label="Category" name="category" v-model="selectedStatus">
                    <UiSelectTrigger placeholder="Select Category" />
                    <UiSelectContent>
                      <UiSelectLabel>Categories</UiSelectLabel>
                      <UiSelectSeparator />
                      <UiSelectGroup>
                        <UiSelectItem
                          v-for="stat in status"
                          :key="stat"
                          :value="stat"
                          :text="stat"
                        />
                      </UiSelectGroup>
                    </UiSelectContent>
                  </UiSelect>
                </div>
              </div>
              <UiLabel for="description" class="pt-4">Description</UiLabel>
              <UiTextarea
                id="description"
                name="description"
                class="w-11/12 pt-4"
                v-model="changedDescription"
              />
            </fieldset>
          </div>
        </div>
        <div class="mx-auto my-8 flex w-11/12 flex-row text-muted-foreground">
          <span>Want to change the variations, prices, and stocks?</span>
          <NuxtLink :to="`/organization/products/inventory/${productID}`">
            <span
              class="ml-2 cursor-pointer text-muted-foreground underline underline-offset-2 hover:text-primary"
              >Click here</span
            >
          </NuxtLink>
        </div>
        <!-- Product Images -->
        <div
          class="mx-auto my-4 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-2xl font-semibold">Product Images</span>
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
                        <UiButton
                          variant="outline"
                          class="text-destructive opacity-50 hover:opacity-100"
                        >
                          <Icon name="lucide:x" class="size-4" />
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
                    <UiLabel for="featured_image">Change Featured Photo</UiLabel>
                    <UiInput
                      type="file"
                      id="featured_image"
                      @change="handleFeaturedFileChange"
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
                  <div v-for="photo in combinedPhotos" :key="photo">
                    <UiDrawer>
                      <UiDrawerTrigger as-child>
                        <img
                          :src="photo"
                          alt="Product Image"
                          class="h-auto max-w-64 cursor-pointer rounded-sm hover:opacity-50 hover:shadow"
                        />
                      </UiDrawerTrigger>
                      <UiDrawerContent>
                        <div class="mx-auto w-full max-w-screen-md rounded-t-lg">
                          <UiDrawerTitle class="mb-1.5 text-center"
                            >Are you sure to remove this photo?</UiDrawerTitle
                          >
                          <UiDrawerDescription> </UiDrawerDescription>
                          <div class="relative min-h-[200px] pt-4">
                            <img
                              :src="photo"
                              alt="Product Image"
                              class="h-96 w-full object-cover"
                            />
                          </div>
                          <UiDrawerClose as-child>
                            <div class="flex flex-row items-center justify-center gap-2 py-4">
                              <UiButton variant="outline" class="opacity-50 hover:opacity-100">
                                Cancel
                              </UiButton>
                              <UiButton @click="handleRemoveImage(photo)" variant="destructive"
                                >Remove</UiButton
                              >
                            </div>
                          </UiDrawerClose>
                        </div>
                      </UiDrawerContent>
                    </UiDrawer>
                  </div>
                </div>
                <div class="flex flex-row items-center gap-1 pb-4">
                  <span class="text-[12px] text-muted-foreground"
                    >Add more images? (Limited to 5 total only)</span
                  >
                  <input type="checkbox" v-model="addMoreImages" id="addMoreImages" />
                </div>
                <div v-if="addMoreImages" class="pb-8">
                  <fieldset>
                    <UiLabel for="photos">Add More Images</UiLabel>
                    <UiInput
                      type="file"
                      id="photos"
                      accept="image/*"
                      @change="handleGalleryFileChange"
                      :disabled="!canAddMoreImages"
                      multiple
                    />
                  </fieldset>
                </div>
              </div>
            </fieldset>
          </div>
        </div>
        <div class="mb-24 flex w-full flex-row justify-end px-14">
          <UiButton variant="outline" class="mr-4" to="/organization/products">Cancel</UiButton>
          <UiButton
            @click.prevent="handleSaveChanges"
            type="submit"
            :class="{ 'cursor-not-allowed': !canAddMoreImages }"
            :disabled="!canAddMoreImages"
            >Save Changes</UiButton
          >
        </div>
      </div>
    </form>
  </div>
  <div
    v-if="loading"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div class="flex flex-col items-center justify-center gap-4">
      <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
      <span class="text-sm text-muted-foreground"> {{ currentMessage }}</span>
      <!-- Add a GIF here -->
    </div>
  </div>
</template>
