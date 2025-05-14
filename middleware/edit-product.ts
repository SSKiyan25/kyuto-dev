export default defineNuxtRouteMiddleware(async (to) => {
  // Determine environment
  const isServer = import.meta.server;

  // Initialize variables for Firebase functions
  let docFn, getDocFn, collectionFn, firestoreFn;

  if (isServer) {
    // Server-side: Use dynamic imports to avoid SSR issues
    const firebaseFirestore = await import("firebase/firestore");

    firestoreFn = firebaseFirestore.getFirestore;
    docFn = firebaseFirestore.doc;
    getDocFn = firebaseFirestore.getDoc;
    collectionFn = firebaseFirestore.collection;
  } else {
    // Client-side: Import the necessary functions from Firebase
    const { doc, getDoc, collection, getFirestore } = await import("firebase/firestore");

    firestoreFn = getFirestore;
    docFn = doc;
    getDocFn = getDoc;
    collectionFn = collection;
  }

  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo("/login");
  }

  const productId = to.params.id as string;

  // Fetch the product to get its organization ID
  try {
    // Get Firestore instance using the appropriate method
    const database = firestoreFn();

    // Use the function references to create document references
    const productRef = docFn(database, "products", productId);
    const productSnap = await getDocFn(productRef);

    if (productSnap.exists()) {
      const productData = productSnap.data();
      const organizationId = productData.organizationID;

      // Check if user's organization ID matches the product's organization ID
      if (user.value.organizationId !== organizationId) {
        console.warn("Unauthorized product access attempt", {
          userId: user.value.id,
          userOrgId: user.value.organizationId,
          productOrgId: organizationId,
        });
        return navigateTo("/");
      }
    } else {
      // Product not found
      console.error("Product not found");
      return navigateTo("/not-found");
    }
  } catch (error) {
    console.error("Error fetching product:", error);
    return navigateTo("/error");
  }
});
