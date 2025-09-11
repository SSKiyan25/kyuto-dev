import { addDoc, collection, doc, getDoc, updateDoc } from "firebase/firestore";
import type { ExtendedOrderItem } from "./useFetchFilterOrders";
import type { Order } from "~/types/models/Order";
import type { Product, Variation } from "~/types/models/Product";

export const useOrderStatusOperations = () => {
  const db = useFirestore();

  // Function to mark order as ready or pending
  const markAsReady = async (
    orderID: string,
    currentStatus: string,
    invalidateOrderCache: (orderId: string) => void,
    invalidateOrganizationCache: (orgId: string) => void
  ): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "ready" ? "pending" : "ready";
    const now = new Date();

    // Create the update object with status date
    const updateData: Partial<Order> = {
      orderStatus: newStatus,
      lastModified: now,
    };

    // Set the appropriate date field
    if (newStatus === "ready") {
      updateData.dateReady = now;
    } else {
      updateData.datePending = now;
    }

    // Add to status history
    const orderDoc = await getDoc(orderRef);
    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      const statusHistory = orderData.statusHistory || [];

      statusHistory.push({
        status: newStatus,
        date: now,
        previousStatus: currentStatus,
      });

      updateData.statusHistory = statusHistory;
    }

    await updateDoc(orderRef, updateData);

    // Invalidate caches after update
    invalidateOrderCache(orderID);

    // Also get the organization ID to invalidate org caches
    const updatedOrderDoc = await getDoc(orderRef);
    if (updatedOrderDoc.exists()) {
      const orderData = updatedOrderDoc.data() as Order;
      invalidateOrganizationCache(orderData.organizationID);
    }
  };

  // Function to mark order as paid or not paid
  const markAsPaid = async (
    orderID: string,
    currentStatus: string,
    invalidateOrderCache: (orderId: string) => void,
    invalidateOrganizationCache: (orgId: string) => void
  ): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "paid" ? "not_paid" : "paid";
    const now = new Date();

    try {
      // Create the update object
      const updateData: Partial<Order> = {
        paymentStatus: newStatus,
        lastModified: now,
      };

      // Set the date paid if status is changing to paid
      if (newStatus === "paid") {
        updateData.datePaid = now;
      }

      // Add to status history
      const orderDoc = await getDoc(orderRef);
      if (!orderDoc.exists()) {
        console.error("Order document not found");
        return;
      }

      const orderData = orderDoc.data() as Order;
      const statusHistory = orderData.statusHistory || [];

      statusHistory.push({
        status: `payment_${newStatus}`,
        date: now,
        previousStatus: `payment_${currentStatus}`,
      });

      updateData.statusHistory = statusHistory;

      // Update the order
      await updateDoc(orderRef, updateData);

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

  // Function to mark order as claimed (completed) or pending
  const markAsClaimed = async (
    orderID: string,
    currentStatus: string,
    orderItems: ExtendedOrderItem[],
    invalidateCache: (key: string) => void,
    invalidateOrderCache: (orderId: string) => void,
    invalidateOrganizationCache: (orgId: string) => void,
    CACHE_KEYS: any
  ): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const now = new Date();

    // Get the organization ID before updating
    const orderDoc = await getDoc(orderRef);
    let organizationID = "";
    let statusHistory: Array<{
      status: string;
      date: Date;
      previousStatus?: string;
      remarks?: string;
    }> = [];

    if (orderDoc.exists()) {
      const orderData = orderDoc.data() as Order;
      organizationID = orderData.organizationID;
      statusHistory = orderData.statusHistory || [];
    }

    // Create update data object
    const updateData: Partial<Order> = {
      orderStatus: newStatus,
      lastModified: now,
    };

    // Add date completed if status is changing to completed
    if (newStatus === "completed") {
      updateData.dateCompleted = now;
      updateData.receivedDate = now;
    } else {
      updateData.datePending = now;
    }

    // Add to status history
    statusHistory.push({
      status: newStatus,
      date: now,
      previousStatus: currentStatus,
    });

    updateData.statusHistory = statusHistory;

    // Update the order
    await updateDoc(orderRef, updateData);

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
    orderItems: ExtendedOrderItem[],
    invalidateCache: (key: string) => void,
    invalidateOrderCache: (orderId: string) => void,
    invalidateOrganizationCache: (orgId: string) => void,
    CACHE_KEYS: any
  ): Promise<void> => {
    if (!remarks) {
      throw new Error("Remarks is required to cancel an order.");
    }

    const orderRef = doc(db, "orders", orderID);
    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data() as Order;
    const organizationID = orderData.organizationID;
    const commissionAmount = orderData.commissionAmount || 0;
    const now = new Date();
    const statusHistory = orderData.statusHistory || [];

    // Add to status history
    statusHistory.push({
      status: "cancelled",
      date: now,
      previousStatus: orderData.orderStatus,
      remarks: remarks,
    });

    // Update the order status to "cancelled"
    await updateDoc(orderRef, {
      orderStatus: "cancelled",
      dateCancelled: now,
      remarks,
      lastModified: now,
      statusHistory: statusHistory,
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

  // Add a function to record refunds
  const markAsRefunded = async (
    orderID: string,
    remarks: string,
    invalidateOrderCache: (orderId: string) => void,
    invalidateOrganizationCache: (orgId: string) => void
  ): Promise<void> => {
    const orderRef = doc(db, "orders", orderID);
    const now = new Date();

    const orderDoc = await getDoc(orderRef);
    if (!orderDoc.exists()) {
      throw new Error("Order not found");
    }

    const orderData = orderDoc.data() as Order;
    const statusHistory = orderData.statusHistory || [];

    // Add to status history
    statusHistory.push({
      status: "refunded",
      date: now,
      previousStatus: orderData.paymentStatus,
      remarks: remarks,
    });

    // Update order
    await updateDoc(orderRef, {
      paymentStatus: "refunded",
      dateRefunded: now,
      lastModified: now,
      remarks: remarks ? `${orderData.remarks || ""} \nRefund: ${remarks}` : orderData.remarks,
      statusHistory: statusHistory,
    });

    // Invalidate caches
    invalidateOrderCache(orderID);
    invalidateOrganizationCache(orderData.organizationID);
  };

  // Function to get a formatted timeline of order status changes
  const getOrderTimeline = (order: Order): Array<{ status: string; date: Date; label: string }> => {
    const timeline = [];

    // Helper function to convert date to proper Date object
    const ensureDate = (date: any): Date => {
      if (!date) return new Date();

      // Handle Firestore Timestamp
      if (date && typeof date.toDate === "function") {
        return date.toDate();
      }

      // Handle if already a Date
      if (date instanceof Date) {
        return date;
      }

      // Handle string or number
      return new Date(date);
    };

    // Add all known status dates
    if (order.dateOrdered) {
      timeline.push({
        status: "ordered",
        date: ensureDate(order.dateOrdered),
        label: "Order Placed",
      });
    }

    if (order.datePending) {
      timeline.push({
        status: "pending",
        date: ensureDate(order.datePending),
        label: "Processing",
      });
    }

    if (order.dateReady) {
      timeline.push({
        status: "ready",
        date: ensureDate(order.dateReady),
        label: "Ready for Pickup/Delivery",
      });
    }

    if (order.datePaid) {
      timeline.push({
        status: "paid",
        date: ensureDate(order.datePaid),
        label: "Payment Completed",
      });
    }

    if (order.dateCompleted) {
      timeline.push({
        status: "completed",
        date: ensureDate(order.dateCompleted),
        label: "Order Completed",
      });
    }

    if (order.dateCancelled) {
      timeline.push({
        status: "cancelled",
        date: ensureDate(order.dateCancelled),
        label: "Order Cancelled",
      });
    }

    if (order.dateRefunded) {
      timeline.push({
        status: "refunded",
        date: ensureDate(order.dateRefunded),
        label: "Payment Refunded",
      });
    }

    // Sort by date
    return timeline.sort((a, b) => {
      try {
        return a.date.getTime() - b.date.getTime();
      } catch (error) {
        console.error("Error comparing dates:", error, a.date, b.date);
        return 0;
      }
    });
  };

  return {
    markAsReady,
    markAsPaid,
    markAsClaimed,
    cancelOrder,
    markAsRefunded,
    getOrderTimeline,
  };
};
