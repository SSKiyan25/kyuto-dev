<template>
  <form @submit.prevent="submit">
    <fieldset class="grid grid-cols-1 gap-5" :disabled="isSubmitting">
      <UiVeeInput name="name" label="Organization Name" icon="lucide:building" />
      <UiVeeInput name="password" label="Password" icon="lucide:lock" type="password" />
      <UiVeeInput
        name="confirmPassword"
        label="Confirm Password"
        icon="lucide:lock"
        type="password"
      />

      <UiDialogFooter>
        <UiButton variant="outline" type="button" @click="$emit('go-back')">Back</UiButton>
        <UiButton type="submit" :loading="isSubmitting">
          <span v-if="!isSubmitting">Create</span>
          <span v-else>Creating...</span>
        </UiButton>
      </UiDialogFooter>
    </fieldset>
  </form>
</template>

<script lang="ts" setup>
  import {
    createUserWithEmailAndPassword,
    sendEmailVerification,
    signInWithCustomToken,
  } from "firebase/auth";
  import { addDoc, collection, doc, serverTimestamp, setDoc } from "firebase/firestore";
  import { object, string, ref as yupRef } from "yup";
  import type { User } from "firebase/auth";

  const props = defineProps({
    email: {
      type: String,
      required: true,
    },
  });

  const auth = useFirebaseAuth()!;
  const db = useFirestore();
  const toast = useToast();
  const isSubmitting = ref(false);

  const emit = defineEmits(["organization-created", "go-back"]);

  // Form Schema
  const OrganizationSchema = object({
    name: string().required().label("Organization Name").max(128),
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

  const { handleSubmit } = useForm({
    validationSchema: toTypedSchema(OrganizationSchema),
  });

  const submit = handleSubmit(async (values) => {
    try {
      isSubmitting.value = true;

      // Create Auth Account
      const currentAdmin = auth.currentUser!;
      const idToken = await currentAdmin.getIdToken();
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        props.email,
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

      // Set email as verified using Admin SDK
      await $fetch("/api/admin/verify-email", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`.replace(/`/g, "\\`"),
          "Content-Type": "application/json",
        },
        body: {
          uid: userCredential.user.uid,
        },
      });

      const generateSearchKeywords = (name: string): string[] => {
        const keywords = new Set<string>();
        const words = name.toLowerCase().split(" ");
        words.forEach((word) => keywords.add(word));
        keywords.add(name.toLowerCase());
        return Array.from(keywords);
      };

      await signInWithCustomToken(auth, token);

      // Create Organization Document
      const orgRef = await addDoc(collection(db, "organizations"), {
        name: values.name,
        contactEmail: props.email,
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
        isPublic: false,
        isSetupComplete: false,
        isVerified: false,
        isArchived: false,
        searchKeywords: generateSearchKeywords(values.name),
      });

      // User Profile Document
      await setDoc(doc(db, "accounts", userCredential.user.uid), {
        email: props.email,
        name: values.name,
        role: "user",
        hasOrganization: true,
        organizationId: orgRef.id,
        organizationName: values.name,
        dateCreated: serverTimestamp(),
        lastModified: serverTimestamp(),
      });

      // Success Handling
      toast.toast({
        title: "Organization Created",
        description: "Your organization has been created successfully!",
        variant: "success",
        icon: "lucide:check-circle",
      });

      emit("organization-created", {
        id: orgRef.id,
        name: values.name,
      });
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
    } finally {
      isSubmitting.value = false;
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
