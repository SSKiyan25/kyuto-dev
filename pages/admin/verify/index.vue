<template>
  <div class="flex h-screen w-full items-center justify-center">
    <div class="flex flex-col items-center justify-center space-y-2 border p-8 shadow-md">
      <div class="flex items-center justify-center">
        <UiLabel class="flex flex-col items-center">
          <p class="mb-3 text-lg font-medium uppercase">Input pin to proceed</p>
          <UiPinInput
            v-model="pinDigits"
            type="number"
            placeholder="0"
            separator="-"
            class="p-2"
            @complete="submit"
          />
        </UiLabel>
      </div>
      <p v-if="isError" class="font-semibold text-red-500">Wrong Pin</p>
    </div>
  </div>
</template>

<script lang="ts" setup>
  definePageMeta({
    layout: "no-nav",
    middleware: "already-logged-in",
  });

  const pinDigits = ref<string[]>(["", "", "", ""]);
  const isError = ref(false);

  const submit = () => {
    const enteredPin = pinDigits.value.join("");
    if (enteredPin === "5878") {
      return navigateTo("/admin/verify/login");
    } else {
      isError.value = true;
      setTimeout(() => {
        pinDigits.value = ["", "", "", ""];
        isError.value = false;
      }, 2000);
    }
  };
</script>
