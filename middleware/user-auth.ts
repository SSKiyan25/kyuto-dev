export default defineNuxtRouteMiddleware(async (to) => {
  // Only run on client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Make sure auth is initialized and wait for it
  if (!authStore.isReady) {
    await authStore.init();
  }

  // Get user ID from route params
  const userId = to.params.userId || to.params.id;

  // Better handling of invalid userId values
  // If there's no user ID in the route, or it's the string "undefined", continue
  if (!userId || userId === "undefined") {
    console.log("No valid userId in route params, continuing without checks");
    return;
  }

  // Improved auth checking with longer and more patient retries
  const maxRetries = 5;
  let retryCount = 0;
  let user = authStore.user;

  // If user is not authenticated or user ID not available yet, try waiting
  while ((!user || !user.id) && retryCount < maxRetries) {
    console.log(`Auth retry attempt ${retryCount + 1}/${maxRetries}...`);

    // Wait longer with each retry (exponential backoff)
    const waitTime = 400 * Math.pow(1.5, retryCount);
    await new Promise((resolve) => setTimeout(resolve, waitTime));

    // Force refresh auth state
    await authStore.init();

    // Re-check auth state after waiting
    user = authStore.user;
    // console.log("After retry:", { userExists: !!user, userId: user?.id });

    retryCount++;
  }

  // If still no user after retries, redirect to login
  if (!user) {
    console.warn("User not available after retries");
    return navigateTo("/login");
  }

  // More lenient check - if we have a user object but no ID, let's be careful
  if (!user.id) {
    console.warn("User exists but ID is missing");
    // Log the actual user object for debugging
    console.log("Problematic user object:", JSON.stringify(user));
    return navigateTo("/login");
  }

  // Check if the current user's ID matches the route's user ID
  if (user.id !== userId && user.role !== "admin") {
    console.warn("Unauthorized user page access attempt", {
      currentUserId: user.id,
      attemptedAccessUserId: userId,
      userRole: user.role,
    });

    // Redirect to home
    return navigateTo("/");
  }
});
