<template>
  <div class="w-full">
    <UiLabel
      v-if="label"
      :for="inputId"
      :hint="labelHint"
      :class="[disabled && 'text-muted-foreground', errorMessage && 'text-destructive', 'mb-2']"
    >
      <span>{{ label }} <span v-if="required" class="text-destructive">*</span></span>
    </UiLabel>
    <div class="relative">
      <UiNumberField
        v-bind="forwardedProps"
        :id="inputId"
        v-model="numberValue"
        :disabled="disabled"
        :required="required"
        :name="name"
        :step="decimalStep"
      >
        <template v-for="(_, slotName) in $slots" #[slotName]="scope">
          <slot :name="slotName" v-bind="scope" />
        </template>
      </UiNumberField>
    </div>
    <TransitionSlide group tag="div">
      <p v-if="hint && !errorMessage" key="hint" class="mt-1.5 text-sm text-muted-foreground">
        {{ hint }}
      </p>
      <p v-if="errorMessage" key="errorMessage" class="mt-1.5 text-sm text-destructive">
        {{ errorMessage }}
      </p>
    </TransitionSlide>
  </div>
</template>

<script lang="ts" setup>
  import { computed } from "vue";
  import type { NumberFieldRootProps } from "radix-vue";

  interface CustomProps {
    label?: string;
    labelHint?: string;
    hint?: string;
    disabled?: boolean;
    name?: string;
    id?: string;
    rules?: any;
    validateOnMount?: boolean;
    required?: boolean;
    decimalPlaces?: number;
  }

  const props = withDefaults(defineProps<NumberFieldRootProps & CustomProps>(), {
    decimalPlaces: 2,
  });

  const emit = defineEmits<{
    (e: "update:modelValue", value: number | undefined): void;
  }>();

  const inputId = computed(() => props.id || useId());

  const { errorMessage, value } = useField(() => props.name || inputId.value, props.rules, {
    initialValue: props.modelValue,
    label: props.label,
    validateOnMount: props.validateOnMount,
    syncVModel: true,
  });

  const decimalStep = computed(() => {
    return parseFloat(`0.${"0".repeat(props.decimalPlaces - 1)}1`);
  });

  // Convert between null/undefined for Radix compatibility
  const numberValue = computed({
    get: () => {
      if (typeof props.modelValue === "number") {
        return parseFloat(props.modelValue.toFixed(props.decimalPlaces));
      }
      return undefined;
    },
    set: (val: number | undefined) => {
      const roundedVal =
        typeof val === "number" ? parseFloat(val.toFixed(props.decimalPlaces)) : undefined;

      emit("update:modelValue", roundedVal);
      value.value = roundedVal ?? 0;
    },
  });

  // Forward all props except our custom ones
  const forwardedProps = computed(() => {
    const { decimalPlaces, ...rest } = props;
    return rest;
  });
</script>
