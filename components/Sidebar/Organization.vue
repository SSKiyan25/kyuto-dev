<template>
  <aside class="fixed flex shadow-lg">
    <UiScrollArea class="z-10 h-screen w-[300px] border-r bg-primary text-primary-foreground">
      <div class="flex h-screen flex-col pt-7">
        <NuxtLink to="/" class="flex w-full items-center gap-3 px-5">
          <UiAvatar
            src="/logo-verch-2.png"
            alt="Company Logo"
            class="size-7 rounded object-contain"
          />
          <span class="text-xl font-bold">Verch</span>
        </NuxtLink>
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
                  @click="setMiniBarItems(n.items)"
                >
                  <Icon v-if="n.icon" :name="n.icon" class="size-4" />
                  <span>{{ n.title }}</span>
                  <Icon v-if="n.items" name="lucide:chevron-right" class="ml-auto size-4" />
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
  import { signOut } from "firebase/auth";

  const auth = useFirebaseAuth();
  const logout = async () => {
    await signOut(auth!);
    navigateTo("/");
  };
  const showMiniSidebar = ref<boolean>(false);
  const miniSidebarItems = ref<Array<any>>();
  const sideBarRef = ref<any>();
  const route = useRoute();

  onClickOutside(sideBarRef, () => {
    showMiniSidebar.value = false;
    miniSidebarItems.value = [];
  });

  const user = {
    username: "Jane Doe",
    email: "muzcad@he.tg",
  };

  const topNav = [
    { title: "Dashboard", icon: "lucide:home", link: "/organization/dashboard" },
    { title: "Analytics", icon: "lucide:bar-chart-3", link: "#" },
    { title: "Inbox", icon: "lucide:inbox", link: "#" },
    { title: "Products", icon: "lucide:package", link: "/organization/products" },
    { title: "Orders", icon: "lucide:list-checks", link: "#" },
    { title: "Users", icon: "lucide:users", link: "#" },
  ];
  const bottomNav = [
    { title: "Support", icon: "lucide:life-buoy", link: "#" },
    {
      title: "Settings",
      icon: "lucide:settings-2",
      items: [
        { title: "Profile", link: "#", icon: "lucide:user" },
        { title: "Account", link: "#", icon: "lucide:settings" },
        { title: "Security", link: "#", icon: "lucide:shield" },
        { title: "Billing", link: "#", icon: "lucide:credit-card" },
      ],
    },
  ];

  const setMiniBarItems = (items?: any) => {
    if (!items) return (showMiniSidebar.value = false);
    miniSidebarItems.value = items;
    showMiniSidebar.value = true;
  };

  const isActiveItem = (link: string) => {
    return route.path === link;
  };
</script>
