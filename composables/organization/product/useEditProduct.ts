import { useFetchUser } from "~/composables/user/useFetchUser";
import { doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";
import {
  deleteObject,
  getDownloadURL,
  listAll,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";
import { sha256 } from "js-sha256";
import { useFirebaseStorage, useFirestore, useStorageFile, useStorageFileUrl } from "vuefire";
import type { Product } from "~/types/models/Product";

export function useEditProduct() {
  const db = useFirestore();
  const storage = useFirebaseStorage();

  const removeImage = async (productID: string, photoUrl: string) => {
    const productRef = doc(db, "products", productID);
    console.log("Passed URL in composable: ", photoUrl);
    // Fetch the current product data
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    const productData = productSnap.data();
    const updatedPhotos = (productData.photos || []).filter((photo: string) => photo !== photoUrl);

    // Update Firestore document
    await updateDoc(productRef, { photos: updatedPhotos });

    // Delete image from Firebase Storage
    const photoRef = storageRef(storage, photoUrl);
    await deleteObject(photoRef);
  };

  const moveImages = async (oldPath: string, newPath: string) => {
    const oldRef = storageRef(storage, oldPath);
    const newRef = storageRef(storage, newPath);

    const listResult = await listAll(oldRef);
    for (const itemRef of listResult.items) {
      const url = await getDownloadURL(itemRef);
      const response = await fetch(url);
      const blob = await response.blob();
      const newItemRef = storageRef(newRef, itemRef.name);
      await uploadBytes(newItemRef, blob);
      await deleteObject(itemRef);
    }
  };

  const updateProduct = async (productID: string, updatedData: Partial<Product>) => {
    const { userData } = await useFetchUser();
    const productRef = doc(db, "products", productID);
    console.log("Product passed: ", updatedData);
    console.log("User data: ", userData);

    // Fetch the current product data
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      throw new Error("Product not found");
    }

    const currentProductData = productSnap.data() as Product;
    const currentName = currentProductData.name;

    // Handle photo uploads
    const timestamp = Timestamp.now().toMillis();
    const basePath = `organizations/${userData.organizationID}/products/${updatedData.name}`;

    const urlToBlob = async (url: string): Promise<Blob> => {
      const response = await fetch(url);
      return await response.blob();
    };

    const uploadPhotos = async (photos: string[]) => {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        if (photo.startsWith("blob:")) {
          const uniqueString = `${timestamp}-${updatedData.name}-${i}`;
          const uniqueName = sha256(uniqueString);
          const photoRef = storageRef(storage, `${basePath}/${uniqueName}`);
          const { upload: uploadPhoto } = useStorageFile(photoRef);
          const { url: photoUrl, refresh: refreshPhotoUrl } = useStorageFileUrl(photoRef);

          const photoBlob = await urlToBlob(photo);
          await uploadPhoto(photoBlob);
          await refreshPhotoUrl();
          const uploadedUrl = photoUrl.value ?? undefined;
          if (uploadedUrl) {
            uploadedUrls.push(uploadedUrl);
          }
        } else {
          uploadedUrls.push(photo);
        }
      }
      return uploadedUrls;
    };

    // Move existing images if the product name has changed
    if (currentName !== updatedData.name) {
      const oldBasePath = `${userData.organization}/products/${currentName}`;
      await moveImages(oldBasePath, basePath);

      // Delete old folder after moving images
      const oldRef = storageRef(storage, oldBasePath);
      const listResult = await listAll(oldRef);
      for (const itemRef of listResult.items) {
        await deleteObject(itemRef);
      }
    }

    if (updatedData.photosURL) {
      updatedData.photosURL = await uploadPhotos(updatedData.photosURL);
    }

    if (updatedData.featuredPhotoURL && updatedData.featuredPhotoURL.startsWith("blob:")) {
      const uniqueString = `${timestamp}-${updatedData.name}-featured`;
      const uniqueName = sha256(uniqueString);
      const featuredRef = storageRef(storage, `${basePath}/${uniqueName}`);
      const { upload: uploadFeatured } = useStorageFile(featuredRef);
      const { url: featuredUrl, refresh: refreshFeaturedUrl } = useStorageFileUrl(featuredRef);

      const featuredBlob = await urlToBlob(updatedData.featuredPhotoURL);
      await uploadFeatured(featuredBlob);
      await refreshFeaturedUrl();
      updatedData.featuredPhotoURL = featuredUrl.value ?? undefined;
    }

    // Update product
    updatedData.lastModified = new Date();
    await updateDoc(productRef, updatedData);
  };

  return { removeImage, updateProduct, moveImages };
}
