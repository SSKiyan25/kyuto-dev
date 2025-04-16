// composables/useOrganization.ts
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { Organization } from "~/types/models/Organization";

// Add this type if not already in your types file
export type OrganizationWithId = Partial<Organization> & { id: string };

export const useOrganization = () => {
  const db = useFirestore();

  // Existing functions
  const getAllOrganizations = async (): Promise<OrganizationWithId[]> => {
    const querySnapshot = await getDocs(collection(db, "organizations"));
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...transformOrganizationData(doc.data()),
    }));
  };

  const getOrganizationById = async (id: string): Promise<OrganizationWithId> => {
    const docRef = doc(db, "organizations", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Organization not found");
    }

    return {
      id: docSnap.id,
      ...transformOrganizationData(docSnap.data()),
    };
  };

  const searchOrganizations = async (searchTerm: string): Promise<OrganizationWithId[]> => {
    const cleanedTerm = searchTerm.trim();
    console.log("cleanedTerm: ", cleanedTerm);
    if (!cleanedTerm) {
      return getAllOrganizations();
    }

    const q = query(
      collection(db, "organizations"),
      where("searchKeywords", "array-contains", cleanedTerm),
      orderBy("name"),
      limit(20)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...transformOrganizationData(doc.data()),
      searchKeywords: (doc.data().searchKeywords || []) as string[],
    })) as OrganizationWithId[];
  };

  const transformOrganizationData = (data: any) => ({
    ...data,
    dateCreated: data.dateCreated?.toDate(),
    lastModified: data.lastModified?.toDate(),
    addressImagesURL: data.addressImagesURL || [],
    imagesURL: data.imagesURL || [],
    adminAccounts: data.adminAccounts || [],
    managerAccounts: data.managerAccounts || [],
    staffAccounts: data.staffAccounts || [],
    searchKeywords: data.searchKeywords || [],
  });

  return {
    getAllOrganizations,
    getOrganizationById,
    searchOrganizations,
  };
};
