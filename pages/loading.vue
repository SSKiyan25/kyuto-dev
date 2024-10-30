<template>
  <div class="loading-screen">
    <p>Loading...</p>
  </div>
</template>

<script setup lang="ts">
  const currentUser = useCurrentUser();
  const router = useRouter();
  const route = useRoute();
  const previousUrl = ref(route.fullPath);

  watch(
    () => currentUser.value,
    (user) => {
      // Once Firebase Auth is loaded, redirect based on the auth status
      setTimeout(() => {
        if (user) {
          // If authenticated, navigate to the intended page or home
          const redirectPath =
            typeof route.query.redirect === "string" ? route.query.redirect : previousUrl.value;
          router.push(redirectPath);
        } else {
          // If not authenticated, navigate to login
          router.push({
            path: "/login",
            query: { redirect: route.fullPath },
          });
        }
      }, 2000); // 2 seconds delay
    },
    { immediate: true }
  );
</script>
<style>
  .loading-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: white;
    z-index: 9999;
  }
</style>
