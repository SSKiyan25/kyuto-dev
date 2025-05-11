<script lang="ts" setup>
  import { _colors } from "#tailwind-config/theme";

  definePageMeta({
    layout: "organization",
    middleware: ["org-auth"],
  });
</script>

<template>
  <div class="flex w-full flex-col">
    <ADComingSoon />
  </div>
</template>
