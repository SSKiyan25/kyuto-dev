<template>
  <ComboboxContent v-bind="forwarded" :class="styles({ class: props.class })">
    <slot />
  </ComboboxContent>
</template>

<script lang="ts" setup>
  import { ComboboxContent, useForwardPropsEmits } from "radix-vue";
  import type { ComboboxContentEmits, ComboboxContentProps } from "radix-vue";

  defineOptions({ inheritAttrs: false });

  const props = defineProps<
    ComboboxContentProps & {
      /**Custom class(es) to add to the element */
      class?: any;
    }
  >();

  const emits = defineEmits<ComboboxContentEmits>();
  const forwarded = useForwardPropsEmits(reactiveOmit(props, "class"), emits);

  const styles = tv({
    base: "max-h-[300px] overflow-y-auto overflow-x-hidden",
  });

  const isInputVisible = ref(true);
  const commandInputContainer = ref(null);

  const handleClickOutside = (event: MouseEvent) => {
    const container = commandInputContainer.value as HTMLElement | null;
    if (container && !container.contains(event.target as Node)) {
      isInputVisible.value = false;
    }
  };

  onMounted(() => {
    document.addEventListener("click", handleClickOutside);
  });

  onBeforeUnmount(() => {
    document.removeEventListener("click", handleClickOutside);
  });
</script>
