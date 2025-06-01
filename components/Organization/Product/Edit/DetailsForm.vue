<script lang="ts" setup>
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";
  import type { Product } from "~/types/models/Product";

  const props = defineProps({
    product: Object as PropType<Partial<Product> | null>,
    formData: Object as any,
    categories: Array as PropType<string[]>,
    statusOptions: Array as PropType<string[]>,
    organization: Object as PropType<OrganizationWithId | null>,
    productID: String,
    orgId: [String, Object] as PropType<string | null | Ref<string | null>>,
  });

  // Character counter for product name
  const nameCharCount = computed(() => props.formData?.name?.length || 0);
  const descriptionCharCount = computed(() => props.formData?.description?.length || 0);

  const preOrderEnabled = ref(props.formData?.canPreOrder || false);

  // Function to manually toggle the pre-order state
  const togglePreOrder = () => {
    preOrderEnabled.value = !preOrderEnabled.value;
    if (props.formData) {
      props.formData.canPreOrder = preOrderEnabled.value;
    }
  };

  // Watch for external changes to keep local state in sync
  watch(
    () => props.formData?.canPreOrder,
    (newValue) => {
      if (newValue !== undefined) {
        preOrderEnabled.value = newValue;
      }
    },
    { immediate: true }
  );

  // Best practices for product details
  const bestPractices = [
    "Use clear, descriptive names that help customers understand what your product is",
    "Select the correct category to ensure your product appears in relevant searches",
    "Write detailed descriptions that highlight key features and benefits",
    "For pre-order products, make sure to include expected delivery timeframes in the description",
  ];
</script>

