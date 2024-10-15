<script setup lang="ts">
  import { useGoogleLogin } from "~/composables/auth/useGoogle";
  import { signInWithEmailAndPassword } from "firebase/auth";

  definePageMeta({
    layout: "no-nav",
    middleware: "already-logged-in",
  });

  const auth = useFirebaseAuth();
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(LoginSchema),
  });

  const submit = handleSubmit(async (values) => {
    const loading = useSonner.loading("Loading...", {
      description: "Signed in successfully!",
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
    await useGoogleLogin();
  };
  const user = useCurrentUser();
  console.log("Check user: ", user);
</script>

<template>
  <div class="h-screen w-full">
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
            <p class="text-lg">
              &ldquo;This library has saved me countless hours of work and helped me deliver
              stunning designs to my clients faster than ever before.&rdquo;
            </p>
            <footer class="text-sm">Sofia Davis</footer>
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
              <UiButton
                @click="signInWithGoogle"
                type="button"
                class="mt-4 w-full"
                variant="outline"
              >
                <Icon name="logos:google-icon" /> Sign in with Google
              </UiButton>
            </div>
          </div>
          <!---->
          <p class="px-8 text-center text-sm text-muted-foreground">
            By clicking continue, you agree to our
            <a href="/terms" class="underline underline-offset-4 hover:text-primary">
              Terms of Service
            </a>
            and
            <a href="/privacy" class="underline underline-offset-4 hover:text-primary">
              Privacy Policy
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
