<template>
  <form @submit.prevent="sendVerificationCode">
    <fieldset class="grid grid-cols-1 gap-5" :disabled="isVerifying">
      <UiVeeInput name="email" label="Email" icon="lucide:mail" type="email" />
      <UiDialogFooter>
        <UiDialogClose as-child>
          <UiButton variant="outline" type="button"> Cancel </UiButton>
        </UiDialogClose>
        <UiButton type="submit" :loading="isVerifying">
          <span v-if="!isVerifying">Send Verification Code</span>
          <span v-else>Sending...</span>
        </UiButton>
      </UiDialogFooter>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
  import { addDoc, collection, serverTimestamp } from "firebase/firestore";
  import { object, string } from "yup";

  const db = useFirestore();
  const toast = useToast();

  const isVerifying = ref(false);

  const emit = defineEmits(["verification-sent"]);

  // Email schema
  const emailSchema = toTypedSchema(
    object({
      email: string().required().label("Email").email(),
    })
  );

  const { handleSubmit: handleEmailSubmit } = useForm({
    validationSchema: emailSchema,
  });

  const sendVerificationCode = handleEmailSubmit(async (values) => {
    console.log("Sending verification code for:", values.email);
    try {
      isVerifying.value = true;

      // Generate a random 6-digit code
      const code = Math.floor(100000 + Math.random() * 900000).toString();

      // Store verification code in Firestore
      const verificationRef = await addDoc(collection(db, "verificationCodes"), {
        email: values.email,
        code: code,
        createdAt: serverTimestamp(),
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        used: false,
      });

      // Send email with verification code
      await $fetch("/api/send-email", {
        method: "POST",
        body: {
          to: values.email,
          subject: "Verch - Email Verification Code",
          text: `Your verification code is: ${code}. It will expire in 15 minutes.`,
          html: `
          <h1>Email Verification</h1>
          <p>Thank you for registering with Verch. Please use the following code to verify your email address:</p>
          <h2 style="font-size: 24px; padding: 10px; background-color: #f0f0f0; text-align: center;">${code}</h2>
          <p>This code will expire in 15 minutes.</p>
          <p>If you did not request this code, please ignore this email.</p>
        `,
        },
      });

      // Emit event to parent with verification info
      emit("verification-sent", {
        email: values.email,
        verificationId: verificationRef.id,
      });

      toast.toast({
        title: "Verification Code Sent",
        description: "Please check your email for the verification code.",
        variant: "success",
      });
    } catch (error: any) {
      console.error("Error sending verification code:", error);
      toast.toast({
        title: "Error",
        description: error.message || "Failed to send verification code. Please try again.",
        variant: "destructive",
      });
    } finally {
      isVerifying.value = false;
    }
  });
</script>
