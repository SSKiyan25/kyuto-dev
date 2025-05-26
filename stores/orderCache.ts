// stores/orderCache.ts
import { defineStore } from "pinia";
import type { Account } from "~/types/models/Account";
import type { Product, Variation } from "~/types/models/Product";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export const useOrderCacheStore = defineStore("orderCache", {
  state: () => ({
    cache: {} as Record<string, CacheItem<any>>,

    // Cache durations in milliseconds
    cacheDurations: {
      ORDERS: 15 * 60 * 1000, // 15 minutes for orders
      PRODUCT: 30 * 60 * 1000, // 30 minutes for products
      VARIATION: 30 * 60 * 1000, // 30 minutes for variations
      BUYER: 30 * 60 * 1000, // 30 minutes for buyer details
    },

    // Cache keys
    cacheKeys: {
      PRODUCT: (productId: string) => `product_details_${productId}_v1`,
      VARIATION: (productId: string, variationId: string) =>
        `variation_details_${productId}_${variationId}_v1`,
      ORDER_ITEMS: (orderId: string) => `order_items_${orderId}`,
      FILTERED_ORDERS: (orgId: string, status: string) => `filtered_orders_${orgId}_${status}_v1`,
      ORDER_DETAILS: (orderId: string) => `order_details_${orderId}_v1`,
      BUYER: (buyerId: string) => `buyer_details_${buyerId}_v1`,
    },
  }),

  actions: {
    getCache<T>(key: string): T | null {
      const item = this.cache[key];
      if (!item) return null;

      // Check if cache has expired
      if (Date.now() > item.expiry) {
        delete this.cache[key];
        return null;
      }

      return item.data as T;
    },

    setCache<T>(key: string, data: T, duration: number): void {
      const now = Date.now();
      this.cache[key] = {
        data,
        timestamp: now,
        expiry: now + duration,
      };
    },

    invalidateCache(key: string): void {
      if (this.cache[key]) {
        delete this.cache[key];
      }
    },

    invalidateOrderCache(orderId: string): void {
      // Clear all caches related to an order
      const keysToInvalidate = Object.keys(this.cache).filter(
        (key) => key.includes(`order_${orderId}`) || key.startsWith("filtered_orders_")
      );

      keysToInvalidate.forEach((key) => delete this.cache[key]);
    },

    invalidateOrganizationCache(orgId: string): void {
      // Clear all caches related to an organization's orders
      const keysToInvalidate = Object.keys(this.cache).filter((key) =>
        key.includes(`filtered_orders_${orgId}`)
      );

      keysToInvalidate.forEach((key) => delete this.cache[key]);
    },

    clearBuyerCaches(): void {
      console.log("Clearing all buyer caches");
      const buyerCacheKeys = Object.keys(this.cache).filter((key) =>
        key.includes("buyer_details_")
      );
      buyerCacheKeys.forEach((key) => delete this.cache[key]);
      console.log(`Cleared ${buyerCacheKeys.length} buyer cache entries`);
    },

    getCacheStats() {
      const now = Date.now();
      const keys = Object.keys(this.cache);

      return {
        totalItems: keys.length,
        validItems: keys.filter((key) => this.cache[key].expiry > now).length,
        expiredItems: keys.filter((key) => this.cache[key].expiry <= now).length,
        keys: keys,
      };
    },
  },
});
