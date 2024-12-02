import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Order, OrderItem } from "~/types/models/Order";

export const useFetchOrders = () => {
  const db = useFirestore();

  // Helper function to fetch order items for a given order ID
  const fetchOrderItems = async (orderID: string): Promise<OrderItem[]> => {
    const orderItemsRef = collection(db, `orders/${orderID}/order-items`);
    const querySnapshot = await getDocs(orderItemsRef);
    const orderItems: OrderItem[] = [];
    querySnapshot.forEach((doc) => {
      orderItems.push(doc.data() as OrderItem);
    });
    return orderItems;
  };

  // 1. Fetch the user order according to the passed userID parameter
  const fetchUserOrders = async (
    userID: string
  ): Promise<(Order & { id: string; orderItems: OrderItem[] })[]> => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("buyerID", "==", userID));
    const querySnapshot = await getDocs(q);
    const orders: (Order & { id: string; orderItems: OrderItem[] })[] = [];
    for (const doc of querySnapshot.docs) {
      const order = doc.data() as Order;
      const orderItems = await fetchOrderItems(doc.id);
      orders.push({ ...order, id: doc.id, orderItems });
    }
    return orders;
  };

  // 2. Fetch the latest pending order for the user
  const fetchLatestOrder = async (
    userID: string
  ): Promise<(Order & { id: string; orderItems: OrderItem[] }) | null> => {
    const ordersRef = collection(db, "orders");
    const q = query(
      ordersRef,
      where("buyerID", "==", userID),
      orderBy("dateOrdered", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      const order = doc.data() as Order;
      const orderItems = await fetchOrderItems(doc.id);
      return { ...order, id: doc.id, orderItems };
    }
    return null;
  };

  // 3. Fetch orders for the user with filters for orderStatus, paymentStatus, and limit
  const fetchOrders = async (
    userID: string,
    orderStatus: string = "all",
    paymentStatus: string = "",
    limitNumber: number = 10
  ): Promise<(Order & { id: string; orderItems: OrderItem[] })[]> => {
    const ordersRef = collection(db, "orders");
    console.log("limitNumber:", limitNumber);
    let q = query(ordersRef, where("buyerID", "==", userID), limit(limitNumber));

    if (orderStatus !== "all") {
      q = query(q, where("orderStatus", "==", orderStatus));
    }

    if (paymentStatus !== "") {
      q = query(q, where("paymentStatus", "==", paymentStatus));
    }

    const querySnapshot = await getDocs(q);
    console.log("querySnapshot size:", querySnapshot.size);
    if (querySnapshot.empty) {
      console.log("No matching documents.");
    } else {
      querySnapshot.forEach((doc) => {
        console.log(doc.id, " => ", doc.data());
      });
    }

    const orders: (Order & { id: string; orderItems: OrderItem[] })[] = [];
    for (const doc of querySnapshot.docs) {
      const order = doc.data() as Order;
      const orderItems = await fetchOrderItems(doc.id);
      orders.push({ ...order, id: doc.id, orderItems });
    }
    return orders;
  };

  // 4. Cancel an order by changing its status and adding remarks
  const cancelOrder = async (orderID: string, remarks: string): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    await updateDoc(orderRef, {
      orderStatus: "Cancelled",
      remarks: remarks,
    });
  };

  return {
    fetchUserOrders,
    fetchLatestOrder,
    fetchOrders,
    cancelOrder,
  };
};
