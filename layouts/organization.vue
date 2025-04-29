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
                  {{ link.label }}
                </UiDropdownMenuItem>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </UiSidebarMenuItem>
        </UiSidebarMenu>
      </UiSidebarHeader>

      <UiSidebarContent>
        <UiDivider class="" />
        <!-- Navigation -->
        <UiSidebarGroup>
          <UiSidebarGroupLabel label="Main Menu" class="text-md rounded-none" />
          <UiSidebarMenu class="space-y-4 p-2 text-lg">
            <template v-for="(n, i) in topNav" :key="i">
              <UiSidebarMenuItem>
                <UiSidebarMenuButton as-child>
                  <NuxtLink
                    :to="n.link"
                    :class="{ 'bg-secondary text-secondary-foreground': isActiveItem(n.link) }"
                  >
                    <Icon v-if="n.icon" :name="n.icon" class="mr-2 size-4" />
                    <span>{{ n.title }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </template>
          </UiSidebarMenu>
        </UiSidebarGroup>
        <UiSidebarGroup>
          <UiSidebarGroupLabel label="Support" class="text-md rounded-none" />
          <UiSidebarMenu class="space-y-4 p-2 text-lg">
            <template v-for="(n, i) in bottomNav" :key="i">
              <UiSidebarMenuItem>
                <UiSidebarMenuButton as-child>
                  <NuxtLink :to="n.link">
                    <Icon v-if="n.icon" :name="n.icon" class="mr-2 size-4" />
                    <span>{{ n.title }}</span>
                  </NuxtLink>
                </UiSidebarMenuButton>
              </UiSidebarMenuItem>
            </template>
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
                    <span class="truncate font-semibold">{{ userData?.organization }}</span>
                    <span class="truncate text-xs">Admin</span>
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
      <UiNavbar sticky class="flex h-16 shrink-0 items-center gap-2 border-b bg-secondary px-4">
        <UiSidebarTrigger class="-ml-1" icon="lucide:menu" />
        <UiSeparator orientation="vertical" class="mr-2 h-4" />
        <UiBreadcrumbs v-if="breadcrumbs && breadcrumbs.length" :items="breadcrumbs" />
      </UiNavbar>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <slot />
      </div>
    </UiSidebarInset>
  </UiSidebarProvider>
</template>

<script lang="ts" setup>
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { signOut } from "firebase/auth";
  import { useRoute, useRouter } from "vue-router";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Account } from "~/types/models/Account";

  const route = useRoute();
  const router = useRouter();
  const auth = useFirebaseAuth();

  const links = computed(() => [
    { label: "Home", url: "/", icon: "lucide:home" },
    { label: "Products", url: "/", icon: "lucide:shopping-bag" },
  ]);

  const props = defineProps<{
    breadcrumbs?: Crumbs[];
  }>();

  const navigateTo = (url: string) => {
    router.push(url);
  };

  const { getOrganizationIDFromUserId } = useOrganization();
  const userData = ref<Account | null>(null);

  const organizationIdParams = route.params.id as string;
  const fetchOrganizationData = async () => {
    try {
      const userId = auth?.currentUser?.uid; // Ensure you have the current user's ID
      if (!userId) {
        throw new Error("User is not logged in");
      }

      const { userData: fetchedUserData } = await getOrganizationIDFromUserId(userId);
      userData.value = fetchedUserData;
      // Use organizationPath or organizationId as needed
    } catch (error) {
      console.error("Error fetching organization data:", error);
    }
  };

  const logout = async () => {
    const authStore = useAuthStore();
    try {
      await signOut(auth!);
      authStore.user = null;
      navigateTo("/");
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  onMounted(() => {
    fetchOrganizationData();
  });

  console.log("Organization id:", organizationIdParams);
  const organizationPath = `/organization/${organizationIdParams}`;
  const organizationID = organizationIdParams;

  const topNav = [
    { title: "Organization", icon: "lucide:newspaper", link: organizationPath },
    {
      title: "Dashboard",
      icon: "lucide:bar-chart-3",
      link: `/organization/dashboard/${organizationID}`,
    },
    { title: "Inbox", icon: "lucide:inbox", link: `/organization/inbox/${organizationID}` },
    { title: "Products", icon: "lucide:package", link: `/organization/products/${organizationID}` },
    { title: "Orders", icon: "lucide:list-checks", link: `/organization/orders/${organizationID}` },
    {
      title: "Billings",
      icon: "lucide:credit-card",
      link: `/organization/billings/${organizationID}`,
    },
    { title: "Members", icon: "lucide:users", link: `/organization/members/${organizationID}` },
  ];

  const bottomNav = [
    { title: "Support", icon: "lucide:life-buoy", link: "#" },
    { title: "Settings", icon: "lucide:settings-2", link: "#" },
  ];

  const isActiveItem = (link: string) => {
    return route.path === link;
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
