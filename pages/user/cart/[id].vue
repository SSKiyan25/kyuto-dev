<template>
  <div class="flex h-screen w-full flex-col items-start p-4">
    <!-- Promotion Banner - Fixed position at top -->
    <div class="mb-6 w-full">
      <div
        class="relative w-full overflow-hidden rounded-lg border border-border/40 bg-gradient-to-r from-primary/90 to-primary/70 shadow-md"
      >
        <div class="absolute inset-0 opacity-10">
          <div
            class="absolute -right-10 -top-10 h-20 w-20 rounded-full bg-secondary/30 blur-xl"
          ></div>
          <div
            class="absolute -left-10 bottom-5 h-10 w-10 rounded-full bg-primary-foreground/20 blur-lg"
          ></div>
        </div>

        <div class="relative flex flex-row items-center justify-between p-4">
          <div class="flex max-w-[80%] flex-col space-y-1">
            <h3 class="text-sm font-bold leading-tight text-primary-foreground sm:text-lg">
              Looking for more items?
            </h3>
            <p class="text-[10px] leading-tight text-primary-foreground/80 sm:text-xs">
              Explore our catalog for the latest products and exclusive deals.
            </p>
            <div class="flex flex-row gap-2 pt-2">
              <UiButton
                to="/products"
                size="sm"
                class="group h-8 bg-secondary/90 px-3 text-secondary-foreground hover:bg-secondary"
              >
                <span class="text-[10px]">Explore Products</span>
                <Icon name="lucide:arrow-right" class="ml-1 h-3 w-3" />
              </UiButton>
            </div>
          </div>

          <div class="ml-2 flex items-center justify-center">
            <Icon
              name="lucide:shopping-bag"
              class="h-8 w-8 text-primary-foreground/90 sm:h-10 sm:w-10"
            />
          </div>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex w-full flex-col items-center justify-center p-12">
      <div class="flex flex-col items-center space-y-6">
        <div class="relative">
          <Icon name="lucide:shopping-cart" class="h-16 w-16 text-primary/20" />
          <div class="absolute inset-0 flex items-center justify-center">
            <div
              class="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"
            ></div>
          </div>
        </div>
        <div class="space-y-2 text-center">
          <h3 class="text-lg font-medium">Loading your cart</h3>
          <p class="text-sm text-muted-foreground">Retrieving your items, please wait...</p>
        </div>
      </div>
    </div>

    <div
      v-else-if="error"
      class="flex w-full flex-col items-center justify-center p-12 text-center"
    >
      <div class="flex flex-col items-center space-y-6">
        <div class="relative text-destructive">
          <Icon name="lucide:alert-octagon" class="h-16 w-16" />
        </div>
        <div class="space-y-2">
          <h3 class="text-lg font-medium">Something went wrong</h3>
          <p class="max-w-md text-sm text-muted-foreground">
            We couldn't load your cart items. Please try again or contact customer support.
          </p>
          <UiButton @click="fetchUserCart(userID as string)" variant="outline" class="mt-4">
            <Icon name="lucide:refresh-cw" class="mr-2 h-4 w-4" />
            Try Again
          </UiButton>
        </div>
      </div>
    </div>

    <!-- Cart Content -->
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
              class="mb-8 w-full px-2 pb-6 sm:px-4"
            >
              <h2 class="text-md flex items-center gap-2 font-semibold sm:text-lg">
                <Icon name="lucide:shopping-bag" class="h-4 w-4 text-primary" />
                {{ organization }}
              </h2>
              <UiDivider class="my-3" />
              <div v-for="cartItem in cartItems" :key="cartItem?.productID" class="mb-3 w-full">
                <template v-if="cartItem">
                  <div
                    class="flex w-full flex-col items-start justify-between gap-2 rounded-lg border border-border/40 p-2 transition-all duration-200 hover:border-primary/20 hover:bg-secondary/10 sm:flex-row sm:items-center sm:gap-6 sm:p-4"
                    :class="{
                      'border-primary/30 bg-secondary/40 shadow-sm': isSelected(cartItem),
                      'opacity-50': isOtherGroupSelected(cartItem),
                    }"
                  >
                    <div class="flex flex-row items-center gap-3 sm:gap-6">
                      <input
                        type="checkbox"
                        class="h-5 w-5 rounded accent-primary sm:h-6 sm:w-6"
                        :checked="isSelected(cartItem)"
                        @change="toggleSelection(cartItem)"
                        :disabled="isOtherGroupSelected(cartItem)"
                      />

                      <!-- Image with loading state -->
                      <div class="h-20 w-20 overflow-hidden rounded-md sm:h-24 sm:w-24">
                        <div
                          v-if="!products[cartItem.productID]?.featuredPhotoURL"
                          class="flex h-full w-full items-center justify-center rounded-md bg-muted"
                        >
                          <Icon
                            name="lucide:image"
                            class="h-8 w-8 animate-pulse text-muted-foreground/50"
                          />
                        </div>
                        <img
                          v-else
                          :src="products[cartItem.productID]?.featuredPhotoURL"
                          :alt="products[cartItem.productID]?.name || 'Product image'"
                          class="h-full w-full rounded-md object-cover"
                          onerror="this.onerror=null; this.src='/placeholder-image.png';"
                        />
                      </div>

                      <!-- Product details with loading states -->
                      <div class="flex flex-col">
                        <div
                          v-if="!products[cartItem.productID]?.name"
                          class="mb-1 h-5 w-32 animate-pulse rounded bg-muted"
                        ></div>
                        <span v-else class="text-sm font-semibold hover:underline sm:text-lg">
                          {{ products[cartItem.productID]?.name }}
                        </span>

                        <div
                          v-if="cartItem.isPreOrder"
                          class="mt-1 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5"
                        >
                          <Icon name="lucide:clock" class="h-3 w-3 text-amber-600" />
                          <span class="text-[10px] font-medium text-amber-700">Pre-Order</span>
                        </div>

                        <div
                          v-if="!variations[cartItem.variationID]"
                          class="mb-1 h-3 w-20 animate-pulse rounded bg-muted"
                        ></div>
                        <span
                          v-else-if="variations[cartItem.variationID]?.value !== 'None'"
                          class="text-[10px] text-muted-foreground sm:text-[12px]"
                        >
                          <span class="font-medium">Variation:</span>
                          {{ variations[cartItem.variationID]?.value }}
                        </span>

                        <div class="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                          <span
                            class="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[12px]"
                          >
                            <Icon name="lucide:package" class="h-3 w-3" />
                            <span class="font-medium">Qty:</span> {{ cartItem.quantity }}
                          </span>

                          <div
                            v-if="!variations[cartItem.variationID]?.price"
                            class="h-3 w-24 animate-pulse rounded bg-muted"
                          ></div>
                          <span
                            v-else
                            class="flex items-center gap-1 text-[10px] text-muted-foreground sm:text-[12px]"
                          >
                            <Icon name="lucide:tag" class="h-3 w-3" />
                            <span class="font-medium">Price:</span>
                            ₱{{
                              calculatePriceWithCommission(
                                Number(variations[cartItem.variationID]?.price)
                              ).toFixed(2)
                            }}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div
                      class="mt-2 flex w-full flex-row items-center justify-between gap-4 sm:mt-0 sm:w-auto sm:justify-end"
                    >
                      <div class="flex flex-col">
                        <span class="text-[10px] text-muted-foreground sm:text-[12px]"
                          >Subtotal:</span
                        >
                        <div
                          v-if="!variations[cartItem.variationID]?.price"
                          class="h-5 w-20 animate-pulse rounded bg-muted"
                        ></div>
                        <span v-else class="text-sm font-semibold text-primary sm:text-base">
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
                              size="sm"
                              class="rounded p-1.5 opacity-90 hover:opacity-100 sm:p-2"
                              @click="openRemoveDialog(cartItem)"
                            >
                              <Icon name="lucide:trash-2" class="mr-1 h-4 w-4" />
                              Remove
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
          <div v-else class="flex w-full flex-col items-center justify-center p-10 text-center">
            <Icon name="lucide:shopping-cart" class="mb-4 h-16 w-16 text-muted-foreground/30" />
            <h3 class="mb-1 text-lg font-medium">Your cart is empty</h3>
            <p class="mb-4 text-sm text-muted-foreground">
              Explore our products and add items to your cart
            </p>
            <UiButton to="/products" class="mt-2">
              <Icon name="lucide:shopping-bag" class="mr-2 h-4 w-4" />
              Browse Products
            </UiButton>
          </div>
        </div>
      </div>

      <div class="flex h-auto w-full flex-col sm:w-1/4">
        <div class="sticky top-20 rounded-lg border border-border/60 bg-card p-5 shadow-sm">
          <div class="flex flex-col space-y-4">
            <div class="flex flex-row items-center justify-between">
              <h3 class="text-lg font-semibold">Order Summary</h3>
              <Icon name="lucide:receipt" class="h-5 w-5 text-muted-foreground" />
            </div>

            <UiDivider />

            <div class="space-y-2">
              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Selected Items:</span>
                <span class="font-medium">{{ selectedItems.length }}</span>
              </div>

              <div class="flex justify-between text-sm">
                <span class="text-muted-foreground">Total Items in Cart:</span>
                <span class="font-medium">{{ userCart.length }}</span>
              </div>
            </div>

            <UiDivider />

            <div class="flex flex-col">
              <span class="text-sm text-muted-foreground">Total Amount:</span>
              <div class="flex items-baseline justify-between">
                <span class="text-2xl font-bold text-primary">₱{{ totalPrice.toFixed(2) }}</span>
                <span class="text-xs text-muted-foreground">Including taxes & fees</span>
              </div>
            </div>

            <UiDivider />

            <div class="space-y-2">
              <p class="text-xs text-muted-foreground">
                <Icon name="lucide:info" class="mr-1 inline h-3 w-3" />
                Select items from the same organization to proceed to checkout
              </p>

              <UiButton
                class="w-full"
                size="lg"
                :disabled="!hasSelectedItems"
                @click="dialog = true"
              >
                <Icon name="lucide:shopping-bag" class="mr-2 h-4 w-4" />
                Proceed to Checkout
              </UiButton>
            </div>
          </div>
          <!-- <div class="flex flex-row items-center gap-2 pt-2">
            <span class="text-md text-muted-foreground line-through">₱ 150.00</span>
            <span class="text-[12px] text-muted-foreground">(Membership Discount)</span>
          </div> -->
          <UiDivider class="mt-2" />
          <div class="w-full pt-4">
            <UiDialog v-model:open="dialog">
              <UiDialogTrigger> </UiDialogTrigger>
              <UiDialogContent
                :class="{ 'z-40': orderLoading }"
                :overlayClass="orderLoading ? 'z-40' : ''"
                class="max-h-[90vh] overflow-y-auto bg-card p-4 sm:max-h-[700px] sm:max-w-[725px] sm:p-8"
                title="Checkout Order"
                description="Please review your order details before proceeding to payment."
              >
                <template #content>
                  <div class="flex flex-col gap-6 py-2">
                    <!-- Order Summary Section -->
                    <div class="rounded-lg border border-border/40 bg-background/50 p-4">
                      <h3 class="flex items-center gap-2 text-lg font-semibold">
                        <Icon name="lucide:shopping-bag" class="h-4 w-4 text-primary" />
                        Order Summary
                      </h3>
                      <UiDivider class="my-3" />

                      <!-- Order Items -->
                      <div class="space-y-4">
                        <div
                          v-for="cartItem in selectedItems"
                          :key="cartItem.productID"
                          class="flex flex-col rounded-md border border-border/30 p-3 shadow-sm transition-all hover:border-primary/20 hover:bg-secondary/5 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
                        >
                          <div class="flex items-center gap-3">
                            <!-- Product Image -->
                            <div class="h-16 w-16 overflow-hidden rounded-md">
                              <img
                                :src="products[cartItem.productID]?.featuredPhotoURL"
                                :alt="products[cartItem.productID]?.name"
                                class="h-full w-full rounded-md object-cover"
                                onerror="this.onerror=null; this.src='/placeholder-image.png';"
                              />
                            </div>

                            <!-- Product Details -->
                            <div class="flex flex-col">
                              <span class="line-clamp-1 text-sm font-semibold sm:text-base">
                                {{ products[cartItem.productID]?.name }}
                              </span>

                              <!-- Pre-Order Badge -->
                              <div
                                v-if="cartItem.isPreOrder"
                                class="mt-1 inline-flex w-fit items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5"
                              >
                                <Icon name="lucide:clock" class="h-3 w-3 text-amber-600" />
                                <span class="text-[10px] font-medium text-amber-700"
                                  >Pre-Order</span
                                >
                              </div>

                              <!-- Variation -->
                              <span
                                v-if="variations[cartItem.variationID]?.value !== 'None'"
                                class="flex items-center gap-1 text-[12px] text-muted-foreground"
                              >
                                <Icon name="lucide:tag" class="h-3 w-3" />
                                {{ variations[cartItem.variationID]?.value }}
                              </span>

                              <!-- Quantity -->
                              <div class="mt-1 flex flex-wrap gap-2">
                                <span
                                  class="flex items-center gap-1 text-[12px] text-muted-foreground"
                                >
                                  <Icon name="lucide:package" class="h-3 w-3" />
                                  Qty: {{ cartItem.quantity }}
                                </span>

                                <!-- Price per Item -->
                                <span
                                  class="flex items-center gap-1 text-[12px] text-muted-foreground"
                                >
                                  <Icon name="lucide:coins" class="h-3 w-3" />
                                  ₱{{
                                    calculatePriceWithCommission(
                                      Number(variations[cartItem.variationID]?.price)
                                    ).toFixed(2)
                                  }}
                                  each
                                </span>
                              </div>
                            </div>
                          </div>

                          <!-- Subtotal -->
                          <div
                            class="mt-2 flex flex-row items-center justify-between sm:mt-0 sm:flex-col sm:items-end"
                          >
                            <span class="text-[12px] text-muted-foreground sm:mb-1">Subtotal:</span>
                            <span class="font-semibold text-primary">
                              ₱{{
                                (
                                  calculatePriceWithCommission(
                                    Number(variations[cartItem.variationID]?.price || 0)
                                  ) * cartItem.quantity
                                ).toFixed(2)
                              }}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <!-- Payment Method Section -->
                    <div class="rounded-lg border border-border/40 bg-background/50 p-4">
                      <h3 class="flex items-center gap-2 text-lg font-semibold">
                        <Icon name="lucide:credit-card" class="h-4 w-4 text-primary" />
                        Payment Method
                      </h3>
                      <UiDivider class="my-3" />

                      <div class="grid gap-3 px-2">
                        <!-- GCash Option (Disabled) -->
                        <label
                          class="flex cursor-not-allowed items-center gap-3 rounded-md border border-border/30 p-3 opacity-50 transition-colors"
                          title="Available soon"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="gcash"
                            class="h-4 w-4"
                            disabled
                          />
                          <div class="flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100"
                            >
                              <Icon name="lucide:smartphone" class="h-4 w-4 text-blue-600" />
                            </div>
                            <div class="flex flex-col">
                              <span class="text-sm font-medium">GCash</span>
                              <span class="text-[10px] text-muted-foreground">Coming soon</span>
                            </div>
                          </div>
                        </label>

                        <!-- Cash on Hand Option -->
                        <label
                          class="flex cursor-pointer items-center gap-3 rounded-md border border-border/30 p-3 transition-colors hover:border-primary/30 hover:bg-secondary/10"
                          :class="{
                            'border-primary bg-secondary/20':
                              selectedPaymentMethod === 'cash_on_hand',
                          }"
                        >
                          <input
                            type="radio"
                            name="paymentMethod"
                            value="cash_on_hand"
                            class="h-4 w-4 accent-primary"
                            v-model="selectedPaymentMethod"
                          />
                          <div class="flex items-center gap-2">
                            <div
                              class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100"
                            >
                              <Icon name="lucide:wallet" class="h-4 w-4 text-green-600" />
                            </div>
                            <div class="flex flex-col">
                              <span class="text-sm font-medium">Cash on Hand</span>
                              <span class="text-[10px] text-muted-foreground"
                                >Pay upon claiming</span
                              >
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    <!-- Order Total & Checkout -->
                    <div class="rounded-lg border border-border/40 bg-background/50 p-4">
                      <div class="flex flex-col space-y-3">
                        <!-- Summary -->
                        <div class="space-y-2">
                          <div class="flex justify-between text-sm">
                            <span class="text-muted-foreground">Items Total:</span>
                            <span>₱{{ totalPrice.toFixed(2) }}</span>
                          </div>
                          <UiDivider class="my-2" />
                          <div class="flex items-center justify-between">
                            <span class="font-semibold">Total:</span>
                            <span class="text-xl font-bold text-primary"
                              >₱{{ totalPrice.toFixed(2) }}</span
                            >
                          </div>
                        </div>

                        <!-- Submit Button -->
                        <UiButton
                          :disabled="!canSubmitOrder"
                          @click="handleCheckout()"
                          size="lg"
                          class="mt-2 w-full"
                        >
                          <Icon name="lucide:check-circle" class="mr-2 h-4 w-4" />
                          {{ canSubmitOrder ? "Place Order" : "Select Payment Method" }}
                        </UiButton>

                        <!-- Help Text -->
                        <p class="mt-2 text-center text-[11px] text-muted-foreground">
                          <Icon name="lucide:info" class="mr-1 inline h-3 w-3" />
                          By placing an order, you agree to our terms and conditions.
                        </p>
                      </div>
                    </div>
                  </div>
                </template>
              </UiDialogContent>
              <!-- <UiDialogFooter>
                <UiButton variant="outline" @click="dialog = false">Cancel</UiButton>
                <UiButton
                  variant="destructive"
                  :disabled="removeLoading"
                  @click="confirmRemoveCartItem"
                >
                  Confirm
                </UiButton>
              </UiDialogFooter> -->
            </UiDialog>
          </div>
        </div>
      </div>
    </div>
    <div
      v-if="removeLoading || orderLoading"
      class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm"
    >
      <div
        class="flex max-w-[85%] flex-col items-center justify-center gap-4 rounded-lg bg-card p-6 text-center shadow-lg"
      >
        <div class="relative">
          <div class="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon name="lucide:loader-circle" class="size-12 animate-spin text-primary" />
          </div>
        </div>
        <div>
          <h3 class="mb-1 text-lg font-semibold">Processing Your Request</h3>
          <p class="text-sm text-muted-foreground">
            {{ removeLoading ? "Removing item from cart..." : "Finalizing your order..." }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import { useCheckoutCart } from "~/composables/user/useCheckoutCart";
  import { useEmailOrder } from "~/composables/user/useEmailOrder";
  import { useFetchUserCart } from "~/composables/user/useFetchUserCart";
  import { collection, doc, getDoc } from "firebase/firestore";
  import type { Cart } from "~/types/models/Cart";
  import type { Product, Variation } from "~/types/models/Product";

  definePageMeta({
    middleware: "user-auth",
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
    // console.log("User cart updated:", userCart.value);
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

  // Add these at the top of your script section with the other refs
  const products = ref<Record<string, Product>>({});
  const variations = ref<Record<string, Variation>>({});
  const organizations = ref<Record<string, { id: string; name: string }>>({});

  // The loading states you already have
  const productLoadingStates = ref<Record<string, boolean>>({});
  const variationLoadingStates = ref<Record<string, boolean>>({});
  const organizationLoadingStates = ref<Record<string, boolean>>({});

  const fetchProductAndVariationDetails = async () => {
    // Set initial loading state
    loading.value = true;

    try {
      const fetchPromises = userCart.value.map(async (cartItem) => {
        // Track loading state separately from the model
        if (cartItem?.productID && !products.value[cartItem.productID]) {
          productLoadingStates.value[cartItem.productID] = true;

          try {
            const productDocRef = doc(collection(db, "products"), cartItem.productID);
            const productDoc = await getDoc(productDocRef);

            if (productDoc.exists()) {
              products.value[cartItem.productID] = productDoc.data() as Product;
            } else {
              products.value[cartItem.productID] = {
                name: "Product Not Found",
                featuredPhotoURL: "/placeholder-image.png",
              } as Product;
            }
          } catch (error) {
            console.error("Error fetching product:", error);
            products.value[cartItem.productID] = {
              name: "Error Loading Product",
              featuredPhotoURL: "/placeholder-image.png",
            } as Product;
          } finally {
            productLoadingStates.value[cartItem.productID] = false;
          }
        }

        // Similar approach for variations
        if (cartItem?.variationID && !variations.value[cartItem.variationID]) {
          variationLoadingStates.value[cartItem.variationID] = true;

          try {
            const variationDocRef = doc(
              collection(doc(db, "products", cartItem.productID), "variations"),
              cartItem.variationID
            );
            const variationDoc = await getDoc(variationDocRef);

            if (variationDoc.exists()) {
              variations.value[cartItem.variationID] = variationDoc.data() as Variation;
            } else {
              variations.value[cartItem.variationID] = {
                value: "Default",
                price: 0,
              } as Variation;
            }
          } catch (error) {
            console.error("Error fetching variation:", error);
            variations.value[cartItem.variationID] = {
              value: "Error Loading",
              price: 0,
            } as Variation;
          } finally {
            variationLoadingStates.value[cartItem.variationID] = false;
          }
        }

        // Organization fetching with loading state
        const product = products.value[cartItem.productID];
        if (product?.organizationID && !organizations.value[product.organizationID]) {
          organizationLoadingStates.value[product.organizationID] = true;
          organizations.value[product.organizationID] = { id: "", name: "Loading..." };

          try {
            const orgDocRef = doc(collection(db, "organizations"), product.organizationID);
            const orgDoc = await getDoc(orgDocRef);

            if (orgDoc.exists()) {
              organizations.value[product.organizationID] = {
                id: orgDoc.id,
                name: orgDoc.data().name || "Unknown Organization",
              };
            } else {
              organizations.value[product.organizationID] = {
                id: product.organizationID,
                name: "Organization Not Found",
              };
            }
          } catch (error) {
            console.error("Error fetching organization:", error);
            organizations.value[product.organizationID] = {
              id: product.organizationID,
              name: "Error Loading Organization",
            };
          } finally {
            organizationLoadingStates.value[product.organizationID] = false;
          }
        }
      });

      // Wait for all fetch operations to complete
      await Promise.all(fetchPromises);
    } catch (error) {
      console.error("Error in fetchProductAndVariationDetails:", error);
    } finally {
      loading.value = false;
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
      const organizationID = products.value[selectedItems.value[0].productID]?.organizationID;

      if (!commissionRate.value) {
        throw new Error("Commission rate not found");
      }
      const commissionRateID = commissionRate.value.id;
      const commissionRateValue = commissionRate.value.rate;

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
</script>
