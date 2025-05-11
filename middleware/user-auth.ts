export default defineNuxtRouteMiddleware((to, from) => {
  // Only run on client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  // Get user ID from route params
  const userId = to.params.userId || to.params.id;

  // If there's no user ID in the route, continue
  if (!userId) return;

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo("/login");
  }

  // Check if the current user's ID matches the route's user ID
  // Or if they are an admin (assuming role-based authorization)
  if (user.value.id !== userId && user.value.role !== "admin") {
    // User is trying to access another user's page without permission
    console.warn("Unauthorized user page access attempt", {
      currentUserId: user.value.id,
      attemptedAccessUserId: userId,
      userRole: user.value.role,
    });

    // Redirect to home
    return navigateTo("/");
  }
});
