import { collection, getDocs, query, where } from "firebase/firestore";
import type { Order } from "~/types/models/Order";

export const useTrackCommission = () => {
  const db = useFirestore();

  const trackCommission = async (organizationID: string) => {
    console.log("Tracking commission for organization ID:", organizationID);
    try {
      // Query orders for the given organization ID
      const ordersRef = collection(db, "orders");
      const q = query(
        ordersRef,
        where("organizationID", "==", organizationID),
        where("paymentStatus", "==", "paid")
      );

      const querySnapshot = await getDocs(q);
      console.log("Query snapshot:", querySnapshot);

      // Initialize totals
      let paidCommission = 0;
      let unpaidCommission = 0;

      // Process each order
      querySnapshot.forEach((doc) => {
        const order = doc.data() as Order;
        console.log("Processing order:", order);
        if (order.commissionStatus === "paid") {
          paidCommission += order.commissionAmount;
          console.log("Paid commission:", paidCommission);
        } else if (order.commissionStatus === "not_paid") {
          unpaidCommission += order.commissionAmount;
          console.log("Unpaid commission:", unpaidCommission);
        }
      });

      return {
        paidCommission: parseFloat(paidCommission.toFixed(2)),
        unpaidCommission: parseFloat(unpaidCommission.toFixed(2)),
      };
    } catch (error) {
      console.error("Error tracking commission:", error);
      return {
        paidCommission: 0,
        unpaidCommission: 0,
      };
    }
  };

  return {
    trackCommission,
  };
};
