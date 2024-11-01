import {
  collection,
  limit as firestoreLimit,
  getDocs,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import type { Product, Variation } from "~/types/models/Product";

interface EnhancedProduct extends Product {
  id: string;
  price: number;
  stock: number;
}

export async function fetchProducts(
  organizationID: string,
  limit: number,
  filterBy: string,
  category: string,
  lastVisible: any = null
) {
  const db = useFirestore();

  console.log("Organization ID in composable: ", organizationID);
  let productsQuery = query(
    collection(db, "products"),
    where("organizationID", "==", organizationID),
    firestoreLimit(limit)
  );

  if (filterBy !== "All") {
    productsQuery = query(productsQuery, where("status", "==", filterBy));
  }

  if (category !== "All") {
    productsQuery = query(productsQuery, where("category", "==", category));
  }

  if (lastVisible) {
    productsQuery = query(productsQuery, startAfter(lastVisible));
  }

  const productsSnapshot = await getDocs(productsQuery);
  const products = productsSnapshot.docs.map((doc) => {
    const product = doc.data() as Product;
    return { ...product, id: doc.id };
  });
  console.log("Products in composable: ", products);

  const enhancedProducts = await Promise.all(
    products.map(async (product) => {
      const variationsSnapshot = await getDocs(
        collection(db, "products", product.id, "variations")
      );
      const variations = variationsSnapshot.docs.map((doc) => doc.data() as Variation);

      const maxPrice = Math.max(...variations.map((v) => v.currentPrice));
      const totalStocks = variations.reduce((acc, v) => acc + v.stocks, 0);

      return {
        ...product,
        price: maxPrice,
        stock: totalStocks,
      } as EnhancedProduct;
    })
  );

  console.log("Enhanced Products in composable: ", enhancedProducts);
  return {
    products: enhancedProducts,
    lastVisible: productsSnapshot.docs[productsSnapshot.docs.length - 1],
  };
}
