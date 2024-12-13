<script lang="ts" setup>
  import { signInWithGoogle as signGoogle } from "~/composables/auth/useGoogle";
  import { signInWithEmailAndPassword } from "firebase/auth";

  const auth = useFirebaseAuth();
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(LoginSchema),
  });

  const submit = handleSubmit(async (values) => {
    const loading = useSonner.loading("Loading...", {
      description: "Signing in your account...",
    });
    try {
      await signInWithEmailAndPassword(auth!, values.email, values.password);
      useSonner.success("Welcome back!", { id: loading });

      console.log("User: ", auth!.currentUser);
      //await updateProfile(user, { displayEmail: values.email });
      return navigateTo("/", { replace: true });
    } catch (error: any) {
      console.error(error.message);
      useSonner.error(error.message, { id: loading });
    }
  });

  const signInWithGoogle = async () => {
    await signGoogle(auth);
  };

  const user = useCurrentUser();
  console.log("Check user: ", user);
</script>

<template>
  <div>
    <form @submit="submit">
      <fieldset :disabled="isSubmitting" class="grid gap-8">
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
        <UiButton type="submit" class="w-full"> Sign In </UiButton>
      </fieldset>
    </form>
    <div class="relative">
      <div class="absolute inset-0 flex items-center">
        <span class="w-full border-t" />
      </div>
      <div class="relative flex justify-center pt-8 text-xs uppercase">
        <span class="bg-background px-2 text-muted-foreground"> Or continue with </span>
      </div>
      <UiButton @click="signInWithGoogle" type="button" class="mt-4 w-full" variant="outline">
        <Icon name="logos:google-icon" /> Sign in with Google
      </UiButton>
    </div>
  </div>
</template>
