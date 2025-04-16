import { collection, getDocs, limit, query, where } from "firebase/firestore";

export const useProductSearch = () => {
  const db = useFirestore();

  const searchProducts = async (term: string) => {
    const cleanedTerm = term.trim().toLowerCase();

    if (!cleanedTerm) return [];

    const q = query(
      collection(db, "products"),
      where("searchKeywords", "array-contains", cleanedTerm),
      limit(10)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
  };

  return { searchProducts };
};