<template>
  <div
    class="mt-4 flex h-auto w-full flex-col items-start rounded-md bg-muted p-4 shadow sm:mt-6 sm:p-6"
  >
    <div class="flex w-full items-start justify-between">
      <div class="flex flex-col items-start gap-1">
        <span class="text-lg font-semibold sm:text-xl md:text-2xl">Product Details</span>
        <p class="text-xs opacity-60 sm:text-sm">
          Edit the details of your product and save the changes.
        </p>
      </div>

      <!-- Best Practices Card -->
      <UiDropdownMenu>
        <UiDropdownMenuTrigger asChild>
          <UiButton variant="ghost" size="sm" class="gap-1">
            <Icon name="lucide:lightbulb" class="h-4 w-4" />
            <span class="hidden sm:inline">Tips</span>
          </UiButton>
        </UiDropdownMenuTrigger>
        <UiDropdownMenuContent class="w-72 p-3">
          <UiDropdownMenuLabel>Best Practices</UiDropdownMenuLabel>
          <UiDropdownMenuSeparator />
          <div class="space-y-2 py-1">
            <div
              v-for="(practice, index) in bestPractices"
              :key="index"
              class="flex items-start px-2 py-1"
            >
              <Icon name="lucide:check-circle" class="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
              <p class="text-left text-xs">{{ practice }}</p>
            </div>
          </div>
        </UiDropdownMenuContent>
      </UiDropdownMenu>
    </div>

    <UiGradientDivider class="mt-3 sm:mt-4" />

    <div class="flex w-full flex-col gap-6 pt-4">
      <!-- Product Name -->
      <div class="space-y-3">
        <div class="flex flex-col gap-2 sm:flex-row">
          <span class="font-semibold">Current Product Name: </span>
          <span class="text-muted-foreground"> {{ product?.name }}</span>
        </div>

        <fieldset>
          <div class="flex items-center justify-between">
            <UiLabel for="name" class="flex items-center gap-2">
              Product Name
              <OrganizationProductEditFormHelpTooltip
                text="Choose a clear, descriptive name that helps customers understand what your product is. Avoid using special characters."
              />
            </UiLabel>
            <span class="text-xs text-muted-foreground">{{ nameCharCount }}/72</span>
          </div>

          <UiInput
            name="name"
            id="name"
            type="text"
            class="w-full"
            v-model="formData.name"
            required
            :class="{ 'border-destructive': nameCharCount > 72 }"
          />

          <p v-if="nameCharCount > 72" class="mt-1 text-xs text-destructive">
            Product name is too long. Maximum 72 characters allowed.
          </p>
        </fieldset>
      </div>

      <!-- Category -->
      <div class="space-y-3">
        <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span class="font-semibold text-muted-foreground">Current Category: </span>
          <span class="font-semibold">{{ product?.category }}</span>
        </div>

        <div class="w-full sm:w-2/3 md:w-1/2 lg:w-4/12">
          <UiLabel for="category" class="mb-2 flex items-center gap-2">
            Category
            <OrganizationProductEditFormHelpTooltip
              text="Select the category that best represents your product to help customers find it."
            />
          </UiLabel>

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

      <!-- Status -->
      <div class="space-y-3">
        <div class="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
          <span class="font-semibold text-muted-foreground">Status:</span>
          <span class="font-semibold">{{ product?.status }}</span>
        </div>

        <div class="w-full sm:w-2/3 md:w-1/2 lg:w-4/12">
          <UiLabel for="status" class="mb-2 flex items-center gap-2">
            Status
            <OrganizationProductEditFormHelpTooltip
              text="Draft products are only visible to you. Published products are visible to customers."
            />
          </UiLabel>

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
          class="flex items-center gap-2 rounded-md bg-muted-foreground/10 p-2 text-xs sm:text-sm"
        >
          <Icon name="lucide:alert-circle" class="h-4 w-4 text-amber-500" />
          The "Publish" option is disabled because the organization is currently hidden. Make the
          organization public to enable publishing.
        </p>
      </div>

      <!-- Description -->
      <div class="space-y-3">
        <UiLabel for="description" class="flex items-center gap-2">
          Product Description
          <OrganizationProductEditFormHelpTooltip
            text="Write a detailed description highlighting key features, benefits, and specifications of your product."
          />
        </UiLabel>

        <div class="relative">
          <UiTextarea
            id="description"
            name="description"
            class="min-h-[120px] w-full"
            v-model="formData.description"
            placeholder="Enter product description"
          />
          <div class="absolute bottom-2 right-2 text-xs text-muted-foreground">
            {{ descriptionCharCount }} characters
          </div>
        </div>
      </div>

      <div
        class="space-y-3 rounded-md bg-secondary/20 p-4"
        :class="{ 'border-2 border-primary': preOrderEnabled }"
      >
        <div class="flex items-start justify-between">
          <span class="font-semibold">Pre-Order Settings </span>
          <OrganizationProductEditFormHelpTooltip
            text="Enable pre-order to allow customers to place orders before the product is available in stock."
          />
        </div>

        <p class="px-2 text-justify text-xs text-muted-foreground sm:px-4 sm:text-sm">
          <span v-if="preOrderEnabled" class="font-medium text-primary">
            Pre-Order is currently enabled.
          </span>
          <span v-else> Pre-Order is currently disabled. </span>
        </p>

        <div class="flex items-center space-x-2 pt-2">
          <div
            @click="togglePreOrder"
            class="relative inline-flex h-6 w-11 cursor-pointer items-center rounded-full"
            :class="preOrderEnabled ? 'bg-primary' : 'bg-muted-foreground/40'"
          >
            <span
              class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform"
              :class="preOrderEnabled ? 'translate-x-5' : 'translate-x-1'"
            ></span>
          </div>
          <span
            @click="togglePreOrder"
            class="cursor-pointer"
            :class="{ 'font-medium text-primary': preOrderEnabled }"
          >
            {{ preOrderEnabled ? "Enabled" : "Disabled" }}
          </span>
        </div>

        <div v-if="preOrderEnabled" class="rounded border-l-2 border-primary bg-primary/10 p-3">
          <p class="text-xs sm:text-sm">
            <strong>Pre-Order Tip:</strong> Make sure to include expected delivery timeframes in
            your product description to set clear expectations for customers.
          </p>
        </div>
      </div>
    </div>

    <div class="mt-6 w-full rounded-md bg-muted-foreground/10 p-4">
      <div class="flex items-center gap-2">
        <Icon name="lucide:tool" class="h-5 w-5 text-primary" />
        <h3 class="font-medium">Advanced Settings</h3>
      </div>
      <div class="mt-2 flex flex-col text-xs text-muted-foreground sm:flex-row sm:text-sm">
        <span>Want to change the variations, prices, and stocks?</span>
        <NuxtLink :to="`/organization/products/inventory/${productID}`">
          <span
            class="mt-1 cursor-pointer text-primary underline underline-offset-2 hover:opacity-80 sm:ml-2 sm:mt-0"
          >
            Click here
          </span>
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
