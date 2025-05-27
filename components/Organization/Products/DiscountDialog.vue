<script setup lang="ts">
  import { addDiscountToProduct, fetchVariations } from "~/composables/organization/useProducts";
  import type { Variation } from "~/types/models/Product";

  const props = defineProps<{
    open: boolean;
    productId: string;
    productName: string;
  }>();

  const emit = defineEmits<{
    (e: "update:open", value: boolean): void;
    (e: "discount-added"): void;
  }>();

  const toast = useToast();
  const discountType = ref("percentage");
  const discountTarget = ref("member");
  const variations = ref<(Variation & { id: string })[]>([]);
  const isCustomDiscount = computed(() => discountType.value === "custom");
  const isLoading = ref(false);

  const discountTargetOptions = [
    { value: "member", text: "Member", description: "Apply discount to all members" },
    { value: "code", text: "Discount Code", description: "Create a code customers can redeem" },
  ];

  const discountTypeOptions = [
    {
      value: "percentage",
      text: "Percentage",
      description: "Apply a percentage discount on product price",
      icon: "lucide:percent",
    },
    {
      value: "custom",
      text: "Custom Pricing",
      description: "Set custom prices for each product variation",
      icon: "lucide:edit",
    },
  ];

  const { handleSubmit, resetForm, isSubmitting } = useForm({
    validationSchema: toTypedSchema(DiscountSchema),
  });

  const formatPrice = (price: number) => {
    return price.toFixed(2);
  };

  const onSubmit = handleSubmit(async (values) => {
    const validCustomDiscountPrices = values.customDiscountPrices?.filter(
      (item) => item.price !== undefined
    ) as { id: string; price: number }[];

    try {
      isLoading.value = true;
      await addDiscountToProduct(
        props.productId,
        values.discountType,
        values.discountTarget,
        values.discount,
        values.discountCode,
        validCustomDiscountPrices
      );
      toast.toast({
        title: "Discount added",
        description: "The discount has been added successfully.",
        variant: "success",
        icon: "lucide:check",
      });
      emit("discount-added");
    } catch (error: any) {
      toast.toast({
        title: "Error",
        description: `An error occurred while adding the discount: ${error.message}`,
        variant: "destructive",
        icon: "lucide:alert-circle",
      });
      console.error("Error adding discount:", error);
    } finally {
      isLoading.value = false;
    }

    closeDialog();
    discountTarget.value = "member";
    discountType.value = "percentage";
  });

  const closeDialog = () => {
    emit("update:open", false);
  };

  watch(
    () => props.open,
    async (newValue) => {
      if (newValue && props.productId) {
        // Fetch variations when dialog is opened
        isLoading.value = true;
        try {
          const variationsResult = await fetchVariations(props.productId);
          variations.value = variationsResult;
        } catch (error) {
          console.error("Error fetching variations:", error);
          toast.toast({
            title: "Error",
            description: "Failed to load product variations.",
            variant: "destructive",
            icon: "lucide:alert-circle",
          });
        } finally {
          isLoading.value = false;
        }
      }
    }
  );
</script>

