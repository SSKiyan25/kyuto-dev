import { signOut } from "firebase/auth";

export async function useLogout() {
  const auth = useFirebaseAuth();

  if (!auth) {
    console.log("Auth is not available");
    return;
  }
  await signOut(auth);
  await navigateTo("/login", { replace: true });
}
