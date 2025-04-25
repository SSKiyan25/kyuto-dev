<script setup lang="ts">
  import { disallowedCharactersRegex } from "~/utils/validation";
  import { addDoc, collection } from "firebase/firestore";
  import { getDownloadURL, getStorage, ref as storageRef, uploadBytes } from "firebase/storage";
  import { array, mixed, object, string } from "yup";
  import type { Account as User } from "~/types/models/Account";

  const toast = useToast();
  const db = useFirestore();
  const storage = getStorage();

  const user = ref<User | null>(null);

  onMounted(async () => {
    const authStore = useAuthStore();
    user.value = authStore.user;
  });

  // Form state
  const isSubmitting = ref(false);
  const form = reactive({
    title: "",
    description: "",
    url: window.location.href,
    browser: navigator.userAgent,
    os: (navigator as any).userAgentData?.platform || navigator.userAgent || "Unknown",
    steps: "",
    attachments: [],
  });

  const BugReportSchema = object({
    title: string()
      .required()
      .label("Title")
      .max(100, "Title cannot exceed 100 characters")
      .matches(disallowedCharactersRegex, "Title contains invalid characters"),
    description: string()
      .required()
      .label("Description")
      .max(1000, "Description cannot exceed 1000 characters")
      .matches(disallowedCharactersRegex, "Description contains invalid characters"),
    url: string().required("URL is required").label("URL"),
    browser: string().required("Browser information is required").label("Browser"),
    os: string().required("Operating System information is required").label("Operating System"),
    steps: string()
      .required()
      .label("Steps to Reproduce")
      .max(1000, "Steps cannot exceed 1000 characters")
      .matches(disallowedCharactersRegex, "Steps contain invalid characters"),
    attachments: array().of(mixed()).max(5, "You can upload a maximum of 5 files"),
  });

  // Form validation
  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(BugReportSchema),
  });

  const uploadAttachments = async (attachments: File[]) => {
    const uploadedUrls: string[] = [];
    for (const file of attachments) {
      const fileRef = storageRef(storage, `bug-reports/${Date.now()}-${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      uploadedUrls.push(downloadURL);
    }
    return uploadedUrls;
  };

  const submit = handleSubmit(async (values) => {
    console.log("Form values:", values);

    if (!user.value?.id) {
      toast.toast({
        title: "Error",
        description: "User ID is not available. Please log in.",
        variant: "warning",
        icon: "lucide:circle-alert",
      });
      return;
    }

    try {
      isSubmitting.value = true;

      const validAttachments = (values.attachments || []).filter(
        (attachment): attachment is File => attachment instanceof File
      );
      const attachmentUrls = await uploadAttachments(validAttachments);

      const reportData = {
        title: values.title,
        description: values.description,
        url: values.url,
        browser: values.browser,
        os: values.os,
        steps: values.steps,
        status: "new",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: user.value?.id || "anonymous",
        email: user.value?.email || null,
        attachments: attachmentUrls,
      };

      // Use the modular Firestore API to add the report
      const reportsCollection = collection(db, "reports");
      await addDoc(reportsCollection, reportData);

      toast.toast({
        title: "Bug Report Submitted",
        description: "Your bug report has been submitted successfully.",
        variant: "success",
        icon: "lucide:badge-check",
      });

      // Reset the form to its initial state
      Object.assign(form, {
        title: "",
        description: "",
        url: window.location.href,
        browser: navigator.userAgent,
        os: (navigator as any).userAgentData?.platform || navigator.userAgent || "Unknown",
        steps: "",
        attachments: [],
      });
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast.toast({
        title: "Error",
        description: "Failed to submit the bug report. Please try again.",
        variant: "warning",
        icon: "lucide:circle-alert",
      });
    } finally {
      isSubmitting.value = false;
    }
  });
</script>

<template>
  <div class="mx-auto max-w-3xl p-6 py-16">
    <div class="mb-8 space-y-2">
      <h1 class="text-3xl font-bold">Report a Bug</h1>
      <p class="text-muted-foreground">
        Found an issue? Please help us improve by submitting detailed information about the problem.
      </p>
    </div>

    <form @submit.prevent="submit" class="space-y-6">
      <!-- Title -->
      <fieldset :disabled="isSubmitting">
        <div class="space-y-2">
          <UiVeeInput
            v-model="form.title"
            name="title"
            label="Title"
            placeholder="Brief summary of the issue"
            :disabled="isSubmitting"
          />
          <!-- <ErrorMessage name="title" class="text-sm text-destructive" /> -->
        </div>

        <!-- Description -->
        <div class="space-y-2">
          <UiVeeTextarea
            v-model="form.description"
            label="Description"
            name="description"
            title="Description"
            placeholder="Describe the problem in detail..."
            class="min-h-[120px]"
            :disabled="isSubmitting"
          />
          <!-- <ErrorMessage name="description" class="text-sm text-destructive" /> -->
        </div>

        <!-- Reproduction Steps -->
        <div class="space-y-2">
          <UiVeeTextarea
            v-model="form.steps"
            name="steps"
            label="Steps to Reproduce"
            title="Steps to Reproduce"
            placeholder="1. Go to...\n2. Click on...\n3. See error..."
            class="min-h-[120px] font-mono text-sm"
            :disabled="isSubmitting"
          />
          <!-- <ErrorMessage name="steps" class="text-sm text-destructive" /> -->
        </div>

        <!-- System Info -->
        <div class="space-y-4 rounded-lg border p-4">
          <h3 class="font-medium">System Information</h3>
          <div class="grid grid-cols-2 gap-4 text-sm">
            <div>
              <UiVeeInput v-model="form.url" name="url" title="URL" label="URL" disabled />
            </div>
            <div>
              <UiVeeInput
                v-model="form.browser"
                name="browser"
                title="Browser"
                label="Browser"
                disabled
              />
            </div>
            <div>
              <UiVeeInput
                v-model="form.os"
                name="os"
                title="Operating System"
                label="Operating System"
                disabled
              />
            </div>
          </div>
        </div>

        <!-- Attachments -->
        <div class="space-y-2">
          <UiVeeFileInput
            v-model="form.attachments"
            multiple
            label="Attachments"
            name="attachments"
            class="cursor-pointer"
            :disabled="isSubmitting"
          />
          <p class="text-sm text-muted-foreground">
            Upload screenshots or files (max 5 files, 5MB each)
          </p>
        </div>

        <UiButton type="submit" :disabled="isSubmitting">
          <Icon name="lucide:loader-circle" v-if="isSubmitting" class="mr-2 h-4 w-4 animate-spin" />
          {{ isSubmitting ? "Submitting..." : "Submit Report" }}
        </UiButton>
      </fieldset>
    </form>

    <!-- Reporting Guidelines -->
    <div class="mt-12 rounded-lg bg-muted/50 p-6">
      <h2 class="mb-4 text-lg font-semibold">Reporting Guidelines</h2>
      <ul class="list-disc space-y-3 pl-6 text-sm">
        <li>Provide clear, step-by-step reproduction instructions</li>
        <li>Include screenshots when possible</li>
        <li>Note any error messages verbatim</li>
        <li>Describe expected vs actual behavior</li>
        <li>Specify if the issue is reproducible consistently</li>
      </ul>
    </div>
  </div>
</template>
