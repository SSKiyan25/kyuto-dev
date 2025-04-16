<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>Update Commission Rate</UiDialogTitle>
        <UiDialogDescription> Current rate: {{ currentRate }}% </UiDialogDescription>
      </UiDialogHeader>

      <form @submit.prevent="submit">
        <div class="grid gap-4 py-4">
          <UiVeeNumberField
            name="rate"
            label="New Rate (%)"
            :min="0"
            :max="99"
            :decimal-places="2"
            required
          >
            <UiNumberFieldInput placeholder="0" />
          </UiVeeNumberField>

          <UiVeeInput name="remarks" label="Reason for Change" rows="3" placeholder="(Optional)" />
        </div>

        <UiDialogFooter>
          <UiButton type="submit" :loading="isSubmitting"> Update Rate </UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import {
    addDoc,
    collection,
    getDocs,
    query,
    serverTimestamp,
    where,
    writeBatch,
  } from "firebase/firestore";

  const db = useFirestore();
  const toast = useToast();

  const props = defineProps({
    modelValue: Boolean,
    currentRate: {
      type: Number,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "success"]);

  const open = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  const { handleSubmit, isSubmitting } = useForm({
    initialValues: {
      rate: props.currentRate,
      remarks: "",
    },
  });

  const submit = handleSubmit(async (values) => {
    try {
      // Archive the current active rate (if exists)
      const currentActiveQuery = query(
        collection(db, "commissionRate"),
        where("status", "==", "active")
      );
      const currentActiveSnapshot = await getDocs(currentActiveQuery);

      if (!currentActiveSnapshot.empty) {
        const batch = writeBatch(db);
        currentActiveSnapshot.forEach((doc) => {
          batch.update(doc.ref, {
            status: "inactive",
            isArchived: true,
            lastModified: serverTimestamp(),
          });
        });
        await batch.commit();
      }

      // Create new rate document
      await addDoc(collection(db, "commissionRate"), {
        rate: Number(values.rate),
        remarks: values.remarks,
        status: "active",
        dateCreated: serverTimestamp(),
        lastModified: serverTimestamp(),
        isArchived: false,
      });

      emit("success");
      open.value = false;

      toast.toast({
        title: "Success",
        description: `Commission rate updated to ${values.rate}%`,
        variant: "success",
      });
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: error.message || "Failed to update commission rate",
        variant: "destructive",
      });
      console.error("Update error:", error);
    }
  });
</script>
