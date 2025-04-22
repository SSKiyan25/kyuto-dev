import { collection, deleteDoc, doc, getDoc, getDocs, writeBatch } from "firebase/firestore";
import { deleteObject, getStorage, ref as refStorage } from "firebase/storage";
import type { Product } from "~/types/models/Product";

export const useDeleteProducts = () => {
  const db = useFirestore();
  const storage = getStorage();
  const isLoading = ref(false);
  const error = ref<Error | null>(null);

  // Extract storage path from download URL
  const getPathFromStorageUrl = (url: string) => {
    const basePath = url.split("/o/")[1].split("?")[0];
    return decodeURIComponent(basePath).replace(/%2F/g, "/");
  };

  const deleteProductImages = async (product: Product) => {
    try {
      const deletePromises = [];

      // Delete featured photo
      if (product.featuredPhotoURL) {
        const featuredPath = getPathFromStorageUrl(product.featuredPhotoURL);
        deletePromises.push(deleteObject(refStorage(storage, featuredPath)));
      }

      // Delete gallery photos
      if (product.photosURL?.length) {
        product.photosURL.forEach((url) => {
          const photoPath = getPathFromStorageUrl(url);
          deletePromises.push(deleteObject(refStorage(storage, photoPath)));
        });
      }

      await Promise.all(deletePromises);
    } catch (err) {
      error.value = new Error("Failed to delete product images");
      throw error.value;
    }
  };

  const deleteProductVariations = async (productId: string) => {
    try {
      const variationsRef = collection(db, `products/${productId}/variations`);
      const querySnapshot = await getDocs(variationsRef);

      const batch = writeBatch(db);

      // Iterate over each variation document
      for (const variationDoc of querySnapshot.docs) {
        const variationId = variationDoc.id;

        // Delete stocksLogs sub-collection for this variation
        const stocksLogsRef = collection(
          db,
          `products/${productId}/variations/${variationId}/stocksLogs`
        );
        const stocksLogsSnapshot = await getDocs(stocksLogsRef);

        stocksLogsSnapshot.forEach((stocksLogDoc) => {
          batch.delete(stocksLogDoc.ref);
        });

        // Delete the variation document itself
        batch.delete(variationDoc.ref);
      }

      await batch.commit();
    } catch (err) {
      error.value = new Error("Failed to delete product variations and their stock logs");
      throw error.value;
    }
  };

  const deleteProduct = async (productId: string) => {
    isLoading.value = true;
    error.value = null;

    try {
      // Get product document first
      const productRef = doc(db, "products", productId);
      const productDoc = await getDoc(productRef);

      if (!productDoc.exists()) {
        throw new Error("Product not found");
      }
      const productData = productDoc.data() as Product;

      // 1. Delete all variations sub-collection
      await deleteProductVariations(productId);

      // 2. Delete associated images from storage
      await deleteProductImages(productData);

      // 3. Delete main product document
      await deleteDoc(productRef);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Deletion failed");
      console.error("Product deletion error:", error.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAllProducts = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const productsRef = collection(db, "products");
      const querySnapshot = await getDocs(productsRef);

      const deletePromises = querySnapshot.docs.map(async (doc) => {
        const productId = doc.id;
        const productData = doc.data() as Product;

        // 1. Delete all variations sub-collection
        await deleteProductVariations(productId);

        // 2. Delete associated images from storage
        await deleteProductImages(productData);

        // 3. Delete main product document
        await deleteDoc(doc.ref);
      });

      await Promise.all(deletePromises);

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to delete all products");
      console.error("Delete all products error:", error.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const deleteAllProductViews = async () => {
    isLoading.value = true;
    error.value = null;

    try {
      const productViewsRef = collection(db, "productViews");
      const querySnapshot = await getDocs(productViewsRef);

      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });

      await batch.commit();

      return true;
    } catch (err) {
      error.value = err instanceof Error ? err : new Error("Failed to delete all product views");
      console.error("Delete all product views error:", error.value);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  return {
    isLoading,
    error,
    deleteProduct,
    deleteAllProducts,
    deleteAllProductViews,
  };
};
