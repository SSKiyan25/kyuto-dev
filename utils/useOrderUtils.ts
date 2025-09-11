import { Timestamp } from "firebase/firestore";
import type { ExtendedOrderItem } from "~/composables/organization/orders/useFetchFilterOrders";

export const useOrderUtils = () => {
  const computeSubtotal = (orderItems: ExtendedOrderItem[] | undefined): number => {
    if (!orderItems) return 0;
    return orderItems.reduce(
      (subtotal, item) => subtotal + item.priceWithCommission * item.quantity,
      0
    );
  };

  const formatDate = (timestamp: any, includeTime = false): string => {
    if (!timestamp) return "N/A";

    let date;
    if (timestamp?.toDate) {
      // Handle Firestore Timestamp
      date = timestamp.toDate();
    } else if (timestamp instanceof Date) {
      date = timestamp;
    } else {
      // Handle string or number
      date = new Date(timestamp);
    }

    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("en-US", options);
  };

  // Styling helper methods
  const getStatusClass = (status: string) => {
    let baseClass = "flex items-center rounded px-2 py-1 text-xs capitalize";
    if (status === "pending") return `${baseClass} bg-yellow-200 text-yellow-800`;
    if (status === "cancelled") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "completed") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "ready") return `${baseClass} bg-blue-200 text-blue-800`;
    if (status === "preparing") return `${baseClass} bg-purple-200 text-purple-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
  };

  const getPaymentClass = (status: string) => {
    let baseClass = "flex items-center rounded px-2 py-1 text-xs capitalize";
    if (status === "paid") return `${baseClass} bg-green-200 text-green-800`;
    if (status === "not_paid") return `${baseClass} bg-red-200 text-red-800`;
    if (status === "partial") return `${baseClass} bg-yellow-200 text-yellow-800`;
    return `${baseClass} bg-gray-200 text-gray-800`;
  };

  const getPaymentTextClass = (status: string) => {
    if (status === "paid") return "text-green-600";
    if (status === "not_paid") return "text-red-600";
    if (status === "partial") return "text-amber-600";
    return "";
  };

  return {
    computeSubtotal,
    formatDate,
    getStatusClass,
    getPaymentClass,
    getPaymentTextClass,
  };
};
