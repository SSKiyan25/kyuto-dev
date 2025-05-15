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

  // Helper function to fetch buyer account details
  const fetchBuyerAccountDetails = async (buyerID: string): Promise<Account | undefined> => {
    const buyerRef = doc(db, "accounts", buyerID);
    const buyerDoc = await getDoc(buyerRef);
    return buyerDoc.exists() ? (buyerDoc.data() as Account) : undefined;
  };

  // Helper function to fetch order details
  const fetchOrderDetails = async (orderID: string): Promise<ExtendedOrder | null> => {
    const orderRef = doc(db, "orders", orderID);
    const orderDoc = await getDoc(orderRef);
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      const buyerAccountDetails = await fetchBuyerAccountDetails(orderData.buyerID);
      const orderItems = await fetchOrderItems(orderID);
      return { ...orderData, id: orderDoc.id, orderItems, buyerAccountDetails };
    }
    return null;
  };

  // Fetch orders for the organization with filters
  const fetchFilteredOrders: (
    organizationID: string,
    orderStatus?: string
  ) => Promise<ExtendedOrder[]> = async (
    organizationID: string,
    orderStatus: string = "all"
  ): Promise<ExtendedOrder[]> => {
    // console.log("Fetching filtered orders for organization: ", organizationID);
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
      // console.log("Total orders fetched: ", querySnapshot.docs.length);
      for (const doc of querySnapshot.docs) {
        const order = doc.data() as Order;
        // console.log("Processing order: ", order);
        const orderItems = await fetchOrderItems(doc.id);
        // console.log("Order items fetched: ", orderItems);
        const buyerAccountDetails = await fetchBuyerAccountDetails(order.buyerID);
        orders.push({ ...order, id: doc.id, orderItems, buyerAccountDetails });
      }
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
          }
        }
      }
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
  };

  return {
    fetchFilteredOrders,
    fetchOrderDetails,
    markAsReady,
    markAsPaid,
    markAsClaimed,
    cancelOrder,
  };
};
