export default defineNuxtRouteMiddleware(async (to) => {
  const user = await getCurrentUser();

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

  if (!user) {
    console.log("No user found. Redirecting to login page.");
    return navigateTo(`/`);
  }
  if (!user.email || !authorizedEmails.includes(user.email)) {
    console.warn(`Unauthorized admin access attempt by: ${user.email}`);
    return navigateTo("/");
  }
});
