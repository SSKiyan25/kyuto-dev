import {
  collection,
  doc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  where,
} from "firebase/firestore";

export interface CommissionPayment {
  id: string;
  organizationId: string;
  amount: number;
  dateCreated: Date;
  lastModified: Date;
  isArchived: boolean;
  method: string;
  reference: string;
  status: "completed" | "failed" | "partial";
  remarks: string;
}

export const useCommission = () => {
  const db = useFirestore();

  const getCommissionHistory = async (organizationId: string) => {
    const q = query(
      collection(db, "commissionPayments"),
      where("organizationId", "==", organizationId),
      orderBy("dateCreated", "desc")
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      dateCreated: doc.data().dateCreated.toDate(),
      lastModified: doc.data().lastModified.toDate(),
    })) as CommissionPayment[];
  };

  const recordCommissionPayment = async (
    organizationId: string,
    paymentData: CommissionPayment
  ) => {
    const orgRef = doc(db, "organizations", organizationId);
    const paymentRef = doc(collection(db, "commissionPayments"));
    console.log("Payment Data Received in composable function: ", paymentData);
    try {
      await runTransaction(db, async (transaction) => {
        // 1. Get organization document
        const orgDoc = await transaction.get(orgRef);
        if (!orgDoc.exists()) throw new Error("Organization not found");

        const orgData = orgDoc.data();
        const unpaidAmount = orgData.totalDue || 0;

        // 2. Validate payment amount
        if (paymentData.amount > unpaidAmount) {
          throw new Error("Payment amount exceeds unpaid balance");
        }

        // 3. Update organization financials
        const newTotalPaid = parseFloat(((orgData.totalPaid || 0) + paymentData.amount).toFixed(2));
        const newTotalDue = parseFloat((unpaidAmount - paymentData.amount).toFixed(2));

        transaction.update(orgRef, {
          totalPaid: newTotalPaid,
          totalDue: newTotalDue,
          lastPaymentDate: new Date(),
        });

        // 4. Create payment record
        const paymentStatus = newTotalDue === 0 ? "completed" : "partial";
        transaction.set(paymentRef, {
          ...paymentData,
          organizationId,
          dateCreated: new Date(),
          remainingBalance: unpaidAmount - paymentData.amount,
          status: paymentStatus,
        });
      });

      return paymentRef.id;
    } catch (error) {
      console.error("Payment failed:", error);
      throw error;
    }
  };

  return {
    getCommissionHistory,
    recordCommissionPayment,
  };
};
