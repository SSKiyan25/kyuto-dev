<template>
  <div class="container mx-auto max-w-4xl px-4 py-8">
    <div class="mb-8 flex items-center justify-between">
      <h1 class="text-2xl font-bold tracking-tight sm:text-3xl">My Profile</h1>
      <UiButton variant="outline" size="sm" class="hidden sm:flex">
        <Icon name="lucide:layout-dashboard" class="mr-2 h-4 w-4" />
        Dashboard
      </UiButton>
    </div>

    <!-- Coming Soon Banner -->
    <div
      class="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-900/20"
    >
      <div class="flex items-center">
        <Icon name="lucide:construction" class="mr-3 h-5 w-5 text-amber-500" />
        <div>
          <h3 class="text-sm font-medium text-amber-800 dark:text-amber-300">
            Profile Enhancement Coming Soon
          </h3>
          <p class="mt-1 text-xs text-amber-700 dark:text-amber-400">
            We're working on adding profile pictures, customization options, and more settings. Stay
            tuned!
          </p>
        </div>
      </div>
    </div>

    <!-- Profile Card -->
    <div class="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div class="bg-gradient-to-r from-primary/10 to-primary/5 px-6 py-4">
        <h2 class="text-lg font-semibold">Account Overview</h2>
      </div>
      <div class="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
        <div
          class="relative h-20 w-20 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 ring-2 ring-background ring-offset-2 sm:h-24 sm:w-24"
        >
          <div class="absolute inset-0 flex items-center justify-center text-primary/40">
            <Icon name="lucide:user" class="h-12 w-12 sm:h-14 sm:w-14" />
          </div>
        </div>
        <div class="flex flex-col justify-center">
          <h3 class="text-xl font-bold">
            {{ userData?.firstname || "None" }} {{ userData?.lastname || "None" }}
          </h3>
          <div
            class="mt-1 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground"
          >
            <div class="flex items-center gap-1">
              <Icon name="lucide:mail" class="h-3.5 w-3.5" />
              <span>{{ userData?.email || "No email provided" }}</span>
            </div>
            <div class="flex items-center gap-1">
              <Icon name="lucide:graduation-cap" class="h-3.5 w-3.5" />
              <span>{{ userData?.course || "No course provided" }}</span>
            </div>
          </div>

          <div class="mt-4 flex items-center gap-2">
            <div
              class="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium"
              :class="
                userData?.studentID
                  ? 'bg-primary/10 text-primary'
                  : 'bg-muted/50 text-muted-foreground'
              "
            >
              <span>{{ userData?.studentID ? "Student" : "Non-Student" }}</span>
            </div>

            <!-- Only show verified badge if they have provided student information -->
            <div
              v-if="userData?.studentID"
              class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
            >
              <Icon name="lucide:check-circle" class="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Personal Information -->
    <div class="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <Icon name="lucide:user" class="h-4 w-4 text-primary" />
          <h2 class="text-lg font-semibold">Personal Information</h2>
        </div>
        <UiDialog v-model:open="profileDialog">
          <UiDialogTrigger as-child>
            <UiButton variant="outline" size="sm" class="gap-1.5">
              <Icon name="lucide:pencil" class="h-3.5 w-3.5" />
              Edit
            </UiButton>
          </UiDialogTrigger>
          <UiDialogContent
            class="sm:max-w-[650px]"
            title="Edit Profile"
            description="Make changes to your profile here. Click save when you're done."
          >
            <UiDialogTitle>Edit Personal Information</UiDialogTitle>
            <UiDialogDescription class="text-sm">
              Make changes to your personal information here. Click save when you're done.
            </UiDialogDescription>
            <form @submit.prevent="submitProfile">
              <div class="space-y-4 p-4 sm:p-6">
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
      <div class="grid grid-cols-1 gap-y-4 p-6 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-6">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">First Name</label>
          <p class="text-sm font-medium">{{ userData?.firstname || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Last Name</label>
          <p class="text-sm font-medium">{{ userData?.lastname || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Email Address</label>
          <p class="text-sm font-medium">{{ userData?.email || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Phone Number</label>
          <p class="text-sm font-medium">{{ userData?.phoneNumber || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Username</label>
          <p class="text-sm font-medium">{{ userData?.username || "Not provided" }}</p>
        </div>
      </div>
    </div>

    <!-- Student Information -->
    <div class="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <Icon name="lucide:graduation-cap" class="h-4 w-4 text-primary" />
          <h2 class="text-lg font-semibold">Student Information</h2>
        </div>
        <div class="flex justify-end">
          <FormsStudent :userID="userID" />
        </div>
      </div>
      <div class="grid grid-cols-1 gap-y-4 p-6 sm:grid-cols-3 sm:gap-x-8 sm:gap-y-6">
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Student ID</label>
          <p class="text-sm font-medium">{{ userData?.studentID || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">Course</label>
          <p class="text-sm font-medium">{{ userData?.course || "Not provided" }}</p>
        </div>
        <div class="space-y-1.5">
          <label class="text-xs font-medium text-muted-foreground">College</label>
          <p class="text-sm font-medium">{{ userData?.faculty || "Not provided" }}</p>
        </div>
      </div>
    </div>

    <!-- Activity History Panel -->
    <div class="mb-6 overflow-hidden rounded-xl border bg-card shadow-sm">
      <div class="flex items-center justify-between border-b px-6 py-4">
        <div class="flex items-center gap-2">
          <Icon name="lucide:history" class="h-4 w-4 text-primary" />
          <h2 class="text-lg font-semibold">Recent Activity</h2>
        </div>
      </div>
      <div class="p-6">
        <div class="flex flex-col items-center justify-center py-8 text-center">
          <div class="mb-4 rounded-full bg-muted/30 p-4">
            <Icon name="lucide:clock" class="h-10 w-10 text-muted-foreground/50" />
          </div>
          <h3 class="text-base font-medium">Activity tracking coming soon</h3>
          <p class="mt-2 max-w-md text-sm text-muted-foreground">
            We're working on adding order history, activity logs, and other account information to
            help you keep track of your interactions.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { toTypedSchema } from "@vee-validate/yup";
  import { useEditProfile } from "~/composables/user/useEditProfile";
  import { EditProfileSchema, EditStudentInfoSchema } from "~/utils/validation";
  import { doc } from "firebase/firestore";
  import { useForm } from "vee-validate";
  import type { Account } from "~/types/models/Account";

  definePageMeta({
    middleware: "user-auth",
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
    // console.log("Profile Form Submitted:", values);
    await editProfile(userID.value, values);
    closeProfileDialog(true);
  });
</script>
