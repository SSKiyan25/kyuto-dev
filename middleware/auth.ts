export default defineNuxtRouteMiddleware(async (to) => {
  const currentUser = useCurrentUser();

  if (currentUser.value === undefined) {
    return navigateTo({
      path: "/loading",
      query: { redirect: to.fullPath },
    });
  }

  // Once Firebase is ready, check if the user is authenticated
  // if (!currentUser.value) {
  //   return navigateTo({
  //     path: "/login",
  //     query: { redirect: to.fullPath },
  //   });
  // }
});
