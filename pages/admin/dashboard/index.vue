<template>
  <div class="my-8 flex flex-col space-y-4 px-8 pb-16">
    <div class="flex w-1/2 flex-col rounded-sm border p-8">
      <div class="flex flex-row space-x-4">
        <img
          src="/logo-verch.webp"
          alt="Verch Logo"
          title="Verch Logo"
          class="h-8 w-8 object-contain"
        />
        <span class="text-2xl font-bold">Verch</span>
      </div>
      <UiDivider class="my-4" />
      <div class="flex flex-col space-y-2 pl-4 pt-2">
        <AdminDashboardBoxText :title="'Total Users'" :icon="'lucide:user'" :value="'100'" />
        <AdminDashboardBoxText
          :title="'Total Organizations'"
          :icon="'lucide:landmark'"
          :value="'10'"
        />
        <AdminDashboardBoxText
          :title="'Total Products'"
          :icon="'lucide:scan-barcode'"
          :value="'20'"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });
</script>
