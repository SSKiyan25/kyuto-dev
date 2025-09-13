import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { Account } from "~/types/models/Account";

// Helper function to detect problematic browsers
const isRestrictedBrowser = (): boolean => {
  // Only run on client-side
  if (typeof window === "undefined") return false;

  const ua = navigator.userAgent.toLowerCase();

  // Detect Facebook in-app browsers
  const isFacebookBrowser =
    ua.includes("fban") || ua.includes("fbav") || ua.includes("instagram") || ua.includes("fb_iab");

  return isFacebookBrowser;
};

export const signInWithGoogle = async (auth: any) => {
  const db = useFirestore();
  if (!db) {
    console.error("Firestore is not initialized");
    return { success: false, error: "Firestore not initialized" };
  }

  const googleAuthProvider = new GoogleAuthProvider();

  // Add these lines to improve sign-in experience
  googleAuthProvider.setCustomParameters({
    prompt: "select_account",
  });

  const loading = useSonner.loading("Loading...", {
    description: "We are signing you in",
  });

  try {
    // Check if we're in a mobile browser
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    );

    // Use redirect for mobile browsers (more reliable), popup for desktop
    if (isMobile) {
      // For redirect flow, we need to store state in localStorage
      localStorage.setItem("authInProgress", "true");
      await signInWithRedirect(auth, googleAuthProvider);
      // The page will refresh, so code below won't execute
      // We'll need to handle the redirect result on page load
      return { success: true };
    } else {
      // Desktop flow with popup
      const result = await signInWithPopup(auth, googleAuthProvider);
      const loggedInUser = result.user;

      // Check if user exists in accounts collection
      const userDocRef = doc(db, "accounts", loggedInUser.uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        // Create new user in accounts collection
        const newUser: Partial<Account> = {
          id: loggedInUser.uid,
          email: loggedInUser.email || "",
          username: loggedInUser.email ? loggedInUser.email.substring(0, 3) : "",
          dateCreated: new Date(),
          role: "user",
        };
        await setDoc(userDocRef, newUser);
      }

      useSonner.success("Signed in successfully!", {
        id: loading,
        description: "You are now signed in.",
      });

      return { success: true, user: loggedInUser };
    }
  } catch (error: any) {
    console.log(error.message);
    useSonner.error(error.message, {
      id: loading,
      description: "Please try again or use email sign-in.",
    });
    return { success: false, error: error.message };
  }
};
