<script setup lang="ts">
  import { sendPasswordResetEmail } from "firebase/auth";
  import type { Auth } from "firebase/auth";

  const props = defineProps<{
    auth: Auth;
  }>();

  const email = ref("");
  const isSubmitting = ref(false);
  const emit = defineEmits(["closeForgotPasswordDialog"]);

  const handleForgotPassword = async () => {
    if (!email.value) {
      useSonner.error("Please enter your email address.");
      return;
    }

    isSubmitting.value = true;
    try {
      await sendPasswordResetEmail(props.auth, email.value);
      useSonner.success("Password reset email sent! Please check your inbox.");
      email.value = "";

      emit("closeForgotPasswordDialog");
    } catch (error: any) {
      console.error("Error sending password reset email:", error.message);
      useSonner.error("Failed to send password reset email. Please try again.");
    } finally {
      isSubmitting.value = false;
    }
  };
</script>

<template>
  <UiDialog>
    <UiDialogTrigger as-child>
      <UiButton variant="ghost" class="text-xs opacity-50"> Forgot password? </UiButton>
    </UiDialogTrigger>

    <UiDialogContent class="sm:max-w-md">
      <UiDialogHeader>
        <UiDialogTitle>Reset Password</UiDialogTitle>
        <UiDialogDescription>
          Enter your email to receive a password reset link.
        </UiDialogDescription>
      </UiDialogHeader>

      <form @submit.prevent="handleForgotPassword" class="grid gap-4">
        <UiVeeInput
          icon="lucide:mail"
          name="email"
          type="email"
          label="Email"
          placeholder="Enter your email"
          v-model="email"
        />

        <UiButton type="submit" :disabled="isSubmitting">
          <span v-if="!isSubmitting">Send Reset Link</span>
          <span v-else class="flex items-center gap-2">
            <Icon name="svg-spinners:270-ring" class="h-4 w-4" />
            Sending...
          </span>
        </UiButton>
      </form>

      <UiDialogFooter class="sm:justify-start">
        <UiDialogClose as-child>
          <UiButton variant="outline"> Back to Login </UiButton>
        </UiDialogClose>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>
