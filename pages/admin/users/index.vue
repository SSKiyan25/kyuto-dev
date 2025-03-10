<template>
  <div>Testing Admin Organization Page</div>
</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "admin",
    middleware: ["auth"],
  });
</script>

<style></style>
