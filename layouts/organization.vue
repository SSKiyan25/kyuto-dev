<template>
  <div class="flex flex-row">
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

    <transition name="slide">
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
  .slide-enter-active,
  .slide-leave-active {
    transition:
      transform 0.3s ease,
      opacity 0.3s ease;
  }
  .slide-enter,
  .slide-leave-to {
    transform: translateX(-100%);
    opacity: 0;
  }
</style>
