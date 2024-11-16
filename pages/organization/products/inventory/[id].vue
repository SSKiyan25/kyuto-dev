<script lang="ts" setup>
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Product, StocksLogs, Variation } from "~/types/models/Product";

  definePageMeta({
    layout: "no-nav",
    middleware: ["auth"],
  });

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard", icon: "lucide:newspaper" },
    { label: "All Products", link: "/organization/products", icon: "lucide:package" },
    {
      label: "Manage Inventory",
      icon: "lucide:file-pen-line",
      disabled: true,
    },
  ];

  const isEditName = ref(false);
  const isEditStatus = ref(false);
  const isAddStocks = ref(false);
  const isRemoveStocks = ref(false);
  const isChangePrice = ref(false);

  const isDelete = ref(false);
  const isAddVariation = ref(false);
  const isDeleteShowMessage = (message: string) => {
    useSonner(message);
  };
  const closeAddDialog = (save: boolean) => {
    useToast().toast({
      title: save ? "Variation added!" : "Action cancelled",
      description: save
        ? "You have successfully added a new variation to your product."
        : "You have cancelled the action.",
      duration: 5000,
      icon: save ? "lucide:check" : "lucide:x",
    });
    isAddVariation.value = false;
  };

  const variations = [
    {
      id: "1",
      name: "Small",
      status: "Not Available",
      price: 100,
      remainingStocks: 10,
      totalStocks: 20,
      lastModified: "2021-10-10",
    },
    {
      id: "2",
      name: "Medium",
      status: "Available",
      price: 150,
      remainingStocks: 20,
      totalStocks: 40,
      lastModified: "2021-10-10",
    },
    {
      id: "3",
      name: "Large",
      status: "Available",
      price: 200,
      remainingStocks: 30,
      totalStocks: 60,
      lastModified: "2021-10-10",
    },
    {
      id: "4",
      name: "X-Large",
      status: "Available",
      price: 250,
      remainingStocks: 15,
      totalStocks: 30,
      lastModified: "2021-10-10",
    },
    {
      id: "5",
      name: "XX-Large",
      status: "Available",
      price: 300,
      remainingStocks: 25,
      totalStocks: 50,
      lastModified: "2021-10-10",
    },
    {
      id: "6",
      name: "XXX-Large",
      status: "Available",
      price: 350,
      remainingStocks: 5,
      totalStocks: 10,
      lastModified: "2021-10-10",
    },
    {
      id: "7",
      name: "Small Tall",
      status: "Available",
      price: 120,
      remainingStocks: 12,
      totalStocks: 24,
      lastModified: "2021-10-10",
    },
    {
      id: "8",
      name: "Medium Tall",
      status: "Available",
      price: 170,
      remainingStocks: 18,
      totalStocks: 36,
      lastModified: "2021-10-10",
    },
    {
      id: "9",
      name: "Large Tall",
      status: "Available",
      price: 220,
      remainingStocks: 22,
      totalStocks: 44,
      lastModified: "2021-10-10",
    },
    {
      id: "10",
      name: "X-Large Tall",
      status: "Available",
      price: 270,
      remainingStocks: 8,
      totalStocks: 16,
      lastModified: "2021-10-10",
    },
  ];
</script>

