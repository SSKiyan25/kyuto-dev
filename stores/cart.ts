import { defineStore } from "pinia";
import type { Cart } from "~/types/models/Cart";
import type { Product } from "~/types/models/Product";

interface CartState {
  items: (Cart & { id: string })[];
  count: number;
  loading: boolean;
  lastUpdated: number;
  productDetails: Record<string, { organizationID: string }>;
}

export const useCartStore = defineStore("cart", {
  state: (): CartState => ({
    items: [],
    count: 0,
    loading: false,
    lastUpdated: 0,
    productDetails: {}, // Cache for product details
  }),

  getters: {
    getCartItems: (state) => state.items,
    getCartCount: (state) => state.count,
    isLoading: (state) => state.loading,

    // Modified to use product details cache
    getCartItemsByOrganization: (state) => (organizationId: string) => {
      return state.items.filter((item) => {
        const productDetail = state.productDetails[item.productID];
        return productDetail && productDetail.organizationID === organizationId;
      });
    },
  },

  actions: {
    setLoading(status: boolean) {
      this.loading = status;
    },

    updateCartItems(items: (Cart & { id: string })[]) {
      this.items = items;
      this.count = items.length;
      this.lastUpdated = Date.now();
    },

    addCartItem(item: Cart & { id: string }) {
      // Check if item already exists
      const existingItemIndex = this.items.findIndex((i) => i.id === item.id);

      if (existingItemIndex >= 0) {
        // Update existing item
        this.items[existingItemIndex] = { ...item };
      } else {
        // Add new item
        this.items.push(item);
        this.count++;
      }
      this.lastUpdated = Date.now();
    },

    removeCartItem(itemId: string) {
      this.items = this.items.filter((item) => item.id !== itemId);
      this.count = this.items.length;
      this.lastUpdated = Date.now();
    },

    clearCart() {
      this.items = [];
      this.count = 0;
      this.lastUpdated = Date.now();
    },

    updateCartItemQuantity(itemId: string, quantity: number) {
      const itemIndex = this.items.findIndex((item) => item.id === itemId);
      if (itemIndex >= 0) {
        this.items[itemIndex].quantity = quantity;
        this.lastUpdated = Date.now();
      }
    },

    invalidateProductDetail(productId: string) {
      if (this.productDetails[productId]) {
        delete this.productDetails[productId];
      }
    },

    // New action to add product details to the cache
    addProductDetail(productId: string, organizationID: string) {
      this.productDetails[productId] = { organizationID };
    },
  },
});
