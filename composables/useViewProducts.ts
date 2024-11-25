import { collection, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import type { Product, Variation } from "~/types/models/Product";

interface EnhancedProduct extends Product {
  id: string;
  price: number;
}

export const useViewProducts = () => {
  const db = useFirestore();
  const products = ref<EnhancedProduct[]>([]);
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
    limitCount: number = 20
  ) => {
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

      productsQuery = query(productsQuery, limit(limitCount));

      const productsSnapshot = await getDocs(productsQuery);
      let fetchedProducts = productsSnapshot.docs.map((doc) => {
        const product = doc.data() as Product;
        return { ...product, id: doc.id };
      });

      const enhancedProducts = await Promise.all(
        fetchedProducts.map(async (product) => {
          const variationsSnapshot = await getDocs(
            collection(db, "products", product.id, "variations")
          );
          const variations = variationsSnapshot.docs.map((doc) => doc.data() as Variation);

          const minPrice = Math.min(...variations.map((v) => v.price));

          await loadImage(product.featuredPhotoURL);

          return {
            ...product,
            price: minPrice,
          } as EnhancedProduct;
        })
      );

      if (sortPrice === "lowest") {
        enhancedProducts.sort((a, b) => a.price - b.price);
      } else if (sortPrice === "highest") {
        enhancedProducts.sort((a, b) => b.price - a.price);
      }

      products.value = enhancedProducts;
    } catch (error) {
      console.error("Error fetching products:", error);
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
