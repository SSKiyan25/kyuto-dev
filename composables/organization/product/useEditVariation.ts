import { addDoc, collection, doc, getDoc, updateDoc, writeBatch } from "firebase/firestore";
import type { StocksLogs, Variation } from "~/types/models/Product";

export function useEditVariation() {
  const db = useFirestore();

  // Function to extract orgID from a product
  const getOrgIDFromProduct = async (productID: string): Promise<string | null> => {
    const productRef = doc(db, "products", productID);
    const productSnap = await getDoc(productRef);

    if (!productSnap.exists()) {
      console.error("Product not found");
      return null;
    }

    const productData = productSnap.data();
    return productData.organizationID || null;
  };

  const updateVariation = async (
    productID: string,
    variationID: string,
    updatedData: Partial<Variation>
  ) => {
    console.log("Product ID: ", productID);
    console.log("Variation ID: ", variationID);
    const variationRef = doc(db, "products", productID, "variations", variationID);
    console.log("Variation passed: ", updatedData);

    // Fetch the current variation data
    const variationSnap = await getDoc(variationRef);
    if (!variationSnap.exists()) {
      throw new Error("Variation not found");
    }

    // Update Firestore document
    await updateDoc(variationRef, {
      ...updatedData,
      lastModified: new Date(),
    });
  };

  const addStocks = async (
    productID: string,
    variationID: string,
    addedStocks: number,
    stocksLogs: StocksLogs[]
  ) => {
    const variationRef = doc(db, "products", productID, "variations", variationID);
    const variationSnap = await getDoc(variationRef);
    if (!variationSnap.exists()) {
      throw new Error("Variation not found");
    }

    const currentStocks = variationSnap.data().remainingStocks || 0;
    const totalStocks = variationSnap.data().totalStocks || 0;
    const updatedRemainingStocks = currentStocks + addedStocks;
    const updatedTotalStocks = totalStocks + addedStocks;

    await updateDoc(variationRef, {
      remainingStocks: updatedRemainingStocks,
      totalStocks: updatedTotalStocks,
      lastModified: new Date(),
    });

    const stocksLogsRef = collection(variationRef, "stocksLogs");
    const batch = writeBatch(db);
    stocksLogs.forEach((log) => {
      const logRef = doc(stocksLogsRef);
      batch.set(logRef, log);
    });
    await batch.commit();
  };

  const removeStocks = async (
    productID: string,
    variationID: string,
    removedStocks: number,
    stocksLogs: StocksLogs[]
  ) => {
    const variationRef = doc(db, "products", productID, "variations", variationID);
    const variationSnap = await getDoc(variationRef);
    if (!variationSnap.exists()) {
      throw new Error("Variation not found");
    }

    const currentStocks = variationSnap.data().remainingStocks || 0;
    if (removedStocks > currentStocks) {
      throw new Error("Cannot remove more stocks than available");
    }
    const updatedRemainingStocks = currentStocks - removedStocks;

    await updateDoc(variationRef, {
      remainingStocks: updatedRemainingStocks,
      lastModified: new Date(),
    });

    const stocksLogsRef = collection(variationRef, "stocksLogs");
    const batch = writeBatch(db);
    stocksLogs.forEach((log) => {
      const logRef = doc(stocksLogsRef);
      batch.set(logRef, log);
    });
    await batch.commit();
  };

  const addVariation = async (productID: string, newVariation: Partial<Variation>) => {
    const variationsRef = collection(db, "products", productID, "variations");
    const validVariation = {
      ...newVariation,
      lastModified: new Date(),
    };
    const variationDocRef = await addDoc(variationsRef, validVariation);
    console.log("Variation added: ", variationDocRef);

    const newStockLog: Partial<StocksLogs> = {
      variationID: variationDocRef.id,
      quantity: newVariation.totalStocks ?? 0,
      action: "Initial Stock",
      remarks: "Initial stock added",
      dateCreated: new Date(),
    };
    console.log("Stock log added: ", newStockLog);

    await addDoc(collection(variationDocRef, "stocksLogs"), newStockLog);
  };

  return { updateVariation, addStocks, removeStocks, addVariation, getOrgIDFromProduct };
}
