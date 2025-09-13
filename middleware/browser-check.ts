export default defineNuxtRouteMiddleware((to, from) => {
  // Skip on server-side
  if (process.server) return; // Add missing return statement

  // Check for Facebook browser
  const ua = navigator.userAgent.toLowerCase();
  const isFacebookBrowser =
    ua.includes("fban") || ua.includes("fbav") || ua.includes("instagram") || ua.includes("fb_iab");

  // Set a global state for other components to use
  useState("isInFacebookBrowser", () => isFacebookBrowser);
});
