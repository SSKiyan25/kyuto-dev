<template>
  <div class="group relative flex flex-row items-center space-x-4">
    <!-- Logo Image with Hover Overlay -->
    <!-- <div class="relative">
      <img
        :src="logoImage || '/placeholder-img.jpg'"
        alt="Organization Logo"
        class="h-32 w-32 rounded-full border-2 border-primary/70 object-cover"
      />
      <div
        class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
        @click="editDialog = true"
      >
        <span class="text-sm font-medium text-white">Change Logo</span>
      </div>
    </div> -->

    <!-- Logo Edit Modal -->
    <UiDialog v-model:open="editDialog">
      <UiDialogContent class="max-w-sm">
        <UiDialogHeader>
          <UiDialogTitle>Update Organization Logo</UiDialogTitle>
          <UiDialogDescription> Recommended size: 300x300px (PNG/JPG) </UiDialogDescription>
        </UiDialogHeader>

        <form @submit.prevent="submit">
          <fieldset class="grid gap-4" :disabled="isSubmitting">
            <!-- Image Upload -->
            <div class="space-y-2">
              <div v-if="imageError" class="text-sm text-destructive">
                {{ imageError }}
              </div>

              <label
                class="group relative flex aspect-square w-full cursor-pointer flex-col items-center justify-center rounded-full border-2 border-dashed bg-muted/50 transition-colors hover:bg-muted"
              >
                <template v-if="!previewImage">
                  <Icon name="lucide:upload" class="size-8 text-muted-foreground" />
                  <span class="mt-2 text-sm">Click to upload</span>
                </template>

                <img
                  v-else
                  :src="previewImage"
                  alt="Logo preview"
                  class="h-full w-full rounded-full object-cover"
                />
                <div
                  class="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <span class="text-sm font-medium text-white">Change Logo</span>
                </div>

                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  class="hidden"
                  @change="handleImageUpload"
                />
              </label>

              <UiButton
                v-if="currentLogoPath"
                variant="destructive"
                size="sm"
                type="button"
                @click="removeLogo"
                :loading="isSubmitting"
              >
                Remove Current Logo
              </UiButton>
            </div>

            <UiDialogFooter>
              <UiDialogClose as-child>
                <UiButton variant="outline" type="button"> Cancel </UiButton>
              </UiDialogClose>
              <UiButton type="submit" :loading="isSubmitting">
                {{ isSubmitting ? "Saving..." : "Save Changes" }}
              </UiButton>
            </UiDialogFooter>
          </fieldset>
        </form>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script lang="ts" setup>
  import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
  import {
    deleteObject,
    getDownloadURL,
    getStorage,
    ref as storageRef,
    uploadBytes,
  } from "firebase/storage";

  const props = defineProps({
    organizationId: {
      type: String,
      required: true,
    },
    logoImage: String,
    currentLogoPath: String,
    modelValue: Boolean,
  });

  const emit = defineEmits(["update:modelValue", "success"]);

  const editDialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const storage = getStorage();
  const db = useFirestore();
  const toast = useToast();

  const previewImage = ref<string | null>(null);
  const newLogoFile = ref<File | null>(null);
  const imageError = ref("");
  const isSubmitting = ref(false);

  const handleImageUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    imageError.value = "";

    if (!input.files?.[0]) return;

    const file = input.files[0];

    if (file.size > MAX_SIZE) {
      imageError.value = "File size exceeds 2MB limit";
      return;
    }

    if (!["image/jpeg", "image/png"].includes(file.type)) {
      imageError.value = "Only JPG/PNG files allowed";
      return;
    }

    newLogoFile.value = file;
    previewImage.value = URL.createObjectURL(file);
  };

  const removeLogo = async () => {
    if (!props.currentLogoPath) return;

    try {
      isSubmitting.value = true;
      const imageRef = storageRef(storage, props.currentLogoPath);
      await deleteObject(imageRef);

      await updateDoc(doc(db, "organizations", props.organizationId), {
        logoImageURL: null,
        logoImagePath: null,
        lastModified: Date.now(),
      });

      emit("success");
      editDialog.value = false;
      toast.toast({ title: "Logo removed", variant: "default" });
    } catch (error: any) {
      toast.toast({
        title: "Error removing logo",
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

      let imageUrl = props.logoImage;
      let imagePath = props.currentLogoPath;

      if (newLogoFile.value) {
        // Delete old logo if exists
        if (props.currentLogoPath) {
          await deleteObject(storageRef(storage, props.currentLogoPath));
        }

        // Upload new logo
        const storagePath = `organizations/${props.organizationId}/logo/${Date.now()}_${newLogoFile.value.name}`;
        const ref = storageRef(storage, storagePath);
        await uploadBytes(ref, newLogoFile.value);
        imageUrl = await getDownloadURL(ref);
        imagePath = storagePath;
      }

      // Update Firestore
      await updateDoc(doc(db, "organizations", props.organizationId), {
        logoImageURL: imageUrl,
        logoImagePath: imagePath,
        lastModified: serverTimestamp(),
      });

      emit("success");
      editDialog.value = false;
      toast.toast({ title: "Logo updated", variant: "default" });
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

  watch(
    () => props.logoImage,
    (newImage) => {
      if (newImage) {
        previewImage.value = newImage;
      } else {
        previewImage.value = null;
      }
    },
    { immediate: true }
  );
</script>
