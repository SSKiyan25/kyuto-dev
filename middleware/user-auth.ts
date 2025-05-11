export default defineNuxtRouteMiddleware(async (to, from) => {
  // Only run on client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();

  // Make sure auth is initialized
  if (!authStore.isReady) {
    await authStore.init();
  }

  // Get user from store
  const user = authStore.user;

  // Get user ID from route params
  const userId = to.params.userId || to.params.id;

  // If there's no user ID in the route, continue
  if (!userId) return;

  // If user is not authenticated, redirect to login
  if (!user) {
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
