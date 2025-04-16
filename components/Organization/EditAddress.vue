<template>
  <UiDialog v-model:open="editDialog">
    <UiDialogContent class="max-w-xl overflow-y-auto">
      <UiDialogHeader>
        <UiDialogTitle>Edit Organization Address</UiDialogTitle>
        <UiDialogDescription> Update your organization's address information. </UiDialogDescription>
      </UiDialogHeader>
      <form @submit.prevent="submit">
        <fieldset class="grid grid-cols-1 gap-5" :disabled="isSubmitting">
          <!-- Address Input -->
          <UiVeeInput
            name="address"
            label="Organization Address"
            icon="lucide:map-pin"
            v-model="existingAddress"
          />

          <!-- Image Upload Section -->
          <div class="space-y-2">
            <label class="text-sm font-medium">Address Images</label>
            <span class="pl-2 text-xs text-muted-foreground">
              {{ currentImageCount }} / 5 images
            </span>
            <div v-if="imageError" class="text-sm text-destructive">{{ imageError }}</div>
            <div class="flex flex-wrap gap-4">
              <!-- Overlay when submitting -->
              <div
                v-if="isSubmitting"
                class="absolute inset-0 z-10 flex items-center justify-center bg-black/50"
              >
                <Icon name="lucide:loader" class="animate-spin text-white" />
              </div>
              <!-- Display existing images -->
              <div v-for="(image, index) in existingImages" :key="index" class="group relative">
                <img
                  :src="image.url"
                  alt="Address image"
                  class="h-32 w-32 rounded-lg border-2 border-primary/70 object-cover"
                />
                <button
                  type="button"
                  @click="removeImage(index)"
                  class="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <Icon name="lucide:x" class="size-4" />
                </button>
              </div>

              <!-- Image Upload Button -->
              <label
                for="image-upload"
                class="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors hover:bg-muted/50"
                :class="{
                  'cursor-not-allowed opacity-50': currentImageCount >= 5,
                  'hover:bg-muted/50': currentImageCount < 5,
                }"
              >
                <Icon name="lucide:plus" class="size-6 text-muted-foreground" />
                <span class="mt-1 text-xs text-muted-foreground">Add Image</span>
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  multiple
                  class="hidden"
                  @change="handleImageUpload"
                  :disabled="currentImageCount >= 5"
                />
              </label>
            </div>
            <p class="text-xs text-muted-foreground">Maximum 10MB per image</p>
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
  import { object, string } from "yup";

  const props = defineProps({
    organizationId: {
      type: String,
      required: true,
    },
    currentAddress: {
      type: String,
      default: "",
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

  // Form Schema
  const AddressSchema = object({
    address: string()
      .required()
      .label("Organization Address")
      .max(500)
      .matches(/^[^<@#`]*$/, "Address cannot contain the characters <, @, `, or #"),
  });

  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: toTypedSchema(AddressSchema),
  });

  // Image handling
  const existingImages = ref<Array<{ url: string; path: string }>>([...props.currentImages]);
  const existingAddress = ref<string>(props.currentAddress || "");
  const newImages = ref<File[]>([]);
  const imagesToDelete = ref<string[]>([]); // Stores storage paths of images to delete
  const imageError = ref<string>("");

  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB in bytes

  const currentImageCount = computed(() => {
    const keptOriginals = props.currentImages.length - imagesToDelete.value.length;
    const newUploads = newImages.value.length;
    return keptOriginals + newUploads;
  });

  const removeImage = (index: number) => {
    const image = existingImages.value[index];
    if (image.path) {
      imagesToDelete.value.push(image.path);
    }
    existingImages.value.splice(index, 1);
    imageError.value = ""; // Clear any previous errors when removing images
  };

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    imageError.value = "";

    if (!input.files?.length) return;

    // Check available slots
    const availableSlots = 5 - currentImageCount.value;
    if (availableSlots <= 0) {
      imageError.value = "Maximum 5 images reached";
      input.value = "";
      return;
    }

    // Get only allowed number of files
    const files = Array.from(input.files).slice(0, availableSlots);

    // Check if user tried to select too many
    if (input.files.length > availableSlots) {
      imageError.value = `Only ${availableSlots} images can be added`;
    }

    // Check file sizes
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);
    if (oversizedFiles.length > 0) {
      imageError.value = `Some images exceed 10MB: ${oversizedFiles.map((f) => f.name).join(", ")}`;
      input.value = "";
      return;
    }

    // Process valid files
    newImages.value = [...newImages.value, ...files];
    files.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      existingImages.value.push({
        url: previewUrl,
        path: "",
      });
    });

    input.value = "";
  };

  // Firebase storage and firestore
  const db = useFirestore();
  const storage = getStorage();
  const toast = useToast();

  const submit = handleSubmit(async (values) => {
    try {
      // Validate there are no image errors
      if (imageError.value) {
        throw new Error("Please fix image upload errors before submitting");
      }

      if (currentImageCount.value > 5) {
        throw new Error("Maximum 5 images allowed");
      }

      // 1. Delete marked images from storage
      if (imagesToDelete.value.length > 0) {
        await Promise.all(
          imagesToDelete.value.map(async (path) => {
            const imageRef = storageRef(storage, path);
            await deleteObject(imageRef);
          })
        );
      }

      // 2. Upload new images to Firebase Storage
      const uploadedImages = await Promise.all(
        newImages.value.map(async (file) => {
          const storagePath = `organizations/${props.organizationId}/address/${Date.now()}_${file.name}`;
          const ref = storageRef(storage, storagePath);
          await uploadBytes(ref, file);
          const url = await getDownloadURL(ref);
          return {
            url,
            path: storagePath,
          };
        })
      );

      // 3. Prepare final image array
      const finalImages = [
        // Existing valid images (filter out blob previews)
        ...existingImages.value.filter(
          (img) =>
            !img.url.startsWith("blob:") &&
            img.path !== "" &&
            !imagesToDelete.value.includes(img.path)
        ),
        // Newly uploaded images
        ...uploadedImages,
      ];

      // 4. Update Firestore document
      await updateDoc(doc(db, "organizations", props.organizationId), {
        address: values.address,
        addressImagesURL: finalImages,
        lastModified: Date.now(),
      });

      // 5. Update local state
      existingImages.value = finalImages;
      newImages.value = [];
      imagesToDelete.value = [];

      // Show success feedback
      toast.toast({
        title: "Success",
        description: "Organization address updated successfully",
        variant: "default",
      });

      // Close dialog and emit success
      emit("success");
      editDialog.value = false;
    } catch (error: any) {
      // Error handling
      console.error("Update error:", error);
      toast.toast({
        title: "Error",
        description: error.message || "Failed to update organization address",
        variant: "destructive",
      });
    } finally {
      // Clean up temporary blob URLs
      existingImages.value.forEach((img) => {
        if (img.url.startsWith("blob:")) {
          URL.revokeObjectURL(img.url);
        }
      });
    }
  });

  watch(
    () => props.currentAddress,
    (newAddress) => {
      existingAddress.value = newAddress;
    }
  );

  watch(
    () => props.currentImages,
    (newImages) => {
      existingImages.value = [...newImages];
    }
  );
</script>
