import {
  collection,
  getCountFromServer,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import type { OrganizationAnalytics, ProductAnalytics } from "~/types/models/Analytics";
import type { OrderItem, OrderWithOrgName } from "~/types/models/Order";
import type { ProductWithId } from "~/types/models/Product";

const cache: Record<string, { data: any; expiry: number }> = {};

export const useOrganizationAnalytics = () => {
  const db = useFirestore();

  const setCache = (key: string, data: any, ttl: number) => {
    cache[key] = {
      data,
      expiry: Date.now() + ttl,
    };
  };

  const getCache = (key: string) => {
    const cached = cache[key];
    if (cached && cached.expiry > Date.now()) {
      console.log(`Cache hit for key: ${key}`);
      return cached.data;
    }
    console.log(`Cache miss for key: ${key}`);
    return null;
  };

  const getProductSales = async (organizationID: string) => {
    const cacheKey = `productSales:${organizationID}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;

    // Fetch products belonging to the organization
    const productsRef = collection(db, "products");
    const productsQuery = query(productsRef, where("organizationID", "==", organizationID));
    const productsSnapshot = await getDocs(productsQuery);

    const products: ProductWithId[] = [];
    productsSnapshot.forEach((doc) => {
      products.push({ ...(doc.data() as ProductWithId), id: doc.id });
    });

    if (products.length === 0) {
      setCache(cacheKey, {}, 3600 * 1000); // Cache for 1 hour
      return {};
    }

    const productMap = new Map(products.map((product) => [product.id, product]));

    // Fetch orders belonging to the organization
    const ordersRef = collection(db, "orders");
    const ordersQuery = query(ordersRef, where("organizationID", "==", organizationID));
    const ordersSnapshot = await getDocs(ordersQuery);

    const productSales: Record<
      string,
      {
        orderCount: number;
        totalQuantity: number;
        totalRevenue: number;
        name: string;
      }
    > = {};

    for (const orderDoc of ordersSnapshot.docs) {
      const order = orderDoc.data() as OrderWithOrgName;
      const orderID = orderDoc.id;

      // Fetch order items for each order
      const orderItemsRef = collection(db, `orders/${orderID}/orderItems`);
      const orderItemsSnapshot = await getDocs(orderItemsRef);

      orderItemsSnapshot.forEach((itemDoc) => {
        const item = itemDoc.data() as OrderItem;

        const product = productMap.get(item.productID);
        if (product) {
          if (!productSales[item.productID]) {
            productSales[item.productID] = {
              orderCount: 0,
              totalQuantity: 0,
              totalRevenue: 0,
              name: product.name ?? "Unknown Product",
            };
          }
          productSales[item.productID].orderCount += item.quantity;
          // Increment totalQuantity and totalRevenue only if paymentStatus is "paid"
          if (order.paymentStatus === "paid") {
            productSales[item.productID].totalQuantity += item.quantity;
            productSales[item.productID].totalRevenue += item.totalPrice;
          }
        }
      });
    }

    setCache(cacheKey, productSales, 3600 * 1000); // Cache for 1 hour
    return productSales;
  };

  const getOrderStats = async (organizationID: string) => {
    const cacheKey = `orderStats:${organizationID}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;
    console.log("Fetching order stats for organization ID:", organizationID);
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("organizationID", "==", organizationID));

    const snapshot = await getDocs(q);
    let totalRevenue = 0;
    const orderCount = snapshot.size;

    snapshot.forEach((doc) => {
      const order = doc.data() as OrderWithOrgName;
      console.log("Order:", order);
      totalRevenue += order.totalPrice || 0;
    });

    const result = { orderCount, totalRevenue };
    setCache(cacheKey, result, 3600 * 1000); // Cache for 1 hour
    return result;
  };

  const getProductViews = async (productIDs: string[]) => {
    const cacheKey = `productViews:${productIDs.join(",")}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;

    const viewsRef = collection(db, "productViews");
    const viewCounts: Record<string, number> = {};

    await Promise.all(
      productIDs.map(async (productID) => {
        const q = query(viewsRef, where("productID", "==", productID));
        const snapshot = await getCountFromServer(q);
        viewCounts[productID] = snapshot.data().count || 0;
      })
    );

    setCache(cacheKey, viewCounts, 3600 * 1000); // Cache for 1 hour
    return viewCounts;
  };

  const getOrganizationAnalytics = async (
    organizationID: string
  ): Promise<OrganizationAnalytics> => {
    console.log("Fetching organization analytics for ID:", organizationID);
    const cacheKey = `organizationAnalytics:${organizationID}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;

    const { orderCount, totalRevenue } = await getOrderStats(organizationID);
    const productSales = await getProductSales(organizationID);
    console.log("Product Sales:", productSales);

    const productIDs = Object.keys(productSales);
    if (productIDs.length === 0) {
      console.warn("No products found for the organization.");
    }
    console.log("Product IDs:", productIDs);

    const viewCounts = await getProductViews(productIDs);

    const popularProducts: ProductAnalytics[] = productIDs
      .map((productID) => ({
        productID,
        name: productSales[productID]?.name || "Unknown Product",
        viewCount: viewCounts[productID] || 0,
        orderCount: productSales[productID]?.orderCount || 0,
        totalQuantitySold: productSales[productID]?.totalQuantity || 0,
        totalRevenue: productSales[productID]?.totalRevenue || 0,
        conversionRate: (productSales[productID]?.orderCount || 0) / (viewCounts[productID] || 1),
      }))
      .sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate the total number of products viewed
    const totalProductsViewed = popularProducts.reduce(
      (sum, product) => sum + product.viewCount,
      0
    );

    const result = {
      totalOrders: orderCount,
      totalRevenue,
      totalProductsViewed,
      popularProducts: popularProducts.slice(0, 5),
    };

    setCache(cacheKey, result, 3600 * 1000); // Cache for 1 hour
    return result;
  };

  const getSalesOverTime = async (organizationID: string, timeRange: string) => {
    const cacheKey = `salesOverTime:${organizationID}:${timeRange}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;

    const ordersRef = collection(db, "orders");
    const now = new Date();

    const getUTCDate = (year: number, month: number, day: number) => {
      return new Date(Date.UTC(year, month, day));
    };

    let startDate: Date, endDate: Date;

    // Map timeRange to startDate
    switch (timeRange) {
      case "month": {
        const year = now.getUTCFullYear();
        const month = now.getUTCMonth();
        startDate = getUTCDate(year, month, 1);
        endDate = getUTCDate(year, month + 1, 0);
        endDate.setUTCHours(23, 59, 59, 999);
        break;
      }

      case "year": {
        const year = now.getUTCFullYear();
        startDate = getUTCDate(year, 0, 1); // January 1st
        endDate = getUTCDate(year + 1, 0, 0); // December 31st
        endDate.setUTCHours(23, 59, 59, 999);
        break;
      }

      case "30days":
        startDate = new Date(now);
        startDate.setUTCDate(now.getUTCDate() - 30);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);
        break;

      case "week":
        startDate = new Date(now);
        startDate.setUTCDate(now.getUTCDate() - 7);
        startDate.setUTCHours(0, 0, 0, 0);
        endDate = new Date(now);
        endDate.setUTCHours(23, 59, 59, 999);
        break;

      case "quarter": {
        const quarter = Math.floor(now.getUTCMonth() / 3);
        const year = now.getUTCFullYear();
        startDate = getUTCDate(year, quarter * 3, 1);
        endDate = getUTCDate(year, (quarter + 1) * 3, 0);
        endDate.setUTCHours(23, 59, 59, 999);
        break;
      }

      default:
        throw new Error(`Invalid time range: ${timeRange}`);
    }

    const q = query(
      ordersRef,
      where("organizationID", "==", organizationID),
      where("paymentStatus", "==", "paid"),
      where("dateOrdered", ">=", startDate),
      where("dateOrdered", "<=", endDate)
    );

    const snapshot = await getDocs(q);
    const dailyData: Record<string, { count: number; revenue: number }> = {};

    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split("T")[0];
      dailyData[dateStr] = { count: 0, revenue: 0 };
      current.setUTCDate(current.getUTCDate() + 1);
    }

    snapshot.forEach((doc) => {
      const order = doc.data() as OrderWithOrgName;
      if (order.dateOrdered) {
        const dateOrdered =
          order.dateOrdered instanceof Timestamp
            ? order.dateOrdered.toDate()
            : new Date(order.dateOrdered);

        // Convert to UTC date string
        const dateStr = dateOrdered.toISOString().split("T")[0];

        if (dailyData[dateStr]) {
          dailyData[dateStr].count += 1;
          dailyData[dateStr].revenue += order.totalPrice || 0;
        }
      }
    });

    const result = Object.entries(dailyData).map(([date, data]) => ({
      date,
      count: data.count,
      revenue: data.revenue,
    }));

    setCache(cacheKey, result, 3600 * 1000); // Cache for 1 hour
    return result;
  };

  const getComparisonForPreAndDirectOrders = async (organizationID: string) => {
    const cacheKey = `comparisonForPreAndDirectOrders:${organizationID}`;
    const cachedData = getCache(cacheKey);
    if (cachedData) return cachedData;

    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("organizationID", "==", organizationID));

    const snapshot = await getDocs(q);
    let preOrderCount = 0;
    let directOrderCount = 0;

    for (const doc of snapshot.docs) {
      const orderID = doc.id;

      // Fetch order items for each order
      const orderItemsRef = collection(db, `orders/${orderID}/orderItems`);
      const orderItemsSnapshot = await getDocs(orderItemsRef);

      orderItemsSnapshot.forEach((itemDoc) => {
        const item = itemDoc.data() as OrderItem;

        if (item.isPreOrder) {
          preOrderCount += item.quantity;
        } else {
          directOrderCount += item.quantity;
        }
      });
    }

    const result = {
      preOrderCount,
      directOrderCount,
    };

    setCache(cacheKey, result, 3600 * 1000); // Cache for 1 hour
    return result;
  };

  return {
    getProductSales,
    getProductViews,
    getOrganizationAnalytics,
    getComparisonForPreAndDirectOrders,
    getSalesOverTime,
  };
};
