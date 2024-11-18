<script lang="ts" setup>
  import { useEditVariation } from "~/composables/organization/product/useEditVariation";
  import { collection, deleteDoc, doc, Timestamp } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { StocksLogs, Variation } from "~/types/models/Product";

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

  const db = useFirestore();
  const route = useRoute();
  const productID = route.params.id as string;

  const variationsRef = computed(() =>
    productID ? collection(doc(db, "products", productID), "variations") : null
  );
  const { data: variationsSnapshot } = useCollection(variationsRef);

  console.log("variationsSnapshot", variationsSnapshot);

  const variations = computed(() => {
    if (!variationsSnapshot.value) {
      return [];
    }
    return variationsSnapshot.value.map((doc) => {
      console.log("doc", doc); // Debugging log
      return {
        id: doc.id,
        ...doc,
      };
    }) as (Variation & { id: string })[];
  });

  const stocksLogs = ref<{ [key: string]: StocksLogs[] }>({});
  const selectedVariation = ref<(Variation & { id: string }) | null>(null);

  // Copy Variables
  const changedVariationValue = ref("");
  const changedVariationPrice = ref(0);
  const changedVariationAddedStocks = ref(0);
  const changedVariationRemovedStocks = ref(0);

  const stockLogsRef = computed(() => {
    if (!selectedVariation.value) return null;
    return collection(
      doc(db, "products", productID),
      "variations",
      selectedVariation.value.id,
      "stocksLogs"
    );
  });

  const { data: stockLogsSnapshot } = useCollection<StocksLogs>(stockLogsRef);

  watch(
    () => stockLogsSnapshot.value,
    (newLogs) => {
      if (selectedVariation.value) {
        stocksLogs.value[selectedVariation.value.id] = newLogs || [];
      }
    },
    { immediate: true }
  );

  const formatDate = (timestamp: Timestamp | Date) => {
    const date = timestamp instanceof Timestamp ? timestamp.toDate() : timestamp;
    return new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    }).format(date);
  };

  const selectVariation = (variation: Variation & { id: string }) => {
    selectedVariation.value = variation;
    // Set initial values for editing
    changedVariationValue.value = variation.value;
    changedVariationPrice.value = variation.price;
  };

  console.log("Variations:", variations);
  console.log("Stock Logs:", stocksLogs);
  const loading = ref(false);

  const { updateVariation, addStocks, removeStocks, addVariation } = useEditVariation();
  const toast = useToast();

  const handleSaveName = async () => {
    loading.value = true;
    if (!selectedVariation.value) return;

    const invalidChars = /[\/\*<>!]/;
    if (invalidChars.test(changedVariationValue.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The name contains invalid characters: /, *, <, >, !",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loading.value = false;
      return;
    }

    const updatedData: Partial<Variation> = {
      value: changedVariationValue.value,
    };
    console.log("Passed variation ID:", selectedVariation.value.id);
    console.log("Updated Data:", updatedData);
    await updateVariation(productID, selectedVariation.value.id, updatedData);
    isEditName.value = false;
    loading.value = false;
    toast.toast({
      title: "Name Updated",
      description: "The name has been updated successfully.",
      variant: "success",
      icon: "lucide:check",
    });
  };

  const handleSavePrice = async () => {
    loading.value = true;
    if (!selectedVariation.value) return;

    const updatedData: Partial<Variation> = {
      price: changedVariationPrice.value,
    };

    await updateVariation(productID, selectedVariation.value.id, updatedData);
    isChangePrice.value = false;
    loading.value = false;
    toast.toast({
      title: "Price Updated",
      description: "The price has been updated successfully.",
      variant: "success",
      icon: "lucide:check",
    });
  };

  const handleSaveAddedStocks = async () => {
    loading.value = true;
    if (!selectedVariation.value) return;

    const addedStocks = changedVariationAddedStocks.value;
    const stocksLog: StocksLogs = {
      variationID: selectedVariation.value.id,
      quantity: addedStocks,
      action: "Add Stock",
      remarks: "Added stocks",
      dateCreated: Timestamp.now().toDate(),
    };

    await addStocks(productID, selectedVariation.value.id, addedStocks, [stocksLog]);
    isAddStocks.value = false;
    changedVariationAddedStocks.value = 0;
    loading.value = false;
    toast.toast({
      title: "Stocks Added",
      description: "The stocks have been added successfully.",
      variant: "success",
      icon: "lucide:check",
    });
  };

  const handleSaveRemovedStocks = async () => {
    loading.value = true;
    if (!selectedVariation.value) return;

    const removedStocks = changedVariationRemovedStocks.value;
    if (removedStocks > selectedVariation.value.remainingStocks) {
      toast.toast({
        title: "Invalid Operation",
        description: "Cannot remove more stocks than available.",
        variant: "destructive",
        icon: "lucide:triangle-alert",
      });
      loading.value = false;
      return;
    }

    const stocksLog: StocksLogs = {
      variationID: selectedVariation.value.id,
      action: "Remove Stock",
      quantity: removedStocks,
      remarks: "Removed stocks",
      dateCreated: Timestamp.now().toDate(),
    };

    await removeStocks(productID, selectedVariation.value.id, removedStocks, [stocksLog]);
    isRemoveStocks.value = false;
    changedVariationRemovedStocks.value = 0;
    loading.value = false;
    toast.toast({
      title: "Stocks Removed",
      description: "The stocks have been removed successfully.",
      variant: "success",
      icon: "lucide:check",
    });
  };

  const handleDeleteVariation = async () => {
    if (!selectedVariation.value) return;

    loading.value = true;
    try {
      await deleteDoc(doc(db, "products", productID, "variations", selectedVariation.value.id));
      toast.toast({
        title: "Variation Deleted",
        description: "The variation has been deleted successfully.",
        variant: "success",
        icon: "lucide:check",
      });
      selectedVariation.value = null;
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "An error occurred while deleting the variation.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    } finally {
      loading.value = false;
    }
  };

  const handleCancelName = () => {
    if (!selectedVariation.value) return;

    // Revert changes
    changedVariationValue.value = selectedVariation.value.value;
    isEditName.value = false;
  };

  const handleCancelPrice = () => {
    if (!selectedVariation.value) return;

    // Revert changes
    changedVariationPrice.value = selectedVariation.value.price;
    isChangePrice.value = false;
  };

  const handleCancelAddedStocks = () => {
    changedVariationAddedStocks.value = 0;
    isAddStocks.value = false;
  };

  const handleCancelRemovedStocks = () => {
    changedVariationRemovedStocks.value = 0;
    isRemoveStocks.value = false;
  };

  const isDeleteDisabled = computed(() => variations.value.length <= 1);
  const loadingVariation = ref(false);

  const newVariationName = ref("");
  const newVariationPrice = ref(0);
  const newVariationStocks = ref(0);

  const handleAddVariation = async () => {
    loadingVariation.value = true;
    const newVariation: Partial<Variation> = {
      value: newVariationName.value,
      price: newVariationPrice.value,
      totalStocks: newVariationStocks.value,
      remainingStocks: newVariationStocks.value,
      lastModified: Timestamp.now().toDate(),
    };

    try {
      await addVariation(productID, newVariation);
      toast.toast({
        title: "Variation Added",
        description: "The new variation has been added successfully.",
        variant: "success",
        icon: "lucide:check",
      });
      isAddVariation.value = false;
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "An error occurred while adding the variation.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    } finally {
      loadingVariation.value = false;
    }
    console.log("New variation added");
  };
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
              <UiTableHead>Total Stocks</UiTableHead>
              <UiTableHead>Remaining Stocks</UiTableHead>
              <UiTableHead>Last Modified</UiTableHead>
            </UiTableRow>
          </UiTableHeader>
          <UiTableBody class="last:border-b">
            <template v-for="variation in variations" :key="variation.id">
              <UiTableRow>
                <UiTableCell class="bg-secondary">{{ variation.value }}</UiTableCell>
                <UiTableCell class="bg-secondary">
                  <template v-if="variation.remainingStocks > 0">
                    <UiBadge> Available </UiBadge>
                  </template>
                  <template v-else>
                    <UiBadge variant="destructive">No Stocks</UiBadge>
                  </template>
                </UiTableCell>
                <UiTableCell>₱{{ variation.price }}</UiTableCell>
                <UiTableCell>{{ variation.totalStocks }}</UiTableCell>
                <UiTableCell>{{ variation.remainingStocks }}</UiTableCell>
                <UiTableCell>{{ formatDate(variation.lastModified) }}</UiTableCell>
              </UiTableRow>
            </template>
          </UiTableBody>
        </UiTable>
      </div>
      <div class="mx-auto flex flex-col items-center justify-center space-y-2 pt-12">
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
                  <UiInput
                    v-model="newVariationName"
                    id="name"
                    placeholder="Small"
                    class="col-span-3"
                  />
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <UiLabel for="price" class="text-right"> Price </UiLabel>
                  <UiNumberField
                    v-model="newVariationPrice"
                    :min="0"
                    :max="10000"
                    class="col-span-3"
                  >
                    <UiNumberFieldInput id="price" placeholder="₱0.00" step="0.01" />
                    <UiNumberFieldDecrement class="border-l" />
                    <UiNumberFieldIncrement class="border-l" />
                  </UiNumberField>
                </div>
                <div class="grid grid-cols-4 items-center gap-4">
                  <UiLabel for="stocks" class="text-right"> Stocks </UiLabel>
                  <UiNumberField
                    v-model="newVariationStocks"
                    :min="0"
                    :max="10000"
                    class="col-span-3"
                  >
                    <UiNumberFieldInput id="stocks" placeholder="0" step="1" />
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
                  :disabled="loadingVariation"
                  variant="outline"
                  type="button"
                  class="mt-2 sm:mt-0"
                  >Cancel
                  <Icon
                    v-if="loadingVariation"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                /></UiButton>
                <UiButton @click="handleAddVariation" :disabled="loadingVariation" type="submit"
                  >Save
                  <Icon
                    v-if="loadingVariation"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                  />
                </UiButton>
              </UiDialogFooter>
            </template>
          </UiDialogContent>
        </UiDialog>
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
          <UiButton
            :variant="
              selectedVariation && selectedVariation.id === variation.id ? 'default' : 'outline'
            "
            @click="selectVariation(variation)"
          >
            {{ variation.value }}
          </UiButton>
        </template>
      </div>
      <UiDivider class="my-3" />
      <div v-if="selectedVariation" class="flex flex-col space-y-2">
        <span class="text-lg font-medium text-muted-foreground">Variation Details</span>
        <div class="flex w-full flex-row items-center gap-2 pl-4 pt-2">
          <!--Variation Name-->
          <div class="flex flex-row items-center gap-1">
            <Icon name="lucide:book-a" class="size-4" />
            <span class="font-medium">Name:</span>
            <span class="pl-2 text-muted-foreground"> {{ selectedVariation.value }}</span>
          </div>
          <UiDivider orientation="vertical" />
          <!--Status-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:eye" class="size-4" />
            <span class="font-medium">Status:</span>
            <UiBadge
              v-if="
                selectedVariation &&
                selectedVariation.remainingStocks !== undefined &&
                selectedVariation.remainingStocks > 0
              "
              >Available</UiBadge
            >
            <UiBadge v-else variant="destructive">No Stocks</UiBadge>
          </div>
          <UiDivider orientation="vertical" />
          <!--Current Price-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:banknote" class="size-4" />
            <span class="font-medium">Current Price:</span>
            <span class="text-muted-foreground">₱{{ selectedVariation.price }}</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Total Stocks-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:layers" class="size-4" />
            <span class="font-medium">Total Stocks:</span>
            <span class="text-muted-foreground"> {{ selectedVariation.totalStocks }}</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Remaining Stocks-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:layers-2" class="size-4" />
            <span class="font-medium">Remaining Stocks:</span>
            <span class="text-muted-foreground"> {{ selectedVariation.remainingStocks }}</span>
          </div>

          <UiDivider orientation="vertical" />
          <!--Last Modified-->
          <div class="flex flex-row items-center gap-2 text-nowrap">
            <Icon name="lucide:calendar-clock" class="size-4" />
            <span class="font-medium">Last Modified:</span>
            <span class="text-muted-foreground">
              {{
                selectedVariation?.lastModified ? formatDate(selectedVariation.lastModified) : "N/A"
              }}
            </span>
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
            <div class="col-span-9 mx-16 pt-10">
              <UiTable class="border">
                <UiTableCaption>Stock History</UiTableCaption>
                <UiTableHeader>
                  <UiTableRow>
                    <UiTableHead>Date</UiTableHead>
                    <UiTableHead>Action</UiTableHead>
                    <UiTableHead>Quantity</UiTableHead>
                    <UiTableHead> Selected Variation</UiTableHead>
                  </UiTableRow>
                </UiTableHeader>
                <UiTableBody class="last:border-b">
                  <template
                    v-if="selectedVariation && selectedVariation.id"
                    v-for="log in stocksLogs[selectedVariation.id]"
                    :key="log.dateCreated"
                  >
                    <UiTableRow>
                      <UiTableCell class="bg-secondary">{{
                        formatDate(log.dateCreated)
                      }}</UiTableCell>
                      <UiTableCell>
                        <UiBadge v-if="log.action === 'Initial Stock'" variant="secondary">
                          Initial Stock
                        </UiBadge>
                        <UiBadge v-else-if="log.action === 'Add Stock'" variant="default">
                          Add Stock
                        </UiBadge>
                        <UiBadge v-else-if="log.action === 'Remove Stock'" variant="destructive">
                          Remove Stock
                        </UiBadge>
                      </UiTableCell>
                      <UiTableCell>{{ log.quantity }}</UiTableCell>
                      <UiTableCell>{{ selectedVariation.value }}</UiTableCell>
                    </UiTableRow>
                  </template>
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
                  <UiButton variant="destructive" :disabled="isDeleteDisabled">Delete</UiButton>
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
                    <UiAlertDialogAction variant="destructive" @click="handleDeleteVariation" />
                  </UiAlertDialogFooter>
                </UiAlertDialogContent>
              </UiDialog>
            </div>
            <UiDivider orientation="vertical" class="col-span-1" />
            <div class="col-span-8 flex flex-col justify-start space-y-4">
              <!-- Edit Name-->
              <div class="flex flex-row items-center">
                <UiInput
                  :disabled="!isEditName || loading"
                  label="Variation Name"
                  :placeholder="selectedVariation.value"
                  v-model="changedVariationValue"
                />
                <template v-if="isEditName && !loading">
                  <UiButton variant="ghost" title="Save Changes" @click="handleSaveName">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel" @click="handleCancelName">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
                <template v-if="loading">
                  <Icon name="lucide:loader-circle" class="ml-2 size-4 animate-spin" />
                </template>
              </div>

              <!-- Add Stocks-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField
                  :disabled="!isAddStocks || loading"
                  :min="0"
                  :max="10000"
                  v-model="changedVariationAddedStocks"
                >
                  <UiNumberFieldInput placeholder="0" step="1" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isAddStocks && !loading">
                  <UiButton variant="ghost" title="Save Changes" @click="handleSaveAddedStocks">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel" @click="handleCancelAddedStocks">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
                <template v-if="loading">
                  <Icon name="lucide:loader-circle" class="ml-2 size-4 animate-spin" />
                </template>
              </div>
              <!-- Remove Stocks-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField
                  :disabled="!isRemoveStocks || loading"
                  :min="0"
                  :max="10000"
                  v-model="changedVariationRemovedStocks"
                >
                  <UiNumberFieldInput placeholder="0" step="1" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isRemoveStocks && !loading">
                  <UiButton variant="ghost" title="Save Changes" @click="handleSaveRemovedStocks">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel" @click="handleCancelRemovedStocks">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
                <template v-if="loading">
                  <Icon name="lucide:loader-circle" class="ml-2 size-4 animate-spin" />
                </template>
              </div>
              <!-- Price Change-->
              <div class="flex w-1/3 flex-row items-center">
                <UiNumberField
                  :disabled="!isChangePrice || loading"
                  :min="0"
                  :max="10000"
                  v-model="changedVariationPrice"
                >
                  <UiNumberFieldInput :placeholder="selectedVariation.price" step="0.01" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiNumberField>
                <template v-if="isChangePrice && !loading">
                  <UiButton variant="ghost" title="Save Changes" @click="handleSavePrice">
                    <Icon name="lucide:check" class="size-4" />
                  </UiButton>
                  <UiButton variant="ghost" title="Cancel" @click="handleCancelPrice">
                    <Icon name="lucide:x" class="size-4" />
                  </UiButton>
                </template>
                <template v-if="loading">
                  <Icon name="lucide:loader-circle" class="ml-2 size-4 animate-spin" />
                </template>
              </div>
            </div>
          </div>
        </div>
        <UiDivider class="mb-2" />
      </div>
    </div>
    <div class="min-h-64 text-secondary">.</div>
  </div>
</template>

<style></style>
