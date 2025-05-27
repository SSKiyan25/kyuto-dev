import {
  collection,
  doc,
  limit as firestoreLimit,
  getDoc,
  getDocs,
  query,
  startAfter,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import type { CachedQueryResult } from "~/stores/productCache";
import type { Product, Variation } from "~/types/models/Product";
import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

interface EnhancedProduct extends Product {
  id: string;
  price: number;
  stock: number;
}

// Define a safe result type that can be properly serialized
export interface SafeProductsResult {
  products: EnhancedProduct[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  lastVisibleId?: string;
  lastVisiblePath?: string;
}

export async function fetchProducts(
  limit: number,
  filterBy: string,
  category: string,
  lastVisible: any = null,
  organizationId: string,
  page: number = 0,
  useCache: boolean = true
): Promise<SafeProductsResult> {
  // Use the product cache store
  const productCache = useProductCacheStore();

  // Create a cache key for this specific query
  const cacheKey = productCache.cacheKeys.PRODUCTS_LIST(
    organizationId,
    filterBy,
    category,
    limit,
    page
  );

  // Check if we have cached data and should use it
  if (useCache) {
    const cachedData = productCache.getCache<CachedQueryResult>(cacheKey);
    if (cachedData) {
      // If we need to use lastVisible from cache, we need to get the actual document
      let lastVisibleDoc = null;
      if (cachedData.lastVisibleId && cachedData.lastVisiblePath) {
        // Only try to get the lastVisible document if we're paginating and need it
        if (page > 0 && lastVisible === null) {
          const db = useFirestore();
          try {
            const docRef = doc(db, cachedData.lastVisiblePath);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
              lastVisibleDoc = docSnap;
            }
          } catch (e) {
            console.error("Error retrieving lastVisible document:", e);
          }
        }
      }

      return {
        products: cachedData.products,
        lastVisible: lastVisibleDoc,
        lastVisibleId: cachedData.lastVisibleId,
        lastVisiblePath: cachedData.lastVisiblePath,
      };
    }
  }

  // If no cache or not using cache, fetch from Firestore
  const db = useFirestore();

  let productsQuery = query(
    collection(db, "products"),
    where("organizationID", "==", organizationId),
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

  const enhancedProducts = await Promise.all(
    products.map(async (product) => {
      // Check for cached variations
      const variationsCacheKey = productCache.cacheKeys.VARIATIONS(product.id);
      let variations: (Variation & { id: string })[] | null = null;

      if (useCache) {
        variations = productCache.getCache<(Variation & { id: string })[]>(variationsCacheKey);
      }

      if (!variations) {
        const variationsSnapshot = await getDocs(
          collection(db, "products", product.id, "variations")
        );
        variations = variationsSnapshot.docs.map(
          (doc) => ({ ...doc.data(), id: doc.id }) as Variation & { id: string }
        );

        // Cache the variations
        productCache.setCache(
          variationsCacheKey,
          variations,
          productCache.cacheDurations.VARIATIONS
        );
      }

      // Handle the case where there are no variations
      const prices = variations.map((v) => v.price || 0);
      const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
      const totalStocks = variations.reduce((sum, v) => sum + (v.remainingStocks || 0), 0);

      return {
        ...product,
        price: maxPrice,
        stock: totalStocks,
      } as EnhancedProduct;
    })
  );

  // Get the last visible document
  const lastDoc = productsSnapshot.docs[productsSnapshot.docs.length - 1];

  // Create a serialization-safe result for caching
  const cacheResult: CachedQueryResult = {
    products: enhancedProducts,
  };

  // Only store ID and path from the lastVisible document
  if (lastDoc) {
    cacheResult.lastVisibleId = lastDoc.id;
    cacheResult.lastVisiblePath = lastDoc.ref.path;
  }

  // Cache the serialization-safe result
  productCache.setCache(cacheKey, cacheResult, productCache.cacheDurations.PRODUCTS_LIST);

  // Return the full result for current use
  return {
    products: enhancedProducts,
    lastVisible: lastDoc,
    lastVisibleId: lastDoc?.id,
    lastVisiblePath: lastDoc?.ref.path,
  };
}

export async function archiveProduct(productId: string) {
  const db = useFirestore();
  const productRef = doc(db, "products", productId);
  await updateDoc(productRef, { isArchived: true, status: "Archived" });

  // Invalidate cache for this product
  const productCache = useProductCacheStore();
  productCache.invalidateProductCache(productId);
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

      newBatch.update(variationRef, { discountPrice: parseFloat(discountPrice.toFixed(2)) });
    });
  }

  await newBatch.commit();

  // Invalidate cache for this product and its variations
  const productCache = useProductCacheStore();
  productCache.invalidateProductCache(productId);
}

export async function fetchVariations(
  productId: string,
  useCache: boolean = true
): Promise<(Variation & { id: string })[]> {
  // Use the product cache store
  const productCache = useProductCacheStore();

  // Create a cache key for variations
  const cacheKey = productCache.cacheKeys.VARIATIONS(productId);

  // Check if we have cached data and should use it
  if (useCache) {
    const cachedData = productCache.getCache<(Variation & { id: string })[]>(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  // If no cache or not using cache, fetch from Firestore
  const db = useFirestore();
  const variationsRef = collection(db, "products", productId, "variations");
  const variationsSnapshot = await getDocs(variationsRef);
  const variations = variationsSnapshot.docs.map(
    (doc) => ({ ...doc.data(), id: doc.id }) as Variation & { id: string }
  );

  // Cache the variations
  productCache.setCache(cacheKey, variations, productCache.cacheDurations.VARIATIONS);

  return variations;
}
