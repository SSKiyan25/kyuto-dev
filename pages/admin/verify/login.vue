<template>
  <div class="flex h-screen items-center justify-center">
    <div class="w-full max-w-[330px] px-5">
      <h1 class="text-2xl font-bold tracking-tight lg:text-3xl">Log in</h1>
      <p class="mt-1 text-muted-foreground">Enter your email & password to log in.</p>

      <form class="mt-10" @submit="submit">
        <fieldset :disabled="isSubmitting" class="grid gap-5">
          <div>
            <UiVeeInput label="Email" type="email" name="email" placeholder="john@example.com" />
          </div>
          <div>
            <UiVeeInput label="Password" type="password" name="password" />
          </div>
          <div>
            <UiButton class="w-full" type="submit" text="Log in" />
          </div>
        </fieldset>
      </form>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useAuthStore } from "~/stores/auth";
  import { signInWithEmailAndPassword } from "firebase/auth";
  import { doc, getDoc } from "firebase/firestore";
  import { object, string } from "yup";
  import type { Account as User } from "~/types/models/Account";
  import type { InferType } from "yup";

  definePageMeta({
    layout: "no-nav",
    middleware: "already-logged-in",
  });

  useSeoMeta({
    title: "Verch | Admin Login",
    description: "Enter your email & password to log in.",
  });

  const auth = useFirebaseAuth();
  const db = useFirestore();
  const user = ref<User | null>(null);
  const authStore = useAuthStore();

  const LoginSchema = object({
    email: string().email().required().label("Email"),
    password: string().required().label("Password"),
  });

  const { handleSubmit, isSubmitting } = useForm<InferType<typeof LoginSchema>>({
    validationSchema: LoginSchema,
  });

  const submit = handleSubmit(async (_) => {
    // console.log("Values", _);
    const loading = useSonner.loading("Loading...", {
      description: "...",
    });
    try {
      const userCredential = await signInWithEmailAndPassword(auth!, _.email, _.password);
      const user = userCredential.user;

      // console.log("User: ", user);
      const userDocRef = doc(db, "accounts", user.uid);
      const userDoc = await getDoc(userDocRef);
      // console.log("UserDoc in Admin Login Page: ", userDoc);
      // console.log("User UID: ", user.uid);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const role = userData.role;
        if (role === "admin") {
          useSonner.success("Welcome back!", { id: loading });
          // console.log("User: ", user);
          authStore.user = userData as User;
          return navigateTo("/admin/dashboard");
        } else {
          useSonner.error("Unauthorized Access", {
            id: loading,
            description: "You are not authorized to access admin pages.",
          });
          return navigateTo("/");
        }
      } else {
        useSonner.error("No User Account Detected", { id: loading });
        return navigateTo("/admin/verify");
      }
    } catch (error: any) {
      console.error(error.message);
      useSonner.error(error.message, { id: loading });
    }
  });
</script>
