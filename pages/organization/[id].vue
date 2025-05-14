<script lang="ts" setup>
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { doc, updateDoc } from "firebase/firestore";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });

  interface ExtendedOrganization extends Partial<OrganizationWithId> {
    id: string;
    address?: string;
    addressImagesURL?: { url: string; path: string }[];
    logoImageURL?: string;
    logoImagePath?: string;
    coverImageURL?: string;
    coverImagePath?: string;
    description?: string;
    imagesURL?: { url: string; path: string }[];
    adminAccounts?: string[];
    managerAccounts?: string[];
    staffAccounts?: string[];
    isPublic?: boolean;
    isSetupComplete?: boolean;
  }

  const organization = ref<ExtendedOrganization | null>(null);
  const editAddressDialog = ref(false);
  const editCoverDialog = ref(false);
  const editGalleryDialog = ref(false);
  const editLogoDialog = ref(false);
  const editInfo = ref(false);
  const loading = ref(true);
  const db = useFirestore();
  const route = useRoute();
  const orgIDparams = route.params.id as string;
  const { getOrganizationById, clearCache: clearOrgCache } = useOrganization();

  onMounted(async () => {
    try {
      const orgData = await getOrganizationById(orgIDparams);
      organization.value = orgData;
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      loading.value = false;
    }
  });

  const refreshOrganization = async () => {
    try {
      clearOrgCache();
      const orgData = await getOrganizationById(orgIDparams);
      organization.value = orgData;
    } catch (error) {
      console.error("Error refreshing organization data:", error);
    }
  };

  onMounted(async () => {
    await refreshOrganization();
  });

  const toggleVisibility = async () => {
    if (!organization.value || !organization.value.id) return;

    try {
      const orgRef = doc(db, "organizations", organization.value.id);
      const newVisibility = !organization.value.isPublic;

      await updateDoc(orgRef, { isPublic: newVisibility });
      organization.value.isPublic = newVisibility;

      console.log(`Organization visibility updated to: ${newVisibility ? "Public" : "Hidden"}`);
    } catch (error) {
      console.error("Error updating organization visibility:", error);
    }
  };
</script>