<template>
  <UiDialog :open="open" @update:open="emit('update:open', $event)">
    <UiDialogContent class="max-h-[95vh] w-[95vw] overflow-y-auto sm:max-w-[650px]">
      <UiDialogHeader class="space-y-2 border-b pb-2">
        <UiDialogTitle class="flex items-center gap-2 text-lg sm:text-xl">
          <Icon name="lucide:tag" class="h-5 w-5 text-primary sm:h-6 sm:w-6" />
          Add Discount
        </UiDialogTitle>
        <UiDialogDescription class="text-xs sm:text-sm">
          Add a discount to your product. If a discount is already applied, it will be replaced.
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="my-3 flex items-center gap-2">
        <Icon name="lucide:package" class="h-4 w-4 text-muted-foreground" />
        <div class="text-base font-semibold sm:text-lg">{{ productName }}</div>
      </div>

      <form @submit.prevent="onSubmit">
        <div class="space-y-5 p-1 sm:p-2">
          <!-- Discount Type Section -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-muted-foreground">Discount Type</h3>
            <UiRadioGroup v-model="discountType">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <UiCard
                  v-for="opt in discountTypeOptions"
                  :key="opt.value"
                  :class="[
                    'cursor-pointer transition-all hover:border-primary',
                    discountType === opt.value ? 'border-primary bg-primary/5' : '',
                  ]"
                  @click="discountType = opt.value"
                >
                  <UiCardHeader class="space-y-1 p-3">
                    <UiCardTitle class="flex items-center gap-2 text-sm">
                      <Icon :name="opt.icon" class="h-4 w-4" />
                      {{ opt.text }}
                    </UiCardTitle>
                    <UiCardDescription class="text-xs">{{ opt.description }}</UiCardDescription>
                  </UiCardHeader>
                  <UiCardFooter class="flex justify-end p-3 pt-0">
                    <UiRadioGroupItem
                      :value="opt.value"
                      :id="`type-${opt.value}`"
                      class="h-4 w-4"
                    />
                  </UiCardFooter>
                </UiCard>
              </div>
            </UiRadioGroup>
          </div>

          <!-- Discount Target Section -->
          <div class="space-y-3">
            <h3 class="text-sm font-medium text-muted-foreground">Discount Target</h3>
            <UiRadioGroup v-model="discountTarget">
              <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <UiCard
                  v-for="opt in discountTargetOptions"
                  :key="opt.value"
                  :class="[
                    'cursor-pointer transition-all hover:border-primary',
                    discountTarget === opt.value ? 'border-primary bg-primary/5' : '',
                  ]"
                  @click="discountTarget = opt.value"
                >
                  <UiCardHeader class="space-y-1 p-3">
                    <UiCardTitle class="text-sm">{{ opt.text }}</UiCardTitle>
                    <UiCardDescription class="text-xs">{{ opt.description }}</UiCardDescription>
                  </UiCardHeader>
                  <UiCardFooter class="flex justify-end p-3 pt-0">
                    <UiRadioGroupItem
                      :value="opt.value"
                      :id="`target-${opt.value}`"
                      class="h-4 w-4"
                    />
                  </UiCardFooter>
                </UiCard>
              </div>
            </UiRadioGroup>
          </div>

          <!-- Percentage Discount Input -->
          <div v-if="!isCustomDiscount" class="space-y-2">
            <h3 class="text-sm font-medium text-muted-foreground">Discount Amount</h3>
            <UiVeeInput
              name="discount"
              label=""
              placeholder="Enter discount percentage (e.g. 10)"
              :min="0"
              :max="100"
              :disabled="isSubmitting"
              v-percentage
              class="w-full"
              containerClass="mt-1"
            >
              <template #prefix>
                <Icon name="lucide:percent" class="h-4 w-4 text-muted-foreground" />
              </template>
            </UiVeeInput>
            <p class="text-xs text-muted-foreground">Enter a value between 0-100</p>
          </div>

          <!-- Discount Code Input -->
          <div v-if="discountTarget === 'code'" class="space-y-2">
            <h3 class="text-sm font-medium text-muted-foreground">Discount Code</h3>
            <UiVeeInput
              name="discountCode"
              label=""
              placeholder="Enter discount code (e.g. SUMMER10)"
              :disabled="isSubmitting"
              class="w-full"
              containerClass="mt-1"
            >
              <template #prefix>
                <Icon name="lucide:ticket" class="h-4 w-4 text-muted-foreground" />
              </template>
            </UiVeeInput>
            <p class="text-xs text-muted-foreground">
              Code that customers can use to redeem this discount
            </p>
          </div>

          <!-- Custom Pricing Section -->
          <div v-if="discountType === 'custom'" class="space-y-4">
            <h3 class="text-sm font-medium text-muted-foreground">Custom Pricing</h3>

            <UiSkeleton v-if="isLoading" class="h-32 w-full" />

            <div v-else-if="variations.length === 0" class="rounded-lg bg-muted/50 p-4 text-center">
              <Icon name="lucide:package-x" class="mx-auto h-8 w-8 text-muted-foreground/60" />
              <p class="mt-2 text-sm text-muted-foreground">No variations found for this product</p>
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="(variation, index) in variations"
                :key="variation.id"
                class="rounded-md bg-muted/30 p-3"
              >
                <div class="mb-2 flex items-center justify-between gap-2">
                  <div class="flex flex-col">
                    <span class="text-sm font-medium">{{ variation.value }}</span>
                    <span class="text-xs text-muted-foreground">
                      Original price: ₱{{ formatPrice(variation.price) }}
                    </span>
                  </div>
                  <Icon name="lucide:tag" class="h-4 w-4 text-muted-foreground" />
                </div>

                <UiVeeInput
                  :name="'customDiscountPrices[' + index + '].id'"
                  v-model="variation.id"
                  hidden
                />
                <UiVeeInput
                  :name="'customDiscountPrices[' + index + '].price'"
                  :label="`Discounted price`"
                  :placeholder="formatPrice(variation.price)"
                  :max="variation.price"
                  :disabled="isSubmitting"
                  :min="0"
                  type="number"
                  step="0.01"
                  class="w-full"
                  containerClass="mt-1"
                >
                  <template #prefix>₱</template>
                </UiVeeInput>
              </div>
            </div>
          </div>

          <UiDialogFooter class="mt-6 flex-col gap-2 border-t pt-4 sm:flex-row sm:gap-0">
            <UiButton
              variant="outline"
              type="button"
              :disabled="isSubmitting || isLoading"
              @click="closeDialog"
              class="w-full sm:w-auto"
            >
              Cancel
            </UiButton>
            <UiButton
              :loading="isSubmitting || isLoading"
              type="submit"
              class="w-full gap-2 sm:w-auto"
            >
              <Icon name="lucide:tag" class="h-4 w-4" />
              Apply Discount
            </UiButton>
          </UiDialogFooter>
        </div>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>
