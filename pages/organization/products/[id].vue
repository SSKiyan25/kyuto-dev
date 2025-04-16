<script setup lang="ts">
  import {
    addDiscountToProduct,
    archiveProduct,
    fetchProducts,
    fetchVariations,
  } from "~/composables/organization/useProducts";
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { useFetchUser } from "~/composables/user/useFetchUser";
  import {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    QueryDocumentSnapshot,
    Timestamp,
    where,
  } from "firebase/firestore";
  import { deleteObject, listAll, ref as storageRef } from "firebase/storage";
  // ...
  import { RouterLink } from "vue-router";
  import type { ColumnDef, Table } from "@tanstack/vue-table";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";
  import type { Variation } from "~/types/models/Product";
  import type { DocumentData } from "firebase/firestore";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  const toast = useToast();
  const route = useRoute();
  const organizationIDLink = computed(() => route.params.id as string);
  const orgIDLink = route.params.id as string;

  console.log("Organization ID Link:", organizationIDLink);
  const crumbs: Crumbs[] = [
    {
      label: "Dashboard",
      link: `/organization/dashboard/${orgIDLink}`,
      icon: "lucide:newspaper",
    },
    {
      label: "All Products",
      link: `/organization/products/${organizationIDLink}`,
      icon: "lucide:package",
      disabled: true,
    },
  ];

  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  // Filters
  const filterBy = ref("All");
  const filterOptions = ["All", "Publish", "Draft", "Archived"];
  const defaultCategory = ref("All");
  const categories = ["All", "T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];

  // Table
  const tableRef = ref();
  const table = ref<Table<Partial<Product>> | null>(null);
  const search = ref("");

  type Product = {
    id: string;
    photo: string;
    name: string;
    category: string;
    price: number;
    stock: number;
    status: string;
    date: string;
  };

  const data = ref<Partial<Product>[]>([]);
  const lastVisible = ref<QueryDocumentSnapshot<DocumentData> | null>(null);
  const columns: ColumnDef<Partial<Product>>[] = [
    { accessorKey: "name", header: "Name", enableHiding: true },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.original.status;
        let variant = "default";

        if (status === "Draft") {
          variant = "outline";
        } else if (status === "Archived") {
          variant = "destructive";
        }

        return h(resolveComponent("UiBadge"), { variant, class: "capitalize" }, () => [status]);
      },
      enableHiding: true,
    },
    { accessorKey: "category", header: "Category", enableHiding: true },
    {
      accessorKey: "price",
      header: "Price",
      enableHiding: true,
      cell: ({ row }) => `₱${calculatePriceWithCommission(Number(row.original.price)).toFixed(2)}`,
    },
    { accessorKey: "stock", header: "Remaining Stocks", enableHiding: true },
    { accessorKey: "date", header: "Date", enableHiding: true },
    {
      accessorKey: "actions",
      header: "",
      enableSorting: false,
      enableHiding: false,
      cell: ({ row }) => {
        const productId = row.original.id;
        return h(resolveComponent("UiDropdownMenu"), {}, () => [
          h(resolveComponent("UiDropdownMenuTrigger"), { asChild: true }, () => [
            h(
              resolveComponent("UiButton"),
              { variant: "ghost", size: "icon", class: "w-9 h-9" },
              () => [
                h(resolveComponent("Icon"), {
                  name: "lucide:more-horizontal",
                  class: "h-4 w-4",
                }),
              ]
            ),
          ]),
          h(resolveComponent("UiDropdownMenuContent"), () => [
            h(resolveComponent("UiDropdownMenuItem"), { title: "View" }, () => [
              h(RouterLink, { to: `/organization/products/product/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:view", class: "mr-2 h-4 w-4" }),
                "View",
              ]),
            ]),
            h(
              resolveComponent("UiDropdownMenuItem"),
              {
                title: "Add Discount",
                onClick: () =>
                  openAddDiscountDialog(productId as string, row.original.name as string),
              },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:tag", class: "mr-2 h-4 w-4" }),
                "Add Discount",
              ]
            ),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Edit" }, () => [
              h(RouterLink, { to: `/organization/products/edit/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:pencil", class: "mr-2 h-4 w-4" }),
                "Edit",
              ]),
            ]),
            h(resolveComponent("UiDropdownMenuItem"), { title: "Manage Inventory" }, () => [
              h(RouterLink, { to: `/organization/products/inventory/${productId}` }, () => [
                h(resolveComponent("Icon"), { name: "lucide:layers-3", class: "mr-2 h-4 w-4" }),
                "Manage Inventory",
              ]),
            ]),
            h(
              resolveComponent("UiDropdownMenuItem"),
              { title: "Archive", onClick: () => handleArchiveProduct(productId as string) },
              () => [
                h(resolveComponent("Icon"), { name: "lucide:file-x", class: "mr-2 h-4 w-4" }),
                "Archive",
              ]
            ),
          ]),
        ]);
      },
    },
  ];

  const { userData } = await useFetchUser();

  console.log("User Data: ", userData);
  // Get copy of the products
  const fetchAndSetProducts = async (reset = false) => {
    if (userData.organizationID) {
      const pageSize = table.value?.getState().pagination.pageSize || 10;
      const result = await fetchProducts(
        pageSize,
        filterBy.value,
        defaultCategory.value,
        reset ? null : lastVisible.value
      );
      console.log("Products in script:", result.products);

      const newData = result.products.map((product) => ({
        id: product.id,
        photo: product.featuredPhotoURL,
        name: product.name,
        category: product.category,
        price: product.price,
        stock: product.stock,
        status: product.status,
        date:
          product.dateCreated instanceof Timestamp
            ? product.dateCreated.toDate().toISOString().split("T")[0]
            : "",
      }));

      if (reset) {
        data.value = newData;
      } else {
        const existingIds = new Set(data.value.map((product) => product.id));
        const uniqueNewData = newData.filter((product) => !existingIds.has(product.id));
        data.value = [...data.value, ...uniqueNewData];
      }

      lastVisible.value = result.lastVisible;
      console.log("Data: ", data.value);
    }
  };

  const handleArchiveProduct = async (productId: string) => {
    try {
      await archiveProduct(productId);
      toast.toast({
        title: "Product Archived",
        description: "The product has been archived successfully.",
        variant: "success",
        icon: "lucide:check",
      });
      await fetchAndSetProducts(true); // Refresh the product list
    } catch (error) {
      toast.toast({
        title: "Error",
        description: "An error occurred while archiving the product.",
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
    }
  };

  watch([filterBy, defaultCategory], () => fetchAndSetProducts(true), {
    immediate: true,
  });

  watch(
    () => table.value?.getState().pagination.pageSize,
    () => fetchAndSetProducts(true)
  );

  watch(
    () => table.value?.getState().pagination.pageIndex,
    () => fetchAndSetProducts()
  );

  onMounted(() => {
    fetchCommissionRate();
  });

  const openAddDiscount = ref(false);
  const discountType = ref("percentage");
  const discountTarget = ref("member");
  const variations = ref<(Variation & { id: string })[]>([]);
  const productName = ref("");
  const productSelected = ref<string>("");
  const isCustomDiscount = computed(() => discountType.value === "custom");

  const discountTargetOptions = [
    { value: "member", text: "Member" },
    { value: "code", text: "Code" },
  ];

  const discountTypeOptions = [
    { value: "percentage", text: "Percentage" },
    { value: "custom", text: "Custom" },
  ];

  const { handleSubmit, resetForm, isSubmitting } = useForm({
    validationSchema: toTypedSchema(DiscountSchema),
  });

  const onSubmit = handleSubmit(async (values) => {
    console.log(discountTarget.value, discountType.value);
    console.log("productSelected", productSelected.value);
    console.log("Form values:", values);

    const validCustomDiscountPrices = values.customDiscountPrices?.filter(
      (item) => item.price !== undefined
    ) as { id: string; price: number }[];

    try {
      await addDiscountToProduct(
        productSelected.value,
        values.discountType,
        values.discountTarget,
        values.discount,
        values.discountCode,
        validCustomDiscountPrices
      );
      toast.toast({
        title: "Discount added",
        description: "The discount has been added successfully.",
        variant: "success",
        icon: "lucide:check",
      });
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: `An error occurred while adding the discount: ${error.message}`,
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
      console.error("Error adding discount:", error);
    }

    closeDiscountDialog(true);
    discountTarget.value = "member";
    discountType.value = "percentage";
    productSelected.value = "";
  });

  const openAddDiscountDialog = async (productId: string, name: string) => {
    const variationsResult = await fetchVariations(productId);
    variations.value = variationsResult;
    productSelected.value = productId;
    productName.value = name;
    console.log("Fetched Variations:", variations.value);

    openAddDiscount.value = true;
  };

  const closeDiscountDialog = (save: boolean) => {
    openAddDiscount.value = false;
  };

  onMounted(fetchAndSetProducts);

  // For Testing
  const organizationID = userData.organizationID;
  const storage = useFirebaseStorage();
  const db = useFirestore();
  const deleteLoading = ref(false);

  const deleteAllProducts = async () => {
    deleteLoading.value = true;
    try {
      // Fetch all products for the organization
      const productsQuery = query(
        collection(db, "products"),
        where("organizationID", "==", organizationID)
      );
      const querySnapshot = await getDocs(productsQuery);

      // Delete each product document and its sub-collections from Firestore
      const deletePromises = querySnapshot.docs.map(async (productDoc) => {
        const productID = productDoc.id;

        // Fetch and delete all variations sub-collection documents
        const variationsQuery = collection(db, "products", productID, "variations");
        const variationsSnapshot = await getDocs(variationsQuery);
        const deleteVariationsPromises = variationsSnapshot.docs.map(async (variationDoc) => {
          const variationID = variationDoc.id;

          // Fetch and delete all stocksLogs sub-collection documents
          const stocksLogsQuery = collection(
            db,
            "products",
            productID,
            "variations",
            variationID,
            "stocksLogs"
          );
          const stocksLogsSnapshot = await getDocs(stocksLogsQuery);
          const deleteStocksLogsPromises = stocksLogsSnapshot.docs.map(async (stocksLogDoc) => {
            await deleteDoc(stocksLogDoc.ref);
          });

          // Wait for all stocksLogs delete operations to complete
          await Promise.all(deleteStocksLogsPromises);

          // Delete the variation document
          await deleteDoc(variationDoc.ref);
        });

        // Wait for all variations delete operations to complete
        await Promise.all(deleteVariationsPromises);

        // Delete the product document
        await deleteDoc(doc(db, "products", productID));
      });

      // Wait for all Firestore delete operations to complete
      await Promise.all(deletePromises);

      // Delete the entire products folder from Firebase Storage
      const storagePath = `organizations/${organizationID}/products`;
      const folderRef = storageRef(storage, storagePath);
      const listResult = await listAll(folderRef);
      const deleteFilePromises = listResult.items.map((fileRef) => deleteObject(fileRef));
      await Promise.all(deleteFilePromises);

      console.log("All products and associated files deleted successfully.");
    } catch (error) {
      console.error("Error deleting products:", error);
    } finally {
      deleteLoading.value = false;
    }
  };
</script>

<template>
  <div class="flex h-screen w-full flex-col p-8">
    <div class="flex flex-row items-center justify-between">
      <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
      <div class="flex flex-row items-center gap-4">
        <!-- Search -->
        <UiInput
          type="search"
          v-model="search"
          placeholder="Search Product"
          class="w-full md:w-96"
        />
      </div>
    </div>
    <div class="flex flex-row items-center justify-between pb-4 pt-8">
      <!-- Show products depending on status -->
      <div>
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton size="sm" variant="secondary" class="flex flex-row items-center"
              >Show: <span class="font-medium opacity-70">{{ filterBy }}</span>
              <Icon name="lucide:chevron-down" class="ml-2 h-4 w-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuLabel label="Filter by:" />
            <UiDropdownMenuRadioGroup v-model="filterBy">
              <UiDropdownMenuRadioItem
                v-for="item in filterOptions"
                :key="item"
                :value="item"
                :title="item"
                :text-value="item"
              />
            </UiDropdownMenuRadioGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
      </div>
      <!-- Filter Options -->
      <div class="flex flex-row items-center gap-4">
        <!-- Filter by category -->
        <UiDropdownMenu>
          <UiDropdownMenuTrigger as-child>
            <UiButton size="sm" variant="secondary" class="flex flex-row items-center"
              >Filter by
              <Icon name="lucide:list-filter" class="h-4 w-4" />
            </UiButton>
          </UiDropdownMenuTrigger>
          <UiDropdownMenuContent>
            <UiDropdownMenuLabel label="Filter by:" />
            <UiDropdownMenuRadioGroup v-model="defaultCategory">
              <UiDropdownMenuRadioItem
                v-for="item in categories"
                :key="item"
                :value="item"
                :title="item"
                :text-value="item"
              />
            </UiDropdownMenuRadioGroup>
          </UiDropdownMenuContent>
        </UiDropdownMenu>
        <UiButton
          :to="`/organization/products/add/${organizationIDLink}`"
          class="flex flex-row items-center"
        >
          <Icon name="lucide:circle-plus" class="size-4" />Add Product
        </UiButton>
      </div>
    </div>
    <div class="flex h-auto w-full flex-col items-start bg-muted p-4 shadow">
      <div class="flex flex-col items-start gap-1">
        <span class="text-2xl font-semibold">Products</span>
        <p class="text-sm opacity-60">Manage your products and view their sales performance.</p>
      </div>
      <!-- Table -->
      <div class="w-full">
        <UiTanStackTable
          @ready="table = $event"
          ref="tableRef"
          :search="search"
          :data="data"
          :columns="columns"
          :showPagination="false"
          :showRowsPerPage="true"
          rowsPerPageText="Total items in Table:"
          class="mt-5 flex w-full rounded-md border"
        >
          <template #empty>
            <div class="flex w-full flex-col items-center justify-center gap-5 py-5">
              <Icon name="lucide:database" class="h-12 w-12 text-muted-foreground" />
              <span class="mt-2">No data available.</span>
            </div>
          </template>
        </UiTanStackTable>
        <div class="flex items-end justify-end">
          <span class="text-sm text-muted-foreground">Total Products: {{ data.length }}</span>
        </div>
      </div>
    </div>
    <!-- Dont remove -->
    <div class="min-h-32 text-secondary"></div>
  </div>

  <UiDialog v-model:open="openAddDiscount">
    <UiDialogContent
      title="Add Discount"
      description="Add a discount to your product."
      class="overflow-y-auto bg-secondary sm:max-h-[700px] sm:max-w-[725px]"
    >
      <UiDialogTitle>Add Discount</UiDialogTitle>
      <UiDialogDescription>
        Add a discount to your product. If a discount is already applied, it will be replaced.
      </UiDialogDescription>
      <div class="text-lg font-semibold">{{ productName }}</div>
      <form @submit.prevent="onSubmit">
        <div class="space-y-4 p-6">
          <UiVeeRadioGroup name="discountTarget" label="Discount Target" v-model="discountTarget">
            <template v-for="(opt, i) in discountTargetOptions" :key="i">
              <div class="mb-2 flex items-center gap-3">
                <UiRadioGroupItem
                  :value="opt.value"
                  :id="opt.value"
                  :checked="discountTarget === opt.value"
                  @change="discountTarget = opt.value"
                  :disabled="isSubmitting"
                />
                <UiLabel :for="opt.value">{{ opt.text }}</UiLabel>
              </div>
            </template>
          </UiVeeRadioGroup>
          <UiVeeRadioGroup name="discountType" label="Discount Type" v-model="discountType">
            <template v-for="(opt, i) in discountTypeOptions" :key="i">
              <div class="mb-2 flex items-center gap-3">
                <UiRadioGroupItem
                  :value="opt.value"
                  :id="opt.value"
                  :checked="discountType === opt.value"
                  @change="discountType = opt.value"
                  :disabled="isSubmitting"
                />
                <UiLabel :for="opt.value">{{ opt.text }}</UiLabel>
              </div>
            </template>
          </UiVeeRadioGroup>
          <div>
            <UiVeeInput
              name="discount"
              label="Discount"
              placeholder="10%"
              :min="0"
              :max="100"
              :disabled="isCustomDiscount || isSubmitting"
              v-percentage
            />
            <span v-if="isCustomDiscount" class="text-sm text-secondary-foreground/60">
              Disabled when Custom is selected
            </span>
          </div>
          <UiVeeInput
            v-if="discountTarget === 'code'"
            name="discountCode"
            label="Discount Code"
            placeholder="SUMMER10"
            :disabled="isSubmitting"
          />
          <div v-if="discountType === 'custom'" class="space-y-4">
            <div v-for="(variation, index) in variations" :key="variation.id" class="flex flex-col">
              <UiVeeInput
                :name="'customDiscountPrices[' + index + '].id'"
                :label="'Variation ' + (index + 1) + ' ID'"
                :placeholder="'Variation ID'"
                v-model="variation.id"
                hidden
              />
              <UiVeeInput
                :name="'customDiscountPrices[' + index + '].price'"
                :label="'Variation ' + (index + 1) + ' Price'"
                :placeholder="variation.price.toString()"
                :max="variation.price"
                :disabled="isSubmitting"
                :min="0"
              />
            </div>
          </div>
          <div class="flex justify-end space-x-2">
            <UiButton variant="outline" :disabled="isSubmitting" @click="closeDiscountDialog(false)"
              >Cancel</UiButton
            >
            <UiButton :loading="isSubmitting" type="submit">Save</UiButton>
          </div>
        </div>
      </form>
    </UiDialogContent>
  </UiDialog>
  <!-- Delete Products-->
  <!-- <div class="flex h-96 w-1/2 flex-col space-y-2 px-12">
    <span>For testing purposes only</span>
    <UiButton @click="deleteAllProducts" variant="destructive">Delete All Products</UiButton>
  </div>
  <div
    v-if="deleteLoading"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div class="flex flex-col items-center justify-center gap-4">
      <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
      <span class="text-sm font-semibold text-secondary-foreground"> Deleting Products </span>
    </div>
  </div> -->
</template>
