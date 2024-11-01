<template>
  <aside class="fixed flex shadow-lg">
    <UiScrollArea
      v-if="!isSidebarHidden"
      class="z-50 h-screen w-[300px] border-r bg-primary text-primary-foreground"
    >
      <!-- Sidebar content -->
      <div class="flex h-screen flex-col pt-7">
        <div class="flex flex-row items-center">
          <UiButton
            @click="toggleSidebar"
            :class="{
              'ml-2 rounded px-2 opacity-90 hover:text-secondary-foreground hover:shadow-sm':
                !isSidebarHidden,
              'bg-primary text-primary-foreground': isSidebarHidden,
            }"
          >
            <Icon name="lucide:menu" class="size-8" />
          </UiButton>
          <NuxtLink to="/" class="flex w-full items-center gap-1 px-2">
            <UiAvatar
              src="/logo-verch-2.png"
              alt="Company Logo"
              class="size-7 rounded object-contain"
            />
            <span class="pt-2 text-xl font-bold">Verch</span>
          </NuxtLink>
        </div>
        <UiDivider class="my-6 px-4" />
        <div class="flex h-full grow flex-col px-5 pb-8">
          <div class="mb-10 flex flex-col gap-10">
            <nav class="flex flex-col gap-1">
              <template v-for="(n, i) in topNav" :key="i">
                <UiButton
                  size="default"
                  :to="n.link"
                  variant="ghost"
                  class="justify-start gap-4 px-3"
                  :class="{ 'bg-secondary text-secondary-foreground': isActiveItem(n.link) }"
                >
                  <Icon v-if="n.icon" :name="n.icon" class="size-4" />
                  <span>{{ n.title }}</span>
                </UiButton>
              </template>
            </nav>
            <nav class="mt-auto flex flex-col gap-1">
              <template v-for="(n, i) in bottomNav" :key="i">
                <UiButton
                  :to="n.link"
                  size="default"
                  variant="ghost"
                  class="justify-start gap-4 px-3"
                >
                  <Icon v-if="n.icon" :name="n.icon" class="size-4" />
                  <span>{{ n.title }}</span>
                </UiButton>
              </template>
            </nav>
          </div>

          <UiDivider class="my-6" />
          <div class="flex items-center gap-3 pb-8">
            <div class="flex items-center gap-3">
              <Icon name="lucide:user" class="size-10" />
              <div>
                <p class="text-sm font-semibold" v-html="user.username" />
                <p class="text-sm" v-html="user.email" />
              </div>
            </div>
            <UiTooltip>
              <UiTooltipTrigger as-child>
                <UiButton class="ml-auto shrink-0" size="icon-sm" variant="ghost">
                  <Icon name="lucide:log-out" class="size-6" />
                </UiButton>
              </UiTooltipTrigger>
              <UiTooltipContent @click="logout" side="right" align="center"
                >Logout</UiTooltipContent
              >
            </UiTooltip>
          </div>
        </div>
        <div class="flex justify-center p-4 text-muted/80">Organization Name</div>
      </div>
    </UiScrollArea>
    <TransitionSlide ref="sideBarRef" :offset="[-30, 0]">
      <UiScrollArea v-if="showMiniSidebar" class="h-full w-[250px] border-r px-5 py-4">
        <nav class="flex flex-col gap-1">
          <template v-for="(n, i) in miniSidebarItems" :key="i">
            <UiButton :to="n.link" size="default" variant="ghost" class="justify-start gap-4 px-3">
              <Icon v-if="n.icon" :name="n.icon" class="size-4 text-muted-foreground" />
              <span>{{ n.title }}</span>
            </UiButton>
          </template>
        </nav>
      </UiScrollArea>
    </TransitionSlide>
  </aside>
</template>

<script lang="ts" setup>
  import { useSidebarState } from "~/composables/misc/useSidebar";
  import { useOrganizationValues } from "~/composables/organization/useOrganizationValues";
  import { useUserValues } from "~/composables/user/useUserValues";
  import { signOut } from "firebase/auth";

  const route = useRoute();

  const auth = useFirebaseAuth();
  const { organizationID, organizationData } = await useOrganizationValues();
  console.log("OrganizationData: ",organizationData.value);
  const { userData } = await useUserValues();
  const logout = async () => {
    await signOut(auth!);
    navigateTo("/");
  };

  const showMiniSidebar = ref<boolean>(false);
  const miniSidebarItems = ref<Array<any>>();
  const sideBarRef = ref<any>();
  const { isSidebarHidden, toggleSidebar } = useSidebarState();

  const user = {
    username: userData.value.username || "Name",
    email: userData.value.email || "",
  };

  const topNav = [
    { title: "Organization", icon: "lucide:newspaper", link: "#" },
    { title: "Dashboard", icon: "lucide:bar-chart-3", link: "/organization/dashboard" },
    { title: "Inbox", icon: "lucide:inbox", link: "#" },
    { title: "Products", icon: "lucide:package", link: "/organization/products" },
    { title: "Orders", icon: "lucide:list-checks", link: "/organization/orders" },
    { title: "Members", icon: "lucide:users", link: "#" },
  ];
  const bottomNav = [
    { title: "Support", icon: "lucide:life-buoy", link: "#" },
    {
      title: "Settings",
      icon: "lucide:settings-2",
    },
  ];

  const isActiveItem = (link: string) => {
    return route.path === link;
  };

  // Function to check if the current route is in topNav or bottomNav
  const isRouteInNav = computed(() => {
    const allNavLinks = [...topNav, ...bottomNav].map((nav) => nav.link);
    return allNavLinks.includes(route.path);
  });

  // Watch the route and hide the sidebar if the route is not in topNav or bottomNav
  watch(
    () => route.path,
    (newPath) => {
      if (!isRouteInNav.value) {
        isSidebarHidden.value = true;
      }
    },
    { immediate: true }
  );
</script>
