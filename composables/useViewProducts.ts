import { useAddProductViews } from "~/composables/useAddProductViews";
import { collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import type { ProductWithId, Variation } from "~/types/models/Product";

export const useViewProducts = () => {
  const db = useFirestore();
  const products = ref<ProductWithId[]>([]);
  const loading = ref(false);
  const CACHE_KEY = "cachedProducts";
  const { countViews } = useAddProductViews();

  const loadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  };

  const getCacheKey = (sortBy: string, categories: string[], sortPrice: string, page: number) => {
    return `${sortBy}-${categories.join(",")}-${sortPrice}-${page}`;
  };

  const fetchProducts = async (
    sortBy: string = "all",
    categories: string[] = [],
    sortPrice: string = "none",
    limitCount: number,
    page: number = 1
  ): Promise<{ products: ProductWithId[]; totalProducts: number }> => {
    loading.value = true;

    try {
      // Generate a unique cache key
      const cacheKey = getCacheKey(sortBy, categories, sortPrice, page);

      // Check if products are cached
      const cachedData = localStorage.getItem(CACHE_KEY);
      const cache = cachedData ? JSON.parse(cachedData) : {};

      if (cache[cacheKey]) {
        console.log("Loaded products from cache:", cache[cacheKey]);
        products.value = cache[cacheKey].products;
        return cache[cacheKey];
      }

      // If not cached, fetch from Firebase
      let productsQuery = query(
        collection(db, "products"),
        where("status", "==", "Publish"),
        where("isArchived", "==", false)
      );

      if (categories.length > 0) {
        productsQuery = query(productsQuery, where("category", "in", categories));
      }

      if (sortBy === "new") {
        productsQuery = query(productsQuery, orderBy("dateCreated", "desc"));
      } else if (sortBy === "top-sales") {
        productsQuery = query(productsQuery, orderBy("totalSales", "desc"));
      }
      // For "popular" we'll sort by view count after fetching

      // Get total count of products
      const totalSnapshot = await getDocs(productsQuery);
      const totalProducts = totalSnapshot.size;

      // Apply limit and orderBy
      if (sortBy !== "popular") {
        productsQuery = query(productsQuery, orderBy("dateCreated", "desc"), limit(limitCount));
      } else {
        // For popular, we need to fetch all and sort manually later
        productsQuery = query(productsQuery, orderBy("dateCreated", "desc"));
      }

      // Calculate the offset
      if (page > 1 && sortBy !== "popular") {
        const offset = (page - 1) * limitCount;
        const snapshot = await getDocs(productsQuery);
        const lastVisible = snapshot.docs[offset - 1];
        if (lastVisible) {
          productsQuery = query(productsQuery, startAfter(lastVisible));
        }
      }

      const productsSnapshot = await getDocs(productsQuery);
      let fetchedProducts = productsSnapshot.docs.map((doc) => {
        const product = doc.data() as ProductWithId;
        return { ...product, id: doc.id };
      });

      const enhancedProducts = await Promise.all(
        fetchedProducts.map(async (product) => {
          const variationsSnapshot = await getDocs(
            collection(db, "products", product.id, "variations")
          );
          const variations = variationsSnapshot.docs.map((doc) => doc.data() as Variation);

          const minPrice = Math.min(...variations.map((v) => v.price));

          await loadImage(product.featuredPhotoURL ?? "");

          return {
            ...product,
            price: minPrice,
          } as ProductWithId;
        })
      );

      // Handle "popular" sort by using view counts
      if (sortBy === "popular") {
        // Fetch view counts for all products
        const productsWithViews = await Promise.all(
          enhancedProducts.map(async (product) => {
            const viewCount = await countViews(product.id);
            return { ...product, viewCount };
          })
        );

        // Sort by view count descending
        productsWithViews.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));

        // Apply pagination manually since we couldn't use Firestore's pagination for this case
        const startIndex = (page - 1) * limitCount;
        const paginatedProducts = productsWithViews.slice(startIndex, startIndex + limitCount);

        // Update enhancedProducts with the paginated results
        enhancedProducts.length = 0;
        enhancedProducts.push(...paginatedProducts);
      }

      if (sortPrice === "lowest") {
        enhancedProducts.sort((a, b) => a.price - b.price);
      } else if (sortPrice === "highest") {
        enhancedProducts.sort((a, b) => b.price - a.price);
      }

      // Cache the fetched products
      cache[cacheKey] = { products: enhancedProducts, totalProducts };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cache));

      products.value = enhancedProducts;
      console.log("Fetched products:", enhancedProducts);
      return { products: enhancedProducts, totalProducts };
    } catch (error) {
      console.error("Error fetching products:", error);
      return { products: [], totalProducts: 0 };
    } finally {
      loading.value = false;
    }
  };

  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    console.log("Cache cleared");
  };

  return {
    products,
    loading,
    fetchProducts,
    clearCache,
  };
};
