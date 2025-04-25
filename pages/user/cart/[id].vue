<template>
  <div class="flex h-screen w-full flex-col items-start p-4">
    <ADUserOrderMore />
    <!-- <div class="flex flex-row items-center gap-4 px-12 pt-2 text-4xl font-bold">
      <Icon name="lucide:shopping-cart" /> <span>Shopping Cart</span>
    </div> -->
    <div
      class="flex h-auto w-full flex-col justify-between px-4 pt-6 sm:flex-row sm:gap-8 sm:px-12"
    >
      <div class="flex h-auto w-full flex-col rounded border p-4 sm:w-3/4">
        <p class="text-[12px] sm:text-sm">
          <span class="text-[12px] font-bold sm:text-sm">{{ userCart.length }}</span> Item(s) in
          Cart
        </p>
        <UiDivider class="my-2" />
        <div class="flex w-full flex-row justify-between pt-2">
          <div v-if="userCart.length > 0" class="w-full">
            <div
              v-for="(cartItems, organization) in groupedCartItems"
              :key="organization"
              class="w-full px-2 pb-8 sm:px-4"
            >
              <h2 class="text-md font-semibold sm:text-lg">{{ organization }}</h2>
              <UiDivider class="my-2" />
              <div v-for="cartItem in cartItems" :key="cartItem?.productID" class="w-full">
                <template v-if="cartItem">
                  <div
                    class="flex w-full flex-col items-start justify-between gap-2 p-1 sm:flex-row sm:items-center sm:gap-6 sm:p-4"
                    :class="{
                      'round-sm bg-secondary': isSelected(cartItem),
                      'opacity-50': isOtherGroupSelected(cartItem),
                    }"
                  >
                    <div class="flex flex-row items-center gap-2 sm:gap-6">
                      <input
                        type="checkbox"
                        class="h-4 w-4 sm:h-6 sm:w-6"
                        :checked="isSelected(cartItem)"
                        @change="toggleSelection(cartItem)"
                        :disabled="isOtherGroupSelected(cartItem)"
                      />
                      <div class="h-16 w-16 overflow-hidden sm:h-24 sm:w-24">
                        <img
                          :src="products[cartItem.productID]?.featuredPhotoURL"
                          :alt="products[cartItem.productID]?.name"
                          class="h-full w-full rounded-sm object-cover"
                        />
                      </div>
                      <div class="flex flex-col">
                        <span class="text-sm font-semibold hover:underline sm:text-lg">{{
                          products[cartItem.productID]?.name
                        }}</span>
                        <span
                          v-if="variations[cartItem.variationID]?.value !== 'None'"
                          class="text-[10px] text-muted-foreground sm:text-[12px]"
                        >
                          {{ variations[cartItem.variationID]?.value }}
                        </span>
                        <span class="text-[10px] text-muted-foreground sm:text-[12px]"
                          >Quantity: {{ cartItem.quantity }}</span
                        >
                        <span class="text-[10px] text-muted-foreground sm:text-[12px]"
                          >Price per quantity:
                          {{
                            calculatePriceWithCommission(
                              Number(variations[cartItem.variationID]?.price)
                            ).toFixed(2)
                          }}</span
                        >
                      </div>
                    </div>
                    <div class="flex flex-row items-center gap-8">
                      <div class="flex flex-col">
                        <span
                          v-if="cartItem.isPreOrder"
                          class="text-[10px] text-muted-foreground sm:text-[12px]"
                          >Pre-Order</span
                        >
                        <span class="text-[10px] text-muted-foreground sm:text-[12px]"
                          >Subtotal:</span
                        >
                        <span class="sm:text-md text-sm font-semibold">
                          ₱{{
                            (
                              calculatePriceWithCommission(
                                Number(variations[cartItem.variationID]?.price) || 0
                              ) * cartItem.quantity
                            ).toFixed(2)
                          }}
                        </span>
                      </div>
                      <div v-if="isSelected(cartItem)">
                        <UiAlertDialog v-model:open="removeModal">
                          <UiAlertDialogTrigger as-child>
                            <UiButton
                              variant="destructive"
                              class="rounded-sm p-2 opacity-75 hover:opacity-100 sm:p-4"
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

      <div class="flex h-auto w-full flex-col sm:w-1/4">
        <div class="sticky top-20 p-4 shadow-sm">
          <div class="flex flex-col space-y-2 py-2 pt-0">
            <p class="text-[10px] text-muted-foreground sm:text-[12px]">
              Select an Item to Proceed to Checkout
            </p>
            <p class="text-[12px] sm:text-sm">
              <span class="font-bold">{{ selectedItems.length }}</span> Item(s) Selected
            </p>
            <UiDivider class="my-2" />
            <span class="sm:text-md text-sm font-extrabold text-muted-foreground">Total:</span>
            <span class="text-lg font-bold sm:text-2xl">₱ {{ totalPrice.toFixed(2) }}</span>
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
                class="max-h-[500px] overflow-y-auto bg-stone-50 p-4 sm:max-h-[700px] sm:max-w-[725px] sm:p-12"
                title="Checkout Order"
                description="Please review your order details before proceeding to payment. Ensure that all items and quantities are correct."
              >
                <template #content>
                  <div class="flex flex-col gap-4 py-0 sm:py-6">
                    <!-- Order Summary Section -->
                    <div>
                      <h3 class="text-md font-semibold">Order Summary</h3>
                      <UiDivider class="my-2" />
                      <div
                        v-for="cartItem in selectedItems"
                        :key="cartItem.productID"
                        class="flex flex-row items-center justify-between gap-4 px-2 py-4 sm:px-8"
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
                            <span class="sm:text-md text-sm font-semibold">{{
                              products[cartItem.productID]?.name
                            }}</span>
                            <span
                              v-if="cartItem.isPreOrder"
                              class="text-[12px] text-muted-foreground"
                              >Pre-Order</span
                            >
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
                              {{
                                calculatePriceWithCommission(
                                  Number(variations[cartItem.variationID]?.price)
                                ).toFixed(2)
                              }}</span
                            >
                          </div>
                        </div>
                        <div class="flex flex-col items-end">
                          <span class="text-[12px] text-muted-foreground">Subtotal:</span>
                          <span class="text-md font-semibold"
                            >₱{{
                              (
                                calculatePriceWithCommission(
                                  Number(variations[cartItem.variationID]?.price || 0)
                                ) * cartItem.quantity
                              ).toFixed(2)
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
                          <input type="radio" name="paymentMethod" value="gcash" class="mr-2" />
                          GCash
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
                    <!-- <div>
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
                    </div> -->
                    <UiDivider class="my-2" />
                    <!-- Submit Order Button -->
                    <div class="flex flex-row items-center justify-between">
                      <span class="text-lg font-semibold">Total: ₱{{ totalPrice.toFixed(2) }}</span>
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
          Processing Request ...
        </span>
        <!-- Add a GIF here -->
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { useOrganization } from "~/composables/useOrganizationValues";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { useCheckoutCart } from "~/composables/user/useCheckoutCart";
  import { useEmailOrder } from "~/composables/user/useEmailOrder";
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
  const orgName = ref<string | null>(null);

  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);
  onMounted(() => {
    fetchCommissionRate();
    // console.log("Commission rate fetched:", commissionRate.value);
  });

  const {
    removeCartItem,
    createOrder,
    loading: removeLoading,
    generateUniqueRefNumber,
  } = useCheckoutCart();
  const { sendOrderEmail } = useEmailOrder();

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
  const organizations = ref<Record<string, { id: string; name: string }>>({});

  const fetchProductAndVariationDetails = async () => {
    for (const cartItem of userCart.value) {
      // console.log("Cart item:", cartItem);

      // Fetch product details
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

      // Fetch variation details
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

      // Fetch organization details
      const product = products.value[cartItem.productID];
      if (product?.organizationID && !organizations.value[product.organizationID]) {
        const orgDocRef = doc(collection(db, "organizations"), product.organizationID);
        const orgDoc = await getDoc(orgDocRef);
        if (orgDoc.exists()) {
          organizations.value[product.organizationID] = {
            id: orgDoc.id,
            name: orgDoc.data().name || "Unknown Organization",
          };
          console.log("Fetched organization:", organizations.value[product.organizationID]);
        } else {
          console.error("Organization not found");
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
      const product = products.value[cartItem.productID];
      const organizationID = product?.organizationID;
      const organizationName = organizationID
        ? organizations.value[organizationID]?.name || "Unknown Organization"
        : "Unknown Organization";

      if (!groups[organizationName]) {
        groups[organizationName] = [];
      }
      groups[organizationName].push(cartItem);
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

    const selectedProduct = products.value[selectedItems.value[0].productID];
    const selectedOrganizationID = selectedProduct?.organizationID;

    const currentProduct = products.value[cartItem.productID];
    const currentOrganizationID = currentProduct?.organizationID;

    return selectedOrganizationID !== currentOrganizationID;
  };

  const totalPrice = computed(() => {
    if (selectedItems.value.length === 0) return 0;

    return selectedItems.value.reduce((total, cartItem) => {
      const basePrice = variations.value[cartItem.variationID]?.price || 0;
      const priceWithCommission = calculatePriceWithCommission(basePrice);
      return total + priceWithCommission * cartItem.quantity;
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
      // console.log("Proceeding to checkout...");
      // console.log("User ID:", userID.value);
      // console.log("Total price:", totalPrice.value);
      // console.log("Selected payment method:", selectedPaymentMethod.value);
      // console.log("Selected items:", selectedItems.value);

      const organizationID = products.value[selectedItems.value[0].productID]?.organizationID;

      // console.log("Organization ID:", organizationID);
      // console.log("Organization Name:", organizationName);

      if (!commissionRate.value) {
        throw new Error("Commission rate not found");
      }
      const commissionRateID = commissionRate.value.id;
      const commissionRateValue = commissionRate.value.rate;

      // console.log("Commission Rate ID:", commissionRateID);
      // console.log("Commission Rate Value:", commissionRateValue);

      const uniqRefNumber = await createOrder(
        userID.value as string,
        organizationID as string,
        totalPrice.value,
        selectedPaymentMethod.value as string,
        selectedItems.value,
        commissionRateID,
        commissionRateValue
      );

      const orderDetails = {
        totalPrice: totalPrice.value,
        items: await Promise.all(
          selectedItems.value.map(async (item) => {
            // Fetch product or variation data to get the name
            const productDocRef = doc(db, `products/${item.productID}`);
            const productDoc = await getDoc(productDocRef);
            const productData = productDoc.data() as Product;

            const variationDocRef = doc(
              db,
              `products/${item.productID}/variations/${item.variationID}`
            );
            const variationDoc = await getDoc(variationDocRef);
            const variationData = variationDoc.data() as Variation;
            console.log("Fetching order details");

            const basePrice = variationData.price || 0; // Get the price from the variation data
            const priceWithCommission = calculatePriceWithCommission(basePrice);

            return {
              name: variationData.value || productData.name || "Unknown Item",
              quantity: item.quantity,
              priceWithCommission: priceWithCommission,
            };
          })
        ),
      };

      await sendOrderEmail(
        uniqRefNumber,
        userID.value as string,
        organizationID as string,
        orderDetails
      );

      // await testUniqueRefNumber();

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
