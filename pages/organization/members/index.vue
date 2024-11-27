<script lang="ts" setup>
  import { _colors } from "#tailwind-config/theme";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });
</script>

<template>
  <div class="flex w-full flex-col p-12">
    <div><span class="text-2xl font-bold">Members</span></div>
  </div>
</template>
