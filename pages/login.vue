<script setup lang="ts">
  import { signInWithGoogle } from "~/composables/auth/useGoogle";
  import { useAuthStore } from "~/stores/auth";
  import { signInWithEmailAndPassword, signOut } from "firebase/auth";
  import { doc, getDoc, updateDoc } from "firebase/firestore";
  import type { Account as User } from "~/types/models/Account";

  definePageMeta({
    layout: "no-nav",
    middleware: "already-logged-in",
  });

  const auth = useFirebaseAuth();
  const user = ref<User | null>(null);
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(LoginSchema),
  });

  const isConsentModalOpen = ref(false);
  const db = useFirestore();
  const router = useRouter();
  const userOrganization = ref(false);
  const userOrganizationId = ref("");

  const authStore = useAuthStore();

  const checkConsentStatus = async () => {
    if (auth?.currentUser) {
      const userDocRef = doc(db, "accounts", auth.currentUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        userOrganizationId.value = userData?.organizationId || "";
        userOrganization.value = userData?.hasOrganization || false;

        authStore.user = userData as User; // Store user data in the auth store
        // console.log("User Data: ", userData);
        if (userData.consentedToPrivacyAndTerms === undefined) {
          // If the field does not exist, create it with a default value of false
          await updateDoc(userDocRef, { consentedToPrivacyAndTerms: false });
          isConsentModalOpen.value = true; // Open modal since consent is not given
        } else if (userData.consentedToPrivacyAndTerms === true) {
          // If consent is already given, navigate to the homepage
          // console.log("User organization? ", userData.hasOrganization);
          // console.log("User organization ID: ", userData.organizationId);
          if (userData.hasOrganization) {
            // console.log("User has an organization.");
            return router.push(`/organization/${userData.organizationId}`);
          } else {
            console.log("User does not have an organization.");
            return router.push("/");
          }
        } else {
          isConsentModalOpen.value = true; // Open modal if consent is not given
        }
      } else {
        console.error("User document does not exist in Firestore.");
      }
    }
  };

  const submit = handleSubmit(async (values) => {
    console.log("Form successfully submitted with values: ", values);
    const loading = useSonner.loading("Loading...", {
      description: "Please wait while we log you in.",
    });
    try {
      await signInWithEmailAndPassword(auth!, values.email, values.password);
      useSonner.success("Welcome back!", { id: loading });

      // console.log("User: ", auth!.currentUser);
      await checkConsentStatus();
      //await updateProfile(user, { displayEmail: values.email });
    } catch (error: any) {
      console.error(error.message);
      useSonner.error(error.message, { id: loading });
    }
  });

  onMounted(async () => {
    authStore.user = null; // Clear user from store
    await checkConsentStatus();
  });

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle(auth);

      // Check consent status after successful Google login
      await checkConsentStatus();

      // If consent is already given, navigate to the home page
      if (!isConsentModalOpen.value) {
        if (userOrganization.value) {
          console.log("User has an organization.");
          return router.push(`/organization/${userOrganizationId.value}`);
        } else {
          console.log("User does not have an organization.");
          return router.push("/");
        }
      }
    } catch (error: any) {
      console.error("Google Sign-In Error:", error.message);
      useSonner.error("Failed to sign in with Google.");
    }
  };

  const handleConsent = async () => {
    if (auth?.currentUser) {
      const userDocRef = doc(db, "accounts", auth.currentUser.uid);
      await updateDoc(userDocRef, { consentedToPrivacyAndTerms: true });
      isConsentModalOpen.value = false; // Close modal
      return navigateTo("/", { replace: true });
    }
  };

  const handleCancel = async () => {
    if (auth?.currentUser) {
      await signOut(auth); // Sign out the user
      authStore.user = null; // Clear user from store
      isConsentModalOpen.value = false; // Close modal
    }
  };
</script>

<template>
  <div class="h-screen w-full">
    <!-- <LegalContent /> -->
    <LegalConsentModal v-if="isConsentModalOpen" @accept="handleConsent" @cancel="handleCancel" />
    <div
      class="container relative h-[800px] flex-col items-center justify-center sm:grid lg:max-w-none lg:grid-cols-2 lg:px-0"
    >
      <NuxtLink to="/" class="ghost absolute right-4 top-4 md:right-8 md:top-8">
        <div class="flex flex-row items-center hover:underline hover:opacity-70">
          <IconsChevronLeft class="pt-1" /> Back to Home
        </div>
      </NuxtLink>
      <div class="relative hidden h-full flex-col bg-muted p-10 text-white dark:border-r lg:flex">
        <div class="absolute inset-0 bg-[#17321A]" />
        <NuxtLink to="/">
          <div class="relative z-20 flex items-center text-lg font-medium">
            <img src="/logo-verch-2.png" alt="logo" class="h-auto w-8" />
            <p class="pl-2 pt-2">Verch</p>
          </div>
        </NuxtLink>
        <div class="relative z-20 mt-auto">
          <blockquote class="space-y-2">
            <!-- <p class="text-lg">
              &ldquo;This library has saved me countless hours of work and helped me deliver
              stunning designs to my clients faster than ever before.&rdquo;
            </p>
            <footer class="text-sm">Sofia Davis</footer> -->
          </blockquote>
        </div>
      </div>
      <div class="pt-20 sm:pt-0 lg:p-8">
        <div class="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <div class="flex flex-col space-y-2 text-center">
            <h1 class="text-2xl font-semibold tracking-tight">Sign in your account</h1>
            <p class="text-sm text-muted-foreground">Enter your email and password to proceed</p>
          </div>
          <!-- Login Component /component/Auth/Login.vue -->
          <!--<AuthLogin />-->
          <div>
            <form @submit="submit">
              <fieldset :disabled="isSubmitting" class="grid gap-4">
                <UiVeeInput
                  icon="lucide:user"
                  name="email"
                  type="email"
                  label="Email"
                  placeholder="juandelacruz@example.com"
                />
                <UiVeeInput
                  icon="lucide:lock"
                  name="password"
                  type="password"
                  label="Password"
                  placeholder="********"
                />
                <ForgotPassword :auth="auth!" />
                <UiButton type="submit" class="w-full"> Sign In </UiButton>
              </fieldset>
              <div class="pt-4">
                <UiDivider label="or continue with" class="pb-4" />
                <UiButton
                  @click="handleGoogleSignIn"
                  type="button"
                  class="w-full"
                  variant="outline"
                >
                  <Icon name="logos:google-icon" /> Sign in with Google
                </UiButton>
              </div>
            </form>
          </div>
          <!---->
          <p class="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our
            <NuxtLink to="/terms" class="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </NuxtLink>
            and
            <NuxtLink to="/privacy" class="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </NuxtLink>
          </p>
        </div>
        <div class="mt-2 flex items-end justify-end p-4 text-sm opacity-50">
          <NuxtLink to="/admin/verify" class="hover:text-red-600 hover:underline">
            Login as Admin
          </NuxtLink>
        </div>
      </div>
    </div>
  </div>
</template>
