import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

export async function useGoogleLogin() {
  const loading = useSonner.loading("Loading", {
    description: "Please wait while we log you in with Google",
  });
  const auth = useFirebaseAuth();
  const googleAuthProvider = new GoogleAuthProvider();

  try {
    await signInWithPopup(auth!, googleAuthProvider);
    useSonner.success("Logged in successfully", {
      id: loading,
    });
  } catch (error) {
    useSonner.error("Failed to log in with Google", {
      id: loading,
    });
    console.error(error);
  }
}
