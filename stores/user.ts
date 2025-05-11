import { doc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export const useMyUserStore = defineStore(
  "myUserStore",
  () => {
    const defaultUser: Partial<Account> = {
      id: "",
      email: "",
      username: "",
      avatarURL: "",
      organization: "",
      organizationId: "",
      organizationRole: "",
      firstname: "",
      lastname: "",
      department: "",
      studentID: "",
      phoneNumber: "",
      dateCreated: new Date(),
      role: "",
      isVerified: false,
    };

    const user = ref<Partial<Account>>(defaultUser);
    const db = useFirestore();

    const isAuthenticated = computed(() => user.value.id !== "");

    async function fetchUser(uid: string) {
      console.log("fetching user", uid);
      try {
        const userDocRef = doc(db, "accounts", uid);
        console.log("userDocRef", userDocRef);
        const { data: userData } = useDocument<Partial<Account>>(userDocRef);
        if (userData.value) {
          user.value = userData.value;
          console.log("user fetched", user.value);
        } else {
          console.log("no user found");
          user.value = defaultUser;
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
        user.value = defaultUser;
      }
    }

    function clearUser() {
      user.value = defaultUser;
    }

    return { user, isAuthenticated, fetchUser, clearUser };
  },
  {
    persist: {
      storage: piniaPluginPersistedstate.localStorage(),
    },
  }
);

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMyUserStore, import.meta.hot));
}
