import { doc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export async function useUserValues() {
  const user = useCurrentUser();
  const db = useFirestore();

  const defaultUser: Partial<Account> = {
    id: "",
    email: "",
    username: "",
    avatarURL: "",
    organization: "",
    firstname: "",
    lastname: "",
    department: "",
    studentId: "",
    phoneNumber: "",
    dateCreated: new Date(),
    role: "",
  };

  const userDocRef = computed(() => (user.value ? doc(db, "accounts", user.value.uid) : null));
  const { data: userData, pending: loading } = useDocument<Partial<Account>>(userDocRef);
  console.log("User data: ", userData);
  // Initialize userData with defaultUser if userDocRef is null
  const userDataWithDefault = computed(() => userData.value ?? defaultUser);

  return { userData: userDataWithDefault, loading };
}
