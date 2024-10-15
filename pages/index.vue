<template>
  <div>Homepage</div>
  <div>{{ user }}</div>
</template>

<script lang="ts" setup>
  const user = useCurrentUser();
</script>
