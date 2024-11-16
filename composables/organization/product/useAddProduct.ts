import { addDoc, collection } from "firebase/firestore";
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

  // Generate a unique name for the featured image
  const uniqueStringFeatured = `${timestamp}-${values.name}-${userData.organization}-${values.category}-1`;
  const uniqueNameFeatured = sha256(uniqueStringFeatured);

  const featuredRef = storageRef(storage, `${basePath}/${uniqueNameFeatured}`);
  const { upload: uploadFeatured } = useStorageFile(featuredRef);
  const { url: featuredUrl, refresh: refreshFeaturedUrl } = useStorageFileUrl(featuredRef);

  try {
    // Upload the featured image
    await uploadFeatured(values.featured_image);
    await refreshFeaturedUrl();
    const featuredPhotoURL = featuredUrl.value ?? undefined;

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
      isDiscounted: false,
      featuredPhotoURL: featuredPhotoURL,
      photosURL: [],
      canPreOrder: canPreOrder,
      isArchived: false,
    };

    const imageUrls: string[] = [];
    for (let i = 0; i < values.images.length; i++) {
      const image = values.images[i];
      const uniqueStringImage = `${timestamp}-${values.name}-${userData.organization}-${values.category}-${i + 2}`;
      const uniqueNameImage = sha256(uniqueStringImage);

      const imageRef = storageRef(storage, `${basePath}/${uniqueNameImage}`);
      const { upload: uploadImage } = useStorageFile(imageRef);
      const { url: imageUrl, refresh: refreshImageUrl } = useStorageFileUrl(imageRef);

      await uploadImage(image);
      await refreshImageUrl();
      const imageUploadedUrl = imageUrl.value ?? undefined;
      if (imageUploadedUrl) {
        imageUrls.push(imageUploadedUrl);
      }
    }

    newProduct.photosURL = imageUrls;

    const productDocRef = await addDoc(collection(db, "products"), newProduct);
    console.log("product added: ", productDocRef);

    // Add variations as a subcollection
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
        totalStocks: variation.stocks ?? 0,
        remainingStocks: variation.stocks ?? 0,
        lastStockUpdate: new Date(),
        dateAdded: new Date(),
        lastModified: new Date(),
        isArchived: false,
      };

      const variationDocRef = await addDoc(collection(productDocRef, "variations"), newVariation);
      console.log("Variation added: ", variationDocRef);

      const newStockLog: Partial<StocksLogs> = {
        variationID: variationDocRef.id,
        quantity: variation.stocks ?? 0,
        action: "Initial Stock",
        remarks: "Initial stock added",
        dateCreated: new Date(),
      };
      console.log("Stock log added: ", newStockLog);

      await addDoc(collection(variationDocRef, "stocksLogs"), newStockLog);
    }

    console.log("Product and subcollections added successfully");
  } catch (error) {
    console.error("Error adding product: ", error);
  }
};
