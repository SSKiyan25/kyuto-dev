<script setup lang="ts">
  import { ref } from "vue";

  defineProps<{
    isSubmitting: boolean;
  }>();

  const emit = defineEmits<{
    (e: "validation-change", isValid: boolean): void;
    (e: "update:featuredImage", file: File | null): void;
    (e: "update:additionalImages", files: File[]): void;
  }>();

  const featuredImageForm = ref<HTMLFormElement | null>(null);
  const featuredImageSelected = ref(false);

  // Method to reset file inputs that actually works
  const resetFileInputs = () => {
    if (featuredImageForm.value) {
      featuredImageForm.value.reset();
      featuredImageSelected.value = false;
      emit("update:featuredImage", null);
      emit("update:additionalImages", []);
      emit("validation-change", false);
    }
  };

  const checkFormForFiles = () => {
    // Get the file input elements from the form
    const featuredInput = featuredImageForm.value?.querySelector(
      'input[name="featured_image"]'
    ) as HTMLInputElement;
    const additionalInput = featuredImageForm.value?.querySelector(
      'input[name="images"]'
    ) as HTMLInputElement;

    // Re-emit the files that are already selected
    if (featuredInput?.files?.length) {
      const file = featuredInput.files[0];
      emit("update:featuredImage", file);
      featuredImageSelected.value = true;
      emit("validation-change", true);

      console.log("Re-emitting featured image:", file.name);
    }

    if (additionalInput?.files?.length) {
      const files = Array.from(additionalInput.files);
      emit("update:additionalImages", files);

      console.log(
        "Re-emitting additional images:",
        files.map((f) => f.name)
      );
    }
  };

  const onFeaturedImageChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;

    featuredImageSelected.value = !!file;
    emit("validation-change", featuredImageSelected.value);

    // Also emit the file itself
    emit("update:featuredImage", file);
    console.log("Featured image selected:", {
      name: file?.name,
      size: file?.size,
      type: file?.type,
    });
  };

  const onAdditionalImagesChange = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const files = input.files ? Array.from(input.files) : [];

    // Emit the files
    emit("update:additionalImages", files);
    console.log("Additional images selected:", {
      count: files.length,
      names: files.map((f) => f.name),
    });
  };

  onMounted(() => {
    // Check for files after a short delay to ensure inputs are ready
    setTimeout(checkFormForFiles, 100);
  });

  // Expose the reset method to parent
  defineExpose({
    resetFileInputs,
    checkFormForFiles,
  });
</script>

<template>
  <UiCardContent class="p-6">
    <div class="mb-4 flex w-full items-center justify-between">
      <div class="flex flex-col items-start gap-1">
        <div class="flex items-center">
          <Icon name="lucide:image" class="mr-2 h-5 w-5 text-green-600" />
          <span class="text-lg font-semibold text-slate-800 sm:text-xl">Product Images</span>
        </div>
        <p class="text-xs text-slate-500 sm:text-sm">
          Add high-quality images to showcase your product from different angles.
        </p>
      </div>
    </div>

    <UiGradientDivider class="mb-6" />

    <!-- Wrap all file inputs in a form for easy reset -->
    <form ref="featuredImageForm" @submit.prevent class="w-full">
      <fieldset :disabled="isSubmitting" class="w-full">
        <!-- Featured Image -->
        <div
          class="mb-6 rounded-lg border border-amber-100 bg-gradient-to-r from-amber-50 to-yellow-50 p-5"
        >
          <div class="mb-3 flex items-center">
            <Icon name="lucide:star" class="mr-2 h-4 w-4 text-amber-600" />
            <h3 class="text-sm font-medium text-amber-900">Featured Image (Required)</h3>
          </div>
          <p class="mb-4 text-xs text-amber-800">
            This will be the main image displayed in product listings and at the top of your product
            page. Use a clear, high-quality image with good lighting.
          </p>

          <UiVeeFileInput
            label="Upload Featured Image"
            name="featured_image"
            accept="image/*"
            class="w-full"
            required
          >
            <template #description>
              <span class="text-xs text-amber-700">
                Recommended size: 1200 x 1200px. Max file size: 10MB
              </span>
            </template>
            <template #default="{ id }">
              <input
                :id="id"
                type="file"
                name="featured_image"
                accept="image/*"
                required
                @change="onFeaturedImageChange"
                class="hidden"
              />
            </template>
          </UiVeeFileInput>

          <!-- Visual validation state -->
          <div class="mt-3 flex items-center" v-if="featuredImageSelected">
            <Icon name="lucide:check-circle" class="mr-1 h-4 w-4 text-green-600" />
            <span class="text-xs text-green-700">Image selected</span>
          </div>
          <div class="mt-3 flex items-center" v-else>
            <Icon name="lucide:alert-circle" class="mr-1 h-4 w-4 text-amber-600" />
            <span class="text-xs text-amber-700">Please select a featured image</span>
          </div>
        </div>

        <!-- Additional Images -->
        <div
          class="rounded-lg border border-green-100 bg-gradient-to-r from-green-50 to-emerald-50 p-5"
        >
          <div class="mb-3 flex items-center">
            <Icon name="lucide:images" class="mr-2 h-4 w-4 text-green-600" />
            <h3 class="text-sm font-medium text-green-900">Additional Images (Optional)</h3>
          </div>
          <p class="mb-4 text-xs text-green-800">
            Add more images to show your product from different angles or highlight specific
            features. Customers who see multiple images are more likely to purchase.
          </p>

          <UiVeeFileInput
            multiple
            label="Upload Additional Images"
            name="images"
            accept="image/*"
            class="w-full"
          >
            <template #description>
              <span class="text-xs text-green-700">
                You can select multiple images. Max file size: 10MB each
              </span>
            </template>
            <template #default="{ id }">
              <input
                :id="id"
                type="file"
                name="images"
                accept="image/*"
                multiple
                class="hidden"
                @change="onAdditionalImagesChange"
              />
            </template>
          </UiVeeFileInput>
        </div>
      </fieldset>
    </form>
  </UiCardContent>
</template>
