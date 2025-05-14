<script lang="ts" setup>
  import { useEditProduct } from "~/composables/organization/product/useEditProduct";
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { collection, doc } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";
  import type { Product } from "~/types/models/Product";

  definePageMeta({
    layout: "no-nav",
    middleware: ["edit-product"],
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

  const orgId = ref<string | null>(null);
  // console.log("Organization ID: ", orgId);
  const { getOrganizationById, clearCache } = useOrganization();
  const organization = ref<OrganizationWithId | null>(null);

  // Constants and Meta
  const crumbs = reactive<Crumbs[]>([
    {
      label: "Dashboard",
      link: "#",
      icon: "lucide:newspaper",
    },
    {
      label: "All Products",
      link: "#",
      icon: "lucide:package",
    },
    { label: "Edit Product", icon: "lucide:file-pen-line", disabled: true },
  ]);

  // Watch orgId and update crumbs dynamically
  watch(
    () => orgId.value,
    (newOrgId) => {
      if (newOrgId) {
        crumbs[0].link = `/organization/dashboard/${newOrgId}`;
        crumbs[1].link = `/organization/products/${newOrgId}`;
      } else {
        crumbs[0].link = "#";
        crumbs[1].link = "#";
      }
    },
    { immediate: true }
  );
  // console.log("Organization ID: ", orgId);
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
        orgId.value = newProduct.organizationID || "";
        // console.log("Organization ID in watch function: ", orgId.value);

        // Update original data
        Object.assign(originalData, { ...formData });

        // Fetch organization data if orgId is available
        if (orgId.value) {
          clearCache();
          getOrganizationById(orgId.value)
            .then((org) => {
              organization.value = org;
              console.log("Fetched organization:", org);
            })
            .catch((error) => {
              console.error("Error fetching organization data:", error);
            });
        }
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

  const validateFields = () => {
    // Regex to detect invalid characters
    const invalidChars = /[<@#`"%;\\\[\]{}|$*^~:/?!+=,\r\n]/;

    // Regex to detect HTML tags
    const htmlTagRegex = /<\/?[\w\s="/.':;#-\/\?]+>/gi;

    if (!formData.name.trim()) {
      showError("Name cannot be empty");
      return false;
    }

    if (formData.name.length > 72) {
      showError("Name cannot exceed 72 characters");
      return false;
    }

    if (invalidChars.test(formData.name)) {
      showError("Name contains invalid characters");
      return false;
    }

    if (htmlTagRegex.test(formData.name)) {
      showError("Name cannot contain HTML tags");
      return false;
    }

    if (formData.description && invalidChars.test(formData.description)) {
      showError("Description contains invalid characters");
      return false;
    }

    if (formData.description && htmlTagRegex.test(formData.description)) {
      showError("Description cannot contain HTML tags");
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
      await updateProduct(productID.value, updatedData, orgId.value as string);
    }

    loading.value = false;
    toast.toast({
      title: "Changes Saved",
      description: "The changes have been saved successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
    router.push(`/organization/products/${orgId.value}`);
  };

  onMounted(() => {
    if (orgId) {
      clearCache();
      getOrganizationById(orgId.value as string)
        .then((org) => {
          organization.value = org;
        })
        .catch((error) => {
          console.error("Error fetching organization data:", error);
        });
    }
  });
</script>

<template>
  <div class="my-8 flex w-full flex-col p-4 sm:p-6 md:p-8">
    <div class="overflow-x-auto pb-4">
      <UiBreadcrumbs class="justify-center" :items="crumbs" />
    </div>

    <form>
      <div class="w-full">
        <!-- Product Details -->
        <div
          class="mt-4 flex h-auto w-full flex-col items-start rounded-md bg-muted p-4 shadow sm:mt-6 sm:p-6"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-lg font-semibold sm:text-xl md:text-2xl">Product Details</span>
            <p class="text-xs opacity-60 sm:text-sm">
              Edit the details of your product and save the changes.
            </p>
          </div>
          <UiGradientDivider class="mt-3 sm:mt-4" />
          <div class="flex w-full flex-col gap-4 pt-4">
            <div class="flex flex-col gap-2 sm:flex-row">
              <span class="font-semibold">Product Name: </span>
              <span class="text-muted-foreground"> {{ product?.name }}</span>
            </div>
            <fieldset>
              <UiLabel for="name">Change Product Name</UiLabel>
              <UiInput
                name="name"
                id="name"
                type="text"
                class="w-full"
                v-model="formData.name"
                required
              />
              <div class="flex w-full flex-col gap-2 pt-4">
                <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <span class="font-semibold text-muted-foreground">Current Category: </span>
                  <span class="font-semibold">{{ product?.category }}</span>
                </div>
                <div class="w-full sm:w-2/3 md:w-1/2 lg:w-4/12">
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
                <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
                  <span class="font-semibold text-muted-foreground">Status:</span>
                  <span class="font-semibold">{{ product?.status }}</span>
                </div>
                <div class="w-full sm:w-2/3 md:w-1/2 lg:w-4/12">
                  <UiSelect label="Status" name="status" v-model="formData.status">
                    <UiSelectTrigger placeholder="Select Status" />
                    <UiSelectContent>
                      <UiSelectLabel>Status</UiSelectLabel>
                      <UiSelectSeparator />
                      <UiSelectGroup>
                        <UiSelectItem
                          v-for="stat in formData.status ? statusOptions : []"
                          :key="stat"
                          :value="stat"
                          :text="stat"
                          :disabled="stat === 'Publish' && !organization?.isPublic"
                        />
                      </UiSelectGroup>
                    </UiSelectContent>
                  </UiSelect>
                </div>
                <!-- Reason for disabling Publish -->
                <p
                  v-if="!organization?.isPublic"
                  class="mt-2 text-xs text-muted-foreground sm:text-sm"
                >
                  The "Publish" option is disabled because the organization is currently hidden.
                  Make the organization public to enable publishing.
                </p>
              </div>
              <UiLabel for="description" class="pt-4">Product Description</UiLabel>
              <UiTextarea
                id="description"
                name="description"
                class="w-full"
                v-model="formData.description"
                placeholder="Enter product description"
              />
              <!-- Pre Order-->
              <div class="flex flex-col gap-2 pt-4">
                <span class="font-semibold">Pre-Order settings: </span>
                <p class="px-2 text-justify text-xs text-muted-foreground sm:px-4 sm:text-sm">
                  {{ formData.canPreOrder ? "Pre-Order is enabled." : "Pre-Order is disabled." }}
                </p>
              </div>
              <div class="flex flex-row items-center gap-2 pt-2">
                <span class="text-xs text-muted-foreground sm:text-sm"
                  >Do you want to change it?</span
                >
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

        <div
          class="mx-auto my-4 flex flex-col text-xs text-muted-foreground sm:my-6 sm:flex-row sm:text-sm"
        >
          <span>Want to change the variations, prices, and stocks?</span>
          <NuxtLink :to="`/organization/products/inventory/${productID}`">
            <span
              class="mt-1 cursor-pointer text-muted-foreground underline underline-offset-2 hover:text-primary sm:ml-2 sm:mt-0"
              >Click here</span
            >
          </NuxtLink>
        </div>

        <!-- Product Images -->
        <div
          class="mt-4 flex h-auto w-full flex-col items-start rounded-md bg-muted p-4 shadow sm:mt-6 sm:p-6"
        >
          <div class="flex flex-col items-start gap-1">
            <span class="text-lg font-semibold sm:text-xl md:text-2xl">Product Images</span>
            <p class="text-xs opacity-60 sm:text-sm">
              You can change your product images here. Make sure to upload high-quality images.
            </p>
          </div>
          <UiGradientDivider class="mt-3 sm:mt-4" />
          <div class="flex w-full flex-col gap-4 pt-4">
            <fieldset>
              <div class="flex flex-col gap-2">
                <span class="font-semibold">Current Featured Photo</span>
                <UiDrawer>
                  <UiDrawerTrigger as-child>
                    <div
                      class="w-full cursor-pointer overflow-hidden rounded-md transition-opacity hover:opacity-80 sm:w-64"
                    >
                      <img
                        :src="formData.featuredPhoto"
                        alt="Product Image"
                        class="h-auto w-full object-cover"
                      />
                    </div>
                  </UiDrawerTrigger>
                  <UiDrawerContent>
                    <div class="mx-auto w-full max-w-screen-md rounded-t-lg p-4 pb-10">
                      <UiDrawerTitle class="mb-1.5"> Current Featured Photo</UiDrawerTitle>
                      <UiDrawerDescription> </UiDrawerDescription>
                      <div class="min-h-[200px] pt-4 text-center sm:min-h-[400px]">
                        <img
                          :src="formData.featuredPhoto"
                          alt="Product Image"
                          class="mx-auto max-h-[250px] sm:max-h-[400px]"
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
              <UiDivider class="my-4 sm:my-6" />
              <div class="flex flex-col">
                <span class="font-semibold">Product Gallery</span>
                <p class="text-xs text-muted-foreground sm:text-sm">
                  You can change the product gallery images here. Click the photo if you want to
                  remove.
                </p>

                <div
                  class="my-4 grid grid-cols-1 gap-4 sm:my-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4"
                >
                  <div v-for="photo in combinedPhotos" :key="photo">
                    <UiDrawer>
                      <UiDrawerTrigger as-child>
                        <div
                          class="cursor-pointer overflow-hidden rounded-md border shadow-sm transition-opacity hover:opacity-80 hover:shadow-md"
                        >
                          <img
                            :src="photo"
                            alt="Product Image"
                            class="aspect-square w-full object-cover"
                          />
                        </div>
                      </UiDrawerTrigger>
                      <UiDrawerContent>
                        <div class="mx-auto w-full max-w-screen-md rounded-t-lg">
                          <UiDrawerTitle class="mb-1.5 text-center"
                            >Are you sure to remove this photo?</UiDrawerTitle
                          >
                          <UiDrawerDescription class="text-center text-xs sm:text-sm">
                            This action cannot be undone.
                          </UiDrawerDescription>
                          <div class="relative min-h-[200px] pt-4">
                            <img
                              :src="photo"
                              alt="Product Image"
                              class="max-h-[250px] w-full object-contain sm:max-h-[400px]"
                            />
                          </div>
                          <UiDrawerClose as-child>
                            <div
                              class="flex flex-col items-center justify-center gap-2 p-4 sm:flex-row"
                            >
                              <UiButton
                                variant="outline"
                                class="w-full opacity-50 hover:opacity-100 sm:w-auto"
                              >
                                Cancel
                              </UiButton>
                              <UiButton
                                @click="handleRemoveImage(photo)"
                                variant="destructive"
                                class="w-full sm:w-auto"
                                >Remove</UiButton
                              >
                            </div>
                          </UiDrawerClose>
                        </div>
                      </UiDrawerContent>
                    </UiDrawer>
                  </div>
                </div>

                <div class="flex flex-row items-center gap-1 pb-2">
                  <span class="text-xs text-muted-foreground sm:text-sm"
                    >Add more images? (Limited to 5 total only)</span
                  >
                </div>
                <div class="pb-4 sm:pb-6">
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

        <div class="my-6 flex flex-col-reverse justify-end gap-3 sm:my-8 sm:flex-row">
          <UiButton
            variant="outline"
            class="w-full sm:w-auto"
            :to="`/organization/products/${orgId}`"
          >
            Cancel
          </UiButton>
          <UiButton
            @click.prevent="handleSaveChanges"
            type="submit"
            class="w-full sm:w-auto"
            :class="{ 'cursor-not-allowed': !canAddMoreImages }"
            :disabled="!canAddMoreImages"
          >
            Save Changes
          </UiButton>
        </div>
      </div>
    </form>
  </div>

  <!-- Loading Overlay -->
  <div
    v-if="loading"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-lg bg-background p-6 shadow-lg"
    >
      <Icon name="lucide:loader-circle" class="size-12 animate-spin text-primary sm:size-16" />
      <span class="text-center text-sm"> {{ currentMessage }}</span>
    </div>
  </div>

  <!-- Pending data Overlay -->
  <div
    v-if="pending"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div
      class="flex flex-col items-center justify-center gap-4 rounded-lg bg-background p-6 shadow-lg"
    >
      <Icon name="lucide:loader-circle" class="size-12 animate-spin text-primary sm:size-16" />
      <span class="text-center text-sm"> Fetching data... </span>
    </div>
  </div>
</template>
