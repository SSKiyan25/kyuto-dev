import { useOrganization } from "~/composables/useOrganizationValues";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Product, ProductWithId, Variation } from "~/types/models/Product";

export const useOrganizationProducts = (organizationID: string, productID: string) => {
  const db = useFirestore();
  const products = ref<ProductWithId[]>([]);
  const organizationName = ref<string | null>(null);
  const loading = ref(false);
  const { getOrganizationById } = useOrganization();

  const CACHE_KEY = "cachedOrganizationProducts";

  // Helper to generate a unique cache key
  const getCacheKey = (key: string) => `${CACHE_KEY}-${key}`;

  // Helper to get cached data
  const getCachedData = (key: string) => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cache = cachedData ? JSON.parse(cachedData) : {};
    return cache[key] || null;
  };

  // Helper to set cached data
  const setCachedData = (key: string, data: any) => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cache = cachedData ? JSON.parse(cachedData) : {};
    cache[key] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  };

  // Helper to clear the cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    console.log("Organization products cache cleared");
  };

  const fetchOrganizationProducts = async () => {
    loading.value = true;
    try {
      const cacheKey = getCacheKey(organizationID);
      const cachedData = getCachedData(cacheKey);

      // Return cached data if available
      if (cachedData) {
        console.log("Loaded organization products from cache");
        products.value = cachedData.products;
        organizationName.value = cachedData.organizationName;
        return;
      }

      // Fetch organization details
      const organization = await getOrganizationById(organizationID);
      organizationName.value = organization?.name || "Unknown Organization";

      // Fetch products for the organization
      const productsQuery = query(
        collection(db, "products"),
        where("organizationID", "==", organizationID),
        where("status", "==", "Publish"),
        where("isArchived", "==", false)
      );

      const productsSnapshot = await getDocs(productsQuery);
      const fetchedProducts = productsSnapshot.docs
        .map((doc) => {
          const product = doc.data() as Product;
          return { ...product, id: doc.id };
        })
        .filter((product) => product.id !== productID);

      const enhancedProducts = await Promise.all(
        fetchedProducts.map(async (product) => {
          const variationsSnapshot = await getDocs(
            collection(db, "products", product.id, "variations")
          ).catch((err) => {
            console.error(`Error fetching variations for product ${product.id}:`, err);
            return { docs: [] };
          });
          const variations = variationsSnapshot.docs.map((doc) => doc.data() as Variation);

          const minPrice = variations.length > 0 ? Math.min(...variations.map((v) => v.price)) : 0;

          return {
            ...product,
            id: product.id,
            price: minPrice,
          } as ProductWithId;
        })
      );

      setCachedData(cacheKey, {
        products: enhancedProducts,
        organizationName: organizationName.value,
      });
    } catch (error) {
      console.error("Error fetching organization products:", error);
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    organizationName,
    loading,
    fetchOrganizationProducts,
    clearCache,
  };
};
