import {
  collection,
  doc,
  getAggregateFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  sum,
  where,
} from "firebase/firestore";
import { useFirestore } from "vuefire";
import type { Organization } from "~/types/models/Organization";

// Add this type if not already in your types file
export type OrganizationWithId = Partial<Organization> & {
  id: string;
  commissionData?: {
    totalPaid: number;
    totalDue: number;
  };
  paymentStatus?: "paid" | "partial" | "unpaid" | "no-commissions";
};

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

  const getOrganizationIDFromUserId = async (
    userId: string
  ): Promise<{ userData: any; organizationId: string | null }> => {
    const docRef = doc(db, "accounts", userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error("User not found");
    }
    const userData = docSnap.data();
    const organizationId = userData?.organizationId || null;

    return { userData, organizationId };
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
      where("isPublic", "==", true),
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

  const getOrganizationFinancials = async (organizationId: string) => {
    try {
      // Fetch organization document
      const orgRef = doc(db, "organizations", organizationId);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) {
        throw new Error("Organization not found");
      }

      const orgData = orgDoc.data();

      // Return financial data directly from the organization document
      return {
        totalPaid: orgData.totalPaid || 0,
        totalDue: orgData.totalDue || 0,
      };
    } catch (error) {
      console.error("Error fetching financial data:", error);
      return { totalPaid: 0, totalDue: 0 };
    }
  };

  const getOrganizationCommissions = async (organizationId: string) => {
    try {
      // Fetch organization document
      const orgRef = doc(db, "organizations", organizationId);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) {
        throw new Error("Organization not found");
      }

      const orgData = orgDoc.data();

      // Return commission data directly from the organization document
      return {
        totalPaid: orgData.totalPaid || 0,
        totalDue: orgData.totalDue || 0,
      };
    } catch (error) {
      console.error("Error fetching commission data:", error);
      return { totalPaid: 0, totalDue: 0 };
    }
  };

  const transformOrganizationData = (data: any) => ({
    ...data,
    dateCreated: data.dateCreated?.toDate ? data.dateCreated.toDate() : data.dateCreated,
    lastModified: data.lastModified?.toDate ? data.lastModified.toDate() : data.lastModified,
    addressImagesURL: data.addressImagesURL || [],
    imagesURL: data.imagesURL || [],
    adminAccounts: data.adminAccounts || [],
    managerAccounts: data.managerAccounts || [],
    staffAccounts: data.staffAccounts || [],
    searchKeywords: data.searchKeywords || [],
  });

  const transformOrderData = (data: any) => ({
    ...data,
    dateOrdered: data.dateOrdered?.toDate(),
    lastModified: data.lastModified?.toDate(),
    receivedDate: data.receivedDate?.toDate(),
  });

  return {
    getAllOrganizations,
    getOrganizationById,
    searchOrganizations,
    getOrganizationFinancials,
    getOrganizationCommissions,
    getOrganizationIDFromUserId,
  };
};
