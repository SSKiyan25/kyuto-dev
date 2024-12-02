<template>
  <div class="flex h-auto w-full flex-col space-y-6 rounded-md p-16 shadow-sm">
    <span class="text-xl font-semibold">My Profile</span>
    <!-- Profile Card -->
    <div
      class="flex w-full items-center justify-between space-x-6 rounded-md border bg-secondary px-12 py-6 shadow-md"
    >
      <div class="flex flex-row items-center space-x-2">
        <img src="/profile-icon.jpg" alt="profile" class="h-20 w-20 rounded-full object-cover" />
        <div class="flex flex-col">
          <span class="text-md font-semibold">John Doe</span>
          <span class="text-sm text-muted-foreground"> BSCS </span>
        </div>
      </div>
      <div class="flex justify-end">
        <UiButton variant="outline">
          <span class="text-[12px]">Edit </span>
          <Icon name="lucide:pencil" class="size-3" />
        </UiButton>
      </div>
    </div>

    <!-- Personal Information -->
    <div
      class="flex w-full flex-col space-x-6 rounded-md border bg-secondary px-12 py-10 shadow-md"
    >
      <!-- Title and Edit Button -->
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Personal Information</span>
        <div class="flex justify-end">
          <UiButton variant="outline">
            <span class="text-[12px]">Edit </span>
            <Icon name="lucide:pencil" class="size-3" />
          </UiButton>
        </div>
      </div>
      <!-- Name and Contact Information -->
      <div class="grid grid-cols-3 gap-8 pt-6">
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">First Name</span>
          <span class="text-sm font-semibold">John</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Last Name</span>
          <span class="text-sm font-semibold">Doe</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Username</span>
          <span class="text-sm font-semibold">johnx</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Email address</span>
          <span class="text-sm font-semibold">johndoe2024@gmail.com</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Phone Number</span>
          <span class="text-sm font-semibold">+639201948834</span>
        </div>
      </div>
    </div>
    <!-- Studen Information -->
    <div class="flex flex-col rounded-md border bg-secondary px-12 py-6 shadow-md">
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Student Information</span>
        <div class="flex justify-end">
          <UiButton variant="outline">
            <span class="text-[12px]">Edit </span>
            <Icon name="lucide:pencil" class="size-3" />
          </UiButton>
        </div>
      </div>
      <div class="grid grid-cols-3 pt-4">
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Student ID</span>
          <span class="text-sm font-semibold">20-1-01709</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">Course</span>
          <span class="text-sm font-semibold">BSCS</span>
        </div>
        <div class="flex flex-col space-y-1">
          <span class="text-[12px] font-semibold text-muted-foreground">College</span>
          <span class="text-sm font-semibold">CET</span>
        </div>
      </div>
    </div>
  </div>
  <div class="min-h-32"></div>
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: "auth",
    layout: "user",
  });
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
</script>

<style></style>
