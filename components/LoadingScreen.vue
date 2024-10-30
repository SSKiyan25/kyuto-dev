<template>
  <div class="loading-screen">
    <p>Loading...</p>
  </div>
</template>

<script lang="ts" setup></script>

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
