<template>
  <div class="flex min-h-screen flex-col">
    <header
      class="sticky top-0 z-40 w-full border-b bg-primary/90 text-primary-foreground backdrop-blur"
    >
      <UiContainer class="flex h-16 items-center justify-between sm:h-20">
        <div class="flex items-center gap-10">
          <NuxtLink to="/" class="flex items-center gap-3">
            <!-- eslint-disable-next-line vue/html-self-closing -->
            <img
              src="/logo-verch-2.png"
              fit="contain"
              alt="Company Logo"
              title="Company Logo"
              class="h-6 object-contain sm:h-8"
            />
            <span class="font-semibold sm:text-lg">Verch</span>
          </NuxtLink>
          <UiNavigationMenu as="nav" class="hidden items-center justify-start gap-8 sm:flex">
            <UiNavigationMenuList class="gap-2">
              <UiNavigationMenuItem>
                <UiNavigationMenuLink as-child>
                  <UiButton to="#" variant="ghost" size="sm"> Home </UiButton>
                </UiNavigationMenuLink>
              </UiNavigationMenuItem>
              <UiNavigationMenuItem></UiNavigationMenuItem>
            </UiNavigationMenuList>
          </UiNavigationMenu>
        </div>
        <div class="sm:hidden">
          <UiSheet>
            <UiSheetTrigger as-child>
              <UiButton variant="ghost" size="icon-sm">
                <Icon name="lucide:menu" class="h-5 w-5" />
              </UiButton>
              <UiSheetContent class="w-[90%] p-0">
                <template #content>
                  <UiSheetTitle class="sr-only" title="Mobile menu" />
                  <UiSheetDescription class="sr-only" description="Mobile menu" />
                  <UiSheetX class="z-20" />

                  <UiScrollArea class="h-full p-5">
                    <div class="flex flex-col gap-2">
                      <!-- User -->
                      <span class="font-bold"> Main Menu </span>
                      <div class="flex flex-row items-center">
                        <Icon name="lucide:house" class="h-5 w-5" />
                        <UiButton variant="ghost" class="text-dm justify-start" to="/">
                          Home
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:user" class="h-5 w-5" />
                        <UiButton
                          variant="ghost"
                          class="justify-start text-sm"
                          :to="`/user/profile/${userData?.id}`"
                        >
                          My Profile
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:shopping-cart" class="h-5 w-5" />
                        <UiButton
                          variant="ghost"
                          class="justify-start text-sm"
                          :to="`/user/cart/${userData?.id}`"
                        >
                          Cart
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:shopping-basket" class="h-5 w-5" />
                        <UiButton
                          variant="ghost"
                          class="justify-start text-sm"
                          :to="`/user/orders/track-orders/${userData?.id}`"
                        >
                          My Orders
                        </UiButton>
                      </div>

                      <UiGradientDivider class="my-5" />
                      <!-- Organization -->
                      <span class="font-bold"> Organization Menu </span>
                      <div class="flex flex-row items-center">
                        <Icon name="lucide:building-2" class="h-5 w-5" />
                        <UiButton
                          variant="ghost"
                          class="justify-start text-sm"
                          to="/organization/products"
                        >
                          Manage Store
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:shopping-bag" class="h-5 w-5" />
                        <UiButton
                          variant="ghost"
                          class="justify-start text-sm"
                          to="/organization/orders"
                        >
                          Manage Orders
                        </UiButton>
                      </div>

                      <UiGradientDivider class="my-5" />
                      <UiButton v-if="!user" to="/login" class="text-secondary-foreground"
                        >Log in</UiButton
                      >
                      <UiButton v-else variant="destructive" to="/login" class="text-secondary"
                        >Sign out</UiButton
                      >
                    </div>
                  </UiScrollArea>
                </template>
              </UiSheetContent>
            </UiSheetTrigger>
          </UiSheet>
        </div>
        <div class="hidden items-center gap-3 sm:flex">
          <UiButton to="/login" variant="outline" size="sm" class="text-secondary-foreground"
            >Log in</UiButton
          >
        </div>
      </UiContainer>
    </header>
    <div class="mt-0">
      <slot />
    </div>
    <footer class="fixed bottom-0 left-0 right-0 border-t bg-white shadow-sm sm:hidden">
      <div class="flex w-full flex-row items-center justify-between">
        <UiButton
          v-for="link in mobileLinks"
          :key="link.name"
          :to="link.to"
          variant="ghost"
          class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
        >
          <Icon :name="link.icon" class="h-5 w-5" />
          {{ link.name }}
        </UiButton>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { signOut } from "firebase/auth";
  import { doc } from "firebase/firestore";
  import type { Account } from "~/types/models/Account";

  const user = useCurrentUser();
  const db = useFirestore();
  console.log("user", user);
  console.log("User iud", user.value?.uid);

  const cartNum = ref(0);

  const userDocRef = computed(() => (user.value ? doc(db, "accounts", user.value.uid) : null));
  const userData = useDocument<Partial<Account>>(userDocRef) as Partial<Account> | undefined;
  console.log("userData", userData);

  watch(
    () => user.value,
    (newUser) => {
      if (newUser) {
        const { userCart, fetchUserCart } = useFetchUserCart(newUser.uid);
        watch(
          () => userCart.value,
          (newCart) => {
            cartNum.value = newCart.length;
          },
          { immediate: true }
        );
        fetchUserCart();
      }
    },
    { immediate: true }
  );

  const auth = useFirebaseAuth();
  const logout = async () => {
    await signOut(auth!);
    navigateTo("/login");
  };

  const mobileLinks = computed(() => [
    { name: "Home", to: "/", icon: "lucide:house" },
    { name: "My Profile", to: `/user/profile/${userData?.id}`, icon: "lucide:user" },
    { name: "Cart", to: `/user/cart/${userData?.id}`, icon: "lucide:shopping-cart" },
    { name: "My Store", to: "/organization/products", icon: "lucide:store" },
  ]);
</script>
