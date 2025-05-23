<template>
  <UiSidebarProvider v-slot="{ isMobile, state }">
    <!-- App Sidebar -->
    <UiSidebar class="bg-primary text-primary-foreground">
      <UiSidebarHeader>
        <!-- Verch Logo and Title -->
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiSidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground rounded-none border-0"
                >
                  <div
                    class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                  >
                    <img
                      src="/logo-verch-2.png"
                      fit="contain"
                      alt="Company Logo"
                      title="Company Logo"
                      class="size-8 object-contain"
                    />
                  </div>
                  <div class="flex flex-col gap-0.5 leading-none">
                    <span class="font-semibold">Verch</span>
                  </div>
                  <Icon name="lucide:chevrons-up-down" class="ml-auto" />
                </UiSidebarMenuButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-[--radix-dropdown-menu-trigger-width]" align="start">
                <UiDropdownMenuItem
                  v-for="link in links"
                  :key="link.label"
                  class="cursor-pointer"
                  @select="navigateTo(link.url)"
                >
                  <Icon v-if="link.icon" :name="link.icon" class="mr-2 size-4" />
                  {{ link.label }}
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>

      <UiSidebarContent>
        <UiDivider class="" />
        <!-- Profile, Inbox, Orders -->
        <UiSidebarGroup>
          <UiSidebarGroupLabel label="Main Menu" class="text-md rounded-none" />
          <UiSidebarMenu class="space-y-4 p-2 text-lg">
            <UiSidebarMenuItem>
              <UiSidebarMenuButton as-child>
                <NuxtLink
                  v-if="user"
                  :to="`/user/profile/${user.uid}`"
                  :class="{
                    'bg-secondary text-secondary-foreground': isActive('/user/profile'),
                  }"
                >
                  <Icon name="lucide:user" class="mr-2 size-4" />
                  <span class="text-md">Profile</span>
                </NuxtLink>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
            <UiSidebarMenuItem>
              <UiSidebarMenuButton as-child>
                <NuxtLink
                  v-if="user"
                  :to="`/user/cart/${user.uid}`"
                  :class="{
                    'bg-secondary text-secondary-foreground': isActive('/user/cart'),
                  }"
                >
                  <Icon name="lucide:shopping-cart" class="mr-2 size-4" />
                  <span class="text-md">Cart</span>
                </NuxtLink>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
            <UiSidebarMenuItem>
              <UiSidebarMenuButton as-child>
                <NuxtLink
                  v-if="user"
                  :to="`/user/inbox/${user.uid}`"
                  :class="{
                    'bg-secondary text-secondary-foreground': isActive('/user/inbox'),
                  }"
                >
                  <Icon name="lucide:inbox" class="mr-2 size-4" />
                  <span class="text-md">Inbox</span>
                </NuxtLink>
              </UiSidebarMenuButton>
            </UiSidebarMenuItem>
            <UiCollapsible as-child :default-open="isActive('/user/orders')">
              <UiSidebarMenuItem>
                <UiCollapsibleTrigger as-child>
                  <UiSidebarMenuButton>
                    <Icon name="lucide:shopping-bag" class="mr-2 size-4" />
                    <span class="text-md">Orders</span>
                    <Icon name="lucide:chevron-right" class="ml-auto" />
                  </UiSidebarMenuButton>
                </UiCollapsibleTrigger>
                <UiCollapsibleContent class="py-2">
                  <UiSidebarMenuSub>
                    <UiSidebarMenuSubItem>
                      <UiSidebarMenuSubButton as-child>
                        <NuxtLink
                          v-if="user"
                          :to="`/user/orders/track-orders/${user.uid}`"
                          :class="{
                            'bg-secondary text-secondary-foreground': isActive(
                              '/user/orders/track-orders'
                            ),
                          }"
                          class="mb-2"
                        >
                          <Icon name="lucide:clock" class="mr-2" />
                          Track Orders
                        </NuxtLink>
                      </UiSidebarMenuSubButton>
                    </UiSidebarMenuSubItem>
                    <UiSidebarMenuSubItem>
                      <UiSidebarMenuSubButton as-child>
                        <NuxtLink
                          v-if="user"
                          :to="`/user/orders/history/${user.uid}`"
                          :class="{
                            'bg-secondary text-secondary-foreground':
                              isActive('/user/orders/history'),
                          }"
                        >
                          <Icon name="lucide:history" class="mr-2" />
                          History
                        </NuxtLink>
                      </UiSidebarMenuSubButton>
                    </UiSidebarMenuSubItem>
                  </UiSidebarMenuSub>
                </UiCollapsibleContent>
              </UiSidebarMenuItem>
            </UiCollapsible>
          </UiSidebarMenu>
        </UiSidebarGroup>
      </UiSidebarContent>
      <UiSidebarRail />
      <!-- Footer -->
      <UiSidebarFooter>
        <UiSidebarMenu>
          <UiSidebarMenuItem>
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiSidebarMenuButton
                  size="lg"
                  class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                >
                  <UiAvatar class="size-8 rounded-lg">
                    <UiAvatarImage src="/profile-icon.jpg" :alt="userData?.email" />
                    <UiAvatarFallback class="rounded-lg">BB</UiAvatarFallback>
                  </UiAvatar>
                  <div class="grid flex-1 text-left text-sm leading-tight">
                    <span class="truncate font-semibold">{{ userData?.username }}</span>
                    <span class="truncate text-xs">{{ userData?.email }}</span>
                  </div>
                  <Icon name="lucide:chevrons-up-down" class="ml-auto size-4" />
                </UiSidebarMenuButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent
                class="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                :side="isMobile ? 'bottom' : 'right'"
                :side-offset="4"
                align="end"
              >
                <UiDropdownMenuLabel class="p-0 font-normal">
                  <div class="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <UiAvatar class="size-8 rounded-lg">
                      <UiAvatarImage src="/profile-icon.jpg" :alt="userData?.email" />
                      <UiAvatarFallback class="rounded-lg">BB</UiAvatarFallback>
                    </UiAvatar>
                    <div class="grid flex-1 text-left text-sm leading-tight">
                      <span class="truncate font-semibold">{{ userData?.username }}</span>
                      <span class="truncate text-xs">{{ userData?.email }}</span>
                    </div>
                  </div>
                </UiDropdownMenuLabel>
                <UiDropdownMenuSeparator />
                <UiDropdownMenuItem icon="lucide:log-out" title="Log out" @click="logout" />
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarFooter>
    </UiSidebar>
    <!-- Sidebar main content -->
    <UiSidebarInset>
      <!-- Navbar -->
      <UiNavbar
        sticky
        class="flex h-16 shrink-0 items-center gap-2 border-b bg-primary px-4 text-primary-foreground"
      >
        <UiSidebarTrigger class="-ml-1" icon="lucide:menu" />
        <UiSeparator orientation="vertical" class="mr-2 h-4" />
      </UiNavbar>
      <div class="flex flex-1 flex-col sm:gap-4 sm:p-4">
        <slot />
      </div>
    </UiSidebarInset>
    <!-- Mobile Footer Navigation - Only visible on mobile -->
    <footer class="fixed bottom-0 left-0 right-0 border-t bg-white shadow-sm sm:hidden">
      <div class="flex w-full flex-row items-center justify-between">
        <UiButton
          to="/"
          variant="ghost"
          class="flex h-16 flex-1 flex-col justify-center py-2 text-sm text-muted-foreground"
        >
          <Icon name="lucide:house" class="h-5 w-5" />
          Home
        </UiButton>

        <UiButton
          :to="`/user/profile/${user?.uid}`"
          variant="ghost"
          class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
        >
          <Icon name="lucide:user" class="h-5 w-5" />
          Profile
        </UiButton>

        <UiButton
          :to="`/user/cart/${user?.uid}`"
          variant="ghost"
          class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
        >
          <div class="relative">
            <Icon name="lucide:shopping-cart" class="h-5 w-5" />
            <span
              v-if="cartCount > 0"
              class="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white"
            >
              {{ cartCount }}
            </span>
          </div>
          Cart
        </UiButton>

        <UiButton
          :to="`/user/orders/track-orders/${user?.uid}`"
          variant="ghost"
          class="flex h-16 flex-1 flex-col justify-center border-l py-2 text-sm text-muted-foreground"
        >
          <Icon name="lucide:shopping-basket" class="h-5 w-5" />
          Orders
        </UiButton>
      </div>
    </footer>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { signOut } from "firebase/auth";
  import { doc } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Account } from "~/types/models/Account";

  const user = useCurrentUser();
  const db = useFirestore();
  const auth = useFirebaseAuth();
  const userDocRef = computed(() => (user.value ? doc(db, "accounts", user.value.uid) : null));
  const userData = useDocument<Partial<Account>>(userDocRef) as Partial<Account> | undefined;
  // console.log("userData", userData);

  const cartCount = ref(0);

  // Fetch cart count when user is loaded
  watch(
    () => user.value,
    async (newUser) => {
      if (newUser?.uid) {
        try {
          const { userCart, fetchUserCart } = useFetchUserCart(newUser.uid);
          await fetchUserCart();

          watch(
            () => userCart.value,
            (cart) => {
              cartCount.value = cart?.length || 0;
            },
            { immediate: true }
          );
        } catch (error) {
          console.error("Error fetching cart:", error);
        }
      } else {
        cartCount.value = 0;
      }
    },
    { immediate: true }
  );

  const links = computed(() => [
    { label: "Home", url: "/", icon: "lucide:home" },
    { label: "Products", url: "/products", icon: "lucide:shopping-bag" },
  ]);

  const router = useRouter();
  const route = useRoute();

  const navigateTo = (url: string) => {
    router.push(url);
  };

  const isActive = (path: string) => {
    return route.path.startsWith(path);
  };

  const logout = async () => {
    const authStore = useAuthStore();
    await signOut(auth!);
    authStore.user = null;
    navigateTo("/");
  };
</script>

<style scoped>
  /* Add hover and active styles */
  .nuxt-link-active {
    background-color: var(--sidebar-accent);
    color: var(--sidebar-accent-foreground);
  }

  .nuxt-link-exact-active {
    background-color: var(--sidebar-accent);
    color: var(--sidebar-accent-foreground);
  }

  .nuxt-link:hover {
    background-color: var(--sidebar-hover);
    color: var(--sidebar-hover-foreground);
  }
</style>
