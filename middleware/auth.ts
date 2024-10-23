export default defineNuxtRouteMiddleware(async (to) => {
  // Wait for the currentUser to be resolved
  const user = await new Promise((resolve) => {
    getCurrentUser().then((user) => {
      resolve(user);
    });
  });

  if (!user) {
    return await navigateTo({
      path: "/login",
      query: {
        redirect: to.fullPath,
      },
    });
  }
});
