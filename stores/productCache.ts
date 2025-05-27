import { defineStore } from "pinia";
import type { Product, Variation } from "~/types/models/Product";

// Use a separate interface for cached query results without the actual snapshot object
export interface CachedQueryResult {
  products: (Product & { id: string; price: number; stock: number })[];
  lastVisibleId?: string; // Store just the ID instead of the whole snapshot
  lastVisiblePath?: string; // Store the path if needed
}

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export const useProductCacheStore = defineStore("productCache", () => {
  const cache = ref<Record<string, CacheItem<any>>>({});

  // Cache durations in milliseconds
  const cacheDurations = {
    PRODUCTS_LIST: 5 * 60 * 1000, // 5 minutes for product lists
    PRODUCT_DETAIL: 15 * 60 * 1000, // 15 minutes for product details
    VARIATIONS: 15 * 60 * 1000, // 15 minutes for variations
  };

  // Cache keys
  const cacheKeys = {
    PRODUCTS_LIST: (
      orgId: string,
      filterBy: string,
      category: string,
      limit: number,
      page: number
    ) => `products_list_${orgId}_${filterBy}_${category}_${limit}_${page}_v1`,
    PRODUCT_DETAIL: (productId: string) => `product_detail_${productId}_v1`,
    VARIATIONS: (productId: string) => `variations_${productId}_v1`,
  };

  function getCache<T>(key: string): T | null {
    const item = cache.value[key];
    if (!item) return null;

    // Check if cache has expired
    if (Date.now() > item.expiry) {
      delete cache.value[key];
      return null;
    }

    return item.data as T;
  }

  function setCache<T>(key: string, data: T, duration: number): void {
    const now = Date.now();

    // Make sure the data is serializable by removing non-serializable parts
    const safeData = makeSerializable(data);

    cache.value[key] = {
      data: safeData,
      timestamp: now,
      expiry: now + duration,
    };
  }

  // Helper function to make data serializable
  function makeSerializable(data: any): any {
    if (data === null || data === undefined) return data;

    if (Array.isArray(data)) {
      return data.map((item) => makeSerializable(item));
    }

    if (typeof data === "object") {
      // Check if it's a Firebase document snapshot by looking for common methods
      if (data.data && typeof data.data === "function") {
        // It's likely a snapshot, so just extract the ID and path
        return {
          id: data.id,
          path: data.ref?.path,
        };
      }

      const result: Record<string, any> = {};

      // Only copy serializable properties
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          const value = data[key];

          // Skip functions
          if (typeof value === "function") continue;

          // Handle dates
          if (value instanceof Date) {
            result[key] = value.toISOString();
            continue;
          }

          // Handle other objects recursively
          result[key] = makeSerializable(value);
        }
      }

      return result;
    }

    // Return primitive values as is
    return data;
  }

  function invalidateCache(key: string): void {
    if (cache.value[key]) {
      delete cache.value[key];
    }
  }

  function invalidateProductsCache(orgId: string): void {
    // Clear all caches related to an organization's products
    const keysToInvalidate = Object.keys(cache.value).filter((key) =>
      key.includes(`products_list_${orgId}`)
    );

    keysToInvalidate.forEach((key) => delete cache.value[key]);
  }

  function invalidateProductCache(productId: string): void {
    // Clear specific product and its variations
    const keysToInvalidate = Object.keys(cache.value).filter(
      (key) =>
        key === cacheKeys.PRODUCT_DETAIL(productId) || key === cacheKeys.VARIATIONS(productId)
    );

    // Also clear any product list caches since they might contain this product
    const productListKeys = Object.keys(cache.value).filter((key) =>
      key.includes("products_list_")
    );

    [...keysToInvalidate, ...productListKeys].forEach((key) => delete cache.value[key]);
  }

  function getCacheStats() {
    const now = Date.now();
    const keys = Object.keys(cache.value);

    return {
      totalItems: keys.length,
      validItems: keys.filter((key) => cache.value[key].expiry > now).length,
      expiredItems: keys.filter((key) => cache.value[key].expiry <= now).length,
      keys: keys,
    };
  }

  return {
    cache,
    cacheDurations,
    cacheKeys,
    getCache,
    setCache,
    invalidateCache,
    invalidateProductsCache,
    invalidateProductCache,
    getCacheStats,
  };
});
