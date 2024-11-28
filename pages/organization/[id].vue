<script lang="ts" setup>
  import { _colors } from "#tailwind-config/theme";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });
</script>

<template>
  <div class="flex w-full flex-col px-12 py-8">
    <div class="flex flex-row items-center justify-between space-x-2 pt-4">
      <div class="flex flex-row items-center space-x-4">
        <img
          src="/placeholder-img.jpg"
          alt="Organization Logo"
          class="h-32 w-32 rounded-full border-2 border-primary/70 object-cover"
        />
        <div class="flex flex-col">
          <span class="text-lg font-bold">Organization Name</span>
          <span class="text-[12px] text-muted-foreground">organizationcontactemail@gmail.com</span>
        </div>
      </div>
    </div>
    <div class="flex flex-row items-center justify-between pt-8">
      <div class="flex flex-col space-y-1">
        <span class="font-semibold">Organization Profile</span>
        <p class="text-[12px] text-muted-foreground">
          Update your organization photo, details, and add accounts to manage your store.
        </p>
      </div>
      <div>
        <UiButton variant="outline">
          <span class="text-[12px]">Edit</span>
          <Icon name="lucide:pencil" class="size-3" />
        </UiButton>
      </div>
    </div>
    <UiDivider class="my-2" />
    <div class="flex flex-row py-4">
      <div class="flex flex-col space-y-1">
        <span class="text-[12px] font-semibold">Public Information</span>
        <p class="text-[10px] text-muted-foreground">This will be displayed to your store.</p>
      </div>
      <div>
        <!-- Put the UI inputs -->
      </div>
    </div>
    <UiDivider class="my-2" />
    <div class="flex flex-row py-4">
      <div class="flex flex-col space-y-1">
        <span class="text-[12px] font-semibold">Organization Logo</span>
        <p class="text-[10px] text-muted-foreground">
          Upload a logo for your organization. The logo will be displayed on your store.
        </p>
      </div>
      <div>
        <!-- Put the Image -->
      </div>
    </div>
    <UiDivider class="my-2" />
    <div class="flex flex-row py-4">
      <div class="flex flex-col space-y-1">
        <span class="text-[12px] font-semibold">Organization Address</span>
        <p class="text-[10px] text-muted-foreground">
          This will be used for customers to claim their orders.
        </p>
      </div>
      <div>
        <!-- Put the Image -->
      </div>
    </div>
    <UiDivider class="my-2" />

    <!-- Organization Accounts -->
    <div class="flex flex-col pt-8">
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Organization Accounts</span>
        <UiButton>
          <Icon name="lucide:plus" class="size-4" />
          <span class="text-[12px]">Add Account</span>
        </UiButton>
      </div>
      <UiDivider class="my-2" />
      <div>
        <UiTable>
          <UiTableCaption>List of accounts</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead> Name </UiTableHead>
              <UiTableHead> Email </UiTableHead>
              <UiTableHead> Role </UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <UiTableRow>
              <UiTableCell>John Doe</UiTableCell>
              <UiTableCell> johndoe@gmail.com </UiTableCell>
              <UiTableCell> Admin </UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div>
    </div>
  </div>
  <div class="min-h-32"></div>
</template>
