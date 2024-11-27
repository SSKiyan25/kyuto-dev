<template>
  <div class="p-32">Profile Page</div>
  {{ userID }}////////////////////////////////////////////////
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: "auth",
    layout: "user",
  });
  const route = useRoute();
  const userID = computed(() => route.params.id as string);
</script>

<style></style>
