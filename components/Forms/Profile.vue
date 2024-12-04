<!-- ProfileForm.vue -->
<template>
  <form @submit.prevent="submitProfile">
    <UiVeeInput label="First Name" name="firstname" />
    <UiVeeInput label="Last Name" name="lastname" />
    <UiVeeInput label="Username" name="username" />
    <UiVeeInput label="Phone Number" name="phoneNumber" />
    <UiButton type="submit" :loading="isSubmittingProfile">Save</UiButton>
  </form>
</template>

<script setup>
  import { EditProfileSchema } from "~/utils/validation";

  const { handleSubmit: handleProfileSubmit, isSubmitting: isSubmittingProfile } = useForm({
    validationSchema: toTypedSchema(EditProfileSchema),
  });

  const submitProfile = handleProfileSubmit(async (values) => {
    console.log("Profile Form Submitted:", values);
  });
</script>
