import { collection, getDocs, query, where } from "firebase/firestore";
import type { CommissionRate } from "~/types/models/CommissionRate";

export interface EnhancedCommissionRate extends CommissionRate {
  id: string;
}

export const useCommissionRate = () => {
  const db = useFirestore();
  const commissionRate = ref<EnhancedCommissionRate | null>(null);
  const loading = ref(false);

  const fetchCommissionRate = async () => {
    loading.value = true;
    try {
      const commissionRateQuery = query(
        collection(db, "commissionRate"),
        where("status", "==", "active"),
        where("isArchived", "==", false)
      );

      const commissionRateSnapshot = await getDocs(commissionRateQuery);
      const fetchedCommissionRate = commissionRateSnapshot.docs.map((doc) => {
        const commissionRate = doc.data() as CommissionRate;
        return { ...commissionRate, id: doc.id } as EnhancedCommissionRate;
      });

      if (fetchedCommissionRate.length > 0) {
        commissionRate.value = fetchedCommissionRate[0];
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
  };
};
