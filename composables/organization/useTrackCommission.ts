import { doc, getDoc } from "firebase/firestore";

export const useTrackCommission = () => {
  const db = useFirestore();

  const trackCommission = async (organizationID: string) => {
    console.log("Tracking commission for organization ID:", organizationID);
    try {
      // Fetch organization document
      const orgRef = doc(db, "organizations", organizationID);
      const orgDoc = await getDoc(orgRef);

      if (!orgDoc.exists()) {
        console.error("Organization not found");
        return {
          paidCommission: 0,
          unpaidCommission: 0,
        };
      }

      const orgData = orgDoc.data();
      console.log("Organization data:", orgData);

      // Extract totalPaid and totalDue
      const paidCommission = orgData.totalPaid || 0;
      const unpaidCommission = orgData.totalDue || 0;

      return {
        paidCommission: parseFloat(paidCommission.toFixed(2)),
        unpaidCommission: parseFloat(unpaidCommission.toFixed(2)),
      };
    } catch (error) {
      console.error("Error tracking commission:", error);
      return {
        paidCommission: 0,
        unpaidCommission: 0,
      };
    }
  };

  return {
    trackCommission,
  };
};
