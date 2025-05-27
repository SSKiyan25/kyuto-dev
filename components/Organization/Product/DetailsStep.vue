<script setup lang="ts">
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";

  const props = defineProps<{
    isSubmitting: boolean;
    nameLength: number;
    categories: string[];
    statusOptions: string[]; // Changed from status to statusOptions
    organization: OrganizationWithId | null;
    canPreOrder: boolean;
    name?: string; // For v-model:name
    description?: string; // For v-model:description
    category?: string; // For v-model:category
    status?: string; // For v-model:status
  }>();

  const emit = defineEmits<{
    (e: "update:name", value: string): void;
    (e: "update:description", value: string): void;
    (e: "update:category", value: string): void;
    (e: "update:status", value: string): void;
    (e: "update:nameLength", value: number): void;
    (e: "update:canPreOrder", value: boolean): void;
    (e: "validation-change", isValid: boolean): void;
  }>();

  const { value: nameValue, errorMessage: nameError } = useField("name");
  const { value: categoryValue, errorMessage: categoryError } = useField("category");
  const { value: statusValue, errorMessage: statusError } = useField("status");
  const { value: descriptionValue, errorMessage: descriptionError } = useField("description");

  watch(
    [
      nameValue,
      categoryValue,
      statusValue,
      descriptionValue,
      nameError,
      categoryError,
      statusError,
      descriptionError,
    ],
    () => {
      const isValid =
        !!nameValue.value &&
        !!categoryValue.value &&
        !!statusValue.value &&
        !nameError.value &&
        !categoryError.value &&
        !statusError.value;
      emit("validation-change", isValid);
    },
    { immediate: true }
  );

  const updateNameLength = (event: Event) => {
    const input = event.target as HTMLInputElement;
    emit("update:nameLength", input.value.length);
  };

  const updatePreOrder = (value: boolean) => {
    emit("update:canPreOrder", value);
  };

  watch(nameValue, (newVal) => {
    emit("update:name", newVal?.toString() || "");
  });

  watch(descriptionValue, (newVal) => {
    emit("update:description", newVal?.toString() || "");
  });

  watch(categoryValue, (newVal) => {
    emit("update:category", newVal?.toString() || "");
  });

  watch(statusValue, (newVal) => {
    emit("update:status", newVal?.toString() || "");
  });

  onMounted(() => {
    // Initialize VeeValidate fields with prop values if they exist
    if (props.name) nameValue.value = props.name;
    if (props.description) descriptionValue.value = props.description;
    if (props.category) categoryValue.value = props.category;
    if (props.status) statusValue.value = props.status || "Draft";

    console.log("Details step mounted with values:", {
      name: nameValue.value,
      description: descriptionValue.value,
      category: categoryValue.value,
      status: statusValue.value,
    });
  });
</script>

<template>
  <UiCardContent class="p-6">
    <div class="mb-4 flex w-full items-center justify-between">
      <div class="flex flex-col items-start gap-1">
        <div class="flex items-center">
          <Icon name="lucide:clipboard-list" class="mr-2 h-5 w-5 text-green-600" />
          <span class="text-lg font-semibold text-slate-800 sm:text-xl">Product Details</span>
        </div>
        <p class="text-xs text-slate-500 sm:text-sm">
          Add a new product to your store. Fill in the details below.
        </p>
      </div>
    </div>

    <UiGradientDivider class="mb-6" />

    <fieldset :disabled="isSubmitting" class="w-full">
      <div class="mb-5">
        <UiVeeInput
          name="name"
          label="Product Name"
          placeholder="Limited to 72 Characters"
          class="w-full"
          required
          @input="updateNameLength"
        >
          <template #description>
            <div class="flex items-center justify-between">
              <span class="text-xs text-slate-500">
                A clear, descriptive name helps customers find your product
              </span>
              <span class="text-xs" :class="nameLength > 60 ? 'text-orange-600' : 'text-slate-500'">
                {{ nameLength }}/72
              </span>
            </div>
          </template>
        </UiVeeInput>
      </div>

      <div class="grid w-full grid-cols-1 gap-5 pt-2 md:grid-cols-2">
        <div>
          <UiVeeSelect
            label="Category"
            name="category"
            required
            class="transition-all duration-200"
          >
            <template #description>
              <span class="text-xs text-slate-500">
                Choose the category that best describes your product
              </span>
            </template>
            <option disabled value="">Select a category</option>
            <option v-for="category in categories" :key="category" :value="category">
              {{ category }}
            </option>
          </UiVeeSelect>
        </div>

        <div>
          <UiVeeSelect label="Status" name="status" required class="transition-all duration-200">
            <template #description>
              <span class="text-xs text-slate-500">
                Draft: Save now, publish later. Publish: Make visible to customers
              </span>
            </template>
            <option disabled value="">Select a status</option>
            <option
              v-for="stat in statusOptions"
              :key="stat"
              :value="stat"
              :disabled="stat === 'Publish' && !organization?.isPublic"
            >
              {{ stat }}
            </option>
          </UiVeeSelect>
        </div>
      </div>

      <div
        v-if="!organization?.isPublic"
        class="mt-4 flex rounded-md border border-amber-200 bg-amber-50 p-4 text-amber-800"
      >
        <Icon name="lucide:alert-triangle" class="h-5 w-5 flex-shrink-0 text-amber-500" />
        <div class="ml-3">
          <h4 class="text-sm font-medium">Organization is hidden</h4>
          <p class="mt-0.5 text-xs">
            The "Publish" option is disabled because the organization is currently hidden. Make the
            organization public to enable publishing.
          </p>
        </div>
      </div>

      <div class="mt-5">
        <UiVeeTextarea
          label="Description"
          name="description"
          placeholder="Describe your product in detail including features, materials, and dimensions"
          class="w-full"
          :rows="4"
        >
          <template #description>
            <span class="text-xs text-slate-500">
              A thorough description improves search visibility and helps customers make informed
              decisions
            </span>
          </template>
        </UiVeeTextarea>
      </div>

      <div class="my-5 flex w-full flex-col justify-start">
        <UiCard class="border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50">
          <UiCardHeader class="p-4">
            <UiCardTitle class="flex items-center text-base text-green-800">
              <Icon name="lucide:calendar" class="mr-2 h-4 w-4 text-green-600" />
              Pre-Order Options
            </UiCardTitle>
            <UiCardDescription class="text-green-600">
              Allow customers to pre-order this product before it's in stock
            </UiCardDescription>
          </UiCardHeader>
          <UiCardContent class="p-4 pt-0">
            <div class="flex items-center space-x-2">
              <UiCheckbox
                id="canPreOrder"
                :checked="canPreOrder"
                @update:checked="updatePreOrder"
              />
              <label
                for="canPreOrder"
                class="text-sm font-medium leading-none text-green-900 peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Enable Pre-Order
              </label>
            </div>
            <p v-if="canPreOrder" class="mt-2 text-xs text-green-700">
              Customers will be able to place orders even if stock shows as zero
            </p>
          </UiCardContent>
        </UiCard>
      </div>
    </fieldset>
  </UiCardContent>
</template>
