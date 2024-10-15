<template>
  <header>
    <UiNavbar sticky class="z-20 border-b bg-primary text-primary-foreground backdrop-blur">
      <UiContainer class="flex h-16 w-full items-center justify-between lg:h-20">
        <div class="flex items-center gap-0">
          <NuxtLink to="/" class="flex items-center gap-3">
            <img
              src="/logo-verch-2.png"
              fit="contain"
              alt="Company Logo"
              title="Company Logo"
              class="h-auto w-8 object-contain lg:w-12"
            />
            <span class="font-semibold lg:text-lg">Verch</span>
          </NuxtLink>
        </div>
        <!-- Mobile (TO EDIT) -->
        <div class="lg:hidden">
          <UiSheet>
            <UiSheetTrigger as-child>
              <UiButton variant="ghost" size="icon-sm">
                <Icon name="lucide:menu" class="h-5 w-5" />
              </UiButton>
              <UiSheetContent class="w-[90%] p-0" side="right">
                <template #content>
                  <UiSheetTitle class="sr-only" title="Mobile menu" />
                  <UiSheetDescription class="sr-only" description="Mobile menu" />
                  <UiSheetX class="z-20" />

                  <UiScrollArea class="h-full p-5">
                    <div class="flex flex-col gap-2">
                      <UiButton variant="ghost" class="justify-start text-base" to="/"
                        >Home</UiButton
                      >
                      <UiGradientDivider class="my-5" />
                      <UiButton variant="default" to="/login">Log in</UiButton>
                    </div>
                  </UiScrollArea>
                </template>
              </UiSheetContent>
            </UiSheetTrigger>
          </UiSheet>
        </div>
        <div class="hidden w-1/2 items-center gap-3 lg:flex">
          <div class="flex w-full items-center justify-center">
            <UiInput icon="lucide:search" placeholder="Type a product..." />
          </div>
          <UiButton v-if="!user" to="/login" variant="secondary" size="sm" class="w-20"
            >Log in</UiButton
          >
          <UiButton @click="logout" v-else variant="secondary" size="sm" class="w-24"
            >Log out</UiButton
          >
        </div>
      </UiContainer>
    </UiNavbar>
  </header>
</template>

<script lang="ts" setup>
  import { signOut } from "firebase/auth";

  const user = useCurrentUser();
  const auth = useFirebaseAuth();
  const logout = async () => {
    await signOut(auth!);
    navigateTo("/");
  };
</script>
