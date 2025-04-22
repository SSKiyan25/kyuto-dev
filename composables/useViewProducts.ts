import { collection, getDocs, limit, orderBy, query, startAfter, where } from "firebase/firestore";
import type { ProductWithId, Variation } from "~/types/models/Product";

export const useViewProducts = () => {
  const db = useFirestore();
  const products = ref<ProductWithId[]>([]);
  const loading = ref(false);

  const loadImage = (url: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = url;
      img.onload = () => resolve();
      img.onerror = () => reject();
    });
  };

  const fetchProducts = async (
    sortBy: string = "all",
    categories: string[] = [],
    sortPrice: string = "none",
    limitCount: number = 10,
    page: number = 1
  ): Promise<{ products: ProductWithId[]; totalProducts: number }> => {
    loading.value = true;
    try {
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

      // Get total count of products
      const totalSnapshot = await getDocs(productsQuery);
      const totalProducts = totalSnapshot.size;

      console.log("Total products:", totalProducts);
      // Apply limit and orderBy
      productsQuery = query(productsQuery, orderBy("dateCreated", "desc"), limit(limitCount));

      // Calculate the offset
      if (page > 1) {
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

      if (sortPrice === "lowest") {
        enhancedProducts.sort((a, b) => a.price - b.price);
      } else if (sortPrice === "highest") {
        enhancedProducts.sort((a, b) => b.price - a.price);
      }

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

  return {
    products,
    loading,
    fetchProducts,
  };
};
