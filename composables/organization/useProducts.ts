import {
  collection,
  doc,
  limit as firestoreLimit,
  getDocs,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch,
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
  } else {
    productsQuery = query(productsQuery, where("isArchived", "==", false));
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

export async function archiveProduct(productId: string) {
  const db = useFirestore();
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isArchived: true, status: "Archived" });
}

export async function addDiscountToProduct(
  productId: string,
  discountType: string,
  discountTarget: string,
  discount?: number,
  discountCode?: string,
  customDiscountPrices?: { id: string; price: number }[]
) {
  const db = useFirestore();
  const productRef = doc(db, "products", productId);
  const variationsRef = collection(db, "products", productId, "variations");

  // Clear existing discount details
  const clearDiscountData: any = {
    isDiscounted: false,
    discountType: null,
    discountTarget: null,
    discountPercentageValue: null,
    discountCode: null,
    lastModified: new Date(),
  };

  await updateDoc(productRef, clearDiscountData);

  // Fetch and clear existing discount prices for variations
  const variationsSnapshot = await getDocs(variationsRef);
  const batch = writeBatch(db);

  variationsSnapshot.docs.forEach((variationDoc) => {
    const variationRef = variationDoc.ref;
    batch.update(variationRef, { discountPrice: null });
  });

  await batch.commit();

  // Update product with new discount details
  const productUpdateData: any = {
    isDiscounted: true,
    discountType: discountType,
    discountTarget: discountTarget,
    discountPercentageValue: discount ?? 0,
    lastModified: new Date(),
  };

  if (discountCode) {
    productUpdateData.discountCode = discountCode;
  }

  if (discountType === "percentage" && discount !== undefined) {
    productUpdateData.discountPercentageValue = discount;
  }

  await updateDoc(productRef, productUpdateData);

  // Fetch and update variations with new discount prices
  const newBatch = writeBatch(db);

  if (discountType === "custom" && customDiscountPrices) {
    customDiscountPrices.forEach(({ id, price }) => {
      const variationRef = doc(variationsRef, id);
      newBatch.update(variationRef, { discountPrice: price });
    });
  } else if (discountType === "percentage" && discount !== undefined) {
    variationsSnapshot.docs.forEach((variationDoc) => {
      const variationRef = variationDoc.ref;
      const variationData = variationDoc.data() as Variation;
      const discountPrice = variationData.price - (variationData.price * discount) / 100;

      newBatch.update(variationRef, { discountPrice });
    });
  }

  await newBatch.commit();
}

export async function fetchVariations(productId: string): Promise<(Variation & { id: string })[]> {
  const db = useFirestore();
  const variationsRef = collection(db, "products", productId, "variations");
  const variationsSnapshot = await getDocs(variationsRef);
  return variationsSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id }) as Variation & { id: string }
  );
}
