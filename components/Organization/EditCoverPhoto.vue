<template>
  <UiDialog v-model:open="editDialog">
    <UiDialogContent class="max-w-xl">
      <UiDialogHeader>
        <UiDialogTitle>Edit Cover Photo</UiDialogTitle>
        <UiDialogDescription> Update your organization's main display image </UiDialogDescription>
      </UiDialogHeader>
      <form @submit.prevent="submit">
        <fieldset class="grid gap-4" :disabled="isSubmitting">
          <!-- Image Upload Area -->
          <div class="space-y-2">
            <div v-if="imageError" class="text-sm text-destructive">{{ imageError }}</div>

            <label
              class="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-muted/50 transition-colors hover:bg-muted"
              :class="{ 'pointer-events-none opacity-50': isSubmitting }"
            >
              <template v-if="!previewImage">
                <Icon name="lucide:upload" class="size-8 text-muted-foreground" />
                <span class="mt-2 text-sm font-medium">Click to upload</span>
                <span class="text-xs text-muted-foreground">JPEG/PNG (max 10MB)</span>
              </template>

              <img
                v-else
                :src="previewImage"
                alt="Cover preview"
                class="h-full w-full rounded-lg object-cover"
              />

              <input
                type="file"
                accept="image/jpeg, image/png"
                class="hidden"
                @change="handleImageUpload"
              />
            </label>

            <UiButton
              v-if="currentImagePath"
              variant="destructive"
              size="sm"
              type="button"
              @click="removeImage"
              :loading="isSubmitting"
            >
              Remove Current Image
            </UiButton>
          </div>

          <UiDialogFooter>
            <UiDialogClose as-child>
              <UiButton variant="outline" type="button">Cancel</UiButton>
            </UiDialogClose>
            <UiButton type="submit" :loading="isSubmitting">
              {{ isSubmitting ? "Saving..." : "Save Changes" }}
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
  import { ref, watch } from "vue";

  const props = defineProps({
    organizationId: {
      type: String,
      required: true,
    },
    currentImageUrl: String,
    currentImagePath: String,
    modelValue: Boolean,
  });

  const emit = defineEmits(["update:modelValue", "success"]);

  const editDialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  const MAX_SIZE = 10 * 1024 * 1024; // 10MB
  const storage = getStorage();
  const db = useFirestore();
  const toast = useToast();

  const previewImage = ref<string | null>(null);
  const newImageFile = ref<File | null>(null);
  const imageError = ref("");
  const isSubmitting = ref(false);

  // Reset state when dialog opens/closes
  watch(editDialog, (val) => {
    if (!val) {
      previewImage.value = null;
      newImageFile.value = null;
      imageError.value = "";
    }
  });

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    imageError.value = "";

    if (!input.files?.[0]) return;

    const file = input.files[0];

    // Validate file
    if (file.size > MAX_SIZE) {
      imageError.value = "File size exceeds 10MB limit";
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      imageError.value = "Only JPEG/PNG files allowed";
      return;
    }

    newImageFile.value = file;
    previewImage.value = URL.createObjectURL(file);
  };

  const removeImage = async () => {
    if (!props.currentImagePath) return;

    try {
      isSubmitting.value = true;
      const imageRef = storageRef(storage, props.currentImagePath);
      await deleteObject(imageRef);

      await updateDoc(doc(db, "organizations", props.organizationId), {
        coverImageURL: null,
        coverImagePath: null,
        lastModified: Date.now(),
      });

      emit("success");
      editDialog.value = false;
      toast.toast({ title: "Image removed successfully", variant: "default" });
    } catch (error: any) {
      toast.toast({
        title: "Error removing image",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      isSubmitting.value = false;
    }
  };

  const submit = async () => {
    try {
      isSubmitting.value = true;

      // Handle image upload if new file selected
      let imageUrl = props.currentImageUrl;
      let imagePath = props.currentImagePath;

      if (newImageFile.value) {
        // Delete old image if exists
        if (props.currentImagePath) {
          await deleteObject(storageRef(storage, props.currentImagePath));
        }

        // Upload new image
        const storagePath = `organizations/${props.organizationId}/cover/${Date.now()}_${newImageFile.value.name}`;
        const ref = storageRef(storage, storagePath);
        await uploadBytes(ref, newImageFile.value);
        imageUrl = await getDownloadURL(ref);
        imagePath = storagePath;
      }

      // Update Firestore
      await updateDoc(doc(db, "organizations", props.organizationId), {
        coverImageURL: imageUrl,
        coverImagePath: imagePath,
        lastModified: Date.now(),
      });

      emit("success");
      editDialog.value = false;
      toast.toast({ title: "Cover photo updated", variant: "default" });
    } catch (error: any) {
      toast.toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      isSubmitting.value = false;
      if (previewImage.value) URL.revokeObjectURL(previewImage.value);
    }
  };
</script>
