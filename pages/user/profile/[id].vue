<template>
  <div class="flex h-auto w-full flex-col space-y-6 rounded-md p-16 shadow-sm">
    <span class="text-xl font-semibold">My Profile</span>
    <!-- Profile Card -->
    <div
      class="flex w-full items-center justify-between space-x-6 rounded-md border bg-secondary px-12 py-6 shadow-md"
    >
      <div class="flex flex-row items-center space-x-2">
        <img src="/profile-icon.jpg" alt="profile" class="h-20 w-20 rounded-full object-cover" />
        <div class="flex flex-col">
          <span class="text-md font-semibold"
            >{{ userData?.firstname || "None" }} {{ userData?.lastname || "None" }}</span
          >
          <span class="text-sm text-muted-foreground">{{ userData?.course || "None" }}</span>
        </div>
      </div>
    </div>

    <!-- Personal Information -->
    <div
      class="flex w-full flex-col space-x-6 rounded-md border bg-secondary px-12 py-10 shadow-md"
    >
      <!-- Title and Edit Button -->
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Personal Information</span>
        <div class="flex justify-end">
          <UiDialog v-model:open="profileDialog">
            <UiDialogTrigger as-child>
              <UiButton variant="outline">
                <span class="text-[12px]">Edit </span>
                <Icon name="lucide:pencil" class="size-3" />
              </UiButton>
            </UiDialogTrigger>
            <UiDialogContent
              class="sm:max-w-[650px]"
              title="Edit Profile"
              description="Make changes to your profile here. Click save when you're done."
            >
              <UiDialogTitle>Edit Personal Information</UiDialogTitle>
              <UiDialogDescription>
                Make changes to your personal information here. Click save when you're done.
              </UiDialogDescription>
              <form @submit.prevent="submitProfile">
                <div class="space-y-4 p-8">
                  <fieldset :disabled="isSubmittingProfile">
                    <UiVeeInput
                      name="firstname"
                      label="First Name"
                      :placeholder="userData?.firstname || 'Juan'"
                      class="mb-4"
                    />
                    <UiVeeInput
                      name="lastname"
                      label="Last Name"
                      :placeholder="userData?.lastname || 'Dela Cruz'"
                      class="mb-4"
                    />
                    <UiVeeInput
                      name="username"
                      label="Username"
                      :placeholder="userData?.username || 'juan123'"
                      class="mb-4"
                    />
                    <UiVeeInput
                      name="phoneNumber"
                      label="Phone Number"
                      :placeholder="userData?.phoneNumber || '09123456789'"
                      class="mb-4"
                    />
                  </fieldset>
                  <UiDialogFooter>
                    <UiButton
                      variant="outline"
                      @click.prevent="closeProfileDialog(false)"
                      type="button"
                      >Cancel</UiButton
                    >
                    <UiButton :loading="isSubmittingProfile" @click.prevent="submitProfile"
                      >Save</UiButton
                    >
                  </UiDialogFooter>
                </div>
              </form>
            </UiDialogContent>
          </UiDialog>
        </div>
      </div>
      <!-- Name and Contact Information -->
      <div class="grid grid-cols-3 gap-8 pt-6">
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">First Name</span>
          <span class="text-sm font-semibold">{{ userData?.firstname || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Last Name</span>
          <span class="text-sm font-semibold">{{ userData?.lastname || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Username</span>
          <span class="text-sm font-semibold">{{ userData?.username || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Email address</span>
          <span class="text-sm font-semibold">{{ userData?.email || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Phone Number</span>
          <span class="text-sm font-semibold">{{ userData?.phoneNumber || "None" }}</span>
        </div>
      </div>
      <div></div>
    </div>
    <!-- Student Information -->
    <div class="flex flex-col rounded-md border bg-secondary px-12 py-6 shadow-md">
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Student Information</span>
        <div class="flex justify-end">
          <FormsStudent :userID="userID" />
        </div>
      </div>
      <div class="grid grid-cols-3 pt-4">
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Student ID</span>
          <span class="text-sm font-semibold">{{ userData?.studentID || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Course</span>
          <span class="text-sm font-semibold">{{ userData?.course || "None" }}</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">College</span>
          <span class="text-sm font-semibold">{{ userData?.college || "None" }}</span>
        </div>
      </div>
    </div>
  </div>
  <div class="min-h-32"></div>
</template>

<script lang="ts" setup>
  import { toTypedSchema } from "@vee-validate/yup";
  import { useEditProfile } from "~/composables/user/useEditProfile";
  import { EditProfileSchema, EditStudentInfoSchema } from "~/utils/validation";
  import { doc } from "firebase/firestore";
  import { useForm } from "vee-validate";
  import type { Account } from "~/types/models/Account";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const route = useRoute();
  const userID = computed(() => route.params.id as string);
  const profileDialog = ref(false);

  const db = useFirestore();

  const userDocRef = computed(() => (userID.value ? doc(db, "accounts", userID.value) : null));
  const userData = useDocument<Partial<Account>>(userDocRef);

  const closeProfileDialog = (save: boolean) => {
    useToast().toast({
      title: save ? "Profile updated" : "Changes discarded",
      description: `Your changes have been ${save ? "saved" : "discarded"}.`,
      duration: 5000,
      icon: save ? "lucide:check" : "lucide:x",
    });
    profileDialog.value = false;
  };

  // Form Functions for Profile
  const { handleSubmit: handleProfileSubmit, isSubmitting: isSubmittingProfile } = useForm({
    validationSchema: toTypedSchema(EditProfileSchema),
  });

  const { editProfile } = useEditProfile();

  const submitProfile = handleProfileSubmit(async (values) => {
    console.log("Profile Form Submitted:", values);
    await editProfile(userID.value, values);
    closeProfileDialog(true);
  });
</script>
