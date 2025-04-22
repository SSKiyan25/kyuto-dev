import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

export const signInWithGoogle = async (auth: any) => {
  const db = useFirestore();
  console.log("Firestore:", db);

  if (!db) {
    console.error("Firestore is not initialized");
    return;
  }

  const googleAuthProvider = new GoogleAuthProvider();

  const loading = useSonner.loading("Loading...", {
    description: "We are signing you in",
  });

  try {
    const result = await signInWithPopup(auth, googleAuthProvider);
    const loggedInUser = result.user;

    // Check if the user exists in the "accounts" collection
    const userDocRef = doc(db, "accounts", loggedInUser.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      // If the user does not exist, create a new document in the "accounts" collection
      const newUser: Partial<Account> = {
        id: loggedInUser.uid,
        email: loggedInUser.email || "",
        username: loggedInUser.email ? loggedInUser.email.substring(0, 3) : "",
        dateCreated: new Date(),
        role: "user",
      };
      await setDoc(userDocRef, newUser);
      console.log("New user added to accounts collection:", newUser);
    } else {
      console.log("User already exists in accounts collection");
    }

    useSonner.success("Signed in successfully!", {
      id: loading,
      description: "You are now signed in.",
    });

    // Redirect to the dashboard
    // const router = useRouter();
    // return await router.replace({ path: "/" });
  } catch (error: any) {
    // Show error
    console.log(error.message);
    useSonner.error(error.message, {
      id: loading,
      description: "Please try again.",
    });
  }
};
