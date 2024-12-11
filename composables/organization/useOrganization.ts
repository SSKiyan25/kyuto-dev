import { doc, getDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";
import type { Organization } from "~/types/models/Organization";

import { useFetchUser } from "../user/useFetchUser";

export interface OrganizationAccount {
  accountID: string;
  role: string;
  accountDetails?: Account;
}

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

  // Fetch account details for each account
  if (orgData.accounts) {
    const accounts: OrganizationAccount[] = orgData.accounts as OrganizationAccount[];
    for (const account of accounts) {
      const accountRef = doc(db, "accounts", account.accountID);
      const accountSnap = await getDoc(accountRef);
      if (accountSnap.exists()) {
        account.accountDetails = accountSnap.data() as Account;
      }
    }
    orgData.accounts = accounts;
  }

  return { ...orgData, id: orgSnap.id };
}
