<template>
  <UiDialog v-model:open="open">
    <UiDialogContent class="max-w-xl overflow-y-auto">
      <UiDialogHeader>
        <UiDialogTitle>Create Organization</UiDialogTitle>
        <UiDialogDescription>
          Populate the form below to create a new organization.
        </UiDialogDescription>
      </UiDialogHeader>
      <form @submit.prevent="submit">
        <fieldset class="grid grid-cols-1 gap-5" :disabled="isSubmitting">
          <UiVeeInput name="name" label="Organization Name" icon="lucide:building" />
          <UiVeeInput name="email" label="Email" icon="lucide:mail" type="email" />
          <UiVeeInput name="password" label="Password" icon="lucide:lock" type="password" />
          <UiVeeInput
            name="confirmPassword"
            label="Confirm Password"
            icon="lucide:lock"
            type="password"
          />

          <UiDialogFooter>
            <UiDialogClose as-child>
              <UiButton variant="outline" type="button"> Cancel </UiButton>
            </UiDialogClose>
            <UiButton type="submit" :loading="isSubmitting">
              <span v-if="!isSubmitting">Create</span>
              <span v-else>Creating...</span>
            </UiButton>
          </UiDialogFooter>
        </fieldset>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithCustomToken,
  } from "firebase/auth";
  import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { object, string, ref as yupRef } from "yup";
  import type { Transaction } from "~/types/models/Transaction";
  import type { User } from "firebase/auth";

  // Firebase composables
  const auth = useFirebaseAuth()!;
  const db = useFirestore();
  const toast = useToast();

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

  // Form Schema
  const OrganizationSchema = object({
    name: string().required().label("Organization Name").max(128),
    email: string().required().label("Email").email(),
    password: string()
      .required()
      .label("Password")
      .min(6)
      .max(20)
      .matches(/^[^<@#`]*$/, "Password cannot contain the characters <, @, `, or #"),
    confirmPassword: string()
      .required()
      .oneOf([yupRef("password")], "Passwords must match"),
  });

  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: toTypedSchema(OrganizationSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      // Create Auth Account
      // const config = useRuntimeConfig();
      const currentAdmin = auth.currentUser!;
      const idToken = await currentAdmin.getIdToken();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        values.email,
        values.password
      );

      const { token } = await $fetch("/api/admin/generate-token", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`.replace(/`/g, "\\`"),
          "Content-Type": "application/json",
        },
        body: {
          uid: currentAdmin.uid,
        },
      });

      await signInWithCustomToken(auth, token);

      // Create Organization Document
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: values.name,
        contactEmail: values.email,
        phoneNumber: "",
        address: "",
        addressImagesURL: [],
        logoImageURL: "",
        coverImageURL: "",
        description: "",
        imagesURL: [],
        adminAccounts: [userCredential.user.uid],
        managerAccounts: [],
        staffAccounts: [],
        totalTransactionCount: 0,
        paidTransactionCount: 0,
        unpaidTransactionCount: 0,
        dateCreated: serverTimestamp(),
        lastModified: serverTimestamp(),
        isVerified: false,
        isArchived: false,
      });

      // User Profile Document
      await setDoc(doc(db, "accounts", userCredential.user.uid), {
        email: values.email,
        name: values.name,
        role: "user",
        hasOrganization: true,
        organizationId: orgRef.id,
        organizationName: values.name,
        dateCreated: serverTimestamp(),
        lastModified: serverTimestamp(),
      });

      // Send Email Verification
      await sendEmailVerification(userCredential.user, {
        url: `${window.location.origin}/verify/success`,
        handleCodeInApp: true,
      });

      // Create Initial Admin Transaction Record
      const initialTransaction: Partial<Transaction> = {
        id: `init-${userCredential.user.uid}`,
        organizationId: userCredential.user.uid,
        adminId: userCredential.user.uid,
        referenceNumber: `INIT-${new Date().getTime()}`,
        status: "paid",
        subtotalAmount: 0,
        totalAmount: 0,
        amountPaid: 0,
        balanceDue: 0,
        paymentMethod: "N/A",
        createdDate: new Date(),
        modifiedDate: new Date(),
      };

      await setDoc(doc(db, "transactions", initialTransaction.id as string), initialTransaction);

      // Success Handling
      toast.toast({
        title: "Organization Created",
        description: "Please check your email to verify your account.",
        variant: "success",
        icon: "lucide:mail-check",
        action: {
          label: "Resend Email",
          onClick: () => resendVerificationEmail(userCredential.user),
        },
      });

      emit("success", {
        id: orgRef.id,
        name: values.name,
      });
      open.value = false;
      resetForm();
    } catch (error: any) {
      console.error("Organization creation error:", error);

      let errorMessage = "Failed to create organization. Please try again.";
      switch (error.code) {
        case "auth/email-already-in-use":
          errorMessage = "This email is already registered.";
          break;
        case "auth/invalid-email":
          errorMessage = "Please enter a valid email address.";
          break;
        case "auth/weak-password":
          errorMessage = "Password must be at least 6 characters.";
          break;
      }

      toast.toast({
        title: "Error",
        description: errorMessage,
        variant: "warning",
        icon: "lucide:circle-alert",
      });
    }
  });

  // Resend verification email function
  const resendVerificationEmail = async (user: User) => {
    try {
      await sendEmailVerification(user);
      toast.toast({
        title: "Verification Sent",
        description: "Check your email for the verification link.",
        variant: "success",
        icon: "lucide:mail",
      });
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "Failed to resend verification email.",
        variant: "warning",
        icon: "lucide:alert-circle",
      });
    }
  };
</script>
