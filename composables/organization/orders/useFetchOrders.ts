import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import type { Account } from "~/types/models/Account";
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

export const useFetchOrders = () => {
  const db = useFirestore();

  // Helper function to fetch product details
  const fetchProductDetails = async (productID: string): Promise<Product | null> => {
    const productRef = doc(db, "products", productID);
    const productDoc = await getDoc(productRef);
    return productDoc.exists() ? (productDoc.data() as Product) : null;
  };

  // Helper function to fetch variation details from the sub-collection of the product
  const fetchVariationDetails = async (
    productID: string,
    variationID: string
  ): Promise<Variation | null> => {
    const variationRef = doc(db, `products/${productID}/variations`, variationID);
    const variationDoc = await getDoc(variationRef);
    return variationDoc.exists() ? (variationDoc.data() as Variation) : null;
  };

  // Helper function to fetch order items for a given order ID
  const fetchOrderItems = async (orderID: string): Promise<ExtendedOrderItem[]> => {
    // console.log("Fetching order items for order: ", orderID);
    const orderItems: ExtendedOrderItem[] = [];
    try {
      const orderItemsRef = collection(db, `orders/${orderID}/orderItems`);
      const querySnapshot = await getDocs(orderItemsRef);
      // console.log("Total order items fetched: ", querySnapshot.docs.length);
      for (const doc of querySnapshot.docs) {
        const orderItem = doc.data() as OrderItem;
        // console.log("Processing order item: ", orderItem);
        const productDetails = await fetchProductDetails(orderItem.productID);
        // console.log("Product details fetched: ", productDetails);
        const variationDetails = await fetchVariationDetails(
          orderItem.productID,
          orderItem.variationID
        );
        // console.log("Variation details fetched: ", variationDetails);
        orderItems.push({
          ...orderItem,
          id: doc.id,
          productDetails,
          variationDetails,
        });
      }
    } catch (error) {
      console.error("Error fetching order items:", error);
    }
    return orderItems;
  };

  // Fetch products for the organization based on organizationID
  const fetchOrganizationProducts = async (
    organizationID: string
  ): Promise<(Product & { id: string })[]> => {
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
    return products;
  };

  // Fetch orders for a chosen product
  const fetchProductOrders = async (productID: string): Promise<ExtendedOrder[]> => {
    console.log("Fetching orders for product: ", productID);
    const orders: ExtendedOrder[] = [];
    try {
      const ordersRef = collection(db, "orders");
      const querySnapshot = await getDocs(ordersRef);
      // console.log("Total orders fetched: ", querySnapshot.docs.length);
      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        // console.log("Processing order: ", order);
        const orderItems = await fetchOrderItems(doc.id);
        // console.log("Order items fetched: ", orderItems);
        const filteredOrderItems = orderItems.filter((item) => item.productID === productID);
        // console.log(`Order ID: ${doc.id}, Filtered Order Items:`, filteredOrderItems);
        if (filteredOrderItems.length > 0) {
          orders.push({ ...order, id: doc.id, orderItems: filteredOrderItems });
        }
      }
    } catch (error) {
      console.error("Error fetching product orders:", error);
    }
    // console.log("Fetched Orders:", orders);
    return orders;
  };

  // Fetch orders for the organization
  const fetchOrganizationOrders = async (organizationID: string): Promise<ExtendedOrder[]> => {
    // console.log("Fetching orders for organization: ", organizationID);
    const orders: ExtendedOrder[] = [];
    try {
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("organizationID", "==", organizationID));
      const querySnapshot = await getDocs(q);
      // console.log("Total orders fetched: ", querySnapshot.docs.length);
      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        // console.log("Processing order: ", order);
        const orderItems = await fetchOrderItems(doc.id);
        // console.log("Order items fetched: ", orderItems);
        orders.push({ ...order, id: doc.id, orderItems });
      }
    } catch (error) {
      console.error("Error fetching organization orders:", error);
    }
    console.log("Fetched Orders:", orders);
    return orders;
  };

  const setOrderStatus = async (
    productID: string,
    orderStatus: "preparing" | "ready"
  ): Promise<void> => {
    // console.log(`Setting orders for product ${productID} to ${orderStatus}`);
    try {
      const orders = await fetchProductOrders(productID);
      for (const order of orders) {
        const orderRef = doc(db, `orders/${order.id}`);
        const orderDoc = await getDoc(orderRef);
        const currentStatus = orderDoc.data()?.orderStatus;

        if (currentStatus !== "claimed" && currentStatus !== "cancelled") {
          await updateDoc(orderRef, { orderStatus });
          console.log(`Order ${order.id} status set to ${orderStatus}`);
        } else {
          console.log(`Order ${order.id} status is ${currentStatus}, not updating`);
        }
      }
    } catch (error) {
      console.error("Error setting order status:", error);
    }
  };

  return {
    fetchOrganizationOrders,
    fetchOrganizationProducts,
    fetchProductOrders,
    fetchOrderItems,
    setOrderStatus,
  };
};
