<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-w-xl overflow-y-auto">
      <UiDialogHeader>
        <UiDialogTitle>Create Organization</UiDialogTitle>
        <UiDialogDescription>
          {{
            formStep === 1
              ? "Enter the email address for the new organization."
              : formStep === 2
                ? "Enter the verification code sent to the email."
                : "Complete organization details to finish setup."
          }}
        </UiDialogDescription>
      </UiDialogHeader>

      <!-- Step 1: Email Input -->
      <EmailVerificationStep v-if="formStep === 1" @verification-sent="handleVerificationSent" />

      <!-- Step 2: Verification Code -->
      <CodeVerificationStep
        v-else-if="formStep === 2"
        :email="verifiedEmail"
        :verification-id="verificationId"
        @verification-success="handleVerificationSuccess"
        @go-back="formStep = 1"
      />

      <!-- Step 3: Organization Details -->
      <OrganizationDetailsStep
        v-else
        :email="verifiedEmail"
        @organization-created="handleOrganizationCreated"
        @go-back="formStep = 2"
      />
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import CodeVerificationStep from "./CodeVerificationStep.vue";
  import EmailVerificationStep from "./EmailVerificationStep.vue";
  import OrganizationDetailsStep from "./OrganizationDetailsStep.vue";

  const formStep = ref(1); // 1: Email entry, 2: Verification code, 3: Organization details
  const verificationId = ref("");
  const verifiedEmail = ref("");

  const props = defineProps({
    modelValue: {
      type: Boolean,
      required: true,
    },
  });

  const emit = defineEmits(["update:modelValue", "success"]);

  const open = computed({
    get: () => props.modelValue,
    set: (value) => emit("update:modelValue", value),
  });

  // Handle the verification sent event from step 1
  const handleVerificationSent = (data: { email: string; verificationId: string }) => {
    verifiedEmail.value = data.email;
    verificationId.value = data.verificationId;
    formStep.value = 2;
  };

  // Handle the verification success event from step 2
  const handleVerificationSuccess = (data: {
    email: string;
    verificationId?: string;
    verified?: boolean;
  }) => {
    // If this is a new verification code (from resend)
    if (data.verificationId) {
      verificationId.value = data.verificationId;
    }

    // Only proceed to step 3 if the verification was successful
    if (data.verified !== false) {
      formStep.value = 3;
    }
  };

  // Handle the organization created event from step 3
  const handleOrganizationCreated = (data: { id: string; name: string }) => {
    emit("success", {
      id: data.id,
      name: data.name,
    });
    open.value = false;
    formStep.value = 1; // Reset to first step for next time
    verificationId.value = "";
    verifiedEmail.value = "";
  };
</script>
