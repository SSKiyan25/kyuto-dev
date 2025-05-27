<script setup lang="ts">
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";

  const props = defineProps<{
    variations: Array<{ value: string; price: number; stocks: number }>;
    isSubmitting: boolean;
  }>();

  const emit = defineEmits<{
    (e: "add"): void;
    (e: "remove", index: number): void;
    (
      e: "update:variations",
      variations: Array<{ value: string; price: number; stocks: number }>
    ): void;
    (e: "validation-change", isValid: boolean): void;
  }>();

  const validateVariations = () => {
    const isValid = props.variations.every(
      (v) => v.value && v.value.trim() !== "" && v.price && v.price > 0
    );
    emit("validation-change", isValid);
  };

  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  watch(
    () => props.variations,
    () => validateVariations(),
    { deep: true, immediate: true }
  );

  onMounted(() => {
    fetchCommissionRate();
  });
</script>

<template>
  <UiCardContent class="p-6">
    <div class="mb-4 flex w-full items-center justify-between">
      <div class="flex flex-col items-start gap-1">
        <div class="flex items-center">
          <Icon name="lucide:layers" class="mr-2 h-5 w-5 text-green-600" />
          <span class="text-lg font-semibold text-slate-800 sm:text-xl">Variations</span>
        </div>
        <p class="text-xs text-slate-500 sm:text-sm">
          Add variations (e.g. Size, Color) to your product. You can add up to 10.
        </p>
      </div>
    </div>

    <UiGradientDivider class="mb-6" />

    <fieldset :disabled="isSubmitting" class="w-full">
      <div class="mb-5 rounded-md border border-green-100 bg-green-50 p-4">
        <div class="text-sm font-medium text-green-800">Variation Guide</div>
        <p class="mt-1 text-xs text-green-700">
          Create options like Small, Medium, Large for sizes or Red, Blue, Green for colors. Each
          variation can have its own price and stock quantity.
        </p>
      </div>

      <!-- Variation cards -->
      <div class="space-y-5">
        <UiCard
          v-for="(variation, index) in variations"
          :key="index"
          class="overflow-hidden border transition-all hover:shadow-md"
          :class="index % 2 === 0 ? 'border-slate-200 bg-white' : 'border-slate-200 bg-slate-50'"
        >
          <UiCardHeader class="p-4 pb-2">
            <UiCardTitle class="flex items-center justify-between text-base text-slate-800">
              <div class="flex items-center">
                <Icon name="lucide:tag" class="mr-2 h-4 w-4 text-green-600" />
                Variation {{ index + 1 }}
              </div>
              <UiButton
                v-if="variations.length > 1"
                @click.prevent="emit('remove', index)"
                variant="ghost"
                size="sm"
                class="h-8 w-8 p-0 text-slate-500 hover:bg-red-50 hover:text-red-600"
              >
                <Icon name="lucide:trash-2" class="h-4 w-4" />
                <span class="sr-only">Remove Variation</span>
              </UiButton>
            </UiCardTitle>
          </UiCardHeader>

          <UiCardContent class="p-4 pt-1">
            <div class="grid grid-cols-1 gap-5 sm:grid-cols-12">
              <div class="sm:col-span-5">
                <UiVeeInput
                  :name="'variations[' + index + '].name'"
                  label="Variation Name"
                  placeholder="e.g. Small, Red, 16oz"
                  required
                  class="w-full"
                  v-model="variation.value"
                >
                  <template #description>
                    <span class="text-xs text-slate-500"> The option name customers will see </span>
                  </template>
                </UiVeeInput>
              </div>

              <div class="sm:col-span-4">
                <UiVeeNumberField
                  :min="1"
                  :max="10000"
                  label="Price"
                  :name="'variations[' + index + '].price'"
                  :decimal-places="2"
                  v-model="variation.price"
                  required
                >
                  <template #description>
                    <span class="text-xs text-slate-500">
                      The base price (without commission)
                    </span>
                  </template>
                  <UiNumberFieldInput placeholder="0.00" step="0.01">
                    <template #prefix>₱</template>
                  </UiNumberFieldInput>
                </UiVeeNumberField>
              </div>

              <div class="sm:col-span-3">
                <UiVeeNumberField
                  :min="0"
                  :max="10000"
                  label="Stocks"
                  :name="'variations[' + index + '].stocks'"
                  v-model="variation.stocks"
                >
                  <template #description>
                    <span class="text-xs text-slate-500"> Available quantity </span>
                  </template>
                  <UiNumberFieldInput placeholder="0" />
                </UiVeeNumberField>
              </div>
            </div>

            <!-- Commission information -->
            <div class="mt-4 rounded-md border border-green-100 bg-green-50 p-4">
              <div class="flex items-center space-x-2">
                <Icon name="lucide:info" class="h-4 w-4 text-green-500" />
                <span class="text-xs font-medium text-green-800">Price with Commission:</span>
                <span class="rounded bg-green-100 px-2 py-0.5 text-xs font-bold text-green-900">
                  ₱{{ calculatePriceWithCommission(variation.price || 0).toFixed(2) }}
                </span>
              </div>
              <p class="mt-1 text-xs text-green-700">
                Commission Rate: {{ commissionRate?.rate || 0 }}%
              </p>
            </div>
          </UiCardContent>
        </UiCard>
      </div>

      <div class="mt-5 flex flex-col items-center justify-center gap-2">
        <UiButton
          variant="outline"
          @click.prevent="emit('add')"
          :disabled="variations.length >= 10"
          class="w-full border-green-200 bg-white text-green-700 hover:bg-green-50 sm:w-1/2 md:w-1/3"
        >
          <Icon name="lucide:plus" class="mr-2 h-4 w-4" />
          Add Variation ({{ variations.length }}/10)
        </UiButton>
      </div>
    </fieldset>
  </UiCardContent>
</template>
