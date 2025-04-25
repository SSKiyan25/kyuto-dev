import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";

export default defineNuxtPlugin(async () => {
  const auth = getAuth();

  try {
    await setPersistence(auth, browserLocalPersistence);
    console.log("Persistence set successfully");
  } catch (error) {
    console.error("Persistence error:", error);
  }

  // Initialize your auth store here
  const authStore = useAuthStore();
  await authStore.init();
});
