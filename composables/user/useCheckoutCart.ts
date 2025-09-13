import { useCartStore } from "~/stores/cart";
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
import type { Product, Variation } from "~/types/models/Product";

export const useCheckoutCart = () => {
  const db = useFirestore();
  const loading = ref(false);
  const cartStore = useCartStore();

  const removeCartItem = async (userID: string, cartItemID: string) => {
    loading.value = true;
    try {
      const cartItemDocRef = doc(db, `accounts/${userID}/cart/${cartItemID}`);
      await deleteDoc(cartItemDocRef);

      // Update store - no need to filter manually as onSnapshot will update
      cartStore.removeCartItem(cartItemID);

      console.log(`Cart item ${cartItemID} removed successfully`);
    } catch (error) {
      console.error("Error removing cart item:", error);
    } finally {
      setTimeout(() => {
        loading.value = false;
      }, 1000);
    }
  };

  const createOrder = async (
    userID: string,
    organizationID: string,
    totalPrice: number,
    paymentMethod: string,
    selectedItems: (Cart & { id: string })[],
    comissionRateID: string,
    comissionRate: number
  ) => {
    loading.value = true;
    let uniqRefNumber = "";

    try {
      // Generate unique reference number
      uniqRefNumber = await generateUniqueRefNumber();

      for (const item of selectedItems) {
        if (!cartStore.productDetails[item.productID]) {
          // Fetch product details if not in cache
          const productRef = doc(db, `products/${item.productID}`);
          const productDoc = await getDoc(productRef);
          if (productDoc.exists()) {
            const productData = productDoc.data() as Product;
            cartStore.addProductDetail(item.productID, productData.organizationID);
          }
        }
      }

      const comissionAmount = await selectedItems.reduce(async (totalPromise, item) => {
        const total = await totalPromise;

        const variationDocRef = doc(
          db,
          `products/${item.productID}/variations/${item.variationID}`
        );
        const variationDoc = await getDoc(variationDocRef);
        const variationData = variationDoc.data() as Variation;

        const basePrice = variationData.price || 0;
        const priceWithCommission = parseFloat((basePrice * (1 + comissionRate / 100)).toFixed(2));

        return parseFloat((total + (priceWithCommission - basePrice) * item.quantity).toFixed(2));
      }, Promise.resolve(0));

      // Create order document
      const orderDocRef = await addDoc(collection(db, "orders"), {
        buyerID: userID,
        organizationID: organizationID,
        orderStatus: "pending",
        uniqRefNumber: uniqRefNumber,
        paymentMethod: paymentMethod,
        paymentStatus: "not_paid",
        commissionRateID: comissionRateID,
        commissionAmount: comissionAmount,
        remarks: "",
        totalPrice: parseFloat(totalPrice.toFixed(2)),
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

        const basePrice = variationData.price || 0;
        const priceWithCommission = parseFloat((basePrice * (1 + comissionRate / 100)).toFixed(2));

        await addDoc(collection(orderDocRef, "orderItems"), {
          orderID: orderDocRef.id,
          productID: item.productID,
          isPreOrder: item.isPreOrder,
          isPackage: item.isPackage,
          packageID: item.packageID,
          variationID: item.variationID,
          variationName: variationData.value,
          quantity: item.quantity,
          origPrice: parseFloat(basePrice.toFixed(2)),
          discountedPrice: parseFloat((variationData.discountPrice || 0).toFixed(2)),
          priceWithCommission: priceWithCommission,
          comissionRateID: comissionRateID,
          totalPrice: parseFloat((priceWithCommission * item.quantity).toFixed(2)),
        });

        // Update variation data if not pre-order
        if (!item.isPreOrder) {
          await updateDoc(variationDocRef, {
            remainingStocks: variationData.remainingStocks - item.quantity,
            lastStockUpdate: Timestamp.now(),
          });

          await updateDoc(variationDocRef, {
            reservedStocks: variationData.reservedStocks + item.quantity,
            lastModified: Timestamp.now(),
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

        if (item.isPreOrder) {
          await updateDoc(variationDocRef, {
            preOrderStocks: variationData.preOrderStocks + item.quantity,
            lastModified: Timestamp.now(),
          });
        }

        // Increment totalOrders in the product document based on the quantity
        await updateDoc(productDocRef, {
          totalOrders: (productData.totalOrders || 0) + 1,
        });

        // Remove cart item from user's cart
        await removeCartItem(userID, item.id);
      }
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
    createOrder,
    removeCartItem,
    generateUniqueRefNumber,
    loading,
  };
};
