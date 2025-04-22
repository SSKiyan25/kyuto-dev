import { collection, deleteDoc, getDocs, writeBatch } from "firebase/firestore";

export const useDeleteOrders = () => {
  const isLoading = ref(false);
  const error = ref<Error | null>(null);
  const db = useFirestore();

  const deleteOrderItems = async (orderId: string) => {
    try {
      const orderItemsRef = collection(db, `orders/${orderId}/orderItems`);
      const orderItemsSnapshot = await getDocs(orderItemsRef);

      const batch = writeBatch(db);

      // Delete all orderItems in the sub-collection
      orderItemsSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();
    } catch (err) {
      error.value = new Error("Failed to delete order items");
      throw error.value;
    }
  };

  const deleteAllOrders = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const ordersRef = collection(db, "orders");
      const ordersSnapshot = await getDocs(ordersRef);

      const deletePromises = ordersSnapshot.docs.map(async (doc) => {
        const orderId = doc.id;

        // 1. Delete all orderItems sub-collection
        await deleteOrderItems(orderId);

        // 2. Delete the main order document
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to delete all orders");
      throw error.value;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    deleteAllOrders,
  };
};
