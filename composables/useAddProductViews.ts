import { addDoc, collection, getDocs, query, serverTimestamp, where } from "firebase/firestore";
import { useCurrentUser } from "vuefire";

export interface ProductViews {
  productID: string;
  accountID: string;
  generatedAt: Date;
  dateString: string;
}

export const useAddProductViews = () => {
  const db = useFirestore();
  const user = useCurrentUser();

  const addView = async (productID: string) => {
    if (!user.value?.uid) {
      console.log("No user logged in. Skipping addView.");
      return;
    }

    const storageKey = `view-${productID}-${user.value.uid}`;
    const lastView = localStorage.getItem(storageKey);
    const now = new Date();
    console.log("Current time:", now);

    if (lastView) {
      const lastViewDate = new Date(lastView);
      const lastViewDateString = lastViewDate.toISOString().split("T")[0];
      const currentDateString = now.toISOString().split("T")[0];
      console.log("Last view date:", lastViewDateString, "Current date:", currentDateString);

      // Check if the last view was recorded on the same day
      if (lastViewDateString === currentDateString) {
        console.log("View already recorded for today. Skipping.");
        return;
      }
    }

    try {
      const dateString = now.toISOString().split("T")[0];
      const newView = {
        productID,
        accountID: user.value?.uid,
        generatedAt: serverTimestamp(),
        dateString,
      };
      await addDoc(collection(db, "productViews"), newView);

      localStorage.setItem(storageKey, now.toISOString());
      console.log("View recorded successfully and timestamp updated in localStorage.");
    } catch (error) {
      console.error("Error recording product view:", error);
    }
  };

  const countViews = async (productID: string): Promise<number> => {
    try {
      // console.log(`Counting views for productID: ${productID}`);
      const q = query(collection(db, "productViews"), where("productID", "==", productID));
      const querySnapshot = await getDocs(q);
      const viewCount = querySnapshot.size; // Number of documents matching the query
      // console.log(`Total views for productID ${productID}:`, viewCount);
      return viewCount;
    } catch (error) {
      console.error("Error counting product views:", error);
      return 0;
    }
  };

  return { addView, countViews };
};
