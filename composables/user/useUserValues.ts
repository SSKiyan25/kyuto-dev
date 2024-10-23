import { doc, getDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export function useUserValues() {
  const user = useCurrentUser();
  const db = useFirestore();

  const defaultUser: Partial<Account> = {
    id: "",
    email: "",
    username: "",
    avatar: "",
    organization: "",
    firstname: "",
    lastname: "",
    department: "",
    studentId: "",
    phoneNumber: "",
    dateCreated: new Date(),
    role: "",
    isVerified: false,
  };

  const userData = ref<Partial<Account>>(defaultUser);
  const loading = ref(true);

  watch(
    user,
    async (newUser) => {
      if (newUser) {
        try {
          //console.log("Current user:", newUser);
          //console.log("Current user ID:", newUser.uid);
          const docRef = doc(db, "accounts", newUser.uid);
          //console.log("User doc ref:", docRef);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            userData.value = docSnap.data() as Partial<Account>;
            //console.log("User data fetched successfully:", userData.value);
          } else {
            console.log("No user data found");
            userData.value = defaultUser;
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          userData.value = defaultUser;
        } finally {
          loading.value = false;
        }
      } else {
        console.log("No current user");
        userData.value = defaultUser;
        loading.value = false;
      }
    },
    { immediate: true }
  );

  return { userData, loading };
}
