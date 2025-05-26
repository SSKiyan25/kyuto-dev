import { useOrderCacheStore } from "~/stores/orderCache";
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Account } from "~/types/models/Account";
import type { Order, OrderItem } from "~/types/models/Order";
import type { Product, Variation } from "~/types/models/Product";

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
      // console.log(`Force refreshing buyer details for ${buyerID}`);
      invalidateCache(cacheKey);
    }

    try {
      // Check cache first (unless force refresh)
      if (!forceRefresh) {
        const cachedBuyer = getCache<Account | null>(cacheKey);
        if (cachedBuyer !== null) {
          // console.log(`Using cached buyer details for ${buyerID}:`, cachedBuyer);
          return cachedBuyer;
        }
      }

      // Fetch from Firestore
      // console.log(`Fetching buyer details for ID: ${buyerID}`);
      const buyerRef = doc(db, "accounts", buyerID);
      const buyerDoc = await getDoc(buyerRef);

      if (!buyerDoc.exists()) {
        console.warn(`No buyer account found for ID: ${buyerID}`);
        // Don't cache null values anymore - this is causing our issue
        return undefined;
      }

      // Document exists, get the data
      const buyerData = buyerDoc.data();
      // console.log(`Found buyer data for ${buyerID}:`, buyerData);

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

    // console.log(`Direct fetch buyer details for ID: ${buyerID}`);
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

  // Function to mark order as ready or pending
  const markAsReady = async (orderID: string, currentStatus: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "ready" ? "pending" : "ready";
    await updateDoc(orderRef, { orderStatus: newStatus, lastModified: new Date() });

    // Invalidate caches after update
    invalidateOrderCache(orderID);

    // Also get the organization ID to invalidate org caches
    const orderDoc = await getDoc(orderRef);
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      invalidateOrganizationCache(orderData.organizationID);
    }
  };

  const markAsPaid = async (orderID: string, currentStatus: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "paid" ? "not_paid" : "paid";

    try {
      // Update the order's payment status
      await updateDoc(orderRef, { paymentStatus: newStatus, lastModified: new Date() });

      // Fetch the order document
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        console.error("Order document not found");
        return;
      }

      const orderData = orderDoc.data();
      const organizationID = orderData.organizationID;
      const commissionAmount = orderData.commissionAmount || 0;

      // Fetch the organization document
      const orgRef = doc(db, "organizations", organizationID);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) {
        console.error("Organization document not found");
        return;
      }

      const orgData = orgDoc.data();
      let newTotalDue = orgData.totalDue || 0;

      // Adjust the organization's totalDue based on the new payment status
      if (newStatus === "paid") {
        // Add the commission amount to totalDue
        newTotalDue += commissionAmount;
      } else {
        // Deduct the commission amount from totalDue
        newTotalDue -= commissionAmount;
      }

      newTotalDue = parseFloat(newTotalDue.toFixed(2));

      // Update the organization's financials
      await updateDoc(orgRef, {
        totalDue: newTotalDue,
        lastModified: new Date(),
      });

      // Invalidate caches after update
      invalidateOrderCache(orderID);
      invalidateOrganizationCache(organizationID);
    } catch (error) {
      console.error("Error updating payment status or organization financials:", error);
    }
  };

  // Function to mark order as claimed or pending
  const markAsClaimed = async (
    orderID: string,
    currentStatus: string,
    orderItems: ExtendedOrderItem[]
  ): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // Get the organization ID before updating
    const orderDoc = await getDoc(orderRef);
    let organizationID = "";
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      organizationID = orderData.organizationID;
    }

    await updateDoc(orderRef, {
      orderStatus: newStatus,
      lastModified: new Date(),
      receivedDate: new Date(),
    });

    if (newStatus === "completed") {
      for (const item of orderItems) {
        const variationRef = doc(db, `products/${item.productID}/variations`, item.variationID);
        const variationDoc = await getDoc(variationRef);
        if (variationDoc.exists()) {
          const variation = variationDoc.data() as Variation;
          const updatedVariationData: Partial<Variation> = {
            completedOrders: variation.completedOrders + item.quantity,
            lastStockUpdate: new Date(),
            lastModified: new Date(),
          };
          if (item.isPreOrder) {
            updatedVariationData.preOrderStocks = variation.preOrderStocks - item.quantity;
          } else {
            updatedVariationData.reservedStocks = variation.reservedStocks - item.quantity;
          }
          await updateDoc(variationRef, updatedVariationData);

          // Invalidate variation cache
          invalidateCache(CACHE_KEYS.VARIATION(item.productID, item.variationID));

          // Update the product's total sales
          const productRef = doc(db, "products", item.productID);
          const productDoc = await getDoc(productRef);
          if (productDoc.exists()) {
            const product = productDoc.data() as Product;
            const updatedProductData: Partial<Product> = {
              totalSales: product.totalSales + item.quantity,
              lastModified: new Date(),
            };
            await updateDoc(productRef, updatedProductData);

            // Invalidate product cache
            invalidateCache(CACHE_KEYS.PRODUCT(item.productID));
          }
        }
      }
    }

    // Invalidate caches after update
    invalidateOrderCache(orderID);
    if (organizationID) {
      invalidateOrganizationCache(organizationID);
    }
  };

  // Function to cancel order
  const cancelOrder = async (
    orderID: string,
    remarks: string,
    orderItems: ExtendedOrderItem[]
  ): Promise<void> => {
    if (!remarks) {
      throw new Error("Remarks is required to cancel an order.");
    }

    const orderRef = doc(db, "orders", orderID);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data();
    const organizationID = orderData.organizationID;
    const commissionAmount = orderData.commissionAmount || 0;

    // Update the order status to "cancelled"
    await updateDoc(orderRef, {
      orderStatus: "cancelled",
      remarks,
      lastModified: new Date(),
    });

    // If the order payment status is "paid", deduct the commission amount from totalDue
    if (orderData.paymentStatus === "paid") {
      const orgRef = doc(db, "organizations", organizationID);
      const orgDoc = await getDoc(orgRef);

      if (orgDoc.exists()) {
        const orgData = orgDoc.data();
        const newTotalDue = (orgData.totalDue || 0) - commissionAmount;

        await updateDoc(orgRef, {
          totalDue: newTotalDue,
          lastModified: new Date(),
        });
      } else {
        console.error("Organization document not found");
      }
    }

    // Update stock and logs for each order item
    for (const item of orderItems) {
      const variationRef = doc(db, `products/${item.productID}/variations`, item.variationID);
      const variationDoc = await getDoc(variationRef);
      if (variationDoc.exists()) {
        const variation = variationDoc.data() as Variation;
        const updatedData: Partial<Variation> = {
          cancelledOrders: variation.cancelledOrders + item.quantity,
          remainingStocks: variation.remainingStocks + item.quantity,
          lastStockUpdate: new Date(),
          lastModified: new Date(),
        };
        if (item.isPreOrder) {
          updatedData.preOrderStocks = variation.preOrderStocks - item.quantity;
        } else {
          updatedData.reservedStocks = variation.reservedStocks - item.quantity;
        }
        await updateDoc(variationRef, updatedData);

        // Invalidate variation cache
        invalidateCache(CACHE_KEYS.VARIATION(item.productID, item.variationID));

        // Update the stocks logs
        const stocksLogRef = collection(
          db,
          `products/${item.productID}/variations/${item.variationID}/stocksLogs`
        );
        await addDoc(stocksLogRef, {
          variationID: item.variationID,
          quantity: item.quantity,
          action: "cancelled",
          remarks: `Order ${orderID} cancelled`,
          dateCreated: new Date(),
        });
      }
    }

    // Invalidate caches after update
    invalidateOrderCache(orderID);
    invalidateOrganizationCache(organizationID);
  };

  // Get cache statistics for debugging - use the store's method
  const getCacheStats = () => {
    return cacheStore.getCacheStats();
  };

  // Clear all caches - use the store method if it exists, or provide one
  const clearAllCaches = () => {
    // Clear all caches by looping through all keys in the store
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
    invalidateOrderCache,
    invalidateOrganizationCache,
    clearBuyerCaches,
    fetchBuyerDirectly,
    getCacheStats,
    clearAllCaches,
  };
};
