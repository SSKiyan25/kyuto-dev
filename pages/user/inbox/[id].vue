<template>
  <!-- <div class="p-32">Inbox Page</div>
  {{ userID }}//////////////////////////////////////////////// -->
  <ADComingSoon />
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: "user-auth",
    layout: "user",
  });
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
</script>

<style></style>
