import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import type { Order, OrderItem } from "~/types/models/Order";
import type { Product, Variation } from "~/types/models/Product";

// Define a new type that extends OrderItem to include additional properties
export type ExtendedOrderItem = OrderItem & {
  productDetails?: Product | null;
  variationDetails?: Variation | null;
};

// Define a new type that extends Order to include additional properties
export type ExtendedOrder = Order & {
  id: string;
  orderItems: ExtendedOrderItem[];
  buyerEmail?: string;
};

export const useFetchFilterOrders = () => {
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
    const orderItemsRef = collection(db, `orders/${orderID}/orderItems`);
    const querySnapshot = await getDocs(orderItemsRef);
    const orderItems: ExtendedOrderItem[] = [];
    for (const doc of querySnapshot.docs) {
      const orderItem = doc.data() as OrderItem;
      const productDetails = await fetchProductDetails(orderItem.productID);
      const variationDetails = await fetchVariationDetails(
        orderItem.productID,
        orderItem.variationID
      );
      orderItems.push({
        ...orderItem,
        productDetails,
        variationDetails,
      });
    }
    return orderItems;
  };

  // Helper function to fetch buyer email
  const fetchBuyerEmail = async (buyerID: string): Promise<string | undefined> => {
    const buyerRef = doc(db, "accounts", buyerID);
    const buyerDoc = await getDoc(buyerRef);
    return buyerDoc.exists() ? (buyerDoc.data().email as string) : undefined;
  };

  // Fetch orders for the organization with filters
  const fetchFilteredOrders = async (
    organizationID: string,
    orderStatus: string = "all"
  ): Promise<ExtendedOrder[]> => {
    console.log("Fetching filtered orders for organization: ", organizationID);
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
      console.log("Total orders fetched: ", querySnapshot.docs.length);
      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        console.log("Processing order: ", order);
        const orderItems = await fetchOrderItems(doc.id);
        console.log("Order items fetched: ", orderItems);
        const buyerEmail = await fetchBuyerEmail(order.buyerID);
        orders.push({ ...order, id: doc.id, orderItems, buyerEmail });
      }
      return orders;
    } catch (error) {
      console.error("Error fetching filtered orders:", error);
      return [];
    }
  };

  return {
    fetchFilteredOrders,
  };
};
