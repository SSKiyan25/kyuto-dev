<template>
  <div class="flex h-screen w-full flex-col items-start p-12">
    <div class="flex flex-row items-center gap-2 px-12 pt-2 text-4xl font-bold">
      <Icon name="lucide:shopping-cart" /> <span>Shopping Cart</span>
    </div>

    <div class="flex h-auto w-full flex-row justify-between gap-8 p-12">
      <div class="flex h-auto w-3/4 flex-col rounded p-4">
        <p>
          <span class="font-bold">{{ userCart.length }}</span> Item(s) in Cart
        </p>
        <UiDivider class="my-2" />
        <div class="flex w-full flex-row justify-between pt-2">
          <div v-if="userCart.length > 0" class="w-full">
            <div
              v-for="(cartItems, organization) in groupedCartItems"
              :key="organization"
              class="w-full px-4 pb-8"
            >
              <h2 class="text-lg font-semibold">{{ organization }}</h2>
              <UiDivider class="my-2" />
              <div v-for="cartItem in cartItems" :key="cartItem?.productID" class="w-full">
                <template v-if="cartItem">
                  <div
                    class="flex w-full flex-row items-center justify-between gap-6 p-4"
                    :class="{
                      'round-sm bg-secondary': isSelected(cartItem),
                      'opacity-50': isOtherGroupSelected(cartItem),
                    }"
                  >
                    <div class="flex flex-row items-center gap-6">
                      <input
                        type="checkbox"
                        class="h-6 w-6"
                        :checked="isSelected(cartItem)"
                        @change="toggleSelection(cartItem)"
                        :disabled="isOtherGroupSelected(cartItem)"
                      />
                      <div class="h-24 w-24 overflow-hidden">
                        <img
                          :src="products[cartItem.productID]?.featuredPhotoURL"
                          :alt="products[cartItem.productID]?.name"
                          class="h-full w-full rounded-sm object-cover"
                        />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-lg font-semibold">{{
                          products[cartItem.productID]?.name
                        }}</span>
                        <span
                          v-if="variations[cartItem.variationID]?.value !== 'None'"
                          class="text-[12px] text-muted-foreground"
                        >
                          {{ variations[cartItem.variationID]?.value }}
                        </span>
                        <span class="text-[12px] text-muted-foreground"
                          >Quantity: {{ cartItem.quantity }}</span
                        >
                        <span class="text-[12px] text-muted-foreground"
                          >Price per piece: {{ variations[cartItem.variationID]?.price }}</span
                        >
                      </div>
                    </div>
                    <div class="flex flex-row items-center gap-8">
                      <div class="flex flex-col">
                        <span class="text-[12px] text-muted-foreground">Subtotal:</span>
                        <span class="text-md font-semibold">
                          ₱{{ (variations[cartItem.variationID]?.price || 0) * cartItem.quantity }}
                        </span>
                      </div>
                      <div v-if="isSelected(cartItem)">
                        <UiAlertDialog v-model:open="removeModal">
                          <UiAlertDialogTrigger as-child>
                            <UiButton
                              variant="destructive"
                              class="rounded-sm p-4 opacity-75 hover:opacity-100"
                              >Remove
                            </UiButton>
                          </UiAlertDialogTrigger>
                          <UiAlertDialogContent
                            @escape-key-down="showMessage('Escape key pressed')"
                          >
                            <UiAlertDialogHeader>
                              <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
                              <UiAlertDialogDescription>
                                This action cannot be undone. This will permanently delete the
                                selected cart item.
                              </UiAlertDialogDescription>
                            </UiAlertDialogHeader>
                            <UiAlertDialogFooter>
                              <UiAlertDialogCancel @click="showMessage('Action cancelled')" />
                              <UiAlertDialogAction
                                @click="showMessage('Removed Cart Item')"
                                variant="destructive"
                                text="Remove"
                              />
                            </UiAlertDialogFooter>
                          </UiAlertDialogContent>
                        </UiAlertDialog>
                      </div>
                    </div>
                  </div>
                </template>
              </div>
              <UiDivider class="my-2" />
            </div>
          </div>
          <div v-else>No items in the cart.</div>
        </div>
      </div>
      <div class="flex h-auto w-1/4 flex-col">
        <div class="sticky top-0 p-4 shadow-sm">
          <div class="flex flex-col space-y-2 py-2 pt-20">
            <span class="text-md font-extrabold text-muted-foreground">Total:</span>
            <span class="text-2xl font-bold">₱ {{ totalPrice }}</span>
          </div>
          <div class="flex flex-row items-center gap-2 pt-2">
            <span class="text-md text-muted-foreground line-through">₱ 150.00</span>
            <span class="text-[12px] text-muted-foreground">(Membership Discount)</span>
          </div>
          <UiDivider class="mt-2" />
          <div class="w-full pt-4">
            <UiDialog v-model:open="dialog">
              <UiDialogTrigger>
                <UiButton class="w-full rounded-none">Checkout</UiButton>
              </UiDialogTrigger>
              <UiDialogContent
                class="overflow-y-auto sm:max-h-[700px] sm:max-w-[725px]"
                title="Checkout Order"
                description="Please review your order details before proceeding to payment. Ensure that all items and quantities are correct."
              >
                <template #content>
                  <div class="flex flex-col gap-4 py-6">
                    <!-- Order Summary Section -->
                    <div>
                      <h3 class="text-md font-semibold">Order Summary</h3>
                      <UiDivider class="my-2" />
                      <div
                        v-for="cartItem in selectedItems"
                        :key="cartItem.productID"
                        class="flex flex-row items-center justify-between gap-4"
                      >
                        <div class="flex flex-row items-center gap-4">
                          <div class="h-16 w-16 overflow-hidden">
                            <img
                              :src="products[cartItem.productID]?.featuredPhotoURL"
                              :alt="products[cartItem.productID]?.name"
                              class="h-full w-full rounded-sm object-cover"
                            />
                          </div>
                          <div class="flex flex-col">
                            <span class="text-md font-semibold">{{
                              products[cartItem.productID]?.name
                            }}</span>
                            <span
                              v-if="variations[cartItem.variationID]?.value !== 'None'"
                              class="text-[12px] text-muted-foreground"
                              >{{ variations[cartItem.variationID]?.value }}</span
                            >
                            <span class="text-[12px] text-muted-foreground"
                              >Quantity: {{ cartItem.quantity }}</span
                            >
                            <span class="text-[12px] text-muted-foreground"
                              >Price per piece: {{ variations[cartItem.variationID]?.price }}</span
                            >
                          </div>
                        </div>
                        <div class="flex flex-col items-end">
                          <span class="text-[12px] text-muted-foreground">Subtotal:</span>
                          <span class="text-md font-semibold"
                            >₱{{
                              (variations[cartItem.variationID]?.price || 0) * cartItem.quantity
                            }}</span
                          >
                        </div>
                      </div>
                    </div>
                    <UiDivider class="my-2" />
                    <!-- Payment Method Section -->
                    <div>
                      <h3 class="text-lg font-semibold">Payment Method</h3>
                      <UiDivider class="my-2" />
                      <div class="flex flex-col gap-2">
                        <label class="flex items-center">
                          <input type="radio" name="paymentMethod" value="gcash" class="mr-2" />
                          GCash
                        </label>
                        <label class="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash-on-delivery"
                            class="mr-2"
                          />
                          Cash on Delivery
                        </label>
                      </div>
                    </div>
                    <UiDivider class="my-2" />
                    <!-- Voucher Section -->
                    <div>
                      <h3 class="text-lg font-semibold">Voucher</h3>
                      <UiDivider class="my-2" />
                      <div class="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Enter voucher code"
                          class="rounded border p-2"
                        />
                        <UiButton class="mt-2 bg-blue-500">Apply Voucher</UiButton>
                      </div>
                    </div>
                    <UiDivider class="my-2" />
                    <!-- Submit Order Button -->
                    <div class="flex flex-row items-center justify-between">
                      <span class="text-lg font-semibold">Total: ₱{{ totalPrice }}</span>
                      <UiButton>Submit Order</UiButton>
                    </div>
                  </div>
                </template>
              </UiDialogContent>
            </UiDialog>
          </div>
        </div>
      </div>
    </div>
    <div class="flex flex-col px-12 py-32">
      <span class="text-lg font-semibold">You Might Also Like</span>
      <UiDivider class="my-5" />
      <!-- Recommended Products -->
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { collection, doc, getDoc } from "firebase/firestore";
  import type { Cart } from "~/types/models/Cart";
  import type { Product, Variation } from "~/types/models/Product";

  definePageMeta({
    middleware: "auth",
  });
  const user = useCurrentUser();
  const userCart = ref<Cart[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const route = useRoute();
  const userID = computed(() => route.params.id);
  const db = useFirestore();
  const selectedItems = ref<Cart[]>([]);
  const dialog = ref(false);
  const removeModal = ref(false);

  const closeDialog = (save: boolean) => {
    useToast().toast({
      title: save ? "Profile updated" : "Changes discarded",
      description: `Your changes has been ${save ? "saved" : "discarded"}.`,
      duration: 5000,
      icon: save ? "lucide:check" : "lucide:x",
    });
    dialog.value = false;
  };

  const showMessage = (message: string) => {
    useSonner(message);
  };

  watch(
    () => userID.value,
    (newUserID) => {
      if (newUserID) {
        const {
          userCart: cart,
          loading: cartLoading,
          error: cartError,
          fetchUserCart,
        } = useFetchUserCart(newUserID as string);
        watch(
          () => cart.value,
          (newCart) => {
            userCart.value = newCart;
            console.log("User cart updated:", newCart);
          },
          { immediate: true }
        );
        loading.value = cartLoading.value;
        error.value = cartError.value;
        fetchUserCart();
      }
    },
    { immediate: true }
  );

  const products = ref<Record<string, Partial<Product>>>({});
  const variations = ref<Record<string, Partial<Variation>>>({});

  const fetchProductAndVariationDetails = async () => {
    for (const cartItem of userCart.value) {
      console.log("Cart item:", cartItem);
      if (cartItem?.productID && !products.value[cartItem.productID]) {
        const productDocRef = doc(collection(db, "products"), cartItem.productID);
        const productDoc = await getDoc(productDocRef);
        if (productDoc.exists()) {
          products.value[cartItem.productID] = productDoc.data() as Product;
          console.log("Fetched product:", products.value[cartItem.productID]);
        } else {
          console.error("Product not found");
        }
      }

      if (cartItem?.variationID && !variations.value[cartItem.variationID]) {
        const variationDocRef = doc(
          collection(doc(db, "products", cartItem.productID), "variations"),
          cartItem.variationID
        );
        const variationDoc = await getDoc(variationDocRef);
        if (variationDoc.exists()) {
          variations.value[cartItem.variationID] = variationDoc.data() as Variation;
          console.log("Fetched variation:", variations.value[cartItem.variationID]);
        } else {
          console.error("Variation not found");
        }
      }
    }
  };

  watch(
    () => userCart.value,
    (newCart) => {
      if (newCart.length > 0) {
        console.log("Fetching product and variation details...");
        fetchProductAndVariationDetails();
      }
    },
    { immediate: true }
  );

  const groupedCartItems = computed(() => {
    const groups: Record<string, Cart[]> = {};
    userCart.value.forEach((cartItem) => {
      const organization =
        products.value[cartItem.productID]?.organization || "Unknown Organization";
      if (!groups[organization]) {
        groups[organization] = [];
      }
      groups[organization].push(cartItem);
    });
    return groups;
  });

  const isSelected = (cartItem: Cart) => {
    return selectedItems.value.includes(cartItem);
  };

  const toggleSelection = (cartItem: Cart) => {
    if (isSelected(cartItem)) {
      selectedItems.value = selectedItems.value.filter((item) => item !== cartItem);
    } else {
      selectedItems.value.push(cartItem);
    }
  };

  const isOtherGroupSelected = (cartItem: Cart) => {
    if (selectedItems.value.length === 0) return false;
    const selectedOrganization = products.value[selectedItems.value[0].productID]?.organization;
    const currentOrganization = products.value[cartItem.productID]?.organization;
    return selectedOrganization !== currentOrganization;
  };

  const totalPrice = computed(() => {
    return selectedItems.value.reduce((total, cartItem) => {
      const price = variations.value[cartItem.variationID]?.price || 0;
      return total + price * cartItem.quantity;
    }, 0);
  });

  const toCheckOut = () => {
    console.log("Proceeding to checkout...");
  };
</script>
