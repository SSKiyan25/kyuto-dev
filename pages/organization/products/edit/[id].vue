<script lang="ts" setup>
  import { useEditProduct } from "~/composables/organization/product/useEditProduct";
  import { collection, doc } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Product } from "~/types/models/Product";

  definePageMeta({
    layout: "no-nav",
    middleware: ["auth"],
  });

  // UI State
  const loading = ref(false);
  const toast = useToast();
  const router = useRouter();

  // Constants
  const categories = [
    "T-shirt",
    "Polo-Shirt",
    "Hoodie",
    "Lanyard",
    "Sticker",
    "Umbrella",
    "Totebag",
    "Fan",
    "Mug",
    "Others",
  ];
  const statusOptions = ["Draft", "Publish"];
  const currentMessage = "Please wait while we save your changes...";

  // Product Data
  const route = useRoute();
  const productID = computed(() => route.params.id as string);
  const db = useFirestore();
  const productRef = computed(() => doc(collection(db, "products"), productID.value));
  const { data: product, pending } = useDocument<Partial<Product>>(productRef);

  const orgId = product.value?.organizationID;

  // Constants and Meta
  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: `/organization/dashboard/${orgId}`, icon: "lucide:newspaper" },
    { label: "All Products", link: `/organization/products/${orgId}`, icon: "lucide:package" },
    { label: "Edit Product", icon: "lucide:file-pen-line", disabled: true },
  ];

  console.log("Organization ID: ", orgId);
  // Form data with original values tracking
  const formData = reactive({
    name: "",
    category: "",
    status: "",
    description: "",
    featuredPhoto: "",
    canPreOrder: false,
    photos: [] as string[],
    newPhotos: [] as string[],
  });

  // Track original values for comparison
  const originalData = reactive({ ...formData });

  // Update form data when product loads
  watch(
    product,
    (newProduct) => {
      if (newProduct) {
        formData.name = newProduct.name || "";
        formData.category = newProduct.category || "";
        formData.status = newProduct.status || "";
        formData.description = newProduct.description || "";
        formData.featuredPhoto = newProduct.featuredPhotoURL || "";
        formData.canPreOrder = newProduct.canPreOrder || false;
        formData.photos = newProduct.photosURL || [];
        formData.newPhotos = [];

        // Update original data
        Object.assign(originalData, { ...formData });
      }
    },
    { immediate: true }
  );

  // Computed properties
  const numImages = computed(() => formData.photos.length + formData.newPhotos.length);
  const canAddMoreImages = computed(() => numImages.value < 6);
  const combinedPhotos = computed(() => [...formData.photos, ...formData.newPhotos]);
  const hasChanges = computed(() => {
    return (
      formData.name !== originalData.name ||
      formData.category !== originalData.category ||
      formData.status !== originalData.status ||
      formData.description !== originalData.description ||
      formData.featuredPhoto !== originalData.featuredPhoto ||
      formData.canPreOrder !== originalData.canPreOrder ||
      JSON.stringify([...formData.photos, ...formData.newPhotos]) !==
        JSON.stringify([...originalData.photos])
    );
  });

  const { removeImage, updateProduct } = useEditProduct();

  // Image handling
  const handleRemoveImage = async (photoUrl: string) => {
    loading.value = true;

    if (formData.newPhotos.includes(photoUrl)) {
      formData.newPhotos = formData.newPhotos.filter((photo) => photo !== photoUrl);
    } else if (productID.value) {
      await removeImage(productID.value, photoUrl);
      formData.photos = formData.photos.filter((photo) => photo !== photoUrl);
    }

    loading.value = false;
    toast.toast({
      title: "Image Removed",
      description: "The image has been removed successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
  };

  const handleFeaturedFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.[0]) return;
    formData.featuredPhoto = URL.createObjectURL(input.files[0]);
  };

  const handleGalleryFileChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;

    const files = Array.from(input.files);
    if (numImages.value + files.length > 5) {
      toast.toast({
        title: "Cannot Add More Images",
        description: "You can only add up to 5 images total.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      return;
    }

    formData.newPhotos.push(...files.map((file) => URL.createObjectURL(file)));
  };

  // Validation
  const validateFields = () => {
    const invalidChars = /[<@`#"]/;

    if (!formData.name.trim()) {
      showError("Name cannot be empty");
      return false;
    }

    if (formData.name.length > 72) {
      showError("Name cannot exceed 72 characters");
      return false;
    }

    if (invalidChars.test(formData.name)) {
      showError("Name cannot contain <, @, `, or #");
      return false;
    }

    if (formData.description && invalidChars.test(formData.description)) {
      showError("Description cannot contain <, @, `, or #");
      return false;
    }

    return true;
  };

  function showError(message: string) {
    toast.toast({
      title: "Invalid Input",
      description: message,
      variant: "warning",
      icon: "lucide:triangle-alert",
    });
  }

  // Save changes
  const handleSaveChanges = async () => {
    if (!validateFields()) return;
    if (!hasChanges.value) {
      toast.toast({
        title: "No Changes",
        description: "No changes were made to save.",
        variant: "default",
        icon: "lucide:info",
      });
      return;
    }

    loading.value = true;

    const updatedData: Partial<Product> = {};

    // Only include changed fields
    if (formData.name !== originalData.name) updatedData.name = formData.name;
    if (formData.description !== originalData.description)
      updatedData.description = formData.description;
    if (formData.category !== originalData.category) updatedData.category = formData.category;
    if (formData.status !== originalData.status) updatedData.status = formData.status;
    if (formData.featuredPhoto !== originalData.featuredPhoto)
      updatedData.featuredPhotoURL = formData.featuredPhoto;
    if (JSON.stringify(combinedPhotos.value) !== JSON.stringify(originalData.photos)) {
      updatedData.photosURL = combinedPhotos.value;
    }
    if (formData.canPreOrder !== originalData.canPreOrder)
      updatedData.canPreOrder = formData.canPreOrder;

    if (productID.value && Object.keys(updatedData).length > 0) {
      await updateProduct(productID.value, updatedData);
    }

    loading.value = false;
    toast.toast({
      title: "Changes Saved",
      description: "The changes have been saved successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
    router.push(`/organization/products/${orgId}`);
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
            <div class="flex flex-row gap-2">
              <span class="font-semibold">Product Name: </span>
              <span class="text-muted-foreground"> {{ product?.name }}</span>
            </div>
            <fieldset>
              <UiLabel for="name">Change Product Name</UiLabel>
              <UiInput
                name="name"
                id="name"
                type="text"
                class="w-11/12"
                v-model="formData.name"
                required
              />
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-row items-center gap-2">
                  <span class="font-semibold text-muted-foreground">Current Category: </span>
                  <span class="font-semibold">{{ product?.category }}</span>
                </div>
                <div class="w-4/12">
                  <UiSelect label="Category" name="category" v-model="formData.category">
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
                  <span class="font-semibold">{{ product?.status }}</span>
                </div>
                <div class="w-4/12">
                  <UiSelect label="Category" name="category" v-model="formData.status">
                    <UiSelectTrigger placeholder="Select Category" />
                    <UiSelectContent>
                      <UiSelectLabel>Categories</UiSelectLabel>
                      <UiSelectSeparator />
                      <UiSelectGroup>
                        <UiSelectItem
                          v-for="stat in formData.status ? statusOptions : []"
                          :key="stat"
                          :value="stat"
                          :text="stat"
                        />
                      </UiSelectGroup>
                    </UiSelectContent>
                  </UiSelect>
                </div>
              </div>
              <div class="flex flex-col gap-2 pt-4">
                <span class="font-semibold">Product Description: </span>
                <p class="px-4 text-justify text-[12px] text-muted-foreground">
                  {{ product?.description }}
                </p>
              </div>
              <UiLabel for="description" class="pt-4">Change Description</UiLabel>
              <UiTextarea
                id="description"
                name="description"
                class="w-11/12 pt-4"
                v-model="formData.description"
              />
              <!-- Pre Order-->
              <div class="flex flex-col gap-2 pt-4">
                <span class="font-semibold">Pre-Order settings: </span>
                <p class="px-4 text-justify text-[12px] text-muted-foreground">
                  {{ formData.canPreOrder ? "Pre-Order is enabled." : "Pre-Order is disabled." }}
                </p>
              </div>
              <div class="flex flex-row items-center gap-2 pt-2">
                <span class="text-[12px] text-muted-foreground">Do you want to change it?</span>
              </div>

              <div class="flex flex-row items-center space-x-2 pt-4">
                <input type="checkbox" v-model="formData.canPreOrder" id="canPreOrder" />
                <UiLabel for="canPreOrder">
                  {{ formData.canPreOrder ? "Enabled" : "Disabled" }}
                </UiLabel>
              </div>
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
                      :src="formData.featuredPhoto"
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
                          :src="formData.featuredPhoto"
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
                </div>
                <div class="pb-8">
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

  <div
    v-if="pending"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div class="flex flex-col items-center justify-center gap-4">
      <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
      <span class="text-sm text-muted-foreground"> Fetching data... </span>
      <!-- Add a GIF here -->
    </div>
  </div>
</template>
