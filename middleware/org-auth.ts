export default defineNuxtRouteMiddleware((to) => {
  // Only run on client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  // Get organization ID from route params
  const organizationId = to.params.organizationId || to.params.id;

  // If there's no organization ID in the route, continue
  if (!organizationId) return;

  // If user is not authenticated, redirect to login
  if (!user.value) {
    return navigateTo("/login");
  }

  // Check if user's organization ID matches the route's organization ID
  if (user.value.organizationId !== organizationId) {
    // User is trying to access an organization they don't belong to
    console.warn("Unauthorized organization access attempt", {
      userId: user.value.id,
      userOrgId: user.value.organizationId,
      attemptedOrgId: organizationId,
    });

    // Redirect to home
    return navigateTo("/");
  }
});