<template>
  <div class="mb-32 flex h-screen w-full flex-col items-start py-20 pl-20">
    <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
    <div
      class="mx-auto mt-12 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 px-8 shadow"
    >
      <span class="text-2xl font-semibold">Inventory</span>
      <span class="py-1 text-[12px] text-muted-foreground"
        >Manage variations, stock levels, and pricing</span
      >
      <UiDivider class="my-2" />
      <span class="pt-4 font-medium">Table of summary</span>
      <div class="my-2 w-full overflow-x-auto rounded-md border pb-4">
        <UiTable>
          <UiTableCaption>List and summary of your product's variations.</UiTableCaption>
          <UiTableHeader>
            <UiTableRow>
              <UiTableHead>Variation Name</UiTableHead>
              <UiTableHead>Status</UiTableHead>
              <UiTableHead>Current Price</UiTableHead>
              <UiTableHead>Remaining Stocks</UiTableHead>
              <UiTableHead>Last Modified</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody class="last:border-b">
            <template v-for="(variation, i) in variations" :key="variation.id">
              <UiTableRow>
                <UiTableCell class="bg-secondary">{{ variation.name }}</UiTableCell>
                <UiTableCell class="bg-secondary">
                  <template v-if="variation.status === 'Available'">
                    <UiBadge>{{ variation.status }}</UiBadge>
                  </template>
                  <template v-else>
                    <UiBadge variant="destructive">{{ variation.status }}</UiBadge>
                  </template>
                </UiTableCell>
                <UiTableCell>₱{{ variation.price }}</UiTableCell>
                <UiTableCell>{{ variation.remainingStocks }}</UiTableCell>
                <UiTableCell>{{ variation.lastModified }}</UiTableCell>
              </UiTableRow>
            </template>
          </UiTableBody>
        </UiTable>
      </div>
    </div>
    <div
      class="mx-auto mt-8 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 px-12 shadow"
    >
      <span class="pt-6 font-medium text-muted-foreground">
        Select a variation to view or edit its details
      </span>
      <div class="flex flex-row flex-wrap gap-4 pt-2">
        <template v-for="(variation, i) in variations" :key="variation.id">
          <UiButton>{{ variation.name }}</UiButton>
        </template>
      </div>
      <UiDivider class="my-3" />
      <div class="flex flex-col space-y-2">
        <span class="text-lg font-medium text-muted-foreground">Variation Details</span>
        <div class="flex w-full flex-row items-center gap-2 pl-4 pt-2">
          <!--Variation Name-->
          <div class="flex flex-row items-center gap-1">
            <Icon name="lucide:book-a" class="size-4" />
            <span class="font-medium">Name:</span>
            <span class="pl-2 text-muted-foreground">Small</span>
          </div>
          <UiDivider orientation="vertical" />
          <!--Status-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:eye" class="size-4" />
            <span class="font-medium">Status:</span>
            <UiBadge>Available</UiBadge>
          </div>
          <UiDivider orientation="vertical" />
          <!--Current Price-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:banknote" class="size-4" />
            <span class="font-medium">Current Price:</span>
            <span class="text-muted-foreground">₱200.00</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Total Stocks-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:layers" class="size-4" />
            <span class="font-medium">Total Stocks:</span>
            <span class="text-muted-foreground">115</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Remaining Stocks-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:layers-2" class="size-4" />
            <span class="font-medium">Remaining Stocks:</span>
            <span class="text-muted-foreground">115</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Last Modified-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:calendar-clock" class="size-4" />
            <span class="font-medium">Last Modified:</span>
            <span class="text-muted-foreground">January 8, 2024</span>
          </div>
        </div>
        <UiGradientDivider class="my-1" />
        <div class="flex flex-col py-2">
          <div class="flex flex-row items-center gap-1">
            <Icon name="lucide:logs" class="size-4" />
            <p>Logs</p>
            <p class="pl-1 pt-1 text-[12px] text-muted-foreground">
              (These logs show the changes in prices and stocks that were added or modified)
            </p>
          </div>
          <div class="grid grid-cols-9 items-center justify-center">
            <div class="col-span-4 mx-16 pt-10">
              <UiTable class="border">
                <UiTableCaption>Price History</UiTableCaption>
                <UiTableHeader>
                  <UiTableRow>
                    <UiTableHead>Date</UiTableHead>
                    <UiTableHead>Previous Price</UiTableHead>
                    <UiTableHead>Updated Price</UiTableHead>
                  </UiTableRow>
                </UiTableHeader>
                <UiTableBody class="last:border-b">
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">₱170.00</UiTableCell>
                    <UiTableCell>₱200.00</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">₱170.00</UiTableCell>
                    <UiTableCell>₱200.00</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">₱170.00</UiTableCell>
                    <UiTableCell>₱200.00</UiTableCell>
                  </UiTableRow>
                </UiTableBody>
              </UiTable>
            </div>
            <div class="col-span-1">
              <UiDivider orientation="vertical" />
            </div>
            <div class="col-span-4 mx-16 pt-10">
              <UiTable class="border">
                <UiTableCaption>Stocks History</UiTableCaption>
                <UiTableHeader>
                  <UiTableRow>
                    <UiTableHead>Date</UiTableHead>
                    <UiTableHead>Previous Stocks</UiTableHead>
                    <UiTableHead>Added Stocks</UiTableHead>
                    <UiTableHead>Total Stocks</UiTableHead>
                  </UiTableRow>
                </UiTableHeader>
                <UiTableBody class="last:border-b">
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">100</UiTableCell>
                    <UiTableCell>15</UiTableCell>
                    <UiTableCell>115</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">100</UiTableCell>
                    <UiTableCell>15</UiTableCell>
                    <UiTableCell>115</UiTableCell>
                  </UiTableRow>
                  <UiTableRow>
                    <UiTableCell>January 8, 2024</UiTableCell>
                    <UiTableCell class="text-muted-foreground">100</UiTableCell>
                    <UiTableCell>15</UiTableCell>
                    <UiTableCell>115</UiTableCell>
                  </UiTableRow>
                </UiTableBody>
              </UiTable>
            </div>
          </div>
        </div>
        <UiDivider class="mb-2" />
        <div class="flex flex-col py-4 pl-4">
          <div class="flex flex-row items-center">
            <Icon name="lucide:square-mouse-pointer" class="size-4" />
            <span class="pl-1 font-medium">Actions</span>
          </div>
          <p class="text-[12px] text-muted-foreground">
            (Use these actions to edit, delete, or add new variations, prices, or stock levels)
          </p>
          <div class="grid grid-cols-10 py-4">
            <div class="col-span-1 flex flex-col justify-center space-y-4">
              <UiButton
                :variant="isEditName ? 'default' : 'outline'"
                @click="isEditName = !isEditName"
                class="p-1"
              >
                Edit Name
              </UiButton>
              <UiButton
                :variant="isEditStatus ? 'default' : 'outline'"
                @click="isEditStatus = !isEditStatus"
                class="p-1"
              >
                Edit Status
              </UiButton>
              <UiButton
                :variant="isAddStocks ? 'default' : 'outline'"
                @click="isAddStocks = !isAddStocks"
              >
                Add Stocks
              </UiButton>
              <UiButton
                :variant="isRemoveStocks ? 'default' : 'outline'"
                @click="isRemoveStocks = !isRemoveStocks"
              >
                Remove Stocks
              </UiButton>
              <UiButton
                :variant="isChangePrice ? 'default' : 'outline'"
                @click="isChangePrice = !isChangePrice"
              >
                Change Price
              </UiButton>
              <!-- Delete Button Variation-->
              <UiDialog v-model:open="isDelete">
                <UiAlertDialogTrigger as-child>
                  <UiButton variant="destructive">Delete</UiButton>
                </UiAlertDialogTrigger>
                <UiAlertDialogContent @escape-key-down="isDeleteShowMessage('Escape key pressed')">
                  <UiAlertDialogHeader>
                    <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
                    <UiAlertDialogDescription>
                      This action cannot be undone. This will permanently delete your product's
                      variation [name] and remove your data from our servers.
                    </UiAlertDialogDescription>
                  </UiAlertDialogHeader>
                  <UiAlertDialogFooter>
                    <UiAlertDialogCancel @click="isDeleteShowMessage('Action cancelled')" />
                    <UiAlertDialogAction
                      variant="destructive"
                      @click="isDeleteShowMessage('Action confirmed!')"
                    />
                  </UiAlertDialogFooter>
                </UiAlertDialogContent>
              </UiDialog>
            </div>
            <UiDivider orientation="vertical" class="col-span-1" />
            <div class="col-span-8 flex flex-col justify-start space-y-4">
              <!-- Edit Name-->
              <div class="flex flex-row items-center">
                <UiInput label="Variation Name" placeholder="Small" />
                <template v-if="isEditName">
                  <UiButton variant="ghost" title="Save Changes">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
              </div>
              <!-- Edit Status-->
              <div class="flex w-1/4 flex-row items-center">
                <UiSelect>
                  <UiSelectTrigger placeholder="Status" />
                  <UiSelectContent>
                    <UiSelectGroup>
                      <UiSelectItem text="Available" value="Available" />
                      <UiSelectItem text="Not Available" value="Not Available" />
                    </UiSelectGroup>
                  </UiSelectContent>
                </UiSelect>
                <template v-if="isEditStatus">
                  <UiButton variant="ghost" title="Save Changes">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
              </div>
              <!-- Add Stocks-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField :min="0" :max="10000">
                  <UiNumberFieldInput placeholder="15" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isAddStocks">
                  <UiButton variant="ghost" title="Save Changes">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
              </div>
              <!-- Remove Stocks-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField :min="0" :max="10000">
                  <UiNumberFieldInput placeholder="15" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isRemoveStocks">
                  <UiButton variant="ghost" title="Save Changes">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
              </div>
              <!-- Price Change-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField :min="0" :max="10000">
                  <UiNumberFieldInput placeholder="₱0.00" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isChangePrice">
                  <UiButton variant="ghost" title="Save Changes">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
              </div>
            </div>
          </div>
        </div>
        <UiDivider class="mb-2" />
        <div class="flex flex-col items-center justify-center space-y-2">
          <span></span>
          <p class="text-[12px] text-muted-foreground">
            You can only have 10 variations in each product.
          </p>
          <UiDialog v-model:open="isAddVariation">
            <UiDialogTrigger as-child>
              <UiButton>
                <Icon name="lucide:plus" class="size-4" />
                Add New Variation
              </UiButton>
            </UiDialogTrigger>
            <UiDialogContent
              class="sm:max-w-[625px]"
              title="Add Variation"
              description="Add a new variation to your product. You can specify details such its name, price, and the number of stocks."
            >
              <template #content>
                <div class="grid gap-4 py-4">
                  <div class="grid grid-cols-4 items-center gap-4">
                    <UiLabel for="name" class="text-right"> Name </UiLabel>
                    <UiInput id="name" placeholder="Small" class="col-span-3" />
                  </div>
                  <div class="grid grid-cols-4 items-center gap-4">
                    <UiLabel for="price" class="text-right"> Price </UiLabel>
                    <UiNumberField :min="0" :max="10000" class="col-span-3">
                      <UiNumberFieldInput id="price" placeholder="₱0.00" />
                      <UiNumberFieldDecrement class="border-l" />
                      <UiNumberFieldIncrement class="border-l" />
                    </UiNumberField>
                  </div>
                  <div class="grid grid-cols-4 items-center gap-4">
                    <UiLabel for="stocks" class="text-right"> Stocks </UiLabel>
                    <UiNumberField :min="0" :max="10000" class="col-span-3">
                      <UiNumberFieldInput id="stocks" placeholder="0" />
                      <UiNumberFieldDecrement class="border-l" />
                      <UiNumberFieldIncrement class="border-l" />
                    </UiNumberField>
                  </div>
                </div>
              </template>
              <template #footer>
                <UiDialogFooter>
                  <UiButton
                    @click="closeAddDialog(false)"
                    variant="outline"
                    type="button"
                    class="mt-2 sm:mt-0"
                    >Cancel</UiButton
                  >
                  <UiButton @click="closeAddDialog(true)" type="submit">Save</UiButton>
                </UiDialogFooter>
              </template>
            </UiDialogContent>
          </UiDialog>
        </div>
      </div>
    </div>
    <div class="min-h-64 text-secondary">.</div>
  </div>
</template>

<style></style>
