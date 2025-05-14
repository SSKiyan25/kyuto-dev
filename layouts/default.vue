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
                  <UiButton to="/" variant="ghost" size="sm" class="rounded-sm"> Home </UiButton>
                  <UiButton to="/stores" variant="ghost" size="sm" class="rounded-sm">
                    Stores
                  </UiButton>
                  <UiButton to="/products" variant="ghost" size="sm" class="rounded-sm">
                    Products
                  </UiButton>
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
                      <!-- Main Menu - Always shown -->
                      <span class="mt-8 font-bold">Main Menu</span>
                      <div class="mt-4 flex flex-row items-center">
                        <Icon name="lucide:house" class="h-5 w-5" />
                        <UiButton variant="ghost" class="text-dm justify-start" to="/">
                          Home
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:store" class="h-5 w-5" />
                        <UiButton variant="ghost" class="justify-start text-sm" to="/stores">
                          Stores
                        </UiButton>
                      </div>

                      <div class="flex flex-row items-center">
                        <Icon name="lucide:tag" class="h-5 w-5" />
                        <UiButton variant="ghost" class="justify-start text-sm" to="/products">
                          Products
                        </UiButton>
                      </div>

                      <!-- User Menu - Only shown when logged in -->
                      <template v-if="user">
                        <UiGradientDivider class="my-5" />
                        <span class="font-bold">User Menu</span>

                        <div class="flex flex-row items-center">
                          <Icon name="lucide:user" class="h-5 w-5" />
                          <UiButton
                            variant="ghost"
                            class="justify-start text-sm"
                            :to="`/user/profile/${user.id}`"
                          >
                            My Profile
                          </UiButton>
                        </div>

                        <div class="flex flex-row items-center">
                          <UiChip
                            :class="cartNum > 0 ? 'bg-red-700 text-white' : ''"
                            size="lg"
                            :text="cartNum > 0 ? cartNum.toString() : ''"
                          >
                            <Icon name="lucide:shopping-cart" class="h-5 w-5" />
                          </UiChip>
                          <UiButton
                            variant="ghost"
                            class="justify-start text-sm"
                            :to="`/user/cart/${user.id}`"
                          >
                            Cart
                          </UiButton>
                        </div>

                        <div class="flex flex-row items-center">
                          <Icon name="lucide:shopping-basket" class="h-5 w-5" />
                          <UiButton
                            variant="ghost"
                            class="justify-start text-sm"
                            :to="`/user/orders/track-orders/${user.id}`"
                          >
                            My Orders
                          </UiButton>
                        </div>

                        <!-- Organization Menu - Only shown when user has an organization -->
                        <template v-if="hasOrganization">
                          <UiGradientDivider class="my-5" />
                          <span class="font-bold">Organization Menu</span>

                          <div class="flex flex-row items-center">
                            <Icon name="lucide:building-2" class="h-5 w-5" />
                            <UiButton
                              variant="ghost"
                              class="justify-start text-sm"
                              :to="`/organization/products/${user.organizationId}`"
                            >
                              Manage Store
                            </UiButton>
                          </div>

                          <div class="flex flex-row items-center">
                            <Icon name="lucide:shopping-bag" class="h-5 w-5" />
                            <UiButton
                              variant="ghost"
                              class="justify-start text-sm"
                              :to="`/organization/orders/${user.organizationId}`"
                            >
                              Manage Orders
                            </UiButton>
                          </div>

                          <div class="flex flex-row items-center">
                            <Icon name="lucide:bar-chart-2" class="h-5 w-5" />
                            <UiButton
                              variant="ghost"
                              class="justify-start text-sm"
                              :to="`/organization/dashboard/${user.organizationId}`"
                            >
                              Analytics
                            </UiButton>
                          </div>
                        </template>

                        <UiGradientDivider class="my-5" />
                        <UiButton variant="destructive" @click="logout" class="text-secondary">
                          Sign out
                        </UiButton>
                      </template>

                      <!-- Login button - Only shown when not logged in -->
                      <template v-else>
                        <UiDivider class="my-5" />
                        <UiButton to="/login" class="text-secondary-foreground"> Log in </UiButton>
                      </template>
                    </div>
                  </UiScrollArea>
                </template>
              </UiSheetContent>
            </UiSheetTrigger>
          </UiSheet>
        </div>
        <div class="hidden items-center gap-3 sm:flex">
          <template v-if="user">
            <UiButton :to="`/user/cart/${user.id}`" variant="ghost">
              <UiChip
                :class="cartNum > 0 ? 'bg-red-700 text-white' : ''"
                size="lg"
                :text="cartNum > 0 ? cartNum.toString() : ''"
              >
                <Icon name="lucide:shopping-cart" class="h-6 w-6 cursor-pointer hover:shadow-md" />
              </UiChip>
            </UiButton>
            <!-- User -->
            <UiNavigationMenu>
              <UiNavigationMenuList>
                <UiNavigationMenuItem>
                  <UiNavigationMenuTrigger
                    class="rounded-full bg-secondary text-secondary-foreground"
                  >
                    <div
                      class="flex flex-row items-center gap-1 rounded-full text-secondary-foreground"
                    >
                      <Icon name="lucide:user" class="h-6 w-6 cursor-pointer hover:shadow-md" />
                    </div>
                  </UiNavigationMenuTrigger>
                  <UiNavigationMenuContent>
                    <div class="flex w-[200px] flex-col justify-start px-4 py-4 text-sm">
                      <div v-if="user">
                        <span></span>
                        <!-- User Profile -->
                        <NuxtLink :to="`/user/profile/${user.id}`">
                          <div
                            class="flex flex-row items-center justify-between rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <div class="flex items-center">
                              <Icon name="lucide:user" class="h-4 w-4" />
                              <div class="pl-2">Profile</div>
                            </div>

                            <Icon name="lucide:move-up-right" class="h-2 w-2 opacity-70" />
                          </div>
                        </NuxtLink>
                        <NuxtLink :to="`/user/orders/track-orders/${user.id}`">
                          <div
                            class="flex flex-row items-center justify-between rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <NuxtLink :to="`/user/orders/track-orders/${user.id}`">
                              <div class="flex items-center">
                                <Icon name="lucide:box" class="h-4 w-4" />
                                <div class="pl-2">Your Orders</div>
                              </div>
                            </NuxtLink>

                            <Icon name="lucide:move-up-right" class="h-2 w-2 opacity-70" />
                          </div>
                        </NuxtLink>
                        <NuxtLink :to="`/user/inbox/${user.id}`">
                          <div
                            class="flex flex-row items-center justify-between rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <div class="flex items-center">
                              <Icon name="lucide:inbox" class="h-4 w-4" />
                              <div class="pl-2">Inbox</div>
                            </div>

                            <Icon name="lucide:move-up-right" class="h-2 w-2 opacity-70" />
                          </div>
                        </NuxtLink>
                      </div>
                      <div v-if="hasOrganization">
                        <UiDivider class="py-2" />
                        <!-- Organization Dashboard -->
                        <NuxtLink :to="`/organization/products/${user?.organizationId}`">
                          <div
                            class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Icon name="lucide:store" class="h-4 w-4" />
                            <div class="pl-2">Manage Store</div>
                          </div>
                        </NuxtLink>
                        <NuxtLink :to="`/organization/orders/${user?.organizationId}`">
                          <div
                            class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <!-- <UiChip class="bg-red-700 text-white" size="lg" text="7"> -->
                            <Icon name="lucide:shopping-bag" class="h-4 w-4" />
                            <!-- </UiChip> -->
                            <div class="pl-2">Manage Orders</div>
                          </div>
                        </NuxtLink>
                        <NuxtLink :to="`/organization/dashboard/${user?.organizationId}`">
                          <div
                            class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Icon name="lucide:bar-chart-2" class="h-4 w-4" />
                            <div class="pl-2">Analytics</div>
                          </div>
                        </NuxtLink>
                      </div>
                      <UiDivider class="py-2" />
                      <!-- Logout -->
                      <UiButton
                        @click="logout"
                        size="sm"
                        variant="destructive"
                        class="flex w-full flex-row items-center"
                      >
                        <Icon name="lucide:log-out" class="h-4 w-4" />
                        Log Out
                      </UiButton>
                    </div>
                  </UiNavigationMenuContent>
                </UiNavigationMenuItem>
              </UiNavigationMenuList>
            </UiNavigationMenu>
          </template>
          <template v-else>
            <UiButton to="/login" variant="outline" size="sm" class="text-secondary-foreground">
              Log in
            </UiButton>
          </template>
        </div>
      </UiContainer>
    </header>
    <div class="mt-0 flex min-h-screen flex-col">
      <slot />
      <Footer />
    </div>
    <footer class="fixed bottom-0 left-0 right-0 border-t bg-white shadow-sm sm:hidden">
      <div class="flex w-full flex-row items-center justify-between">
        <!-- Anonymous User Navigation -->
        <template v-if="!user">
          <UiButton
            to="/"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:house" class="h-5 w-5" />
            Home
          </UiButton>
          <UiButton
            to="/stores"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:store" class="h-5 w-5" />
            Stores
          </UiButton>
          <UiButton
            to="/products"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:tag" class="h-5 w-5" />
            Products
          </UiButton>
          <UiButton
            to="/login"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:log-in" class="h-5 w-5" />
            Login
          </UiButton>
        </template>

        <!-- Regular User Navigation -->
        <template v-else-if="user && !hasOrganization">
          <UiButton
            to="/"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:house" class="h-5 w-5" />
            Home
          </UiButton>
          <UiButton
            to="/products"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:tag" class="h-5 w-5" />
            Products
          </UiButton>
          <UiButton
            :to="`/user/cart/${user.id}`"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <div class="relative">
              <Icon name="lucide:shopping-cart" class="h-5 w-5" />
              <span
                v-if="cartNum > 0"
                class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white"
              >
                {{ cartNum }}
              </span>
            </div>
            Cart
          </UiButton>
          <UiButton
            :to="`/user/orders/track-orders/${user.id}`"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:shopping-basket" class="h-5 w-5" />
            Orders
          </UiButton>
        </template>

        <!-- Organization User Navigation -->
        <template v-else-if="user && hasOrganization">
          <UiButton
            to="/"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:house" class="h-5 w-5" />
            Home
          </UiButton>
          <UiButton
            :to="`/organization/products/${user.organizationId}`"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:store" class="h-5 w-5" />
            My Store
          </UiButton>
          <UiButton
            :to="`/organization/orders/${user.organizationId}`"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:package" class="h-5 w-5" />
            Sales
          </UiButton>
          <UiButton
            :to="`/organization/dashboard/${user.organizationId}`"
            variant="ghost"
            class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
          >
            <Icon name="lucide:bar-chart-2" class="h-5 w-5" />
            Dashboard
          </UiButton>
        </template>
      </div>
    </footer>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { signOut } from "firebase/auth";
  import type { Account } from "~/types/models/Account";

  const user = ref<Account | null>(null);

  onMounted(() => {
    const authStore = useAuthStore();
    user.value = authStore.user;
    console.log("User in layout:", user.value);
  });

  const hasOrganization = computed(() => !!user.value?.organizationId);

  const cartNum = ref(0);

  watch(
    () => user.value,
    (newUser) => {
      if (newUser && newUser.id) {
        const { userCart, fetchUserCart } = useFetchUserCart(newUser.id);
        watch(
          () => userCart.value,
          (newCart) => {
            cartNum.value = newCart.length;
          },
          { immediate: true }
        );
        const authStore = useAuthStore();
        authStore.user = newUser as Account;
        fetchUserCart();
      }
    },
    { immediate: true }
  );

  const auth = useFirebaseAuth();

  const logout = async () => {
    const authStore = useAuthStore();
    await signOut(auth!);
    authStore.user = null;
    navigateTo("/login");
  };
</script>
