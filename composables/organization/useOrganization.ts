import { doc, getDoc } from "firebase/firestore";
import type { Organization } from "~/types/models/Organization";

import { useFetchUser } from "../user/useFetchUser";

export async function fetchOrganization() {
  const db = useFirestore();
  const user = useCurrentUser();

  if (!user.value) {
    throw new Error("User not found");
  }
  const { userData } = await useFetchUser();
  console.log("UserData: ", userData);
  console.log("User in composable: ", user.value);
  const orgRef = doc(db, "organizations", userData.organizationID as string);
  const orgSnap = await getDoc(orgRef);

  if (!orgSnap.exists()) {
    throw new Error("Organization not found");
  }

  const orgData = orgSnap.data() as Partial<Organization>;
  return { ...orgData, id: orgSnap.id };
}
