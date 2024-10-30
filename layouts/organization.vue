<template>
  <div class="flex flex-row">
    <transition name="sidebar">
      <UiButton
        v-if="isSidebarHidden"
        @click="toggleSidebar"
        :class="{
          'ml-2 rounded px-2 opacity-90 hover:text-secondary-foreground hover:shadow-sm':
            !isSidebarHidden,
          'm-4 bg-primary text-primary-foreground': isSidebarHidden,
        }"
      >
        <Icon name="lucide:menu" class="size-8" />
      </UiButton>
    </transition>
    <transition name="sidebar">
      <div v-if="!isSidebarHidden" class="relative pr-72">
        <SidebarOrganization />
      </div>
    </transition>
    <slot />
  </div>
</template>

<script lang="ts" setup>
  import { useSidebarState } from "~/composables/misc/useSidebar";

  const { isSidebarHidden, toggleSidebar } = useSidebarState();
  console.log("isSidebarHidden", isSidebarHidden);
</script>

<style scoped>
  .sidebar-enter-active,
  .sidebar-leave-active {
    transition: all 0.5s ease;
  }
  .sidebar-enter,
  .sidebar-leave-to {
    opacity: 0;
    transform: translateX(100%);
  }
  .sidebar-leave-active {
    transform: translateX(-100%);
  }
</style>
