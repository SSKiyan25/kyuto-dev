<template>
  <PinInputInput v-bind="forwarded" :class="styles({ class: props.class })" />
</template>

<script lang="ts" setup>
  import { PinInputInput } from "radix-vue";
  import type { PinInputInputProps } from "radix-vue";

  const props = defineProps<
    PinInputInputProps & {
      class?: any;
    }
  >();
  const forwarded = reactiveOmit(props, "class");
  const styles = tv({
    base: "h-16 w-16 rounded-md border border-input bg-background p-1 text-center text-base font-medium placeholder:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm",
  });
</script>
