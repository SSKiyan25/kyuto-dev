<template>
  <div>Testing Admin Organization Page</div>
</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "admin",
    middleware: ["auth-admin"],
  });
</script>

<style></style>
