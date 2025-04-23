import { collection, getDocs, query, where } from "firebase/firestore";
import type { CommissionRate } from "~/types/models/CommissionRate";

export interface EnhancedCommissionRate extends CommissionRate {
  id: string;
}

export const useCommissionRate = () => {
  const db = useFirestore();
  const commissionRate = ref<EnhancedCommissionRate | null>(null);
  const loading = ref(false);
  const CACHE_KEY = "cachedCommission";

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
    console.log("Commission rate cache cleared");
  };

  const fetchCommissionRate = async () => {
    loading.value = true;
    try {
      const commissionRateQuery = query(
        collection(db, "commissionRate"),
        where("status", "==", "active"),
        where("isArchived", "==", false)
      );
      const cacheKey = "activeCommissionRate";
      const cachedCommissionRate = getCachedData(cacheKey);

      // Return cached data if available
      if (cachedCommissionRate) {
        console.log("Loaded commission rate from cache");
        commissionRate.value = cachedCommissionRate;
        return;
      }

      const commissionRateSnapshot = await getDocs(commissionRateQuery);
      const fetchedCommissionRate = commissionRateSnapshot.docs.map((doc) => {
        const commissionRate = doc.data() as CommissionRate;
        return { ...commissionRate, id: doc.id } as EnhancedCommissionRate;
      });

      if (fetchedCommissionRate.length > 0) {
        commissionRate.value = fetchedCommissionRate[0];
        setCachedData(cacheKey, fetchedCommissionRate[0]);
      } else {
        console.warn("No active commission rate found.");
        commissionRate.value = null;
      }
    } catch (error) {
      console.error("Error fetching commission rate:", error);
    } finally {
      loading.value = false;
    }
  };
  return {
    commissionRate,
    fetchCommissionRate,
    loading,
    clearCache,
  };
};
