export default defineNuxtRouteMiddleware((to) => {
  // Only run on client-side
  if (import.meta.server) return;

  const authStore = useAuthStore();
  const { user } = storeToRefs(authStore);

  const {
    public: { adminEmails },
  } = useRuntimeConfig();

  const parseEmails = (input: string | undefined): string[] => {
    if (!input) return [];
    return input
      .split(",")
      .map((email) => email.trim())
      .filter(Boolean);
  };

  const authorizedEmails = parseEmails(adminEmails);

  if (authorizedEmails.length === 0) {
    if (process.dev) {
      // Only show detailed error in development
      console.error("No admin emails configured. Set NUXT_PUBLIC_ADMIN_EMAILS in .env");
      console.info('ℹ Example: NUXT_PUBLIC_ADMIN_EMAILS="admin@test.com,backup@test.com"');
    }
    return navigateTo("/maintenance");
  }

  if (!user.value) {
    console.log("No user found. Redirecting to login page.");
    return navigateTo(`/`);
  }
  if (!user.value.email || !authorizedEmails.includes(user.value.email)) {
    console.warn(`Unauthorized admin access attempt by: ${user.value.email}`);
    return navigateTo("/");
  }
});
