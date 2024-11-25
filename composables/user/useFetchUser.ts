import { doc, getDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export async function useFetchUser() {
  const db = useFirestore();
  const user = useCurrentUser();

  if (!user.value) {
    throw new Error("User not found");
  }

  const userRef = doc(db, "accounts", user.value.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    throw new Error("User not found");
  }

  const userData = userSnap.data() as Partial<Account>;
  return { userData };
}
