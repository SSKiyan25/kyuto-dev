import { addDoc, collection, doc, writeBatch } from "firebase/firestore";
import { ref as storageRef } from "firebase/storage";
import { sha256 } from "js-sha256";
import type { Product, StocksLogs, Variation } from "~/types/models/Product";

import { useFetchUser } from "../../user/useFetchUser";

export const useAddProduct = async (values: any, canPreOrder: boolean) => {
  const user = useCurrentUser();
  const db = useFirestore();
  const storage = useFirebaseStorage();
  const { userData } = await useFetchUser();

  const timestamp = Date.now();
  const basePath = `organizations/${userData.organizationID}/products/${values.name}`;

  try {
    // Upload featured image
    const featuredUrl = await uploadFile(values.featured_image, `${basePath}/featured`, storage);

    // Upload additional images concurrently
    const imageUrls = await Promise.all(
      (values.images || []).map((image: File, index: number) =>
        uploadFile(image, `${basePath}/image-${index}`, storage)
      )
    );

    // Create the new product
    const newProduct: Partial<Product> = {
      accountID: user.value?.uid ?? "",
      organizationID: userData.organizationID,
      organization: userData.organization,
      name: values.name,
      category: values.category,
      description: values.description ?? "",
      status: values.status,
      dateCreated: new Date(),
      lastModified: new Date(),
      isApproved: false,
      totalSales: 0,
      totalOrders: 0,
      isDiscounted: false,
      discountType: "",
      discountTarget: "",
      featuredPhotoURL: featuredUrl,
      photosURL: imageUrls,
      canPreOrder: canPreOrder,
      isArchived: false,
    };

    // Add product to Firestore
    const productDocRef = await addDoc(collection(db, "products"), newProduct);

    // Add variations using a batch
    const batch = writeBatch(db);
    for (const variation of values.variations) {
      if (!variation.name || !variation.price) {
        console.error("Variation name or price is undefined");
        continue;
      }

      const newVariation: Partial<Variation> = {
        productID: productDocRef.id,
        value: variation.name,
        price: variation.price,
        discountPrice: variation.discountPrice ?? 0,
        reservedStocks: 0,
        preOrderStocks: 0,
        completedOrders: 0,
        cancelledOrders: 0,
        totalStocks: variation.stocks ?? 0,
        remainingStocks: variation.stocks ?? 0,
        lastStockUpdate: new Date(),
        dateAdded: new Date(),
        lastModified: new Date(),
        isArchived: false,
      };

      const variationRef = collection(productDocRef, "variations");
      const variationDocRef = doc(variationRef);
      batch.set(variationDocRef, newVariation);

      const newStockLog: Partial<StocksLogs> = {
        variationID: variationDocRef.id,
        quantity: variation.stocks ?? 0,
        action: "Initial Stock",
        remarks: "Initial stock added",
        dateCreated: new Date(),
      };

      const stockLogRef = collection(variationDocRef, "stocksLogs");
      batch.set(doc(stockLogRef), newStockLog);
    }

    await batch.commit();
    console.log("Product and subcollections added successfully");
  } catch (error) {
    console.error("Error adding product: ", error);
    throw error;
  }
};

// Helper function to upload files
const uploadFile = async (file: File, path: string, storage: any): Promise<string> => {
  try {
    const uniqueName = sha256(`${Date.now()}-${file.name}`);
    const fileRef = storageRef(storage, `${path}/${uniqueName}`);
    const { upload } = useStorageFile(fileRef);
    const { url, refresh } = useStorageFileUrl(fileRef);

    await upload(file);
    await refresh();
    return url.value ?? "";
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error("Failed to upload file");
  }
};
