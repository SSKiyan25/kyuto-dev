import { defineStore } from "pinia";
import type { Account } from "~/types/models/Account";
import type { User as FirebaseUser } from "firebase/auth";

export const useAuthStore = defineStore("auth", () => {
  const user = ref<Account | null>(null);
  const isReady = ref(false);

  const init = async () => {
    if (import.meta.client) {
      const { getAuth, onAuthStateChanged } = await import("firebase/auth");
      const { getFirestore, doc, getDoc } = await import("firebase/firestore");
      const auth = getAuth();
      const db = getFirestore();

      try {
        return new Promise((resolve) => {
          const unsubscribe = onAuthStateChanged(
            auth,
            async (firebaseUser: FirebaseUser | null) => {
              if (firebaseUser) {
                const baseUser: Account = {
                  id: firebaseUser.uid,
                  email: firebaseUser.email || "",
                  username: firebaseUser.displayName || "",
                  role: "",
                  firstname: "",
                  lastname: "",
                  department: "",
                  studentID: "",
                  avatarURL: firebaseUser.photoURL || "",
                  phoneNumber: "",
                  faculty: "",
                  course: "",
                  hasOrganization: false,
                  organization: undefined,
                  organizationId: "",
                  organizationRole: "",
                  dateCreated: new Date(),
                  lastModified: new Date(),
                  isArchived: false,
                  isVerified: false,
                  consentedToPrivacyAndTerms: false,
                  disabled: false,
                };

                // Fetch additional user details from Firestore
                const userDocRef = doc(db, "accounts", firebaseUser.uid);
                const userDocSnap = await getDoc(userDocRef);

                if (userDocSnap.exists()) {
                  const firestoreData = userDocSnap.data();
                  user.value = {
                    ...baseUser,
                    ...firestoreData,
                  };
                } else {
                  user.value = baseUser;
                }
              } else {
                user.value = null;
              }
              isReady.value = true;
              unsubscribe();
              resolve(true);
            }
          );
        });
      } catch (error) {
        isReady.value = true;
        throw error;
      }
    }
  };

  return { user, isReady, init };
});
