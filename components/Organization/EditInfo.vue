<template>
  <UiDialog v-model:open="editDialog">
    <UiDialogContent class="sm:h-w-[700px] overflow-y-auto sm:max-w-[725px]">
      <UiDialogHeader>
        <UiDialogTitle>Edit Organization Profile</UiDialogTitle>
        <UiDialogDescription>
          Make changes to your organization profile here. Click save when you're done.
        </UiDialogDescription>
      </UiDialogHeader>
      <form @submit.prevent="submit">
        <fieldset :disabled="isSubmitting">
          <div class="flex flex-col space-y-4">
            <UiVeeInput label="Name" name="name" v-model="currentValues.name" />
            <UiVeeInput
              label="Contact Email"
              type="email"
              name="contactEmail"
              v-model="currentValues.contactEmail"
            />
            <UiVeeInput
              label="Phone Number"
              name="phoneNumber"
              v-model="currentValues.phoneNumber"
            />
            <UiVeeTextarea
              label="Description"
              name="description"
              v-model="currentValues.description"
            />
          </div>
        </fieldset>
        <UiDialogFooter>
          <UiDialogClose as-child>
            <UiButton variant="outline" type="button">Cancel</UiButton>
          </UiDialogClose>
          <UiButton type="submit" :loading="isSubmitting">
            <span v-if="!isSubmitting">Save Changes</span>
            <span v-else>Saving...</span>
          </UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { doc, updateDoc } from "firebase/firestore";
  import { useForm } from "vee-validate";
  import { object, string } from "yup";

  const props = defineProps({
    organizationId: {
      type: String,
      required: true,
    },
    currentValues: {
      type: Object as PropType<{
        name: string;
        contactEmail: string;
        phoneNumber: string;
        description: string;
      }>,
      required: true,
    },
    modelValue: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "success"]);
  const regex = /^[^<@#`'"%;\\\[\]{}|&$*^~:/?!+=\r\n]*$/;

  const editDialog = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  // Form Schema
  const OrganizationProfileSchema = object({
    name: string()
      .required()
      .label("Organization Name")
      .max(128)
      .matches(regex, "Name contains invalid characters"),
    contactEmail: string().email().required().label("Contact Email"),
    phoneNumber: string().required().label("Phone Number"),
    description: string()
      .max(500)
      .label("Description")
      .matches(regex, "Description contains invalid characters"),
  });

  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: toTypedSchema(OrganizationProfileSchema),
    initialValues: props.currentValues,
  });

  const submit = handleSubmit(async (values) => {
    try {
      const orgRef = doc(useFirestore(), "organizations", props.organizationId);
      await updateDoc(orgRef, {
        ...values,
        lastModified: new Date(),
      });
      emit("success");
      editDialog.value = false;
    } catch (error) {
      console.error("Error updating organization:", error);
    }
  });
</script>
