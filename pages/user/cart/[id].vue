<template>
  <div class="flex h-screen w-full flex-col items-start p-4">
    <ADUserOrderMore />
    <!-- <div class="flex flex-row items-center gap-4 px-12 pt-2 text-4xl font-bold">
      <Icon name="lucide:shopping-cart" /> <span>Shopping Cart</span>
    </div> -->
    <div class="flex h-auto w-full flex-row justify-between gap-8 px-12 pt-6">
      <div class="flex h-auto w-3/4 flex-col rounded border p-4">
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
                        <span class="text-lg font-semibold hover:underline">{{
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
                          >Price per quantity: {{ variations[cartItem.variationID]?.price }}</span
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
                              @click="openRemoveDialog(cartItem)"
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
                                @click="confirmRemoveCartItem()"
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
        <div class="sticky top-20 p-4 shadow-sm">
          <div class="flex flex-col space-y-2 py-2 pt-0">
            <p class="text-[12px] text-muted-foreground">Select an Item to Proceed to Checkout</p>
            <p>
              <span class="font-bold">{{ selectedItems.length }}</span> Item(s) Selected
            </p>
            <UiDivider class="my-2" />
            <span class="text-md font-extrabold text-muted-foreground">Total:</span>
            <span class="text-2xl font-bold">₱ {{ totalPrice }}</span>
          </div>
          <!-- <div class="flex flex-row items-center gap-2 pt-2">
            <span class="text-md text-muted-foreground line-through">₱ 150.00</span>
            <span class="text-[12px] text-muted-foreground">(Membership Discount)</span>
          </div> -->
          <UiDivider class="mt-2" />
          <div class="w-full pt-4">
            <UiDialog v-model:open="dialog">
              <UiDialogTrigger>
                <UiButton class="w-full rounded-none" :disabled="!hasSelectedItems"
                  >Checkout</UiButton
                >
              </UiDialogTrigger>
              <UiDialogContent
                :class="{ 'z-40': orderLoading }"
                :overlayClass="orderLoading ? 'z-40' : ''"
                class="overflow-y-auto bg-stone-50 p-12 sm:max-h-[700px] sm:max-w-[725px]"
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
                        class="flex flex-row items-center justify-between gap-4 px-8 py-4"
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
                              >Price per quantity:
                              {{ variations[cartItem.variationID]?.price }}</span
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
                      <div class="flex flex-col gap-2 px-4 text-sm">
                        <label class="flex items-center opacity-50" title="Available soon">
                          <input
                            disabled
                            type="radio"
                            name="paymentMethod"
                            value="gcash"
                            class="mr-2"
                          />
                          GCash (Available Soon)
                        </label>
                        <label class="flex items-center">
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash_on_hand"
                            class="mr-2"
                            v-model="selectedPaymentMethod"
                          />
                          Cash on Hand
                        </label>
                      </div>
                    </div>
                    <UiDivider class="my-2" />
                    <!-- Discount Section -->
                    <div>
                      <h3 class="text-lg font-semibold">Avail Discount</h3>
                      <UiDivider class="my-2" />
                      <div class="flex flex-col gap-2">
                        <input
                          type="text"
                          placeholder="Enter student id"
                          class="rounded border p-2"
                          name="discount"
                        />
                        <UiButton class="mt-2 bg-blue-500 hover:bg-blue-700">Send Request</UiButton>
                      </div>
                    </div>
                    <UiDivider class="my-2" />
                    <!-- Submit Order Button -->
                    <div class="flex flex-row items-center justify-between">
                      <span class="text-lg font-semibold">Total: ₱{{ totalPrice }}</span>
                      <UiButton :disabled="!canSubmitOrder" @click="handleCheckout()"
                        >Submit Order</UiButton
                      >
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
    <div
      v-if="removeLoading || orderLoading"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
    >
      <div class="flex flex-col items-center justify-center gap-4">
        <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
        <span class="text-sm font-semibold text-secondary-foreground">
          {{ removeLoading ? "Removing Cart Item ..." : "Processing Order ..." }}
        </span>
        <!-- Add a GIF here -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useCheckoutCart } from "~/composables/user/useCheckoutCart";
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { collection, doc, getDoc } from "firebase/firestore";
  import type { Cart } from "~/types/models/Cart";
  import type { Product, Variation } from "~/types/models/Product";

  definePageMeta({
    middleware: "auth",
    layout: "user",
  });
  const userCart = ref<(Cart & { id: string })[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const route = useRoute();
  const userID = computed(() => route.params.id);
  const db = useFirestore();
  const selectedItems = ref<(Cart & { id: string })[]>([]);
  const selectedPaymentMethod = ref<string | null>(null);
  const cartItemToRemove = ref<(Cart & { id: string }) | null>(null);
  const dialog = ref(false);
  const toast = useToast();
  const removeModal = ref(false);
  const orderLoading = ref(false);
  const router = useRouter();

  const {
    removeCartItem,
    createOrder,
    loading: removeLoading,
    generateUniqueRefNumber,
  } = useCheckoutCart();

  const openRemoveDialog = (cartItem: Cart & { id: string }) => {
    cartItemToRemove.value = cartItem;
    removeModal.value = true;
  };

  const showMessage = (message: string) => {
    useSonner(message);
  };

  const fetchUserCart = async (userID: string) => {
    const {
      userCart: cart,
      loading: cartLoading,
      error: cartError,
      fetchUserCart: fetchCart,
    } = useFetchUserCart(userID);
    await fetchCart();
    userCart.value = cart.value.map((item, index) => ({
      ...item,
      id: cart.value[index].id,
    }));
    loading.value = cartLoading.value;
    error.value = cartError.value;
    console.log("User cart updated:", userCart.value);
  };

  watch(
    () => userID.value,
    async (newUserID) => {
      if (newUserID) {
        await fetchUserCart(newUserID as string);
      }
    },
    { immediate: true }
  );

  const confirmRemoveCartItem = async () => {
    removeLoading.value = true;
    if (cartItemToRemove.value && userID.value) {
      await removeCartItem(userID.value as string, cartItemToRemove.value.id);
      await fetchUserCart(userID.value as string);
      showMessage("Removed Cart Item");
      selectedItems.value = selectedItems.value.filter(
        (item) => item.id !== cartItemToRemove.value?.id
      );
      cartItemToRemove.value = null;
      removeModal.value = false;
    }
    removeLoading.value = false;
  };

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
    const groups: Record<string, (Cart & { id: string })[]> = {};
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

  const isSelected = (cartItem: Cart & { id: string }) => {
    return selectedItems.value.includes(cartItem);
  };

  const toggleSelection = (cartItem: Cart & { id: string }) => {
    if (isSelected(cartItem)) {
      selectedItems.value = selectedItems.value.filter((item) => item.id !== cartItem.id);
    } else {
      selectedItems.value.push(cartItem);
    }
  };

  const isOtherGroupSelected = (cartItem: Cart & { id: string }) => {
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

  const hasSelectedItems = computed(() => {
    return selectedItems.value.length > 0;
  });

  const canSubmitOrder = computed(() => {
    return hasSelectedItems.value && selectedPaymentMethod.value !== null;
  });

  const handleCheckout = async () => {
    orderLoading.value = true;
    try {
      console.log("Proceeding to checkout...");
      console.log("User ID:", userID.value);
      console.log("Total price:", totalPrice.value);
      console.log("Selected payment method:", selectedPaymentMethod.value);
      console.log("Selected items:", selectedItems.value);

      const organizationID = products.value[selectedItems.value[0].productID]?.organizationID;
      const organizationName = products.value[selectedItems.value[0].productID]?.organization;

      console.log("Organization ID:", organizationID);
      console.log("Organization Name:", organizationName);

      await createOrder(
        userID.value as string,
        organizationID as string,
        organizationName as string,
        totalPrice.value,
        selectedPaymentMethod.value as string,
        selectedItems.value
      );
      await testUniqueRefNumber();

      toast.toast({
        title: "Order submitted",
        description: "Your order has been submitted successfully. Please wait for confirmation.",
        variant: "success",
        icon: "lucide:badge-check",
      });
      router.push(`/user/orders/track-orders/${userID.value}`);
    } catch (error) {
      console.error("Error during checkout:", error);
      showMessage("Error during checkout");
    } finally {
      orderLoading.value = false;
    }
  };

  const testUniqueRefNumber = async () => {
    const uniqueRefNumber = generateUniqueRefNumber();
    console.log("Generated Unique Reference Number:", uniqueRefNumber);
  };
</script>
