<script lang="ts" setup>
  defineProps({
    formData: Object as any,
    combinedPhotos: {
      type: Array as PropType<string[]>,
      required: true,
    },
    canAddMoreImages: Boolean,
  });

  defineEmits(["remove-image", "update-featured", "update-gallery"]);

  // Image best practices
  const imageBestPractices = [
    "Use high-quality images with good lighting to showcase your product clearly",
    "Keep a consistent image style for all product photos",
    "Featured image should show the main view of your product",
    "Include different angles and details in your gallery images",
    "Use a white or neutral background for professional looking product images",
  ];

  const draggedPhoto = ref<string | null>(null);
  const isDragging = ref(false);

  const handleDragStart = (photo: string) => {
    draggedPhoto.value = photo;
    isDragging.value = true;
  };

  const handleDragEnd = () => {
    draggedPhoto.value = null;
    isDragging.value = false;
  };

  const triggerPhotoInputClick = () => {
    const photoInput = document.getElementById("photos");
    if (photoInput) {
      photoInput.click();
    }
  };
</script>

<template>
  <div
    class="mt-4 flex h-auto w-full flex-col items-start rounded-md bg-muted p-4 shadow sm:mt-6 sm:p-6"
  >
    <div class="flex w-full items-start justify-between">
      <div class="flex flex-col items-start gap-1">
        <span class="text-lg font-semibold sm:text-xl md:text-2xl">Product Images</span>
        <p class="text-xs opacity-60 sm:text-sm">
          You can change your product images here. Make sure to upload high-quality images.
        </p>
      </div>

      <!-- Best Practices Card -->
      <UiDropdown>
        <UiDropdownTrigger>
          <UiButton variant="ghost" size="sm" class="gap-1">
            <Icon name="lucide:image" class="h-4 w-4" />
            <span class="hidden sm:inline">Image Tips</span>
          </UiButton>
        </UiDropdownTrigger>
        <UiDropdownContent class="w-72 p-4" align="end">
          <h3 class="mb-2 text-sm font-medium">Image Best Practices</h3>
          <ul class="space-y-2">
            <li v-for="(practice, index) in imageBestPractices" :key="index" class="flex text-xs">
              <Icon name="lucide:check-circle" class="mr-2 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{{ practice }}</span>
            </li>
          </ul>
        </UiDropdownContent>
      </UiDropdown>
    </div>

    <UiGradientDivider class="mt-3 sm:mt-4" />

    <div class="flex w-full flex-col gap-6 pt-4">
      <!-- Featured Image Section -->
      <div class="space-y-4">
        <div class="flex flex-col gap-2">
          <div class="flex items-center gap-2">
            <span class="font-semibold">Featured Product Image</span>
            <OrganizationProductEditFormHelpTooltip
              text="This is the main image customers will see first. Use a clear, high-quality photo that best represents your product."
            />
          </div>

          <p class="text-xs text-muted-foreground">
            This image appears in search results and is the first image customers see
          </p>

          <UiDrawer>
            <UiDrawerTrigger as-child>
              <div class="group relative">
                <div
                  class="w-full max-w-xs cursor-pointer overflow-hidden rounded-md border-2 border-dashed border-muted-foreground/20 bg-muted-foreground/5 transition-all hover:border-primary/50 hover:bg-primary/5 sm:w-64"
                >
                  <div
                    v-if="!formData.featuredPhoto"
                    class="flex flex-col items-center justify-center p-8 text-center"
                  >
                    <Icon name="lucide:image-plus" class="mb-2 size-12 text-muted-foreground" />
                    <span class="text-sm text-muted-foreground">No featured image selected</span>
                    <span class="mt-2 text-xs text-muted-foreground">Click to upload</span>
                  </div>
                  <img
                    v-else
                    :src="formData.featuredPhoto"
                    alt="Product Image"
                    class="aspect-square h-auto w-full object-cover"
                  />
                </div>
                <div
                  class="absolute inset-0 flex items-center justify-center rounded-md bg-black/40 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span class="text-sm font-medium text-white">Click to preview</span>
                </div>
              </div>
            </UiDrawerTrigger>
            <UiDrawerContent>
              <div class="mx-auto w-full max-w-screen-md rounded-t-lg p-4 pb-10">
                <UiDrawerTitle class="mb-1.5"> Featured Product Image</UiDrawerTitle>
                <UiDrawerDescription
                  >High-quality images help customers make purchase decisions</UiDrawerDescription
                >
                <div class="min-h-[200px] pt-4 text-center sm:min-h-[400px]">
                  <img
                    v-if="formData.featuredPhoto"
                    :src="formData.featuredPhoto"
                    alt="Product Image"
                    class="mx-auto max-h-[250px] sm:max-h-[400px]"
                  />
                  <div
                    v-else
                    class="flex h-[250px] flex-col items-center justify-center rounded-md bg-muted-foreground/5 sm:h-[400px]"
                  >
                    <Icon name="lucide:image-off" class="size-16 text-muted-foreground" />
                    <span class="mt-4 text-muted-foreground">No featured image uploaded</span>
                  </div>
                </div>
                <UiDrawerClose class="absolute right-4 top-3 h-7 w-7" asChild>
                  <UiButton variant="outline" class="text-destructive opacity-50 hover:opacity-100">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </UiDrawerClose>
              </div>
            </UiDrawerContent>
          </UiDrawer>

          <fieldset class="mt-4">
            <UiLabel for="featured_image" class="flex items-center gap-2">
              Change Featured Photo
              <OrganizationProductEditFormHelpTooltip
                text="Upload a new featured image. Use square images (1:1 ratio) for best results."
              />
            </UiLabel>
            <UiInput
              type="file"
              id="featured_image"
              @change="$emit('update-featured', $event)"
              accept="image/*"
              hint="Max file size: 10MB. Recommended size: 1000x1000px"
              class="mt-1"
            />
          </fieldset>
        </div>
      </div>

      <UiDivider />

      <!-- Product Gallery -->
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="font-semibold">Product Gallery</span>
            <OrganizationProductEditFormHelpTooltip
              text="Add up to 5 additional images to showcase different angles and details of your product."
            />
          </div>
          <span class="rounded-full bg-muted-foreground/10 px-2 py-1 text-xs text-muted-foreground">
            {{ combinedPhotos.length }}/5 images
          </span>
        </div>

        <p class="text-xs text-muted-foreground">
          Click an image to preview or remove it. You can add up to 5 gallery images.
        </p>

        <!-- Empty state -->
        <div
          v-if="combinedPhotos.length === 0"
          class="rounded-md border-2 border-dashed border-muted-foreground/20 p-8 text-center"
        >
          <Icon name="lucide:images" class="mx-auto mb-4 size-12 text-muted-foreground" />
          <h3 class="mb-1 text-sm font-medium">No gallery images</h3>
          <p class="mb-4 text-xs text-muted-foreground">
            Add multiple images to show different angles and details of your product
          </p>
          <UiButton size="sm" variant="outline" class="mx-auto" @click="triggerPhotoInputClick">
            <Icon name="lucide:plus" class="mr-1 size-4" /> Add Images
          </UiButton>
        </div>

        <!-- Gallery grid -->
        <div v-else class="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <div
            v-for="photo in combinedPhotos"
            :key="photo"
            class="group relative"
            draggable="true"
            @dragstart="handleDragStart(photo)"
            @dragend="handleDragEnd"
          >
            <UiDrawer>
              <UiDrawerTrigger as-child>
                <div
                  class="aspect-square cursor-pointer overflow-hidden rounded-md border shadow-sm transition-all hover:shadow-md"
                  :class="{ 'border-2 border-primary': draggedPhoto === photo }"
                >
                  <img :src="photo" alt="Product Image" class="h-full w-full object-cover" />
                </div>
              </UiDrawerTrigger>
              <UiDrawerContent>
                <div class="mx-auto w-full max-w-screen-md rounded-t-lg">
                  <UiDrawerTitle class="mb-1.5 text-center">Gallery Image</UiDrawerTitle>
                  <UiDrawerDescription class="text-center text-xs sm:text-sm">
                    Would you like to remove this image from your product gallery?
                  </UiDrawerDescription>
                  <div class="relative min-h-[200px] pt-4">
                    <img
                      :src="photo"
                      alt="Product Image"
                      class="max-h-[250px] w-full object-contain sm:max-h-[400px]"
                    />
                  </div>
                  <UiDrawerClose as-child>
                    <div class="flex flex-col items-center justify-center gap-2 p-4 sm:flex-row">
                      <UiButton
                        variant="outline"
                        class="w-full opacity-50 hover:opacity-100 sm:w-auto"
                      >
                        Cancel
                      </UiButton>
                      <UiButton
                        @click="$emit('remove-image', photo)"
                        variant="destructive"
                        class="w-full sm:w-auto"
                      >
                        Remove Image
                      </UiButton>
                    </div>
                  </UiDrawerClose>
                </div>
              </UiDrawerContent>
            </UiDrawer>

            <!-- Hover overlay -->
            <div
              class="absolute inset-0 flex items-center justify-center rounded-md bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
            >
              <div class="flex flex-col items-center">
                <span class="mb-2 text-xs font-medium text-white">Click to preview</span>
                <UiButton
                  size="sm"
                  variant="destructive"
                  @click.stop="$emit('remove-image', photo)"
                >
                  <Icon name="lucide:trash-2" class="mr-1 size-3" /> Remove
                </UiButton>
              </div>
            </div>
          </div>

          <!-- Add more images button -->
          <div
            v-if="canAddMoreImages"
            class="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-muted-foreground/20 p-4 transition-all hover:border-primary/50 hover:bg-primary/5"
            @click="triggerPhotoInputClick"
          >
            <Icon name="lucide:plus-circle" class="mb-2 size-8 text-muted-foreground" />
            <span class="text-center text-xs text-muted-foreground">Add more images</span>
          </div>
        </div>

        <div class="pb-4 sm:pb-6">
          <fieldset>
            <UiLabel for="photos" class="flex items-center gap-2">
              Add Gallery Images
              <OrganizationProductEditFormHelpTooltip
                text="You can upload up to 5 images for your product gallery. Use consistent lighting and style for all images."
              />
            </UiLabel>
            <UiInput
              type="file"
              id="photos"
              accept="image/*"
              @change="$emit('update-gallery', $event)"
              :disabled="!canAddMoreImages"
              multiple
              class="mt-1"
            />
            <p v-if="!canAddMoreImages" class="mt-1 flex items-center gap-1 text-xs text-amber-600">
              <Icon name="lucide:alert-triangle" class="size-3" />
              You've reached the maximum of 5 gallery images.
            </p>
          </fieldset>
        </div>
      </div>
    </div>
  </div>
</template>
