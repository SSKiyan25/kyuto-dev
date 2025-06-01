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
  const activeSection = ref("details");

  // Product Data
  const route = useRoute();
  const productID = computed(() => route.params.id as string);
  const db = useFirestore();
  const productRef = computed(() => doc(collection(db, "products"), productID.value));
  const { data: product, pending } = useDocument<Partial<Product>>(productRef);

  const orgId = ref<string | null>(null);
  const { getOrganizationById, clearCache } = useOrganization();
  const organization = ref<OrganizationWithId | null>(null);

  // Breadcrumbs configuration
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

        // Update original data
        Object.assign(originalData, { ...formData });

        // Fetch organization data if orgId is available
        if (orgId.value) {
          clearCache();
          getOrganizationById(orgId.value as string)
            .then((org) => {
              organization.value = org;
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
    // More flexible approach for name validation
    const nameInvalidChars = /[<>@#`"\\{}|$*^~]/;

    // More permissive for description (allows more formatting)
    const descInvalidChars = /[<>{}|$*^]/;

    // Regex to detect HTML tags - keep this as is
    const htmlTagRegex = /<\/?[\w\s="/.':;#-\/\?]+>/gi;

    // Script tags detection (high security priority)
    const scriptTagRegex = /<\s*script\b[^>]*>.*?<\/\s*script\s*>/gi;

    // Basic validation
    if (!formData.name.trim()) {
      showError("Name cannot be empty");
      return false;
    }

    if (formData.name.length > 72) {
      showError("Name cannot exceed 72 characters");
      return false;
    }

    // Name validation (stricter)
    if (nameInvalidChars.test(formData.name)) {
      showError("Product name contains invalid characters");
      return false;
    }

    if (htmlTagRegex.test(formData.name)) {
      showError("Product name cannot contain HTML tags");
      return false;
    }

    // Description validation (more permissive)
    if (formData.description) {
      if (descInvalidChars.test(formData.description)) {
        showError("Description contains invalid characters");
        return false;
      }

      if (htmlTagRegex.test(formData.description)) {
        showError("Description cannot contain HTML tags");
        return false;
      }

      if (scriptTagRegex.test(formData.description)) {
        showError("Description contains potentially unsafe code");
        return false;
      }
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

  // Progress indicator
  const completionSteps = computed(() => {
    const steps = [
      {
        name: "Basic Information",
        complete: !!formData.name && !!formData.category && !!formData.status,
      },
      {
        name: "Description",
        complete: !!formData.description,
      },
      {
        name: "Featured Image",
        complete: !!formData.featuredPhoto,
      },
      {
        name: "Gallery Images",
        complete: formData.photos.length > 0 || formData.newPhotos.length > 0,
      },
    ];

    return steps;
  });

  const completionPercentage = computed(() => {
    const completed = completionSteps.value.filter((step) => step.complete).length;
    return Math.round((completed / completionSteps.value.length) * 100);
  });
</script>

<template>
  <div class="my-8 flex w-full flex-col p-4 sm:p-6 md:p-8">
    <div class="overflow-x-auto pb-4">
      <UiBreadcrumbs class="justify-center" :items="crumbs" />
    </div>

    <!-- Progress Indicator -->
    <div class="mx-auto mb-6 w-full max-w-4xl">
      <div class="mb-2 flex items-center justify-between">
        <h3 class="text-sm font-medium">Product completion</h3>
        <span class="text-sm font-medium">{{ completionPercentage }}%</span>
      </div>
      <div class="h-2.5 w-full rounded-full bg-muted">
        <div
          class="h-2.5 rounded-full bg-primary transition-all duration-500"
          :style="`width: ${completionPercentage}%`"
        ></div>
      </div>
      <div class="mt-2 grid grid-cols-4 gap-2">
        <div
          v-for="(step, index) in completionSteps"
          :key="index"
          class="flex flex-col items-center"
        >
          <div
            class="flex h-6 w-6 items-center justify-center rounded-full border"
            :class="
              step.complete
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-muted-foreground bg-background text-muted-foreground'
            "
          >
            <Icon :name="step.complete ? 'lucide:check' : 'lucide:circle'" class="h-4 w-4" />
          </div>
          <span class="mt-1 text-center text-xs">{{ step.name }}</span>
        </div>
      </div>
    </div>

    <!-- Section Navigation -->
    <div class="mx-auto mb-6 w-full max-w-4xl">
      <div class="flex border-b">
        <button
          @click="activeSection = 'details'"
          class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-all duration-200"
          :class="
            activeSection === 'details'
              ? 'border-primary text-primary'
              : 'border-transparent hover:text-primary/80'
          "
        >
          <Icon name="lucide:clipboard-list" class="mr-2 inline-block h-4 w-4" />
          Product Details
        </button>
        <button
          @click="activeSection = 'images'"
          class="-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-all duration-200"
          :class="
            activeSection === 'images'
              ? 'border-primary text-primary'
              : 'border-transparent hover:text-primary/80'
          "
        >
          <Icon name="lucide:image" class="mr-2 inline-block h-4 w-4" />
          Product Images
        </button>
      </div>
    </div>

    <form class="mx-auto w-full max-w-4xl">
      <!-- Product Details Section -->
      <OrganizationProductEditDetailsForm
        v-if="activeSection === 'details'"
        :product="product"
        :formData="formData"
        :categories="categories"
        :statusOptions="statusOptions"
        :organization="organization"
        :productID="productID"
        :orgId="orgId"
      />

      <!-- Product Images Section -->
      <OrganizationProductEditImageManager
        v-if="activeSection === 'images'"
        :formData="formData"
        :combinedPhotos="combinedPhotos"
        :canAddMoreImages="canAddMoreImages"
        @remove-image="handleRemoveImage"
        @update-featured="handleFeaturedFileChange"
        @update-gallery="handleGalleryFileChange"
      />

      <!-- Save Actions (Fixed at bottom) -->
      <OrganizationProductEditSaveActions
        :hasChanges="hasChanges"
        :orgId="orgId"
        @save="handleSaveChanges"
      />
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
