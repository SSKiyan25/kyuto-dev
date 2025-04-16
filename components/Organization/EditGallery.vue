<!-- components/OrganizationGalleryModal.vue -->
<template>
  <UiDialog v-model:open="editDialog">
    <UiDialogContent class="max-w-4xl overflow-y-auto">
      <UiDialogHeader>
        <UiDialogTitle>Edit Gallery Images</UiDialogTitle>
        <UiDialogDescription>
          Manage your organization's gallery images (Max 10 images)
        </UiDialogDescription>
      </UiDialogHeader>
      <form @submit.prevent="submit">
        <fieldset class="grid grid-cols-1 gap-5" :disabled="isSubmitting">
          <!-- Image Upload Section -->
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <label class="text-sm font-medium">Gallery Images</label>
              <span class="text-xs text-muted-foreground">
                {{ currentImageCount }} / 10 images
              </span>
            </div>

            <div v-if="imageError" class="text-sm text-destructive">{{ imageError }}</div>
            <!-- Overlay when submitting -->
            <div
              v-if="isSubmitting"
              class="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
            >
              <Icon name="lucide:loader" class="animate-spin text-white" />
            </div>

            <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              <!-- Existing Images -->
              <div v-for="(image, index) in existingImages" :key="index" class="group relative">
                <img
                  :src="image.url || '/placeholder-img.jpg'"
                  alt="Gallery image"
                  class="h-32 w-full rounded-lg border-2 border-primary/70 object-cover"
                />
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon name="lucide:x" class="size-4" />
                </button>
              </div>

              <!-- Upload Button -->
              <label
                v-if="currentImageCount < 10"
                class="flex h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 transition-colors hover:bg-muted"
              >
                <Icon name="lucide:plus" class="size-6 text-muted-foreground" />
                <span class="mt-1 text-xs text-muted-foreground">Add Images</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleImageUpload"
                  :disabled="currentImageCount >= 10"
                />
              </label>
            </div>
          </div>

          <UiDialogFooter>
            <UiDialogClose as-child>
              <UiButton variant="outline" type="button"> Cancel </UiButton>
            </UiDialogClose>
            <UiButton type="submit" :loading="isSubmitting">
              <span v-if="!isSubmitting">Save Changes</span>
              <span v-else>Saving...</span>
            </UiButton>
          </UiDialogFooter>
        </fieldset>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { doc, updateDoc } from "firebase/firestore";
  import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
  } from "firebase/storage";
  import { computed, ref } from "vue";

  const props = defineProps({
    organizationId: {
      type: String,
      required: true,
    },
    currentImages: {
      type: Array as PropType<Array<{ url: string; path: string }>>,
      default: () => [],
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "success"]);

  const editDialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  // Image handling
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_IMAGES = 10;
  const existingImages = ref([...props.currentImages]);
  const newImages = ref<File[]>([]);
  const imagesToDelete = ref<string[]>([]);
  const imageError = ref("");
  const isSubmitting = ref(false);

  const currentImageCount = computed(() => {
    // Count remaining existing images (not marked for deletion)
    const remainingExisting = existingImages.value.filter(
      (img) => img.path && !imagesToDelete.value.includes(img.path)
    ).length;

    // Count new images that haven't been removed
    const remainingNew = newImages.value.length;

    return remainingExisting + remainingNew;
  });

  const removeImage = (index: number) => {
    const image = existingImages.value[index];

    if (image.path) {
      // Existing image - mark for deletion
      imagesToDelete.value.push(image.path);
    } else {
      // New image - remove from newImages array
      const newIndex = existingImages.value.slice(0, index).filter((img) => !img.path).length;
      newImages.value.splice(newIndex, 1);
    }

    // Remove from displayed images
    existingImages.value.splice(index, 1);
  };

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    imageError.value = "";

    if (!input.files?.length) return;

    const availableSlots = MAX_IMAGES - currentImageCount.value;
    const files = Array.from(input.files).slice(0, availableSlots);

    if (input.files.length > availableSlots) {
      imageError.value = `Only ${availableSlots} images can be added`;
    }

    const validFiles = files.filter((file) => {
      if (file.size > MAX_FILE_SIZE) {
        imageError.value = `${file.name} exceeds 10MB limit`;
        return false;
      }
      return true;
    });

    newImages.value = [...newImages.value, ...validFiles];
    validFiles.forEach((file) => {
      existingImages.value.push({
        url: URL.createObjectURL(file),
        path: "",
      });
    });

    input.value = "";
  };

  // Firebase operations
  const storage = getStorage();
  const db = useFirestore();
  const toast = useToast();

  const submit = async () => {
    try {
      if (currentImageCount.value > MAX_IMAGES) {
        throw new Error("Maximum 10 images allowed");
      }

      // Delete marked images
      if (imagesToDelete.value.length > 0) {
        await Promise.all(
          imagesToDelete.value.map((path) => deleteObject(storageRef(storage, path)))
        );
      }

      isSubmitting.value = true;

      // Upload new images
      const uploaded = await Promise.all(
        newImages.value.map(async (file) => {
          const path = `organizations/${props.organizationId}/gallery/${Date.now()}_${file.name}`;
          const ref = storageRef(storage, path);
          await uploadBytes(ref, file);
          const url = await getDownloadURL(ref);
          return { url, path };
        })
      );

      // Combine images
      const finalImages = [
        ...existingImages.value
          .filter((img) => !img.url.startsWith("blob:") && img.path)
          .map((img) => ({ url: img.url, path: img.path })),
        ...uploaded,
      ];

      // Update Firestore
      await updateDoc(doc(db, "organizations", props.organizationId), {
        imagesURL: finalImages,
        lastModified: Date.now(),
      });

      emit("success");
      editDialog.value = false;
      toast.toast({ title: "Gallery updated", variant: "default" });
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to update gallery",
        variant: "destructive",
      });
    } finally {
      isSubmitting.value = false;
      existingImages.value.forEach((img) => {
        if (img.url.startsWith("blob:")) URL.revokeObjectURL(img.url);
      });
    }
  };

  watch(
    () => props.currentImages,
    (newImages) => {
      existingImages.value = [...newImages];
    }
  );
</script>
