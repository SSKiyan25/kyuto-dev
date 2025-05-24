<template>
  <form @submit.prevent="verifyCode">
    <fieldset class="grid grid-cols-1 gap-5" :disabled="isSubmitting">
      <div class="flex flex-col space-y-2">
        <label class="text-sm font-medium">Verification Code</label>
        <p class="text-xs text-gray-500">Enter the 6-digit code sent to {{ email }}</p>
        <div class="flex gap-2">
          <UiInput v-model="code" placeholder="000000" class="text-center" />
          <UiButton
            type="button"
            variant="outline"
            size="sm"
            @click="handleResendCode"
            :disabled="isResending"
          >
            {{ isResending ? "Sending..." : "Resend" }}
          </UiButton>
        </div>
      </div>

      <UiDialogFooter>
        <UiButton variant="outline" type="button" @click="$emit('go-back')">Back</UiButton>
        <UiButton type="submit" :loading="isSubmitting">
          <span v-if="!isSubmitting">Verify</span>
          <span v-else>Verifying...</span>
        </UiButton>
      </UiDialogFooter>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
  import { addDoc, collection, doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

  const props = defineProps({
    email: {
      type: String,
      required: true,
    },
    verificationId: {
      type: String,
      required: true,
    },
  });

  const db = useFirestore();
  const toast = useToast();

  const code = ref("");
  const isSubmitting = ref(false);
  const isResending = ref(false);

  const emit = defineEmits(["verification-success", "go-back"]);

  const verifyCode = async () => {
    try {
      isSubmitting.value = true;

      // Get the verification document
      const verificationRef = doc(db, "verificationCodes", props.verificationId);
      const verificationDoc = await getDoc(verificationRef);

      if (!verificationDoc.exists()) {
        throw new Error("Verification code not found");
      }

      const verificationData = verificationDoc.data();

      // Check if code is expired
      const now = new Date();
      const expiresAt = verificationData.expiresAt.toDate();

      if (now > expiresAt) {
        throw new Error("Verification code expired");
      }

      // Check if code matches
      if (verificationData.code !== code.value) {
        throw new Error("Invalid verification code");
      }

      // Mark code as used
      await setDoc(verificationRef, { used: true }, { merge: true });

      // Emit success event
      emit("verification-success", { email: props.email });

      toast.toast({
        title: "Email Verified",
        description: "Email verified successfully. Please complete the organization setup.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Verification error:", error);
      toast.toast({
        title: "Verification Failed",
        description: error.message || "Failed to verify code. Please try again.",
        variant: "destructive",
      });
    } finally {
      isSubmitting.value = false;
    }
  };

  const handleResendCode = async () => {
    try {
      isResending.value = true;
      // Generate new code
      const newCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Create new verification document
      const verificationRef = await addDoc(collection(db, "verificationCodes"), {
        email: props.email,
        code: newCode,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      });

      // Send email with new code
      await $fetch("/api/send-email", {
        method: "POST",
        body: {
          to: props.email,
          subject: "Verch - New Email Verification Code",
          text: `Your new verification code is: ${newCode}. It will expire in 15 minutes.`,
          html: `
          <h1>New Email Verification Code</h1>
          <p>You requested a new verification code. Please use the following code:</p>
          <h2 style="font-size: 24px; padding: 10px; background-color: #f0f0f0; text-align: center;">${newCode}</h2>
          <p>This code will expire in 15 minutes.</p>
        `,
        },
      });

      // Update the verification ID in the parent component
      emit("verification-success", {
        email: props.email,
        verificationId: verificationRef.id,
        verified: false,
      });

      toast.toast({
        title: "New Code Sent",
        description: "A new verification code has been sent to your email.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error resending code:", error);
      toast.toast({
        title: "Error",
        description: "Failed to send new verification code.",
        variant: "destructive",
      });
    } finally {
      isResending.value = false;
    }
  };
</script>
