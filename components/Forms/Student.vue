<template>
  <UiDialog v-model:open="studentDialog">
    <UiDialogTrigger as-child>
      <UiButton variant="outline" class="px-2 py-1 sm:px-2 sm:py-4">
        <span class="text-[10px] sm:text-[12px]">Edit </span>
        <Icon name="lucide:pencil" class="size-3" />
      </UiButton>
    </UiDialogTrigger>
    <UiDialogContent
      class="sm:max-w-[650px]"
      title="Edit Student Information"
      description="Make changes to your student information here. Click save when you're done."
    >
      <UiDialogTitle>Edit Student Information</UiDialogTitle>
      <UiDialogDescription>
        Make changes to your student information here. Click save when you're done.
      </UiDialogDescription>
      <form @submit.prevent="submitStudent">
        <UiVeeInput label="Student ID" name="studentID" class="mb-4" />
        <UiVeeInput label="Course" name="course" class="mb-4" />
        <UiVeeInput label="College" name="college" class="mb-4" />
        <UiDialogFooter class="pt-4">
          <UiButton
            @click="closeStudentDialog(false)"
            variant="outline"
            type="button"
            class="mt-2 sm:mt-0"
            >Cancel</UiButton
          >
          <UiButton type="submit" :loading="isSubmittingStudent">Save</UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script setup lang="ts">
  import { useEditProfile } from "~/composables/user/useEditProfile";
  import { EditStudentInfoSchema } from "~/utils/validation";

  const user = useCurrentUser();
  console.log("User in composable:", user);

  const studentDialog = ref<boolean>(false);
  const { handleSubmit: handleStudentSubmit, isSubmitting: isSubmittingStudent } = useForm({
    validationSchema: toTypedSchema(EditStudentInfoSchema),
  });

  const props = defineProps<{ userID: string }>();

  const closeStudentDialog = (save: boolean) => {
    useToast().toast({
      title: save ? "Profile updated" : "Changes discarded",
      description: `Your changes have been ${save ? "saved" : "discarded"}.`,
      duration: 5000,
      icon: save ? "lucide:check" : "lucide:x",
    });
    studentDialog.value = false;
  };

  const { editProfile } = useEditProfile();
  const submitStudent = handleStudentSubmit(async (values) => {
    console.log("Student Form Submitted:", values);
    await editProfile(props.userID as string, values);
    closeStudentDialog(true);
  });
</script>
