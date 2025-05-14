<script lang="ts" setup>
  import { useEditVariation } from "~/composables/organization/product/useEditVariation";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { collection, deleteDoc, doc, Timestamp } from "firebase/firestore";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { StocksLogs, Variation } from "~/types/models/Product";

  definePageMeta({
    layout: "no-nav",
    middleware: ["edit-product"],
  });

  const route = useRoute();

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
  const productID = route.params.id as string;

  const { commissionRate, fetchCommissionRate, clearCache } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  const variationsRef = computed(() =>
    productID ? collection(doc(db, "products", productID), "variations") : null
  );
  const { data: variationsSnapshot } = useCollection(variationsRef);

  // console.log("variationsSnapshot", variationsSnapshot);

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

  // console.log("Variations:", variations);
  // console.log("Stock Logs:", stocksLogs);
  const loading = ref(false);

  const { updateVariation, addStocks, removeStocks, addVariation, getOrgIDFromProduct } =
    useEditVariation();
  const toast = useToast();

  const handleSaveName = async () => {
    loading.value = true;
    if (!selectedVariation.value) return;

    // Regex to detect invalid characters
    const invalidChars = /[\/\*<>!@]/;

    // Regex to detect HTML tags
    const htmlTagRegex = /<\/?[\w\s="/.':;#-\/\?]+>/gi;

    if (invalidChars.test(changedVariationValue.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The name contains invalid characters: /, *, <, >, !, @",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loading.value = false;
      return;
    }

    if (htmlTagRegex.test(changedVariationValue.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The name cannot contain HTML tags.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loading.value = false;
      return;
    }

    const updatedData: Partial<Variation> = {
      value: changedVariationValue.value,
    };
    // console.log("Passed variation ID:", selectedVariation.value.id);
    // console.log("Updated Data:", updatedData);
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

    // Regex to detect invalid characters
    const invalidChars = /[\/\*<>!@]/;

    // Regex to detect HTML tags
    const htmlTagRegex = /<\/?[\w\s="/.':;#-\/\?]+>/gi;

    // Validate the new variation name
    if (!newVariationName.value.trim()) {
      toast.toast({
        title: "Invalid Name",
        description: "The variation name cannot be empty.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loadingVariation.value = false;
      return;
    }

    if (invalidChars.test(newVariationName.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The variation name contains invalid characters: /, *, <, >, !, @",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loadingVariation.value = false;
      return;
    }

    if (htmlTagRegex.test(newVariationName.value)) {
      toast.toast({
        title: "Invalid Name",
        description: "The variation name cannot contain HTML tags.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loadingVariation.value = false;
      return;
    }

    // Validate the price
    if (newVariationPrice.value < 1) {
      toast.toast({
        title: "Invalid Price",
        description: "The price cannot be less than zero.",
        variant: "warning",
        icon: "lucide:triangle-alert",
      });
      loadingVariation.value = false;
      return;
    }

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
    // console.log("New variation added");
  };

  const orgID = ref<string | null>(null);

  const crumbs = reactive<Crumbs[]>([
    {
      label: "Dashboard",
      link: "#",
      icon: "lucide:newspaper",
    },
    {
      label: "All Products",
      link: "#",
      icon: "lucide:package",
    },
    {
      label: "Manage Inventory",
      icon: "lucide:file-pen-line",
      disabled: true,
    },
  ]);

  const formattedStockLogs = computed(() => {
    if (!selectedVariation.value) return [];
    return (
      stocksLogs.value[selectedVariation.value.id]?.map((log) => ({
        ...log,
        selectedVariation: selectedVariation.value?.value || "Unknown",
      })) || []
    );
  });

  onMounted(async () => {
    console.log("Product ID:", productID);
    orgID.value = await getOrgIDFromProduct(productID);
    console.log("Org ID:", orgID.value);
  });

  watch(
    () => orgID.value,
    (newOrgID) => {
      if (newOrgID) {
        crumbs[0].link = `/organization/dashboard/${newOrgID}`;
        crumbs[1].link = `/organization/products/${newOrgID}`;
      } else {
        crumbs[0].link = "#";
        crumbs[1].link = "#";
      }
    },
    { immediate: true }
  );

  onMounted(() => {
    clearCache();
    fetchCommissionRate();
  });
</script>

<template>
  <div
    class="my-8 flex min-h-screen w-full flex-col px-4 py-4 sm:px-6 sm:py-6 md:px-8 md:py-12 lg:py-16 lg:pl-20"
  >
    <!-- Breadcrumbs - Mobile friendly -->
    <div class="mb-6 w-full sm:mb-8">
      <UiBreadcrumbs :items="crumbs" class="overflow-x-auto pb-1 text-xs sm:text-sm" />
    </div>

    <!-- Main Content Container - Responsive width -->
    <div class="flex w-full flex-col gap-6">
      <!-- Inventory Summary Section -->
      <div class="flex w-full flex-col items-start rounded-lg bg-card p-4 shadow sm:p-6">
        <div class="mb-4 flex w-full flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 class="text-xl font-semibold sm:text-2xl">Inventory</h1>
            <p class="mt-1 text-xs text-muted-foreground sm:text-sm">
              Manage variations, stock levels, and pricing
            </p>
          </div>

          <!-- Add New Variation Button - More prominent -->
          <UiDialog v-model:open="isAddVariation">
            <UiDialogTrigger as-child>
              <UiButton class="mt-4 sm:mt-0" size="sm" variant="default">
                <Icon name="lucide:plus" class="mr-1 size-4" />
                Add Variation
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
                      :decimal-places="2"
                      class="col-span-3"
                    >
                      <UiNumberFieldInput id="price" placeholder="₱0.00" step="0.01" />
                      <UiNumberFieldDecrement class="border-l" />
                      <UiNumberFieldIncrement class="border-l" />
                    </UiNumberField>
                  </div>
                  <div class="grid grid-cols-4 items-center gap-4">
                    <UiLabel class="text-right"> Price with Commission </UiLabel>
                    <div class="col-span-3 text-muted-foreground">
                      <p class="text-sm">
                        <span
                          >₱{{
                            calculatePriceWithCommission(newVariationPrice || 0).toFixed(2)
                          }}</span
                        >
                        <br />
                        <span class="text-xs"
                          >Commission Rate: {{ commissionRate?.rate || 0 }}%</span
                        >
                      </p>
                    </div>
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

        <UiDivider />

        <!-- Summary Table Section - Responsive -->
        <div class="mt-4 w-full">
          <h2 class="mb-3 text-sm font-medium">Table of Summary</h2>
          <div class="w-full overflow-x-auto rounded-md border">
            <UiTable>
              <UiTableCaption class="text-xs">
                List and summary of your product's variations.
              </UiTableCaption>
              <UiTableHeader>
                <UiTableRow>
                  <UiTableHead class="whitespace-nowrap">Variation</UiTableHead>
                  <UiTableHead class="whitespace-nowrap">Status</UiTableHead>
                  <UiTableHead class="whitespace-nowrap">Price</UiTableHead>
                  <UiTableHead class="hidden whitespace-nowrap sm:table-cell"
                    >Total Stocks</UiTableHead
                  >
                  <UiTableHead class="whitespace-nowrap">Remaining</UiTableHead>
                  <UiTableHead class="hidden whitespace-nowrap md:table-cell"
                    >Last Modified</UiTableHead
                  >
                </UiTableRow>
              </UiTableHeader>
              <UiTableBody>
                <template v-for="variation in variations" :key="variation.id">
                  <UiTableRow
                    :class="
                      selectedVariation && selectedVariation.id === variation.id
                        ? 'bg-primary/5'
                        : ''
                    "
                    class="cursor-pointer transition-colors hover:bg-muted/50"
                    @click="selectVariation(variation)"
                  >
                    <UiTableCell class="font-medium">{{ variation.value }}</UiTableCell>
                    <UiTableCell>
                      <UiBadge
                        :variant="variation.remainingStocks > 0 ? 'default' : 'destructive'"
                        class="whitespace-nowrap text-xs"
                      >
                        {{ variation.remainingStocks > 0 ? "Available" : "No Stock" }}
                      </UiBadge>
                    </UiTableCell>
                    <UiTableCell class="whitespace-nowrap">
                      ₱{{ calculatePriceWithCommission(Number(variation.price)).toFixed(2) }}
                    </UiTableCell>
                    <UiTableCell class="hidden sm:table-cell">{{
                      variation.totalStocks
                    }}</UiTableCell>
                    <UiTableCell>{{ variation.remainingStocks }}</UiTableCell>
                    <UiTableCell class="hidden whitespace-nowrap md:table-cell">
                      {{ formatDate(variation.lastModified) }}
                    </UiTableCell>
                  </UiTableRow>
                </template>
              </UiTableBody>
            </UiTable>
          </div>
          <p class="mt-2 text-center text-xs text-muted-foreground">
            You can only have 10 variations per product. Click on a row to edit details.
          </p>
        </div>
      </div>

      <!-- Variation Details Section - Mobile optimized -->
      <div class="flex w-full flex-col items-start rounded-lg bg-card p-4 shadow sm:p-6">
        <h2 class="mb-4 text-base font-medium">Variation Details</h2>

        <!-- Variation Selector - Horizontal scrollable on mobile -->
        <div class="hide-scrollbar mb-4 w-full overflow-x-auto pb-2">
          <div class="flex space-x-2">
            <template v-for="variation in variations" :key="variation.id">
              <UiButton
                size="sm"
                class="flex-shrink-0"
                :variant="
                  selectedVariation && selectedVariation.id === variation.id ? 'default' : 'outline'
                "
                @click="selectVariation(variation)"
              >
                {{ variation.value }}
              </UiButton>
            </template>
          </div>
        </div>

        <UiDivider />

        <!-- Selected Variation Details -->
        <div v-if="selectedVariation" class="mt-4 w-full">
          <!-- Variation Details Cards - Better mobile layout -->
          <div class="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
            <!-- Name card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:book-a" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Name</div>
                <div class="font-medium">{{ selectedVariation.value }}</div>
              </div>
            </div>

            <!-- Status card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:eye" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Status</div>
                <UiBadge
                  :variant="selectedVariation.remainingStocks > 0 ? 'default' : 'destructive'"
                  class="mt-1"
                >
                  {{ selectedVariation.remainingStocks > 0 ? "Available" : "No Stock" }}
                </UiBadge>
              </div>
            </div>

            <!-- Price card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:banknote" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Current Price</div>
                <div class="font-medium">
                  ₱{{ calculatePriceWithCommission(Number(selectedVariation.price)).toFixed(2) }}
                </div>
              </div>
            </div>

            <!-- Total Stocks card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:layers" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Total Stocks</div>
                <div class="font-medium">{{ selectedVariation.totalStocks }}</div>
              </div>
            </div>

            <!-- Remaining Stocks card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:layers-2" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Remaining Stocks</div>
                <div class="font-medium">{{ selectedVariation.remainingStocks }}</div>
              </div>
            </div>

            <!-- Last Modified card -->
            <div class="flex items-center gap-2 rounded-lg bg-muted/30 p-3">
              <Icon name="lucide:calendar-clock" class="size-5 text-primary" />
              <div>
                <div class="text-xs text-muted-foreground">Last Modified</div>
                <div class="font-medium">
                  {{
                    selectedVariation?.lastModified
                      ? formatDate(selectedVariation.lastModified)
                      : "N/A"
                  }}
                </div>
              </div>
            </div>
          </div>

          <!-- Logs Section - Responsive -->
          <div class="mt-6">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:logs" class="size-5" />
              <h3 class="font-medium">Stock Logs</h3>
            </div>
            <p class="mb-4 text-xs text-muted-foreground">
              These logs show the changes in prices and stocks that were added or modified
            </p>

            <div class="w-full overflow-x-auto">
              <OrganizationStocksHistory :tableData="formattedStockLogs" />
            </div>
          </div>

          <!-- Actions Section - Responsive tabs for mobile -->
          <div class="mt-8">
            <div class="mb-3 flex items-center gap-2">
              <Icon name="lucide:square-mouse-pointer" class="size-5" />
              <h3 class="font-medium">Actions</h3>
            </div>

            <!-- Mobile-friendly action layout -->
            <div class="mb-4 flex flex-wrap gap-2">
              <UiButton
                size="sm"
                :variant="isEditName ? 'default' : 'outline'"
                @click="isEditName = !isEditName"
              >
                <Icon name="lucide:edit-2" class="mr-1 size-3.5" />
                Edit Name
              </UiButton>

              <UiButton
                size="sm"
                :variant="isAddStocks ? 'default' : 'outline'"
                @click="isAddStocks = !isAddStocks"
              >
                <Icon name="lucide:plus-circle" class="mr-1 size-3.5" />
                Add Stocks
              </UiButton>

              <UiButton
                size="sm"
                :variant="isRemoveStocks ? 'default' : 'outline'"
                @click="isRemoveStocks = !isRemoveStocks"
              >
                <Icon name="lucide:minus-circle" class="mr-1 size-3.5" />
                Remove Stocks
              </UiButton>

              <UiButton
                size="sm"
                :variant="isChangePrice ? 'default' : 'outline'"
                @click="isChangePrice = !isChangePrice"
              >
                <Icon name="lucide:philippine-peso" class="mr-1 size-3.5" />
                Change Price
              </UiButton>

              <UiDialog v-model:open="isDelete">
                <UiAlertDialogTrigger as-child>
                  <UiButton size="sm" variant="destructive" :disabled="isDeleteDisabled">
                    <Icon name="lucide:trash-2" class="mr-1 size-3.5" />
                    Delete
                  </UiButton>
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

            <!-- Action Input Fields - Responsive layout -->
            <div class="mt-4 space-y-4 rounded-lg bg-muted/20 p-4">
              <!-- Edit Name-->
              <div v-if="isEditName" class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label class="text-sm font-medium">New Name:</label>
                <div class="flex flex-1 items-center">
                  <UiInput
                    :disabled="loading"
                    :placeholder="selectedVariation.value"
                    v-model="changedVariationValue"
                    class="flex-1"
                  />
                  <div class="ml-2 flex">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Save"
                      @click="handleSaveName"
                      :disabled="loading"
                    >
                      <Icon name="lucide:check" class="size-4" />
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Cancel"
                      @click="handleCancelName"
                      :disabled="loading"
                    >
                      <Icon name="lucide:x" class="size-4" />
                    </UiButton>
                  </div>
                  <Icon
                    v-if="loading"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                  />
                </div>
              </div>

              <!-- Add Stocks -->
              <div v-if="isAddStocks" class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label class="text-sm font-medium">Add Stocks:</label>
                <div class="flex flex-1 items-center">
                  <UiNumberField
                    :disabled="loading"
                    :min="0"
                    :max="10000"
                    v-model="changedVariationAddedStocks"
                    class="flex-1"
                  >
                    <UiNumberFieldInput placeholder="0" step="1" />
                    <UiNumberFieldDecrement class="border-l" />
                    <UiNumberFieldIncrement class="border-l" />
                  </UiNumberField>
                  <div class="ml-2 flex">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Save"
                      @click="handleSaveAddedStocks"
                      :disabled="loading"
                    >
                      <Icon name="lucide:check" class="size-4" />
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Cancel"
                      @click="handleCancelAddedStocks"
                      :disabled="loading"
                    >
                      <Icon name="lucide:x" class="size-4" />
                    </UiButton>
                  </div>
                  <Icon
                    v-if="loading"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                  />
                </div>
              </div>

              <!-- Remove Stocks -->
              <div v-if="isRemoveStocks" class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label class="text-sm font-medium">Remove Stocks:</label>
                <div class="flex flex-1 items-center">
                  <UiNumberField
                    :disabled="loading"
                    :min="0"
                    :max="selectedVariation.remainingStocks"
                    v-model="changedVariationRemovedStocks"
                    class="flex-1"
                  >
                    <UiNumberFieldInput placeholder="0" step="1" />
                    <UiNumberFieldDecrement class="border-l" />
                    <UiNumberFieldIncrement class="border-l" />
                  </UiNumberField>
                  <div class="ml-2 flex">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Save"
                      @click="handleSaveRemovedStocks"
                      :disabled="loading"
                    >
                      <Icon name="lucide:check" class="size-4" />
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Cancel"
                      @click="handleCancelRemovedStocks"
                      :disabled="loading"
                    >
                      <Icon name="lucide:x" class="size-4" />
                    </UiButton>
                  </div>
                  <Icon
                    v-if="loading"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                  />
                </div>
              </div>

              <!-- Change Price -->
              <div v-if="isChangePrice" class="flex flex-col gap-2 sm:flex-row sm:items-center">
                <label class="text-sm font-medium">New Price:</label>
                <div class="flex flex-1 items-center">
                  <UiNumberField
                    :disabled="loading"
                    :min="0"
                    :max="10000"
                    :decimal-places="2"
                    v-model="changedVariationPrice"
                    class="flex-1"
                  >
                    <UiNumberFieldInput :placeholder="selectedVariation.price" step="0.01" />
                    <UiNumberFieldDecrement class="border-l" />
                    <UiNumberFieldIncrement class="border-l" />
                  </UiNumberField>
                  <div class="ml-2 flex">
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Save"
                      @click="handleSavePrice"
                      :disabled="loading"
                    >
                      <Icon name="lucide:check" class="size-4" />
                    </UiButton>
                    <UiButton
                      variant="ghost"
                      size="sm"
                      title="Cancel"
                      @click="handleCancelPrice"
                      :disabled="loading"
                    >
                      <Icon name="lucide:x" class="size-4" />
                    </UiButton>
                  </div>
                  <Icon
                    v-if="loading"
                    name="lucide:loader-circle"
                    class="ml-2 size-4 animate-spin"
                  />
                </div>

                <!-- Price Preview -->
                <div
                  v-if="changedVariationPrice"
                  class="mt-2 text-xs text-muted-foreground sm:mt-0"
                >
                  With commission: ₱{{
                    calculatePriceWithCommission(changedVariationPrice).toFixed(2)
                  }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- No variation selected state -->
        <div v-else class="w-full py-8 text-center">
          <Icon name="lucide:box" class="mx-auto mb-3 size-12 text-muted-foreground/50" />
          <p class="text-muted-foreground">
            Select a variation from above to view and edit details
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
  /* Hide scrollbars but keep functionality */
  .hide-scrollbar {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }

  .hide-scrollbar::-webkit-scrollbar {
    display: none;
  }

  /* Fix responsive tables */
  :deep(table) {
    width: 100%;
    min-width: 500px;
  }

  /* Responsive cards adjustments */
  @media (max-width: 640px) {
    :deep(.ui-table-cell) {
      padding: 0.5rem;
    }

    :deep(.ui-badge) {
      font-size: 0.65rem;
      padding-left: 0.5rem;
      padding-right: 0.5rem;
    }
  }
</style>
