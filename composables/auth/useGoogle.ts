import {
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";
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

  // Fix COOP issue by setting proper window features
  googleAuthProvider.setCustomParameters({
    prompt: "select_account",
    // This will help mitigate COOP warnings
    auth_flow_type: "popup",
  });

  const loading = useSonner.loading("Loading...", {
    description: "We are signing you in",
  });

  try {
    // Add popup config to fix COOP warning
    const popupConfig = {
      width: 500,
      height: 600,
      location: "yes",
      resizable: "yes",
      statusbar: "yes",
      toolbar: "no",
    };

    // For now, use signInWithPopup for all browsers
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
  } catch (error: any) {
    // Check if error is related to popup being blocked or closed
    if (error.code === "auth/popup-closed-by-user") {
      useSonner.error("Sign-in cancelled", {
        id: loading,
        description: "You closed the sign-in window. Please try again.",
      });
    } else if (error.code === "auth/popup-blocked") {
      useSonner.error("Popup blocked", {
        id: loading,
        description: "Please allow popups for this site and try again.",
      });
    } else {
      console.log("Google Sign-In Error:", error);
      useSonner.error("Sign-in failed", {
        id: loading,
        description: error.message || "Please try again or use email sign-in.",
      });
    }
    return { success: false, error: error.message };
  }
};

// Add a helper function to handle redirect results
export const handleGoogleRedirectResult = async (auth: any) => {
  const db = useFirestore();

  try {
    const result = await getRedirectResult(auth);
    if (!result) return { success: false, user: null };

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

    return { success: true, user: loggedInUser };
  } catch (error: any) {
    console.error("Error with redirect sign-in:", error);
    useSonner.error("Sign-in failed", {
      description: error.message || "Error processing Google sign-in. Please try again.",
    });
    return { success: false, error: error.message };
  }
};
