<script lang="ts" setup>
  import { useAddProduct } from "~/composables/organization/product/useAddProduct";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { VisuallyHidden } from "radix-vue";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";

  definePageMeta({
    layout: "no-nav",
    middleware: ["org-auth"],
  });

  interface ImagesStepRef {
    resetFileInputs: () => void;
    checkFormForFiles: () => void;
  }

  const router = useRouter();
  const route = useRoute();

  const organizationID = route.params.id as string;
  const organization = ref<OrganizationWithId | null>(null);
  const { getOrganizationById, clearCache: clearOrgCache } = useOrganization();
  const productCache = useProductCacheStore();

  const crumbs: Crumbs[] = [
    {
      label: "Dashboard",
      link: `/organization/dashboard/${organizationID}`,
      icon: "lucide:newspaper",
    },
    {
      label: "All Products",
      link: `/organization/products/${organizationID}`,
      icon: "lucide:package",
    },
    {
      label: "Add Product",
      link: `/organization/products/add/${organizationID}`,
      icon: "lucide:file-plus",
    },
  ];

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
  const variations = ref([{ value: "None", price: 1, stocks: 0 }]);
  const loading = ref(false);
  const canPreOrder = ref(false);
  const currentMessage = ref("");
  const activeStep = ref(1);
  const showGuidance = ref(false);
  const nameLength = ref(0);

  const {
    commissionRate,
    fetchCommissionRate,
    clearCache: clearCommissionCache,
  } = useCommissionRate();

  // References to step components
  const imagesStepRef = ref<ImagesStepRef | null>(null);

  const toast = useToast();

  const stepValidation = reactive([false, false, false, false]);

  // Function to check if the current step is valid
  const isCurrentStepValid = () => {
    const isValid = stepValidation[activeStep.value];
    console.log(`Current step ${activeStep.value} is valid: ${isValid}`); // Debug
    return isValid;
  };

  // Add handlers for each step's validation change
  const handleStep1ValidationChange = (isValid: boolean) => {
    stepValidation[1] = isValid;
  };

  const handleStep2ValidationChange = (isValid: boolean) => {
    stepValidation[2] = isValid;
  };

  const handleStep3ValidationChange = (isValid: boolean) => {
    console.log("Step 3 validation changed to:", isValid); // Debug
    stepValidation[3] = isValid;
    console.log("Step validation array:", stepValidation); // Debug
  };

  const formState = reactive({
    // Step 1 values
    name: "",
    description: "",
    category: "",
    status: "Draft", // Default value
    canPreOrder: false, // Default value

    // Step 2 is handled by variations ref

    // Step 3 - We'll handle files differently
    featuredImage: null as File | null,
    additionalImages: [] as File[],
  });

  const canAccessStep = (stepNumber: number) => {
    // Always allow current or previous steps
    if (stepNumber <= activeStep.value) {
      return true;
    }

    // For future steps, check if all previous steps are valid
    for (let i = 1; i < stepNumber; i++) {
      if (!stepValidation[i]) {
        return false;
      }
    }

    // If the step is exactly one ahead and all previous steps are valid, allow access
    return stepNumber === activeStep.value + 1 && stepValidation[activeStep.value];
  };

  const addVariation = () => {
    if (variations.value.length < 10) {
      variations.value.push({ value: "", price: 1, stocks: 0 });
    } else {
      toast.toast({
        title: "Limit Reached",
        description: "You can only add up to 10 variations.",
        variant: "warning",
        icon: "lucide:alert-circle",
      });
    }
  };

  const removeVariation = (index: number) => {
    if (variations.value.length === 1) return;
    variations.value.splice(index, 1);
  };

  const toggleGuidance = () => {
    showGuidance.value = !showGuidance.value;
  };

  const messages = [
    "Uploading your product...",
    "Almost there...",
    "Just a moment...",
    "Hang tight, we're adding your product...",
    "It should be finished already...",
    "Just a few more seconds...",
    "Thank you for your patience...",
  ];

  let messageIndex = 0;
  const updateMessage = () => {
    currentMessage.value = messages[messageIndex];
    messageIndex = (messageIndex + 1) % messages.length;
  };

  // Stepper Configuration
  const steps = [
    {
      step: 1,
      title: "Product Details",
      description: "Enter the basic information about your product",
    },
    {
      step: 2,
      title: "Variations",
      description: "Add product variations like size, color, etc.",
    },
    {
      step: 3,
      title: "Images",
      description: "Upload product images",
    },
  ];

  const isLastItem = (step: number) => step === steps.length;

  const canGoNext = computed(() => activeStep.value < steps.length);
  const canGoBack = computed(() => activeStep.value > 1);

  const goNext = async () => {
    if (activeStep.value < steps.length && isCurrentStepValid()) {
      activeStep.value++;
    } else if (!isCurrentStepValid()) {
      toast.toast({
        title: "Validation Error",
        description: "Please complete all required fields before proceeding.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    }
  };

  const goBack = () => {
    if (activeStep.value > 1) {
      activeStep.value--;
    }
  };

  // Form Functions
  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: toTypedSchema(AddProductSchema),
  });

  const directAddProduct = async () => {
    console.log("Direct add product function called");

    if (isSubmitting.value) {
      console.log("Already submitting, please wait");
      return;
    }

    if (activeStep.value === 3 && imagesStepRef.value) {
      // This will trigger a re-emission of the files
      imagesStepRef.value.checkFormForFiles();

      // Short delay to ensure events are processed
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Debug state before submission
    console.log("Form state before submission:", formState);
    console.log("Variations before submission:", variations.value);

    console.log("Form state before submission:", {
      ...formState,
      featuredImage: formState.featuredImage
        ? {
            name: formState.featuredImage.name,
            size: formState.featuredImage.size,
            type: formState.featuredImage.type,
          }
        : null,
    });

    // Validate required fields directly from our centralized state
    const missingFields = [];
    if (!formState.name) missingFields.push("Product Name");
    if (!formState.category) missingFields.push("Category");
    if (!formState.status) missingFields.push("Status");
    if (!formState.featuredImage) missingFields.push("Featured Image");

    // Check if any required fields are missing
    if (missingFields.length > 0) {
      const errorMessage = `Required fields are missing: ${missingFields.join(", ")}`;
      console.error(errorMessage);

      toast.toast({
        title: "Validation Error",
        description: errorMessage,
        variant: "destructive",
        icon: "lucide:alert-circle",
      });

      return; // Exit early
    }

    loading.value = true;
    const messageInterval = setInterval(updateMessage, 2000);

    try {
      // Create a product object from our centralized state
      const productData = {
        name: formState.name,
        description: formState.description,
        category: formState.category,
        status: formState.status,
        // Add featured image
        featured_image: formState.featuredImage,
        // Add additional images as an array
        images: formState.additionalImages,
        // Add variations from our reactive state
        variations: variations.value.map((v) => ({
          name: v.value,
          price: v.price,
          stocks: v.stocks,
        })),
      };

      console.log("Submitting product data:", productData);

      // Clear organization cache and fetch organization
      clearOrgCache();
      await getOrganizationById(organizationID);

      // Call your add product function with the data
      await useAddProduct(productData, canPreOrder.value, organizationID);

      // Invalidate the products cache
      productCache.invalidateProductsCache(organizationID);

      // Show success toast
      toast.toast({
        title: "Product Added",
        description: "Your product has been added successfully.",
        variant: "success",
        icon: "lucide:badge-check",
      });

      // Navigate to products page
      router.push(`/organization/products/${organizationID}`);
    } catch (error) {
      console.error("Error adding product:", error);

      toast.toast({
        title: "Error",
        description: "Failed to add the product. Please try again.",
        variant: "warning",
        icon: "lucide:circle-alert",
      });
    } finally {
      clearInterval(messageInterval);
      loading.value = false;
      // Reset state
      resetFormState();
    }
  };

  const resetFormState = () => {
    formState.name = "";
    formState.description = "";
    formState.category = "";
    formState.status = "Draft";
    formState.featuredImage = null;
    formState.additionalImages = [];
    variations.value = [{ value: "None", price: 1, stocks: 0 }];

    if (imagesStepRef.value) {
      try {
        imagesStepRef.value.resetFileInputs();
      } catch (e) {
        console.error("Error resetting file inputs:", e);
      }
    }
  };

  const submit = handleSubmit(async (values) => {
    console.log("Form successfully submitted with values: ", values);
    loading.value = true;
    const messageInterval = setInterval(updateMessage, 2000);

    try {
      clearOrgCache();
      await getOrganizationById(organizationID);

      await useAddProduct(values, canPreOrder.value, organizationID);

      // Invalidate the products cache to ensure fresh data is loaded next time
      productCache.invalidateProductsCache(organizationID);

      toast.toast({
        title: "Product Added",
        description: "Your product has been added successfully.",
        variant: "success",
        icon: "lucide:badge-check",
      });
      router.push(`/organization/products/${organizationID}`);
    } catch (error) {
      console.error("Error adding product:", error);
      toast.toast({
        title: "Error",
        description: "Failed to add the product. Please try again.",
        variant: "warning",
        icon: "lucide:circle-alert",
      });
    } finally {
      clearInterval(messageInterval);
      loading.value = false;
      resetForm();
      variations.value = [{ value: "None", price: 1, stocks: 0 }];
    }
  });

  onMounted(() => {
    clearCommissionCache();
    clearOrgCache();
    fetchCommissionRate();
    getOrganizationById(organizationID)
      .then((org) => {
        organization.value = org;
      })
      .catch((error) => {
        console.error("Error fetching organization:", error);
      });
  });

  watch(
    () => formState.featuredImage,
    (newVal) => {
      console.log("Featured image updated:", newVal?.name || "null");
    },
    { immediate: true }
  );

  watch(
    () => formState.additionalImages,
    (newVal) => {
      console.log(
        "Additional images updated:",
        newVal.length > 0 ? newVal.map((f) => f.name) : "empty"
      );
    },
    { immediate: true }
  );
</script>

<template>
  <div class="mx-auto my-8 max-w-7xl px-4 sm:px-6 lg:px-8">
    <div
      class="flex w-full flex-col rounded-xl bg-gradient-to-b from-green-50 to-slate-50 p-6 shadow-sm sm:p-8 md:p-10"
    >
      <!-- Header Section -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div class="overflow-x-auto pb-2 sm:pb-0">
          <UiBreadcrumbs class="justify-center" :items="crumbs" />
        </div>
        <UiButton
          variant="outline"
          size="sm"
          @click="toggleGuidance"
          class="border-green-200 bg-white shadow-sm hover:bg-green-50"
        >
          <Icon name="lucide:help-circle" class="mr-2 h-4 w-4 text-green-500" />
          {{ showGuidance ? "Hide Tips" : "Show Tips" }}
        </UiButton>
      </div>

      <!-- Quick Tips Panel (conditionally shown) -->
      <UiCollapsible :open="showGuidance" class="mb-8">
        <UiCollapsibleContent>
          <div
            class="rounded-lg border border-amber-200 bg-gradient-to-r from-amber-50 to-amber-100 p-5 shadow-sm"
          >
            <div class="mb-3 flex items-center">
              <Icon name="lucide:lightbulb" class="mr-2 h-5 w-5 text-amber-500" />
              <h3 class="text-base font-medium text-amber-900">Tips for Adding a Great Product</h3>
            </div>
            <div class="space-y-3 text-sm text-amber-800">
              <p class="flex items-start">
                <Icon
                  name="lucide:check-circle"
                  class="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                />
                <span
                  >Use a <strong>clear, descriptive name</strong> that includes key details
                  customers search for.</span
                >
              </p>
              <p class="flex items-start">
                <Icon
                  name="lucide:check-circle"
                  class="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                />
                <span
                  >Include <strong>size, color and other options</strong> as variations to give
                  customers choices.</span
                >
              </p>
              <p class="flex items-start">
                <Icon
                  name="lucide:check-circle"
                  class="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                />
                <span
                  >Add <strong>high-quality images</strong> from multiple angles to showcase your
                  product.</span
                >
              </p>
              <p class="flex items-start">
                <Icon
                  name="lucide:check-circle"
                  class="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600"
                />
                <span
                  >Write a <strong>detailed description</strong> including materials, dimensions,
                  and key features.</span
                >
              </p>
            </div>
          </div>
        </UiCollapsibleContent>
      </UiCollapsible>

      <form @submit.prevent="submit" class="w-full">
        <UiCard class="border border-slate-200">
          <!-- Stepper Navigation -->
          <UiStepper
            v-model="activeStep"
            class="flex w-full items-start justify-between gap-2 border-b p-6"
          >
            <UiStepperItem
              v-for="step in steps"
              :key="step.step"
              v-slot="{ state }"
              class="group relative w-full"
              :step="step.step"
              :class="[isLastItem(step.step) && '!w-fit']"
            >
              <UiStepperTrigger
                as="div"
                class="flex items-center gap-3"
                :class="[
                  isLastItem(step.step) && 'justify-end',
                  !canAccessStep(step.step) && 'pointer-events-none opacity-60', // This prevents clicks when disabled
                ]"
                :disabled="!canAccessStep(step.step)"
                :title="!canAccessStep(step.step) ? 'Complete previous steps first' : ''"
              >
                <UiButton
                  :variant="state == 'completed' || state == 'active' ? 'default' : 'outline'"
                  size="icon-sm"
                  class="z-10 size-8 shrink-0 rounded-full"
                  :class="[
                    state == 'active' &&
                      'ring-2 ring-green-200 ring-offset-2 ring-offset-background',
                    !canAccessStep(step.step) && 'cursor-not-allowed opacity-50',
                  ]"
                >
                  <TransitionScale mode="out-in" :scale="0.8" :duration="100">
                    <Icon v-if="state == 'active'" name="lucide:pen" class="h-4 w-4 text-white" />
                    <Icon
                      v-else-if="state == 'completed'"
                      name="lucide:check"
                      class="h-4 w-4 text-white"
                    />
                    <span v-else>{{ step.step }}</span>
                  </TransitionScale>
                </UiButton>

                <UiStepperTitle
                  :class="[
                    state == 'active' && 'text-green-600',
                    !canAccessStep(step.step) && 'text-slate-400',
                  ]"
                  class="hidden font-medium transition md:block"
                >
                  {{ step.title }}
                </UiStepperTitle>

                <UiStepperSeparator
                  v-if="!isLastItem(step.step)"
                  class="h-0.5 shrink-0 grow rounded-full bg-slate-200 group-data-[state=completed]:bg-green-500"
                  :class="[!canAccessStep(step.step + 1) && 'bg-slate-100']"
                />
                <VisuallyHidden as-child>
                  <UiStepperDescription>{{ step.description }}</UiStepperDescription>
                </VisuallyHidden>
              </UiStepperTrigger>
            </UiStepperItem>
          </UiStepper>

          <!-- Step Content -->
          <div class="overflow-hidden">
            <TransitionSlide
              mode="out-in"
              :duration="100"
              :offset="{
                enter: ['10%', 0],
                leave: ['-10%', 0],
              }"
            >
              <!-- Step 1: Product Details -->
              <OrganizationProductDetailsStep
                v-if="activeStep == 1"
                :isSubmitting="isSubmitting"
                :nameLength="nameLength"
                :categories="categories"
                :statusOptions="statusOptions"
                :organization="organization"
                :canPreOrder="canPreOrder"
                v-model:name="formState.name"
                v-model:description="formState.description"
                v-model:category="formState.category"
                v-model:status="formState.status"
                @update:nameLength="nameLength = $event"
                @update:canPreOrder="canPreOrder = $event"
                @validation-change="handleStep1ValidationChange"
              />

              <!-- Step 2: Variations -->
              <OrganizationProductVariationsStep
                v-if="activeStep == 2"
                :variations="variations"
                :is-submitting="isSubmitting"
                @add="addVariation"
                @remove="removeVariation"
                @validation-change="handleStep2ValidationChange"
              />

              <!-- Step 3: Images -->
              <OrganizationProductImagesStep
                v-if="activeStep == 3"
                ref="imagesStepRef"
                :isSubmitting="isSubmitting"
                @validation-change="handleStep3ValidationChange"
                @update:featuredImage="formState.featuredImage = $event"
                @update:additionalImages="formState.additionalImages = $event"
              />
            </TransitionSlide>
          </div>

          <!-- Navigation Footer -->
          <UiCardFooter class="flex items-center justify-between gap-5 border-t p-6">
            <div class="flex">
              <UiButton
                v-if="canGoBack"
                variant="outline"
                size="sm"
                @click="goBack"
                class="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Icon name="lucide:chevron-left" class="mr-2 h-4 w-4" />
                Back
              </UiButton>
              <UiButton
                v-else
                variant="outline"
                :to="`/organization/products/${organizationID}`"
                class="border-slate-300 text-slate-700 hover:bg-slate-50"
              >
                <Icon name="lucide:x" class="mr-2 h-4 w-4" />
                Cancel
              </UiButton>
            </div>

            <div>
              <UiButton
                v-if="canGoNext"
                size="sm"
                @click="goNext"
                :disabled="!isCurrentStepValid()"
                class="bg-green-600 text-white hover:bg-green-700"
              >
                Next
                <Icon name="lucide:chevron-right" class="ml-2 h-4 w-4" />
              </UiButton>

              <UiButton
                v-else
                type="button"
                size="sm"
                class="bg-green-600 text-white hover:bg-green-700"
                :disabled="isSubmitting"
                :loading="isSubmitting"
                @click="directAddProduct"
              >
                <Icon name="lucide:check" class="mr-2 h-4 w-4" />
                Add Product
              </UiButton>
            </div>
          </UiCardFooter>
        </UiCard>
      </form>
    </div>
  </div>

  <!-- Loading Overlay -->
  <OrganizationProductLoadingOverlay :loading="loading" :message="currentMessage" />
</template>
