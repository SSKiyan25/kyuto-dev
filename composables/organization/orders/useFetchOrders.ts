import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import type { Order, OrderItem } from "~/types/models/Order";
import type { Product, Variation } from "~/types/models/Product";

// Define a new type that extends OrderItem to include additional properties
export type ExtendedOrderItem = OrderItem & {
  id: string;
  productDetails?: Product | null;
  variationDetails?: Variation | null;
};

// Define a new type that extends Order to include additional properties
export type ExtendedOrder = Order & {
  id: string;
  orderItems: ExtendedOrderItem[];
};

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number; // Time in milliseconds when this cache item expires
}

export const useFetchOrders = () => {
  const db = useFirestore();

  // Cache duration in milliseconds (default: 5 minutes)
  const CACHE_DURATION = 5 * 60 * 1000;

  // Cache keys
  const CACHE_KEYS = {
    PRODUCT: (productId: string) => `product_${productId}_details`,
    VARIATION: (productId: string, variationId: string) =>
      `variation_${productId}_${variationId}_details`,
    ORDER_ITEMS: (orderId: string) => `order_items_${orderId}_details`,
    PRODUCT_ORDERS: (productId: string) => `product_orders_${productId}_details`,
    ORG_PRODUCTS: (orgId: string) => `org_products_${orgId}_details`,
    ORG_ORDERS: (orgId: string) => `org_orders_${orgId}_details`,
  };

  // In-memory cache
  const cache = reactive<Record<string, CacheItem<any>>>({});

  // Cache management functions
  const getCache = <T>(key: string): T | null => {
    const item = cache[key];
    if (!item) return null;

    // Check if cache has expired
    if (Date.now() > item.expiry) {
      delete cache[key];
      return null;
    }

    return item.data as T;
  };

  const setCache = <T>(key: string, data: T, duration = CACHE_DURATION): void => {
    const now = Date.now();
    cache[key] = {
      data,
      timestamp: now,
      expiry: now + duration,
    };
  };

  const invalidateCache = (key: string): void => {
    if (cache[key]) {
      delete cache[key];
    }
  };

  const invalidateOrgCache = (orgId: string): void => {
    // Clear all caches related to an organization
    const keysToInvalidate = Object.keys(cache).filter(
      (key) =>
        key.includes(`org_${orgId}`) || key.startsWith("product_") || key.startsWith("order_")
    );

    keysToInvalidate.forEach((key) => delete cache[key]);
  };

  const invalidateProductCache = (productId: string): void => {
    // Clear caches related to a specific product
    const keysToInvalidate = Object.keys(cache).filter(
      (key) => key.includes(`product_${productId}`) || key.startsWith("order_")
    );

    keysToInvalidate.forEach((key) => delete cache[key]);
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
      setCache(cacheKey, product);
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
      setCache(cacheKey, variation);
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

      setCache(cacheKey, orderItems);
    } catch (error) {
      console.error("Error fetching order items:", error);
    }

    return orderItems;
  };

  // Fetch products for the organization based on organizationID
  const fetchOrganizationProducts = async (
    organizationID: string
  ): Promise<(Product & { id: string })[]> => {
    const cacheKey = CACHE_KEYS.ORG_PRODUCTS(organizationID);
    const cachedProducts = getCache<(Product & { id: string })[]>(cacheKey);

    if (cachedProducts !== null) {
      return cachedProducts;
    }

    const productsRef = collection(db, "products");
    const q = query(productsRef, where("organizationID", "==", organizationID));
    const querySnapshot = await getDocs(q);
    const products: (Product & { id: string })[] = querySnapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        }) as Product & { id: string }
    );

    setCache(cacheKey, products);
    return products;
  };

  // Fetch orders for a chosen product
  const fetchProductOrders = async (
    productID: string,
    forceRefresh = false
  ): Promise<ExtendedOrder[]> => {
    const cacheKey = CACHE_KEYS.PRODUCT_ORDERS(productID);
    if (!forceRefresh) {
      const cachedOrders = getCache<ExtendedOrder[]>(cacheKey);
      if (cachedOrders !== null) {
        return cachedOrders;
      }
    } else {
      invalidateProductCache(productID);
    }

    const orders: ExtendedOrder[] = [];
    try {
      const ordersRef = collection(db, "orders");
      const querySnapshot = await getDocs(ordersRef);

      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        const orderItems = await fetchOrderItems(doc.id);
        const filteredOrderItems = orderItems.filter((item) => item.productID === productID);

        if (filteredOrderItems.length > 0) {
          orders.push({ ...order, id: doc.id, orderItems: filteredOrderItems });
        }
      }

      setCache(cacheKey, orders);
    } catch (error) {
      console.error("Error fetching product orders:", error);
    }

    return orders;
  };

  // Fetch orders for the organization
  const fetchOrganizationOrders = async (
    organizationID: string,
    forceRefresh = false
  ): Promise<ExtendedOrder[]> => {
    const cacheKey = CACHE_KEYS.ORG_ORDERS(organizationID);
    if (!forceRefresh) {
      const cachedOrders = getCache<ExtendedOrder[]>(cacheKey);
      if (cachedOrders !== null) {
        return cachedOrders;
      }
    } else {
      invalidateOrgCache(organizationID);
    }

    const orders: ExtendedOrder[] = [];
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("organizationID", "==", organizationID));
      const querySnapshot = await getDocs(q);

      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        const orderItems = await fetchOrderItems(doc.id);
        orders.push({ ...order, id: doc.id, orderItems });
      }

      setCache(cacheKey, orders);
    } catch (error) {
      console.error("Error fetching organization orders:", error);
    }

    return orders;
  };

  // Update order status and invalidate relevant caches
  const setOrderStatus = async (
    productID: string,
    orderStatus: "preparing" | "ready"
  ): Promise<void> => {
    try {
      const orders = await fetchProductOrders(productID, true); // Force fresh data
      for (const order of orders) {
        const orderRef = doc(db, `orders/${order.id}`);
        const orderDoc = await getDoc(orderRef);
        const currentStatus = orderDoc.data()?.orderStatus;

        if (currentStatus !== "claimed" && currentStatus !== "cancelled") {
          await updateDoc(orderRef, { orderStatus });

          // Invalidate caches for this order
          invalidateCache(CACHE_KEYS.ORDER_ITEMS(order.id));
        }
      }

      // Invalidate product orders cache after updating statuses
      invalidateCache(CACHE_KEYS.PRODUCT_ORDERS(productID));

      // Also invalidate organization orders cache if we can get the orgID
      if (orders.length > 0 && orders[0].organizationID) {
        invalidateCache(CACHE_KEYS.ORG_ORDERS(orders[0].organizationID));
      }
    } catch (error) {
      console.error("Error setting order status:", error);
    }
  };

  // Get cache statistics for debugging
  const getCacheStats = () => {
    const now = Date.now();
    const keys = Object.keys(cache);

    return {
      totalItems: keys.length,
      validItems: keys.filter((key) => cache[key].expiry > now).length,
      expiredItems: keys.filter((key) => cache[key].expiry <= now).length,
      keys: keys,
    };
  };

  // Clear all caches
  const clearAllCaches = () => {
    Object.keys(cache).forEach((key) => delete cache[key]);
  };

  return {
    fetchOrganizationOrders,
    fetchOrganizationProducts,
    fetchProductOrders,
    fetchOrderItems,
    setOrderStatus,
    invalidateOrgCache,
    invalidateProductCache,
    getCacheStats,
    clearAllCaches,
  };
};
