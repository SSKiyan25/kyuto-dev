<script lang="ts" setup>
  import { fetchOrganization } from "~/composables/organization/useOrganization";
  import { doc, updateDoc } from "firebase/firestore";
  import type { OrganizationAccount } from "~/composables/organization/useOrganization";
  import type { Organization } from "~/types/models/Organization";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  interface ExtendedOrganization extends Partial<Organization> {
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
  }

  const organization = ref<ExtendedOrganization | null>(null);
  const editDialog = ref(false);
  const editAddressDialog = ref(false);
  const editCoverDialog = ref(false);
  const editGalleryDialog = ref(false);
  const editLogoDialog = ref(false);
  const loading = ref(true);
  const loadingEdit = ref(false);
  const db = useFirestore();

  const { handleSubmit, isSubmitting, setValues } = useForm({
    validationSchema: toTypedSchema(OrganizationProfileSchema),
    initialValues: {
      name: organization.value?.name || "",
      contactEmail: organization.value?.contactEmail || "",
      phoneNumber: organization.value?.phoneNumber || "",
      description: organization.value?.description || "",
      address: organization.value?.address || "",
    },
  });

  const setFormValues = (orgData: Partial<Organization>) => {
    setValues({
      name: orgData.name || "",
      contactEmail: orgData.contactEmail || "",
      phoneNumber: orgData.phoneNumber || "",
      description: orgData.description || "",
    });
  };

  onMounted(async () => {
    try {
      const orgData = await fetchOrganization();
      organization.value = orgData;
      setFormValues(orgData);
    } catch (error) {
      console.error("Error fetching organization data:", error);
    } finally {
      loading.value = false;
    }
  });

  const onSubmit = handleSubmit(async (values) => {
    loadingEdit.value = true;
    try {
      if (organization.value?.id) {
        const orgRef = doc(db, "organizations", organization.value.id);
        await updateDoc(orgRef, {
          ...values,
          lastModified: new Date(),
        });
        console.log("Organization updated successfully");
        // Update the organization state with the new values
        organization.value = { ...organization.value, ...values, lastModified: new Date() };
      } else {
        console.error("Organization ID is missing");
      }
    } catch (error) {
      console.error("Error updating organization:", error);
    } finally {
      loadingEdit.value = false;
      editDialog.value = false;
    }
  });

  const removeImage = (index: number) => {
    console.log("Image removed at index:", index);
  };

  const refreshOrganization = async () => {
    try {
      const orgData = await fetchOrganization();
      organization.value = orgData;
      setFormValues(orgData);
    } catch (error) {
      console.error("Error refreshing organization data:", error);
    }
  };

  onMounted(async () => {
    await refreshOrganization();
  });
</script>

<template>
  <div class="flex w-full flex-col px-12 py-8">
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
    <div class="flex flex-row items-center justify-between pt-8">
      <div class="flex flex-col space-y-1">
        <span class="font-semibold">Organization Profile</span>
        <p class="text-[12px] text-muted-foreground">
          Update your organization photo, details, and add accounts to manage your store.
        </p>
      </div>
      <div>
        <UiDialog v-model:open="editDialog">
          <UiDialogTrigger as-child>
            <UiButton variant="outline">
              <span class="text-[12px]">Edit</span>
              <Icon name="lucide:pencil" class="size-3" />
            </UiButton>
          </UiDialogTrigger>
          <UiDialogContent class="sm:h-w-[700px] overflow-y-auto sm:max-w-[725px]">
            <div v-if="loadingEdit">
              <div
                class="absolute z-50 flex h-full w-full flex-col items-center justify-center bg-secondary-foreground/10"
              >
                <Icon name="lucide:loader-circle" class="h-24 w-24 animate-spin text-primary" />
                <p>Updating Changes...</p>
              </div>
            </div>
            <UiDialogTitle>Edit Organization Profile</UiDialogTitle>
            <UiDialogDescription>
              Make changes to your organization profile here. Click save when you're done.
            </UiDialogDescription>

            <form @submit="onSubmit">
              <fieldset :disabled="isSubmitting">
                <div class="flex flex-col space-y-4">
                  <UiVeeInput label="Name" name="name" :placeholder="organization?.name" disabled />
                  <UiVeeInput
                    label="Contact Email"
                    type="email"
                    name="contactEmail"
                    :placeholder="organization?.contactEmail || ''"
                  />
                  <UiVeeInput
                    label="Phone Number"
                    name="phoneNumber"
                    :placeholder="organization?.phoneNumber || ''"
                  />
                  <UiVeeTextarea
                    label="Description"
                    name="description"
                    :placeholder="organization?.description || ''"
                  />
                </div>
              </fieldset>
              <UiDialogFooter class="">
                <div class="mt-4 space-x-2">
                  <UiButton variant="outline" @click="editDialog = false">Cancel</UiButton>
                  <UiButton type="submit" :disabled="isSubmitting">Save</UiButton>
                </div>
              </UiDialogFooter>
            </form>
          </UiDialogContent>
        </UiDialog>
      </div>
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
    <UiDivider class="my-2" />
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
        <!-- <div class="flex flex-col px-8 pt-4">
          <span>Organization Address Link</span>
          <span>
            <a href="https://www.google.com/maps" target="_blank" class="text-blue-500 underline">
              View on Google Maps
            </a>
          </span>
        </div>
        <div class="flex flex-col px-8 pt-4">
          <iframe
            width="600"
            height="450"
            style="border: 0"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
            src="https://www.google.com/maps/embed/v1/place?key=YOUR_API_KEY&q=Organization+Address"
          >
          </iframe>
        </div> -->
        <div></div>
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
          <UiTableCaption>List of Accounts</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Username</UiTableHead>
              <UiTableHead>Email</UiTableHead>
              <UiTableHead>Role</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody>
            <!-- Admin Accounts -->
            <UiTableRow v-for="admin in organization?.adminAccounts || []" :key="admin">
              <UiTableCell>{{ admin }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Admin</UiTableCell>
            </UiTableRow>

            <!-- Manager Accounts -->
            <UiTableRow v-for="manager in organization?.managerAccounts || []" :key="manager">
              <UiTableCell>{{ manager }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Manager</UiTableCell>
            </UiTableRow>

            <!-- Staff Accounts -->
            <UiTableRow v-for="staff in organization?.staffAccounts || []" :key="staff">
              <UiTableCell>{{ staff }}</UiTableCell>
              <UiTableCell>N/A</UiTableCell>
              <UiTableCell>Staff</UiTableCell>
            </UiTableRow>
          </UiTableBody>
        </UiTable>
      </div>
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
