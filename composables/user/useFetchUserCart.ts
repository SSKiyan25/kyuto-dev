import { useCartStore } from "~/stores/cart";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import type { Cart } from "~/types/models/Cart";
import type { Product } from "~/types/models/Product";

export const useFetchUserCart = (userID: string) => {
  const db = useFirestore();
  const userCart = ref<(Cart & { id: string })[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const cartStore = useCartStore();
  let unsubscribe: (() => void) | null = null;

  // Helper function to fetch product details
  const fetchProductDetails = async (cartItems: (Cart & { id: string })[]) => {
    for (const item of cartItems) {
      try {
        // Check if we already have this product's details
        if (!cartStore.productDetails[item.productID]) {
          const productRef = doc(db, "products", item.productID);
          const productSnap = await getDoc(productRef);

          if (productSnap.exists()) {
            const productData = productSnap.data() as Product;
            cartStore.addProductDetail(item.productID, productData.organizationID);
          }
        }
      } catch (err) {
        console.error(`Error fetching details for product ${item.productID}:`, err);
      }
    }
  };

  const fetchUserCart = async () => {
    error.value = null;
    loading.value = true;
    cartStore.setLoading(true);

    try {
      const userDocRef = doc(db, "accounts", userID);
      const cartCollection = collection(userDocRef, "cart");

      // Create query for pending cart items
      const q = query(
        cartCollection,
        where("status", "==", "pending"),
        orderBy("dateCreated", "desc")
      );

      // First, get initial data
      const querySnapshot = await getDocs(q);
      const cartItems = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (Cart & { id: string })[];

      userCart.value = cartItems;
      cartStore.updateCartItems(cartItems);

      // Fetch product details for all cart items
      await fetchProductDetails(cartItems);

      // Then set up real-time listener
      if (unsubscribe) {
        unsubscribe();
      }

      unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const updatedItems = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as (Cart & { id: string })[];

          userCart.value = updatedItems;
          cartStore.updateCartItems(updatedItems);

          // Fetch product details for any new items
          await fetchProductDetails(updatedItems);
        },
        (err) => {
          console.error("Error in cart snapshot listener:", err);
          error.value = err.message;
        }
      );
    } catch (err: any) {
      error.value = err.message;
      console.error("Error fetching user cart:", err);
    } finally {
      loading.value = false;
      cartStore.setLoading(false);
    }
  };

  // Clean up listener on component unmount
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  return {
    userCart,
    loading,
    error,
    fetchUserCart,
  };
};
