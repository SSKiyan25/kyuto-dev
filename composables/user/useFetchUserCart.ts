import { collection, doc, getDocs, orderBy, query, where } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { Cart } from "~/types/models/Cart";

export const useFetchUserCart = (userID: string) => {
  const db = useFirestore();
  const userCart = ref<Cart[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUserCart = async () => {
    console.log("Fetching user cart...");
    error.value = null;
    try {
      const userDocRef = doc(db, "accounts", userID);
      const cartCollection = collection(userDocRef, "cart");
      const q = query(
        cartCollection,
        where("status", "==", "pending"),
        orderBy("dateCreated", "desc")
      );
      const querySnapshot = await getDocs(q);
      userCart.value = querySnapshot.docs.map((doc) => doc.data() as Cart);
      console.log("User cart in composable: ", userCart.value);
    } catch (err: any) {
      error.value = err.message;
      console.log("Error fetching user cart:", err);
    }
  };

  return {
    userCart,
    loading,
    error,
    fetchUserCart,
  };
};
