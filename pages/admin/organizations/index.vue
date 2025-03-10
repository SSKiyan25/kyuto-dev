<template>
  <div class="flex w-full flex-col space-y-8 px-8 pb-24 pt-8">
    <div class="flex w-full flex-row items-center space-x-8">
      <div class="flex w-1/2 flex-col items-center justify-center rounded-sm border p-16">
        <Icon name="lucide:worm" class="mb-2 h-8 w-8" />
        <span class="font-medium">Free Plan</span>
        <h1 class="text-3xl font-semibold">Add New Organization</h1>
        <p class="text-sm text-gray-500">Limited Features and Permissions</p>
        <UiButton size="sm" class="mt-4">Add Now</UiButton>
      </div>
      <div
        class="flex w-1/2 flex-col items-center justify-center rounded-sm border bg-primary/90 p-16 text-primary-foreground"
      >
        <Icon name="lucide:bird" class="mb-2 h-8 w-8" />
        <span class="font-medium">Paid Plan</span>
        <h1 class="text-3xl font-semibold">Add New Organization</h1>
        <p class="text-sm">Access all Features and Permissions</p>
        <UiButton size="sm" class="mt-4" variant="secondary">Add Now</UiButton>
      </div>
    </div>
    <div class="flex flex-col space-y-2 px-4">
      <div class="flex flex-row items-center justify-between">
        <h1 class="text-2xl font-semibold">Organizations</h1>
      </div>
      <UiDatatable :options="options" @ready="tableRef = $event">
        <template #subscriptionType="{ cellData }">
          <UiBadge :variant="cellData.subscriptionType == 'Free' ? 'outline' : 'default'">{{
            cellData.subscriptionType
          }}</UiBadge>
        </template>
        <template #dateOfSubscription="{ cellData }: { cellData: Organization }">
          <span v-if="cellData.subscriptionType !== 'Free'">
            {{ cellData.dateOfSubscription }}
          </span>
        </template>
        <template #subscriptionEndDate="{ cellData }: { cellData: Organization }">
          <span v-if="cellData.subscriptionType === 'Paid'">
            {{ cellData.subscriptionEndDate }}
          </span>
        </template>
        <template #actions="{ cellData }: { cellData: Organization }">
          <UiDropdownMenu>
            <UiDropdownMenuTrigger as-child>
              <UiButton class="h-6 text-[10px] sm:h-7 sm:text-xs"> Actions </UiButton>
            </UiDropdownMenuTrigger>
            <UiDropdownMenuContent class="w-32">
              <UiDropdownMenuItem
                v-if="cellData.subscriptionType === 'Free'"
                @click="openUpdateSubscriptionDialog(cellData)"
              >
                Update Subscription
              </UiDropdownMenuItem>
              <UiDropdownMenuItem v-else @click="openExtendSubscriptionDialog(cellData)">
                Extend Subscription
              </UiDropdownMenuItem>
              <UiDropdownMenuItem @click="archiveOrganization(cellData)">
                Archive
              </UiDropdownMenuItem>
            </UiDropdownMenuContent>
          </UiDropdownMenu>
        </template>
      </UiDatatable>

      <!-- Organization Dialog -->
      <UiDialog v-model:open="userDialog">
        <UiDialogContent class="max-w-xl overflow-y-auto">
          <UiDialogHeader>
            <UiDialogTitle>Create Organization</UiDialogTitle>
            <UiDialogDescription
              description="Populate the form below to create a new organization."
            />
          </UiDialogHeader>
          <form @submit.prevent="submit">
            <fieldset class="grid grid-cols-1 gap-5">
              <UiVeeInput label="Organization Name" icon="lucide:building" />
              <UiVeeSelect label="Subscription Type" trailing-icon="lucide:credit-card">
                <option value="Free">Free</option>
                <option value="Paid">Paid</option>
              </UiVeeSelect>
              <UiVeeInput label="Email" icon="lucide:mail" type="email" />
              <UiVeeInput label="Password" icon="lucide:lock" type="password" />
              <UiVeeInput label="Confirm Password" icon="lucide:lock" type="password" />
              <UiDialogFooter>
                <UiDialogClose as-child>
                  <UiButton variant="outline" text="Cancel" />
                </UiDialogClose>
                <UiButton type="submit" text="Create" />
              </UiDialogFooter>
            </fieldset>
          </form>
        </UiDialogContent>
      </UiDialog>

      <!-- Update Subscription Dialog -->
      <UiDialog v-model:open="updateDialog">
        <UiDialogContent class="max-w-lg">
          <UiDialogHeader>
            <UiDialogTitle>Update Subscription</UiDialogTitle>
          </UiDialogHeader>
          <div class="mb-4">
            <p class="text-sm text-muted-foreground">
              Updating subscription from free to paid for:
            </p>
            <p class="text-lg font-semibold">{{ selectedOrganization?.name }}</p>
          </div>
          <form @submit.prevent="submitUpdate">
            <fieldset class="grid grid-cols-1 gap-2">
              <UiVeeInput
                label="Number of Months"
                icon="lucide:calendar"
                type="number"
                min="1"
                max="5"
              />
              <UiVeeInput
                label="Total Price"
                icon="lucide:philippine-peso"
                type="text"
                value="100"
                class=""
                disabled
              />
              <span class="mb-4 text-sm text-muted-foreground">
                Price per month: <span class="font-semibold">100</span>
              </span>

              <UiVeeInput label="Admin Password" icon="lucide:lock" type="password" />
              <span>
                <p class="mb-8 text-sm text-muted-foreground">
                  Admin Password is required to update the subscription.
                </p>
              </span>
              <UiDialogFooter>
                <UiDialogClose as-child>
                  <UiButton variant="outline" text="Cancel" />
                </UiDialogClose>
                <UiButton type="submit" text="Update" />
              </UiDialogFooter>
            </fieldset>
          </form>
        </UiDialogContent>
      </UiDialog>

      <!-- Extend Subscription Dialog -->
      <UiDialog v-model:open="extendDialog">
        <UiDialogContent class="max-w-lg">
          <UiDialogHeader>
            <UiDialogTitle>Extend Subscription</UiDialogTitle>
          </UiDialogHeader>
          <div class="mb-4">
            <p class="text-sm text-muted-foreground">Extending paid subscription for:</p>
            <p class="text-lg font-semibold">{{ selectedOrganization?.name }}</p>
          </div>
          <form @submit.prevent="submitExtend">
            <fieldset class="grid grid-cols-1 gap-2">
              <UiVeeInput label="Number of Months" icon="lucide:calendar" type="number" />
              <UiVeeInput
                label="Total Price"
                icon="lucide:philippine-peso"
                type="text"
                value="100"
                min="1"
                max="5"
                disabled
              />
              <span class="mb-4 text-sm text-muted-foreground">
                Price per month: <span class="font-semibold">100</span>
              </span>
              <UiVeeInput label="Admin Password" icon="lucide:lock" type="password" />
              <span>
                <p class="mb-8 text-sm text-muted-foreground">
                  Admin Password is required to update the subscription.
                </p>
              </span>
              <UiDialogFooter>
                <UiDialogClose as-child>
                  <UiButton variant="outline" text="Cancel" />
                </UiDialogClose>
                <UiButton type="submit" text="Extend" />
              </UiDialogFooter>
            </fieldset>
          </form>
        </UiDialogContent>
      </UiDialog>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { faker } from "@faker-js/faker";
  import DataTable from "datatables.net";
  import type { Config } from "datatables.net";

  definePageMeta({
    layout: "admin",
    middleware: ["auth"],
  });

  type Organization = {
    id: number;
    name: string;
    subscriptionType: string;
    dateCreated: string;
    dateOfSubscription?: string;
    subscriptionEndDate?: string;
  };

  const tableRef = shallowRef<InstanceType<typeof DataTable<Organization[]>> | null>(null);
  const userDialog = ref(false);
  const updateDialog = ref(false);
  const extendDialog = ref(false);
  const selectedOrganization = ref<Organization | null>(null);
  const submit = () => {
    userDialog.value = false;
  };

  const submitUpdate = () => {
    console.log("Update Subscription for:", selectedOrganization.value);
    // Add your logic to update the subscription here
    updateDialog.value = false;
  };

  const submitExtend = () => {
    console.log("Extend Subscription for:", selectedOrganization.value);
    // Add your logic to extend the subscription here
    extendDialog.value = false;
  };

  const openUpdateSubscriptionDialog = (organization: Organization) => {
    selectedOrganization.value = organization;
    updateDialog.value = true;
  };

  const openExtendSubscriptionDialog = (organization: Organization) => {
    selectedOrganization.value = organization;
    extendDialog.value = true;
  };

  const archiveOrganization = (organization: Organization) => {
    console.log("Archive Organization:", organization);
    // Add your logic to archive the organization here
  };

  const options: Config = {
    dom: `<'relative'r<'flex flex-col gap-4 md:flex-row md:items-center justify-between mb-5'fB><'overflow-auto border rounded-md't><'mt-4 px-2 flex flex-col md:flex-row md:items-center md:justify-between gap-4'<l><'flex flex-col gap-4 md:flex-row md:items-center md:gap-8'<i><p>>>>`,
    pagingType: "full",
    language: {
      info: "<p class='inline-flex gap-1'><span class='font-medium text-foreground'>_START_-_END_</span> of <span class='font-medium text-foreground'>_TOTAL_</span></p>",
      lengthMenu: "<span class='font-medium text-foreground'>Rows per page</span> _MENU_",
      search: "",
      searchPlaceholder: "Search...",
    },
    lengthMenu: [7, 25, 50, 75, 100],
    order: [[2, "asc"]],
    buttons: [
      {
        extend: "colvis",
        text: "View",
        columns: ":not(.no-column)",
      },
      {
        extend: "print",
        text: "Print",
        title: `Organizations - ${useDateFormat(new Date(), "MMM DD, YYYY").value}`,
        exportOptions: {
          columns: ":not(.no-export)",
          trim: true,
          stripHtml: true,
          format: {
            body: (data: any) => {
              const htmlString = data.outerHTML;
              const parser = new DOMParser();
              const doc = parser.parseFromString(htmlString, "text/html");
              return htmlString ? doc?.body?.textContent : data;
            },
          },
        },
      },
      {
        text: "Add Organization",
        action: () => {
          userDialog.value = true;
        },
      },
    ],
    columns: [
      { title: "ID", data: "id", visible: false },
      { title: "Organization Name", data: "name" },
      {
        title: "Subscription Type",
        data: null,
        render: {
          _: "subscriptionType",
          display: "#subscriptionType",
        },
      },
      { title: "Date Created", data: "dateCreated" },
      {
        title: "Date of Subscription",
        data: null,
        render: {
          _: "dateOfSubscription",
          display: "#dateOfSubscription",
        },
      },
      {
        title: "Subscription End Date",
        data: null,
        render: {
          _: "subscriptionEndDate",
          display: "#subscriptionEndDate",
        },
      },
      {
        title: "Actions",
        data: null,
        orderable: false,
        searchable: false,
        render: "#actions",
      },
    ],
    serverSide: true,
    processing: true,
    async ajax(data: any, callback: any) {
      // sleep for 1 second to simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1000));
      // fetch data from API
      const res = Array.from({ length: 100 }, (item, index) => ({
        id: index + 1,
        name: faker.company.name(),
        subscriptionType: faker.helpers.arrayElement(["Free", "Paid"]),
        dateCreated: useDateFormat(faker.date.past().toISOString(), "MMMM DD, YYYY").value,
        dateOfSubscription: faker.helpers.arrayElement([
          null,
          useDateFormat(faker.date.past().toISOString(), "MMMM DD, YYYY").value,
        ]),
        subscriptionEndDate: faker.helpers.arrayElement([
          null,
          useDateFormat(faker.date.future().toISOString(), "MMMM DD, YYYY").value,
        ]),
      }));
      callback({
        // always pass back draw from data
        draw: Number(data.draw),
        // the data to be displayed (paginated from sever)
        data: res.slice(data.start, data.start + data.length),
        // the total number of records in the dataset, not just the number returned
        recordsTotal: res.length,
        // the total number of records after filtering (if any filtering)
        recordsFiltered: res.length,
      });
    },
  };
</script>
