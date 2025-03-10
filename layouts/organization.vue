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
  import { fetchOrganization } from "~/composables/organization/useOrganization";
  import { signOut } from "firebase/auth";
  import { doc } from "firebase/firestore";
  import { useRoute, useRouter } from "vue-router";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Account } from "~/types/models/Account";

  const route = useRoute();
  const router = useRouter();
  const user = useCurrentUser();
  const db = useFirestore();
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

  const orgData = await fetchOrganization();
  const userDocRef = computed(() => (user.value ? doc(db, "accounts", user.value.uid) : null));
  const userData = useDocument<Partial<Account>>(userDocRef) as Partial<Account> | undefined;

  console.log("OrganizationData: ", orgData);

  const logout = async () => {
    await signOut(auth!);
    navigateTo("/");
  };

  console.log("Organization id:", userData?.organizationID);
  const organizationPath = `/organization/${orgData.id}`;
  const organizationID = orgData.id || userData?.organizationID;
  console.log(organizationPath);

  const topNav = [
    { title: "Organization", icon: "lucide:newspaper", link: organizationPath },
    {
      title: "Dashboard",
      icon: "lucide:bar-chart-3",
      link: `/organization/dashboard/${organizationID}`,
    },
    { title: "Inbox", icon: "lucide:inbox", link: "/organization/inbox" },
    { title: "Products", icon: "lucide:package", link: "/organization/products" },
    { title: "Orders", icon: "lucide:list-checks", link: "/organization/orders" },
    { title: "Members", icon: "lucide:users", link: "/organization/members" },
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
