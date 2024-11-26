<template>
  <ClientOnly>
    <div>
      <UiNavbar sticky class="z-50 border-b bg-primary text-primary-foreground backdrop-blur">
        <UiContainer class="flex h-16 w-full items-center justify-between md:h-20">
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

          <div class="relative hidden w-1/2 items-center gap-3 md:flex">
            <div class="flex w-full items-center justify-center">
              <!-- Search -->
              <UiCommand class="rounded-lg border shadow-sm">
                <UiCommandInput placeholder="Search Anything..." showCancel type="string" />
                <UiCommandList class="absolute mt-12 w-10/12 rounded-sm bg-secondary shadow">
                  <!-- <UiCommandEmpty>No results found.</UiCommandEmpty> -->
                  <!-- <template v-for="(item, label, i) in items" :key="i">
                    <UiCommandGroup :heading="label">
                      <UiCommandItem
                        v-for="(child, k) in item"
                        :key="k"
                        :text="child.label"
                        :icon="child.icon"
                        :value="child.label"
                        @select="
                          child.perform?.();
                          $event.preventDefault();
                        "
                      />
                    </UiCommandGroup>
                    <UiCommandSeparator class="last:hidden" />
                  </template> -->
                </UiCommandList>
              </UiCommand>
            </div>
            <div class="pl-2 text-xl">|</div>
            <div v-if="user" class="flex flex-row items-center gap-4">
              <!-- Cart -->
              <UiButton :to="`/user/cart/${user.uid}`">
                <UiChip
                  :class="cartNum > 0 ? 'bg-red-700 text-white' : ''"
                  size="lg"
                  :text="cartNum > 0 ? cartNum.toString() : ''"
                >
                  <Icon
                    name="lucide:shopping-cart"
                    class="h-6 w-6 cursor-pointer hover:shadow-md"
                  />
                </UiChip>
              </UiButton>
              <!-- User -->
              <UiNavigationMenu>
                <UiNavigationMenuList>
                  <UiNavigationMenuItem>
                    <UiNavigationMenuTrigger>
                      <div class="flex flex-row items-center gap-2 text-secondary-foreground/70">
                        <Icon name="lucide:user" class="h-6 w-6 cursor-pointer hover:shadow-md" />
                        <span>{{ userData?.username || "User" }}</span>
                      </div>
                    </UiNavigationMenuTrigger>
                    <UiNavigationMenuContent>
                      <div class="flex w-[200px] flex-col justify-start px-4 py-4 text-sm">
                        <span></span>
                        <!-- User Profile -->
                        <NuxtLink to="/user/profile">
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
                        <NuxtLink to="/user/profile">
                          <div
                            class="flex flex-row items-center justify-between rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <div class="flex items-center">
                              <Icon name="lucide:box" class="h-4 w-4" />
                              <div class="pl-2">Your Orders</div>
                            </div>

                            <Icon name="lucide:move-up-right" class="h-2 w-2 opacity-70" />
                          </div>
                        </NuxtLink>
                        <NuxtLink to="/user/profile">
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
                        <div v-if="userData && userData.hasOrganization">
                          <UiDivider class="py-2" />
                          <!-- Organization Dashboard -->
                          <NuxtLink to="/organization/dashboard">
                            <div
                              class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                            >
                              <Icon name="lucide:store" class="h-4 w-4" />
                              <div class="pl-2">Manage Store</div>
                            </div>
                          </NuxtLink>
                          <NuxtLink to="/organization/orders">
                            <div
                              class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                            >
                              <UiChip class="bg-red-700 text-white" size="lg" text="7">
                                <Icon name="lucide:shopping-bag" class="h-4 w-4" />
                              </UiChip>
                              <div class="pl-2">Manage Orders</div>
                            </div>
                          </NuxtLink>
                        </div>
                        <UiDivider class="py-2" />
                        <!-- Logout -->
                        <UiButton
                          @click="logout"
                          size="sm"
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
            </div>
            <UiButton v-if="!user" to="/login" variant="secondary" size="sm" class="w-20"
              >Log in</UiButton
            >
          </div>
        </UiContainer>
      </UiNavbar>
    </div>
  </ClientOnly>
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

  const search = ref("");
</script>
