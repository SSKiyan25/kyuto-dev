import { deleteDoc, doc } from "firebase/firestore";
import type { Cart } from "~/types/models/Cart";

export const useCheckoutCart = () => {
  const db = useFirestore();
  const userCart = ref<(Cart & { id: string })[]>([]);
  const loading = ref(false);

  const removeCartItem = async (userID: string, cartItemID: string) => {
    loading.value = true;
    console.log(`Removing cart item in composable ${cartItemID}...`);
    console.log(`User ID: ${userID}`);
    try {
      const cartItemDocRef = doc(db, `accounts/${userID}/cart/${cartItemID}`);
      await deleteDoc(cartItemDocRef);
      userCart.value = userCart.value.filter((item) => item.id !== cartItemID);
      console.log(`Cart item ${cartItemID} removed successfully`);
    } catch (error) {
      console.error("Error removing cart item:", error);
    } finally {
      setTimeout(() => {
        loading.value = false;
        console.log(`Cart item ${cartItemID} removed successfully`);
      }, 2000);
    }
  };

  return {
    userCart,
    removeCartItem,
    loading,
  };
};
