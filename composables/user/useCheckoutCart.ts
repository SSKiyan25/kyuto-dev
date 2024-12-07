import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Cart } from "~/types/models/Cart";
import type { Order, OrderItem } from "~/types/models/Order";
import type { Product, StocksLogs, Variation } from "~/types/models/Product";

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

  const createOrder = async (
    userID: string,
    organizationID: string,
    organizationName: string,
    totalPrice: number,
    paymentMethod: string,
    selectedItems: (Cart & { id: string })[]
  ) => {
    loading.value = true;
    let uniqRefNumber = "";
    try {
      // Generate unique reference number
      uniqRefNumber = await generateUniqueRefNumber();

      // Create order document
      const orderDocRef = await addDoc(collection(db, "orders"), {
        buyerID: userID,
        organizationID: organizationID,
        organizationName: organizationName,
        orderStatus: "pending",
        uniqRefNumber: uniqRefNumber,
        paymentMethod: paymentMethod,
        paymentStatus: "not_paid",
        remarks: "",
        totalPrice: totalPrice,
        isDiscounted: false,
        discountValue: 0,
        receivedDate: null,
        dateOrdered: Timestamp.now(),
        lastModified: Timestamp.now(),
        isArchived: false,
      });

      // Create order items
      for (const item of selectedItems) {
        const productDocRef = doc(db, `products/${item.productID}`);
        const productDoc = await getDoc(productDocRef);
        const productData = productDoc.data() as Product;

        const variationDocRef = doc(
          db,
          `products/${item.productID}/variations/${item.variationID}`
        );
        const variationDoc = await getDoc(variationDocRef);
        const variationData = variationDoc.data() as Variation;

        await addDoc(collection(orderDocRef, "orderItems"), {
          orderID: orderDocRef.id,
          productID: item.productID,
          isPreOrder: item.isPreOrder,
          isPackage: item.isPackage,
          packageID: item.packageID,
          variationID: item.variationID,
          variationName: variationData.value,
          quantity: item.quantity,
          price: variationData.price,
          discountedPrice: variationData.discountPrice || 0,
          totalPrice: variationData.price * item.quantity,
        });

        // Update variation data if not pre-order
        if (!item.isPreOrder) {
          await updateDoc(variationDocRef, {
            remainingStocks: variationData.remainingStocks - item.quantity,
            lastStockUpdate: Timestamp.now(),
          });

          // Log stock changes in the sub-collection of the variation
          await addDoc(collection(variationDocRef, "stocksLogs"), {
            variationID: item.variationID,
            quantity: item.quantity,
            action: "decrement",
            remarks: "ordered",
            dateCreated: Timestamp.now(),
          });
        }
        await updateDoc(variationDocRef, {
          pendingOrders: variationData.pendingOrders + item.quantity,
          lastModified: Timestamp.now(),
        });

        // Increment totalOrders in the product document based on the quantity
        await updateDoc(productDocRef, {
          totalOrders: (productData.totalOrders || 0) + item.quantity,
        });

        // Update cart item status to "done"
        const cartItemDocRef = doc(db, `accounts/${userID}/cart/${item.id}`);
        await updateDoc(cartItemDocRef, {
          status: "done",
        });
      }

      console.log("Order created successfully");
    } catch (error) {
      console.error("Error creating order:", error);
    } finally {
      loading.value = false;
    }
    return uniqRefNumber;
  };
  const generateUniqueRefNumber = async (): Promise<string> => {
    let isUnique = false;
    let uniqRefNumber = "";

    while (!isUnique) {
      uniqRefNumber = Math.random().toString(36).substr(2, 9).toUpperCase();
      const q = query(collection(db, "orders"), where("uniqRefNumber", "==", uniqRefNumber));
      const querySnapshot = await getDocs(q);
      if (querySnapshot.empty) {
        isUnique = true;
      }
    }

    return uniqRefNumber;
  };

  return {
    userCart,
    createOrder,
    removeCartItem,
    generateUniqueRefNumber,
    loading,
  };
};
