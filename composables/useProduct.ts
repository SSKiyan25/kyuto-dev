import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { Product, ProductWithId, Variation } from "~/types/models/Product";

export const useProduct = () => {
  const db = useFirestore();

  const getPublishedProducts = async () => {
    const q = query(
      collection(db, "products"),
      where("status", "==", "Publish"),
      where("isArchived", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const fetchedProducts = querySnapshot.docs.map((doc) => transformProductData(doc));

    // Enhance products with price and variations
    const enhancedProducts = await enhanceProductsWithPrice(fetchedProducts);

    return enhancedProducts as Partial<ProductWithId>[];
  };

  const getProductsByOrganization = async (organizationID: string) => {
    const q = query(
      collection(db, "products"),
      where("organizationID", "==", organizationID),
      where("status", "==", "Publish"),
      where("isArchived", "==", false)
    );

    const querySnapshot = await getDocs(q);
    const fetchedProducts = querySnapshot.docs.map((doc) => transformProductData(doc));

    // Enhance products with price and variations
    const enhancedProducts = await enhanceProductsWithPrice(fetchedProducts);

    return enhancedProducts as Partial<ProductWithId>[];
  };

  const getProductWithVariations = async (productID: string) => {
    const productDoc = await getDoc(doc(db, "products", productID));
    if (!productDoc.exists()) throw new Error("Product not found");

    const variationsQuery = query(
      collection(db, "variations"),
      where("productID", "==", productID),
      where("isArchived", "==", false)
    );

    const variationsSnapshot = await getDocs(variationsQuery);

    return {
      ...transformProductData(productDoc),
      variations: variationsSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...transformVariationData(doc.data()),
      })) as Partial<Variation>[],
    } as Partial<Product>;
  };

  // Helper function to enhance products with price
  const enhanceProductsWithPrice = async (products: Partial<ProductWithId>[]) => {
    return await Promise.all(
      products.map(async (product) => {
        const variationsSnapshot = await getDocs(
          collection(db, "products", product.id as string, "variations")
        );
        const variations = variationsSnapshot.docs.map((doc) => doc.data() as Variation);

        const minPrice = Math.min(...variations.map((v) => v.price));

        return {
          ...product,
          price: minPrice,
        } as ProductWithId & { price: number };
      })
    );
  };

  // Data transformers
  const transformProductData = (doc: any) => ({
    id: doc.id,
    ...doc.data(),
    dateCreated: doc.data().dateCreated?.toDate(),
    lastModified: doc.data().lastModified?.toDate(),
    photosURL: doc.data().photosURL || [],
    variations: [],
  });

  const transformVariationData = (data: any) => ({
    ...data,
    lastStockUpdate: data.lastStockUpdate?.toDate(),
    dateAdded: data.dateAdded?.toDate(),
    lastModified: data.lastModified?.toDate(),
  });

  return {
    getPublishedProducts,
    getProductsByOrganization,
    getProductWithVariations,
  };
};