<template>
  <div class="container mx-auto px-4 py-6 sm:px-6 md:px-8 md:py-8">
    <!-- Organization Logo and Visibility-->
    <div
      class="flex flex-col items-start justify-between gap-4 pt-4 sm:flex-row sm:items-center sm:gap-6"
    >
      <div class="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <div class="group relative h-24 w-24 sm:h-32 sm:w-32">
          <img
            :src="organization?.logoImageURL || '/placeholder-img.jpg'"
            alt="Organization Logo"
            class="h-24 w-24 cursor-pointer rounded-full border border-primary/70 object-cover shadow-sm sm:h-32 sm:w-32"
            @click="editLogoDialog = true"
          />
          <div
            class="absolute inset-0 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-full bg-black/50 opacity-0 transition-opacity group-hover:opacity-100"
            @click="editLogoDialog = true"
          >
            <Icon name="lucide:pencil" class="size-4 text-white" />
            <span class="text-xs font-medium text-white">Change Logo</span>
          </div>
        </div>
        <OrganizationEditLogo
          v-model="editLogoDialog"
          :organization-id="organization?.id || ''"
          :logo-image="organization?.logoImageURL"
          :current-logo-path="organization?.logoImagePath"
          @success="refreshOrganization"
        />

        <div class="flex flex-col">
          <span class="text-lg font-bold">{{ organization?.name || "Organization Name" }}</span>
          <span class="text-[12px] text-muted-foreground">{{
            organization?.contactEmail || "organizationcontactemail@gmail.com"
          }}</span>
          <span class="text-[12px] text-muted-foreground">{{
            organization?.phoneNumber || "No phone number available"
          }}</span>
        </div>
      </div>
    </div>

    <!-- Visibility Section -->
    <div class="flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-center sm:pt-8">
      <div class="flex flex-col space-y-1">
        <p class="font-semibold">
          Visibility
          <span class="font-bold">({{ organization?.isPublic ? "Public" : "Hidden" }})</span>
        </p>
        <p class="text-[12px] text-muted-foreground">
          {{
            organization?.isPublic
              ? "This organization is public and visible on the Stores Page."
              : "This organization is hidden and not visible on the Stores Page."
          }}
        </p>
        <p v-if="organization?.isPublic" class="text-[12px] text-primary">
          <NuxtLink to="/stores" class="underline">View on Stores Page</NuxtLink>
        </p>
      </div>
      <UiButton
        variant="outline"
        size="sm"
        :class="organization?.isPublic ? 'bg-destructive text-white' : 'bg-primary text-white'"
        @click="toggleVisibility"
      >
        <Icon
          :name="organization?.isPublic ? 'lucide:eye-off' : 'lucide:eye'"
          class="mr-2 size-4"
        />
        <span class="text-[12px]">
          {{ organization?.isPublic ? "Hide Organization" : "Change To Public" }}
        </span>
      </UiButton>
    </div>

    <!-- Organization Information -->
    <div class="flex flex-col justify-between gap-4 pt-6 sm:flex-row sm:items-center sm:pt-8">
      <div class="flex flex-col space-y-1">
        <span class="font-semibold">Organization Profile</span>
        <p class="text-[12px] text-muted-foreground">
          Update your organization photo, details, and add accounts to manage your store.
        </p>
      </div>
      <UiButton variant="outline" size="sm" @click="editInfo = true">
        <span class="text-[12px]">Edit</span>
        <Icon name="lucide:pencil" class="ml-1.5 size-3" />
      </UiButton>
    </div>

    <UiDivider class="my-4" />

    <!-- Public Information Section -->
    <div class="flex w-full flex-col py-4">
      <div class="flex w-full flex-col space-y-1">
        <span class="text-sm font-semibold">Public Information</span>
        <p class="text-xs text-muted-foreground">This will be displayed to your store.</p>
        <UiDivider class="my-2" />

        <!-- Organization Details Grid -->
        <div class="grid grid-cols-1 gap-4 pt-4 md:grid-cols-3">
          <div class="flex flex-col items-start space-y-1 py-1">
            <span class="text-xs font-medium text-muted-foreground">Name</span>
            <span class="text-sm font-medium">{{ organization?.name || "Organization Name" }}</span>
          </div>
          <div class="flex flex-col items-start space-y-1 py-1">
            <span class="text-xs font-semibold text-muted-foreground">Contact Email</span>
            <span class="break-all text-sm font-medium">{{
              organization?.contactEmail || "organizationcontactemail@gmail.com"
            }}</span>
          </div>
          <div class="flex flex-col items-start space-y-1 py-1">
            <span class="text-xs font-semibold text-muted-foreground">Phone Number</span>
            <span class="text-sm font-medium">{{
              organization?.phoneNumber || "No phone number available"
            }}</span>
          </div>
        </div>

        <div class="flex flex-col space-y-1 py-4">
          <span class="text-xs font-semibold text-muted-foreground">Description</span>
          <span class="text-sm font-medium">{{
            organization?.description || "No description available"
          }}</span>
        </div>
      </div>
    </div>

    <OrganizationEditInfo
      v-model="editInfo"
      :organization-id="organization?.id || ''"
      :current-values="{
        name: organization?.name || '',
        contactEmail: organization?.contactEmail || '',
        phoneNumber: organization?.phoneNumber || '',
        description: organization?.description || '',
      }"
      @success="refreshOrganization"
    />

    <UiDivider class="my-4" />

    <!-- Organization Address -->
    <div class="flex w-full flex-col py-4">
      <div class="flex w-full flex-col space-y-4">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex flex-col space-y-1">
            <span class="text-sm font-semibold">Organization Address</span>
            <p class="text-xs text-muted-foreground">
              This will be used for customers to claim their orders.
            </p>
          </div>
          <UiButton variant="outline" size="sm" @click="editAddressDialog = true">
            <span class="text-[12px]">Edit</span>
            <Icon name="lucide:pencil" class="ml-1.5 size-3" />
          </UiButton>
        </div>

        <UiDivider class="my-2" />

        <div class="flex flex-col space-y-4">
          <div>
            <span class="text-xs font-semibold text-muted-foreground">Organization Address</span>
            <p class="mt-1 text-sm font-medium">
              {{ organization?.address || "No address available" }}
            </p>
          </div>

          <div>
            <span class="text-xs font-semibold text-muted-foreground">
              Organization Address Image/s
            </span>
            <div class="mt-2 flex flex-row flex-wrap gap-4">
              <img
                v-for="(addImg, index) in organization?.addressImagesURL || []"
                :key="index"
                :src="addImg.url || '/placeholder-img.jpg'"
                alt="Organization Address Image"
                class="h-24 w-24 rounded-lg border-2 border-primary/70 object-cover sm:h-32 sm:w-32"
              />

              <!-- Display placeholder if addressImagesURL is empty -->
              <img
                v-if="!organization?.addressImagesURL || organization.addressImagesURL.length === 0"
                src="/placeholder-img.jpg"
                alt="Placeholder Image"
                class="h-24 w-24 rounded-lg border-2 border-primary/70 object-cover sm:h-32 sm:w-32"
              />
            </div>
          </div>
        </div>

        <OrganizationEditAddress
          v-model="editAddressDialog"
          :organization-id="organization?.id || ''"
          :current-address="organization?.address"
          :current-images="organization?.addressImagesURL || []"
          @success="refreshOrganization"
        />
      </div>
    </div>

    <UiDivider class="my-4" />

    <!-- Organization Accounts -->
    <div class="flex flex-col py-6">
      <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <span class="font-semibold">Organization Accounts</span>
          <p class="mt-1 text-xs text-muted-foreground">
            Manage access to your organization by assigning different roles to users.
          </p>
        </div>
        <UiButton disabled class="mt-2 hover:cursor-not-allowed sm:mt-0">
          <Icon name="lucide:plus" class="mr-1.5 size-4" />
          <span class="text-[12px]">Add Account</span>
        </UiButton>
      </div>

      <UiDivider class="my-4" />

      <div class="rounded-lg bg-muted/20 p-6 text-center">
        <div class="flex flex-col items-center justify-center gap-2">
          <Icon name="lucide:users" class="size-10 text-muted-foreground/70" />
          <h3 class="text-base font-semibold">Account Management Coming Soon</h3>
          <p class="max-w-md text-sm text-muted-foreground">
            You'll soon be able to add staff and manager accounts to help you run your organization.
            This feature is currently in development and will be available in an upcoming update.
          </p>
        </div>
      </div>
    </div>

    <UiDivider class="my-4" />

    <!-- Organization Photos -->
    <div class="flex flex-col space-y-8 py-6">
      <!-- Cover Photo -->
      <div>
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex flex-col space-y-1">
            <span class="text-sm font-semibold">Cover Photo</span>
            <p class="text-xs text-muted-foreground">
              This will be displayed on your store's page.
            </p>
          </div>
          <UiButton
            variant="outline"
            size="sm"
            @click="editCoverDialog = true"
            class="mt-2 sm:mt-0"
          >
            <span class="text-[12px]">Edit</span>
            <Icon name="lucide:pencil" class="ml-1.5 size-3" />
          </UiButton>
        </div>

        <UiDivider class="my-4" />

        <div class="mx-auto w-full max-w-3xl p-4 md:p-6">
          <div class="aspect-[16/9] w-full overflow-hidden rounded-lg border-2 border-primary/50">
            <img
              :src="organization?.coverImageURL || '/placeholder-img.jpg'"
              alt="Organization Cover Image"
              class="h-full w-full object-cover"
            />
          </div>
        </div>

        <OrganizationEditCoverPhoto
          v-if="organization"
          v-model="editCoverDialog"
          :organization-id="organization.id || ''"
          :current-image-url="organization.coverImageURL"
          :current-image-path="organization.coverImagePath"
          @success="refreshOrganization"
        />
      </div>

      <!-- Gallery Images -->
      <div>
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div class="flex flex-col space-y-1">
            <span class="text-sm font-semibold">Gallery</span>
            <p class="text-xs text-muted-foreground">
              These images will be displayed in your store's gallery.
            </p>
          </div>
          <UiButton
            variant="outline"
            size="sm"
            @click="editGalleryDialog = true"
            class="mt-2 sm:mt-0"
          >
            <span class="text-[12px]">Edit</span>
            <Icon name="lucide:pencil" class="ml-1.5 size-3" />
          </UiButton>
        </div>

        <UiDivider class="my-4" />

        <div class="xs:grid-cols-2 grid grid-cols-1 gap-4 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(image, index) in organization?.imagesURL || []"
            :key="index"
            class="group relative aspect-square"
          >
            <img
              :src="image.url || '/placeholder-img.jpg'"
              alt="Gallery Image"
              class="h-full w-full rounded-lg border-2 border-primary/70 object-cover"
            />
          </div>

          <!-- Display placeholder if no gallery images -->
          <div
            v-if="!organization?.imagesURL || organization.imagesURL.length === 0"
            class="aspect-square"
          >
            <img
              src="/placeholder-img.jpg"
              alt="Placeholder Image"
              class="h-full w-full rounded-lg border-2 border-primary/70 object-cover opacity-50"
            />
          </div>
        </div>
      </div>

      <OrganizationEditGallery
        v-model="editGalleryDialog"
        v-if="organization"
        :organization-id="organization.id || ''"
        :current-images="organization.imagesURL || []"
        @success="refreshOrganization"
      />
    </div>
  </div>
  <div class="min-h-32"></div>
</template>
