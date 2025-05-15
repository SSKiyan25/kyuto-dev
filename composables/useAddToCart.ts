import { addDoc, collection, doc, getDocs, query, updateDoc, where } from "firebase/firestore";
import type { Cart } from "~/types/models/Cart";

export const useAddToCart = () => {
  const db = useFirestore();
  const loading = ref(false);
  const error = ref<string | null>(null);

  const addToCart = async (
    accountID: string,
    productID: string,
    variationID: string,
    quantity: number,
    isPreOrder: boolean
  ) => {
    error.value = null;

    // console.log("Adding to cart...");
    // console.log("accountID:", accountID);
    // console.log("productID:", productID);
    // console.log("variationID:", variationID);
    // console.log("quantity:", quantity);
    // console.log("isPreOrder:", isPreOrder);
    try {
      const cartCollection = collection(db, "accounts", accountID, "cart");
      const cartQuery = query(
        cartCollection,
        where("productID", "==", productID),
        where("variationID", "==", variationID),
        where("isPreOrder", "==", isPreOrder)
      );
      const cartSnapshot = await getDocs(cartQuery);

      if (!cartSnapshot.empty) {
        // Update existing cart item
        const cartDoc = cartSnapshot.docs[0];
        const cartData = cartDoc.data() as Cart;
        await updateDoc(cartDoc.ref, {
          quantity: cartData.quantity + quantity,
        });
      } else {
        // Add new cart item
        const newCartItem: Cart = {
          accountID,
          productID,
          variationID,
          isPreOrder,
          isPackage: false,
          packageID: "",
          quantity,
          status: "pending",
          dateCreated: new Date(),
        };
        await addDoc(cartCollection, newCartItem);
      }
    } catch (err) {
      error.value = "Failed to add to cart";
      console.error("Error adding to cart:", err);
    }
  };

  return {
    addToCart,
    loading,
    error,
  };
};
