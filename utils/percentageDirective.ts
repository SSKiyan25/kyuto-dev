import type { DirectiveBinding } from "vue";

const percentageDirective = {
  mounted(el: HTMLInputElement, binding: DirectiveBinding) {
    const formatValue = (value: string | null) => {
      if (value === null || value === undefined) {
        return "";
      }
      if (!value.endsWith("%")) {
        return `${value}%`;
      }
      return value;
    };

    el.value = formatValue(el.value);

    el.addEventListener("input", () => {
      el.value = formatValue(el.value.replace("%", ""));
      binding.instance?.$emit("update:modelValue", parseFloat(el.value.replace("%", "")));
    });
  },
};

export default percentageDirective;
