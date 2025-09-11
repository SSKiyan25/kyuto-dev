import { useOrderCacheStore } from "~/stores/orderCache";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import type { Account } from "~/types/models/Account";
import type { Order, OrderItem } from "~/types/models/Order";
import type { Product, Variation } from "~/types/models/Product";

import { useOrderStatusOperations } from "./useOrderStatusOperations";

// Define a new type that extends OrderItem to include additional properties
export type ExtendedOrderItem = OrderItem & {
  id?: string;
  productDetails?: Product | null;
  variationDetails?: Variation | null;
};

// Define a new type that extends Order to include additional properties
export type ExtendedOrder = Order & {
  id: string;
  orderItems: ExtendedOrderItem[];
  buyerEmail?: string;
  buyerAccountDetails?: Account;
};

export const useFetchFilterOrders = () => {
  const db = useFirestore();
  const cacheStore = useOrderCacheStore();

  // Get the status operations
  const statusOperations = useOrderStatusOperations();

  // Use the durations and keys from the store
  const CACHE_DURATIONS = cacheStore.cacheDurations;
  const CACHE_KEYS = cacheStore.cacheKeys;

  // Cache management functions now use the store
  const getCache = <T>(key: string): T | null => {
    return cacheStore.getCache<T>(key);
  };

  const setCache = <T>(key: string, data: T, duration: number): void => {
    cacheStore.setCache(key, data, duration);
  };

  const invalidateCache = (key: string): void => {
    cacheStore.invalidateCache(key);
  };

  const invalidateOrderCache = (orderId: string): void => {
    cacheStore.invalidateOrderCache(orderId);
  };

  const invalidateOrganizationCache = (orgId: string): void => {
    cacheStore.invalidateOrganizationCache(orgId);
  };

  const clearBuyerCaches = () => {
    cacheStore.clearBuyerCaches();
  };

  // Helper function to fetch product details
  const fetchProductDetails = async (productID: string): Promise<Product | null> => {
    const cacheKey = CACHE_KEYS.PRODUCT(productID);
    const cachedProduct = getCache<Product | null>(cacheKey);

    if (cachedProduct !== null) {
      return cachedProduct;
    }

    const productRef = doc(db, "products", productID);
    const productDoc = await getDoc(productRef);
    const product = productDoc.exists() ? (productDoc.data() as Product) : null;

    if (product) {
      setCache(cacheKey, product, CACHE_DURATIONS.PRODUCT);
    }

    return product;
  };

  // Helper function to fetch variation details from the sub-collection of the product
  const fetchVariationDetails = async (
    productID: string,
    variationID: string
  ): Promise<Variation | null> => {
    const cacheKey = CACHE_KEYS.VARIATION(productID, variationID);
    const cachedVariation = getCache<Variation | null>(cacheKey);

    if (cachedVariation !== null) {
      return cachedVariation;
    }

    const variationRef = doc(db, `products/${productID}/variations`, variationID);
    const variationDoc = await getDoc(variationRef);
    const variation = variationDoc.exists() ? (variationDoc.data() as Variation) : null;

    if (variation) {
      setCache(cacheKey, variation, CACHE_DURATIONS.VARIATION);
    }

    return variation;
  };

  // Helper function to fetch order items for a given order ID
  const fetchOrderItems = async (orderID: string): Promise<ExtendedOrderItem[]> => {
    const cacheKey = CACHE_KEYS.ORDER_ITEMS(orderID);
    const cachedOrderItems = getCache<ExtendedOrderItem[]>(cacheKey);

    if (cachedOrderItems !== null) {
      return cachedOrderItems;
    }

    const orderItems: ExtendedOrderItem[] = [];
    try {
      const orderItemsRef = collection(db, `orders/${orderID}/orderItems`);
      const querySnapshot = await getDocs(orderItemsRef);

      for (const doc of querySnapshot.docs) {
        const orderItem = doc.data() as OrderItem;
        const productDetails = await fetchProductDetails(orderItem.productID);
        const variationDetails = await fetchVariationDetails(
          orderItem.productID,
          orderItem.variationID
        );

        orderItems.push({
          ...orderItem,
          id: doc.id,
          productDetails,
          variationDetails,
        });
      }

      setCache(cacheKey, orderItems, CACHE_DURATIONS.ORDERS);
    } catch (error) {
      console.error("Error fetching order items:", error);
    }

    return orderItems;
  };

  // Helper function to fetch buyer account details
  const fetchBuyerAccountDetails = async (
    buyerID: string,
    forceRefresh = false
  ): Promise<Account | undefined> => {
    if (!buyerID) {
      console.warn("No buyerID provided to fetchBuyerAccountDetails");
      return undefined;
    }

    const cacheKey = CACHE_KEYS.BUYER(buyerID);

    // Force refresh will skip the cache completely
    if (forceRefresh) {
      invalidateCache(cacheKey);
    }

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedBuyer = getCache<Account | null>(cacheKey);
        if (cachedBuyer !== null) {
          return cachedBuyer;
        }
      }

      // Fetch from Firestore
      const buyerRef = doc(db, "accounts", buyerID);
      const buyerDoc = await getDoc(buyerRef);

      if (!buyerDoc.exists()) {
        console.warn(`No buyer account found for ID: ${buyerID}`);
        // Don't cache null values anymore - this is causing our issue
        return undefined;
      }

      // Document exists, get the data
      const buyerData = buyerDoc.data();

      // Ensure we have all required fields for an Account
      const buyer = {
        id: buyerID, // Make sure the ID is included
        ...buyerData,
      } as Account;

      // Cache the result
      setCache(cacheKey, buyer, CACHE_DURATIONS.BUYER);
      return buyer;
    } catch (error) {
      console.error(`Error fetching buyer account for ID: ${buyerID}`, error);
      return undefined;
    }
  };

  // Add a direct fetch function that bypasses cache
  const fetchBuyerDirectly = async (buyerID: string): Promise<Account | undefined> => {
    if (!buyerID) return undefined;

    try {
      const buyerRef = doc(db, "accounts", buyerID);
      const buyerDoc = await getDoc(buyerRef);

      if (!buyerDoc.exists()) {
        console.warn(`No buyer account found for ID: ${buyerID}`);
        return undefined;
      }

      const buyerData = buyerDoc.data();
      return {
        id: buyerID,
        ...buyerData,
      } as Account;
    } catch (error) {
      console.error(`Error direct fetching buyer: ${error}`);
      return undefined;
    }
  };

  // Helper function to fetch order details
  const fetchOrderDetails = async (
    orderID: string,
    forceRefresh = false
  ): Promise<ExtendedOrder | null> => {
    const cacheKey = CACHE_KEYS.ORDER_DETAILS(orderID);

    if (!forceRefresh) {
      const cachedOrder = getCache<ExtendedOrder | null>(cacheKey);
      if (cachedOrder !== null) {
        return cachedOrder;
      }
    } else {
      invalidateCache(cacheKey);
    }

    const orderRef = doc(db, "orders", orderID);
    const orderDoc = await getDoc(orderRef);
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;

      // Invalidate order items cache if force refresh
      if (forceRefresh) {
        invalidateCache(CACHE_KEYS.ORDER_ITEMS(orderID));
      }

      const buyerAccountDetails = await fetchBuyerAccountDetails(orderData.buyerID);
      const orderItems = await fetchOrderItems(orderID);

      const extendedOrder = {
        ...orderData,
        id: orderDoc.id,
        orderItems,
        buyerAccountDetails,
      };

      setCache(cacheKey, extendedOrder, CACHE_DURATIONS.ORDERS);
      return extendedOrder;
    }

    return null;
  };

  // Fetch orders for the organization with filters
  const fetchFilteredOrders = async (
    organizationID: string,
    orderStatus: string = "all",
    forceRefresh = false,
    refreshBuyers = false
  ): Promise<ExtendedOrder[]> => {
    const cacheKey = CACHE_KEYS.FILTERED_ORDERS(organizationID, orderStatus);

    if (!forceRefresh) {
      const cachedOrders = getCache<ExtendedOrder[]>(cacheKey);
      if (cachedOrders !== null) {
        return cachedOrders;
      }
    } else {
      invalidateCache(cacheKey);
    }

    if (refreshBuyers) {
      clearBuyerCaches();
    }

    const orders: ExtendedOrder[] = [];
    try {
      const ordersRef = collection(db, "orders");
      let q = query(
        ordersRef,
        where("organizationID", "==", organizationID),
        orderBy("dateOrdered", "desc")
      );

      if (orderStatus !== "all") {
        q = query(q, where("orderStatus", "==", orderStatus));
      }

      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        const orderItemsKey = CACHE_KEYS.ORDER_ITEMS(doc.id);

        // Clear order items cache if force refresh
        if (forceRefresh) {
          invalidateCache(orderItemsKey);
        }

        const orderItems = await fetchOrderItems(doc.id);
        const buyerAccountDetails = await fetchBuyerAccountDetails(order.buyerID, refreshBuyers);

        orders.push({
          ...order,
          id: doc.id,
          orderItems,
          buyerAccountDetails,
        });
      }

      setCache(cacheKey, orders, CACHE_DURATIONS.ORDERS);
      return orders;
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
      return [];
    }
  };

  // Wrapper for markAsReady to pass the necessary dependencies
  const markAsReady = async (orderID: string, currentStatus: string): Promise<void> => {
    return statusOperations.markAsReady(
      orderID,
      currentStatus,
      invalidateOrderCache,
      invalidateOrganizationCache
    );
  };

  // Wrapper for markAsPaid to pass the necessary dependencies
  const markAsPaid = async (orderID: string, currentStatus: string): Promise<void> => {
    return statusOperations.markAsPaid(
      orderID,
      currentStatus,
      invalidateOrderCache,
      invalidateOrganizationCache
    );
  };

  // Wrapper for markAsClaimed to pass the necessary dependencies
  const markAsClaimed = async (
    orderID: string,
    currentStatus: string,
    orderItems: ExtendedOrderItem[]
  ): Promise<void> => {
    return statusOperations.markAsClaimed(
      orderID,
      currentStatus,
      orderItems,
      invalidateCache,
      invalidateOrderCache,
      invalidateOrganizationCache,
      CACHE_KEYS
    );
  };

  // Wrapper for cancelOrder to pass the necessary dependencies
  const cancelOrder = async (
    orderID: string,
    remarks: string,
    orderItems: ExtendedOrderItem[]
  ): Promise<void> => {
    return statusOperations.cancelOrder(
      orderID,
      remarks,
      orderItems,
      invalidateCache,
      invalidateOrderCache,
      invalidateOrganizationCache,
      CACHE_KEYS
    );
  };

  // Wrapper for markAsRefunded to pass the necessary dependencies
  const markAsRefunded = async (orderID: string, remarks: string): Promise<void> => {
    return statusOperations.markAsRefunded(
      orderID,
      remarks,
      invalidateOrderCache,
      invalidateOrganizationCache
    );
  };

  // Get order timeline wrapper
  const getOrderTimeline = (order: Order) => {
    return statusOperations.getOrderTimeline(order);
  };

  // Get cache statistics for debugging
  const getCacheStats = () => {
    return cacheStore.getCacheStats();
  };

  // Clear all caches
  const clearAllCaches = () => {
    const stats = cacheStore.getCacheStats();
    stats.keys.forEach((key) => cacheStore.invalidateCache(key));
  };

  return {
    fetchFilteredOrders,
    fetchOrderDetails,
    markAsReady,
    markAsPaid,
    markAsClaimed,
    cancelOrder,
    markAsRefunded, // New function
    getOrderTimeline, // New function
    invalidateOrderCache,
    invalidateOrganizationCache,
    clearBuyerCaches,
    fetchBuyerDirectly,
    getCacheStats,
    clearAllCaches,
  };
};
