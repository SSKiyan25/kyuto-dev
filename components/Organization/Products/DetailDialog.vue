<script setup lang="ts">
  import { useCommissionRate } from "~/composables/useCommissionRate";
  import { usePriceCalculator } from "~/composables/usePriceCalculator";
  import type { Product } from "~/types/models/Product";

  // Define a type that includes the properties you need
  type ProductDetails = Partial<Product> & {
    id?: string;
    price?: number;
    stock?: number;
    date?: string;
  };

  const props = defineProps<{
    open: boolean;
    product: ProductDetails | null;
  }>();

  defineEmits<{
    (e: "update:open", value: boolean): void;
  }>();

  // Use the composables directly
  const { commissionRate, fetchCommissionRate } = useCommissionRate();
  const { calculatePriceWithCommission } = usePriceCalculator(commissionRate);

  onMounted(() => {
    fetchCommissionRate();
  });
</script>

<template>
  <UiDialog :open="open" @update:open="$emit('update:open', $event)">
    <UiDialogContent class="max-h-[95vh] w-[95vw] max-w-[350px] overflow-y-auto sm:max-w-[450px]">
      <UiDialogHeader>
        <UiDialogTitle>Product Details</UiDialogTitle>
        <UiDialogDescription class="text-xs sm:text-sm">
          Overview of the product and its details.
        </UiDialogDescription>
      </UiDialogHeader>

      <div v-if="product" class="space-y-4 pt-2">
        <div class="flex flex-col gap-1">
          <h3 class="text-base font-semibold sm:text-lg">{{ product.name || "" }}</h3>
          <UiBadge
            :variant="
              product.status === 'Draft'
                ? 'outline'
                : product.status === 'Archived'
                  ? 'destructive'
                  : 'default'
            "
            class="w-fit capitalize"
          >
            {{ product.status || "Unknown" }}
          </UiBadge>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground sm:text-sm">Category</p>
            <p class="text-sm font-medium sm:text-base">{{ product.category || "-" }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground sm:text-sm">Price</p>
            <p class="text-sm font-medium sm:text-base">
              ₱{{ calculatePriceWithCommission(Number(product.price || 0)).toFixed(2) }}
            </p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground sm:text-sm">Remaining Stock</p>
            <p class="text-sm font-medium sm:text-base">{{ product.stock || "-" }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-xs text-muted-foreground sm:text-sm">Added on</p>
            <p class="text-sm font-medium sm:text-base">{{ product.date || "-" }}</p>
          </div>
        </div>

        <UiDialogFooter class="flex-col gap-2 pt-2 sm:flex-row sm:gap-0">
          <UiButton variant="outline" @click="$emit('update:open', false)" class="w-full sm:w-auto">
            Close
          </UiButton>
          <UiButton
            :to="`/organization/products/edit/${product.id || ''}`"
            class="w-full sm:w-auto"
          >
            Edit Product
          </UiButton>
        </UiDialogFooter>
      </div>
    </UiDialogContent>
  </UiDialog>
</template>
