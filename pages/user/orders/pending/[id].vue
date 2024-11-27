<template>
  <div class="p-32">Orders Page</div>
  {{ userID }}////////////////////////////////////////////////
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: "auth",
    layout: "user",
  });

  const breadcrumbs = [
    { label: "Building Your Application", link: "#" },
    { label: "Data Fetching", link: "#" },
  ];

  const route = useRoute();
  const userID = computed(() => route.params.id as string);
</script>

<style></style>
