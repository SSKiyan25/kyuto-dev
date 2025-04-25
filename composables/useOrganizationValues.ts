import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from "firebase/firestore";
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
  const CACHE_KEY = "cachedOrganizations";

  // Helper to generate a unique cache key
  const getCacheKey = (key: string) => `${CACHE_KEY}-${key}`;

  // Helper to get cached data
  const getCachedData = (key: string) => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cache = cachedData ? JSON.parse(cachedData) : {};
    return cache[key] || null;
  };

  // Helper to set cached data
  const setCachedData = (key: string, data: any) => {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cache = cachedData ? JSON.parse(cachedData) : {};
    cache[key] = data;
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  };

  // Helper to clear the cache
  const clearCache = () => {
    localStorage.removeItem(CACHE_KEY);
    // console.log("Organization cache cleared");
  };

  // Existing functions
  const getAllOrganizations = async (): Promise<OrganizationWithId[]> => {
    const cacheKey = getCacheKey("allOrganizations");
    const cachedOrganizations = getCachedData(cacheKey);

    if (cachedOrganizations) {
      console.log("Loaded organizations from cache");
      return cachedOrganizations;
    }

    const querySnapshot = await getDocs(collection(db, "organizations"));
    const organizations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...transformOrganizationData(doc.data()),
    }));

    setCachedData(cacheKey, organizations);
    return organizations;
  };

  const getOrganizationById = async (id: string): Promise<OrganizationWithId> => {
    const cacheKey = getCacheKey(`organization-${id}`);
    const cachedOrganization = getCachedData(cacheKey);

    if (cachedOrganization) {
      // console.log(`Loaded organization ${id} from cache`);
      return cachedOrganization;
    }

    const docRef = doc(db, "organizations", id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      throw new Error("Organization not found");
    }

    const organization = {
      id: docSnap.id,
      ...transformOrganizationData(docSnap.data()),
    };

    setCachedData(cacheKey, organization);
    return organization;
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
    const cacheKey = getCacheKey(`search-${searchTerm}`);
    const cachedSearchResults = getCachedData(cacheKey);

    if (cachedSearchResults) {
      // console.log(`Loaded search results for "${searchTerm}" from cache`);
      return cachedSearchResults;
    }

    const cleanedTerm = searchTerm.trim();
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
    const organizations = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...transformOrganizationData(doc.data()),
      searchKeywords: (doc.data().searchKeywords || []) as string[],
    })) as OrganizationWithId[];

    setCachedData(cacheKey, organizations);
    return organizations;
  };

  const getOrganizationFinancials = async (organizationId: string) => {
    const cacheKey = getCacheKey(`financials-${organizationId}`);
    const cachedFinancials = getCachedData(cacheKey);

    if (cachedFinancials) {
      // console.log(`Loaded financials for organization ${organizationId} from cache`);
      return cachedFinancials;
    }

    const orgRef = doc(db, "organizations", organizationId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error("Organization not found");
    }

    const financials = {
      totalPaid: orgDoc.data().totalPaid || 0,
      totalDue: orgDoc.data().totalDue || 0,
    };

    setCachedData(cacheKey, financials);
    return financials;
  };

  const getOrganizationCommissions = async (organizationId: string) => {
    const cacheKey = getCacheKey(`commissions-${organizationId}`);
    const cachedCommissions = getCachedData(cacheKey);

    if (cachedCommissions) {
      // console.log(`Loaded commissions for organization ${organizationId} from cache`);
      return cachedCommissions;
    }

    const orgRef = doc(db, "organizations", organizationId);
    const orgDoc = await getDoc(orgRef);

    if (!orgDoc.exists()) {
      throw new Error("Organization not found");
    }

    const commissions = {
      totalPaid: orgDoc.data().totalPaid || 0,
      totalDue: orgDoc.data().totalDue || 0,
    };

    setCachedData(cacheKey, commissions);
    return commissions;
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

  return {
    getAllOrganizations,
    getOrganizationById,
    searchOrganizations,
    getOrganizationFinancials,
    getOrganizationCommissions,
    clearCache,
    getOrganizationIDFromUserId,
  };
};
