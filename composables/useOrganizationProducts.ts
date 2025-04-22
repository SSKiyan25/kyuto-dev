import { useOrganization } from "~/composables/useOrganizationValues";
import { collection, getDocs, query, where } from "firebase/firestore";
import type { Product, ProductWithId, Variation } from "~/types/models/Product";

export const useOrganizationProducts = (organizationID: string, productID: string) => {
  const db = useFirestore();
  const products = ref<ProductWithId[]>([]);
  const organizationName = ref<string | null>(null); // Add a ref for the organization name
  const loading = ref(false);
  const { getOrganizationById } = useOrganization();

  const fetchOrganizationProducts = async () => {
    loading.value = true;
    try {
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

      products.value = enhancedProducts;
    } catch (error) {
      console.error("Error fetching organization products:", error);
    } finally {
      loading.value = false;
    }
  };

  return {
    products,
    organizationName, // Return the organization name
    loading,
    fetchOrganizationProducts,
  };
};
