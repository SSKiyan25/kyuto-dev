<script lang="ts" setup>
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { doc, updateDoc } from "firebase/firestore";
  import type { OrganizationWithId } from "~/composables/useOrganizationValues";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
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
  <div class="flex w-full flex-col px-12 py-8">
    <!-- Organization Logo and Visibility-->
    <div class="flex flex-row items-center justify-between space-x-2 pt-4">
      <div class="flex flex-row items-center space-x-4">
        <div class="group relative h-32 w-32">
          <img
            :src="organization?.logoImageURL || '/placeholder-img.jpg'"
            alt="Organization Logo"
            class="h-32 w-32 cursor-pointer rounded-full border border-primary/70 object-cover shadow-sm"
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
    <div class="flex flex-row items-center justify-between pt-8">
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
    <div class="flex flex-row items-center justify-between pt-8">
      <div class="flex flex-col space-y-1">
        <span class="font-semibold">Organization Profile</span>
        <p class="text-[12px] text-muted-foreground">
          Update your organization photo, details, and add accounts to manage your store.
        </p>
      </div>
      <UiButton variant="outline" size="sm" @click="editInfo = true">
        <span class="text-[12px]">Edit</span>
        <Icon name="lucide:pencil" class="size-3" />
      </UiButton>
    </div>

    <UiDivider class="my-2" />
    <div class="flex w-full flex-row py-4">
      <div class="flex w-full flex-col space-y-1">
        <span class="text-[12px] font-semibold">Public Information</span>
        <p class="text-[10px] text-muted-foreground">This will be displayed to your store.</p>
        <UiDivider class="my-2" />
        <div class="flex flex-row items-center pt-4">
          <div class="flex flex-col items-start space-y-1 px-8 py-1">
            <span class="text-[12px] font-medium text-muted-foreground">Name</span>
            <span class="text-sm font-medium">{{ organization?.name || "Organization Name" }}</span>
          </div>
          <div class="flex flex-col items-start space-y-1 px-8 py-1">
            <span class="text-[12px] font-semibold text-muted-foreground">Contact Email</span>
            <span class="text-sm font-medium">{{
              organization?.contactEmail || "organizationcontactemail@gmail.com"
            }}</span>
          </div>
          <div class="flex flex-col items-start space-y-1 px-8 py-1">
            <span class="text-[12px] font-semibold text-muted-foreground">Phone Number</span>
            <span class="text-sm font-medium">{{
              organization?.phoneNumber || "No phone number available"
            }}</span>
          </div>
        </div>

        <div class="flex flex-col space-y-1 px-8 py-1 pt-4">
          <span class="text-[12px] font-semibold text-muted-foreground">Description</span>
          <span class="text-[12px] font-medium">{{
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
    <UiDivider class="my-2" />
    <!-- Organization Address -->
    <div class="flex w-full flex-row py-4">
      <div class="flex w-full flex-col space-y-1">
        <div class="flex flex-row justify-between">
          <div class="flex flex-col space-y-1">
            <span class="text-[12px] font-semibold">Organization Address</span>
            <p class="text-[10px] text-muted-foreground">
              This will be used for customers to claim their orders.
            </p>
          </div>
          <div>
            <UiButton variant="outline" size="sm" @click="editAddressDialog = true">
              <span class="text-[12px]">Edit</span>
              <Icon name="lucide:pencil" class="size-3" />
            </UiButton>
          </div>
        </div>
        <UiDivider class="my-2" />
        <div class="flex flex-col space-y-1 px-8 pt-4">
          <span class="text-[12px] font-semibold text-muted-foreground">Organization Address</span>
          <span class="text-sm font-medium">{{
            organization?.address || "No address available"
          }}</span>
          <span class="pt-4 text-[12px] font-semibold text-muted-foreground">
            Organization Address Image/s
          </span>
          <div class="flex flex-row flex-wrap space-x-4">
            <img
              v-for="(addImg, index) in organization?.addressImagesURL || []"
              :key="index"
              :src="addImg.url || '/placeholder-img.jpg'"
              alt="Organization Address Image"
              class="h-32 w-32 rounded-lg border-2 border-primary/70 object-cover"
            />
          </div>

          <!-- Display placeholder if addressImagesURL is empty -->
          <div v-if="!organization?.addressImagesURL || organization.addressImagesURL.length === 0">
            <img
              src="/placeholder-img.jpg"
              alt="Placeholder Image"
              class="h-32 w-32 rounded-lg border-2 border-primary/70 object-cover"
            />
          </div>
        </div>
        <OrganizationEditAddress
          v-model="editAddressDialog"
          :organization-id="organization?.id || ''"
          :current-address="organization?.address"
          :current-images="organization?.addressImagesURL || []"
          @success="refreshOrganization"
        />
        <!-- Google Maps, will be added in future-->
        <div></div>
      </div>
    </div>
    <UiDivider class="my-2" />

    <!-- Organization Accounts -->
    <div class="flex flex-col pt-8 opacity-50">
      <div class="flex flex-row items-center justify-between">
        <span class="font-semibold">Organization Accounts</span>
        <UiButton disabled class="hover:cursor-not-allowed">
          <Icon name="lucide:plus" class="size-4" />
          <span class="text-[12px]">Add Account</span>
        </UiButton>
      </div>
      <UiDivider class="my-2" />
      <p class="text-sm">Will be added in future.</p>
      <!-- <div>
        <UiTable>
          <UiTableCaption>List of Accounts</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Username</UiTableHead>
              <UiTableHead>Email</UiTableHead>
              <UiTableHead>Role</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            
            <UiTableRow v-for="admin in organization?.adminAccounts || []" :key="admin">
              <UiTableCell>{{ admin }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Admin</UiTableCell>
            </UiTableRow>

            <UiTableRow v-for="manager in organization?.managerAccounts || []" :key="manager">
              <UiTableCell>{{ manager }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Manager</UiTableCell>
            </UiTableRow>

            <UiTableRow v-for="staff in organization?.staffAccounts || []" :key="staff">
              <UiTableCell>{{ staff }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Staff</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div> -->
    </div>
    <UiDivider class="my-2" />

    <!-- Organization Photos -->
    <div class="flex flex-col space-y-2 pt-8">
      <!-- Cover Photo -->
      <div class="flex flex-row justify-between">
        <div class="flex flex-col space-y-2">
          <span class="text-[12px] font-semibold">Cover Photo</span>
          <p class="text-[10px] text-muted-foreground">
            This will be displayed on your store's page.
          </p>
        </div>
        <div>
          <UiButton variant="outline" size="sm" @click="editCoverDialog = true">
            <span class="text-[12px]">Edit</span>
            <Icon name="lucide:pencil" class="size-3" />
          </UiButton>
        </div>
      </div>
      <UiDivider class="my-2" />
      <div class="mx-auto flex w-full max-w-4xl items-center justify-center p-12">
        <img
          :src="organization?.coverImageURL || '/placeholder-img.jpg'"
          alt="Organization Cover Image"
          class="h-auto w-full rounded-lg border-2 border-primary/50 object-cover"
        />
      </div>
      <OrganizationEditCoverPhoto
        v-if="organization"
        v-model="editCoverDialog"
        :organization-id="organization.id || ''"
        :current-image-url="organization.coverImageURL"
        :current-image-path="organization.coverImagePath"
        @success="refreshOrganization"
      />

      <!-- Images -->
      <div>
        <div class="flex flex-row justify-between">
          <div class="flex flex-col space-y-1">
            <span class="text-[12px] font-semibold">Gallery</span>
            <p class="text-[10px] text-muted-foreground">
              These images will be displayed in your store's gallery.
            </p>
          </div>
          <div>
            <UiButton variant="outline" size="sm" @click="editGalleryDialog = true">
              <span class="text-[12px]">Edit</span>
              <Icon name="lucide:pencil" class="size-3" />
            </UiButton>
          </div>
        </div>
        <UiDivider class="my-2" />
        <div class="flex flex-row space-x-2">
          <div
            v-for="(image, index) in organization?.imagesURL || []"
            :key="index"
            class="group relative"
          >
            <img
              :src="image.url || '/placeholder-img.jpg'"
              alt="Gallery Image"
              class="w-54 h-48 rounded-lg border-2 border-primary/70 object-cover"
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
