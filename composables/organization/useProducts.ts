import { user } from "firebase-functions/v1/auth";
import {
  collection,
  limit as firestoreLimit,
  getDocs,
  query,
  startAfter,
  where,
} from "firebase/firestore";
import type { Product, Variation } from "~/types/models/Product";

import { useFetchUser } from "../user/useFetchUser";

interface EnhancedProduct extends Product {
  id: string;
  price: number;
  stock: number;
}

export async function fetchProducts(
  limit: number,
  filterBy: string,
  category: string,
  lastVisible: any = null
) {
  const db = useFirestore();
  const { userData } = await useFetchUser();

  console.log("Organization ID in composable: ", userData.organizationID);
  let productsQuery = query(
    collection(db, "products"),
    where("organizationID", "==", userData.organizationID),
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

      const maxPrice = Math.max(...variations.map((v) => v.price));
      const totalStocks = variations.reduce((sum, v) => sum + v.remainingStocks, 0);

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
