<template>
  <header>
    <UiNavbar sticky class="z-20 border-b bg-primary text-primary-foreground backdrop-blur">
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

        <div class="hidden w-1/2 items-center gap-3 md:flex">
          <div class="flex w-full items-center justify-center">
            <UiInput icon="lucide:search" placeholder="Type a product..." />
          </div>
          <div class="pl-2 text-xl">|</div>
          <div v-if="user" class="flex flex-row items-center gap-4">
            <!-- Cart -->
            <UiSheet>
              <UiSheetTrigger asChild>
                <UiChip class="bg-desctructive text-white" size="lg" :text="cartNum?.toString()">
                  <UiFancyIcon
                    icon="lucide:shopping-cart"
                    type="dark"
                    class="h-10 w-12 cursor-pointer hover:shadow-md"
                  />
                </UiChip>
              </UiSheetTrigger>
              <UiSheetContent side="right" title="Cart">
                <template #content>
                  <UiDivider class="pb-6 pt-2" />
                  Testing
                </template>
              </UiSheetContent>
            </UiSheet>
            <!-- User -->
            <UiNavigationMenu>
              <UiNavigationMenuList>
                <UiNavigationMenuItem>
                  <UiNavigationMenuTrigger>
                    <div class="flex flex-row items-center gap-2 text-secondary-foreground/70">
                      <Icon name="lucide:user" class="h-6 w-6 cursor-pointer hover:shadow-md" />
                      <span>{{ userData.username || "User" }}</span>
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
                      <div v-if="userData.organization">
                        <UiDivider class="py-2" />
                        <!-- Organization Dashboard -->

                        <NuxtLink :to="`/organization/${organizationID}`">
                          <div
                            class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Icon name="lucide:store" class="h-4 w-4" />
                            <div class="pl-2">Manage Store</div>
                          </div>
                        </NuxtLink>
                        <NuxtLink :to="`/organization/${organizationID}`">
                          <div
                            class="flex flex-row items-center justify-start rounded-sm p-2 hover:bg-primary hover:text-primary-foreground"
                          >
                            <Icon name="lucide:shopping-bag" class="h-4 w-4" />
                            <div class="pl-2">Manage Orders</div>
                          </div>
                        </NuxtLink>
                      </div>
                      <UiDivider class="py-2" />
                      <!-- Logout -->
                      <UiButton @click="logout" size="sm" class="flex w-full flex-row items-center">
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
  </header>
</template>

<script lang="ts" setup>
  import { useOrganizationValues } from "~/composables/organization/useOrganizationValues";
  import { useUserValues } from "~/composables/user/useUserValues";
  import { signOut } from "firebase/auth";

  const { organizationID } = useOrganizationValues();
  const { userData } = useUserValues();

  const cartNum = ref(1);

  const user = useCurrentUser();
  const auth = useFirebaseAuth();
  const logout = async () => {
    await signOut(auth!);
    navigateTo("/login");
  };
</script>
