import { doc, setDoc } from "firebase/firestore";
import type { Account } from "@/types/models/Account";

export const useEditProfile = () => {
  const db = useFirestore();

  const editProfile = async (userID: string, updatedData: Partial<Account>) => {
    // console.log("Editing profile...");
    // console.log("User ID: ", userID);
    // console.log("Updated Data: ", updatedData);

    // Filter out empty values
    const filteredData = Object.fromEntries(
      Object.entries(updatedData).filter(
        ([_, value]) => value !== "" && value !== null && value !== undefined
      )
    );

    // console.log("Filtered Data: ", filteredData);
    try {
      const userDocRef = doc(db, "accounts", userID);
      const dataWithTimestamp = {
        ...filteredData,
        lastModified: new Date(),
      };
      await setDoc(userDocRef, dataWithTimestamp, { merge: true });
      // console.log("Profile updated successfully");
    } catch (error) {
      console.error("Error updating profile: ", error);
    }
  };

  return { editProfile };
};
