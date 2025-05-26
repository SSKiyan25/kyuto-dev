<template>
  <div>
    <UiDialog v-model:open="isOpen">
      <UiDialogTrigger as-child>
        <UiButton class="mt-2 sm:mt-0" @click="openDialog">Choose a Product</UiButton>
      </UiDialogTrigger>
      <UiDialogContent
        class="overflow-y-auto sm:max-h-[600px] sm:max-w-[800px]"
        title="Your Products"
        description="Select a product to view and manage its associated orders."
      >
        <template #content>
          <div
            v-for="product in products"
            :key="product.id"
            :class="[
              'flex flex-row items-center space-x-4 px-6 py-2',
              {
                'bg-primary/10': selectedProduct === product,
                'hover:bg-secondary/50': selectedProduct !== product,
              },
            ]"
            @click="selectedProduct = product"
          >
            <input
              type="radio"
              :value="product"
              v-model="selectedProduct"
              name="selectedProduct"
              class="text-primary-600 form-radio h-4 w-4 transition duration-150 ease-in-out"
            />
            <div class="h-16 w-16 overflow-hidden">
              <img
                :src="product.featuredPhotoURL || '/placeholder-img.jpg'"
                class="h-full w-full rounded-sm object-cover"
              />
            </div>
            <div class="flex flex-col">
              <span class="text-lg font-semibold">{{ product.name }}</span>
              <span class="text-sm text-muted-foreground">
                Total Orders:
                <span class="text-secondary-foreground">{{ product.totalOrders || 0 }}</span>
              </span>
              <span class="text-sm text-muted-foreground">
                Total Sales:
                <span class="text-secondary-foreground">{{ product.totalSales || 0 }}</span>
              </span>
            </div>
          </div>
        </template>
        <template #footer>
          <UiDialogFooter>
            <UiButton @click="cancel" variant="outline" type="button" :disabled="loading"
              >Cancel</UiButton
            >
            <UiButton @click="confirm" type="button" :disabled="!selectedProduct || loading"
              >Choose</UiButton
            >
          </UiDialogFooter>
        </template>
      </UiDialogContent>
    </UiDialog>
  </div>
</template>

<script lang="ts" setup>
  import type { Product } from "~/types/models/Product";

  type ExtendedProduct = Product & { id: string };

  const props = defineProps<{
    products: ExtendedProduct[];
    loading: boolean;
  }>();

  const emit = defineEmits<{
    select: [product: ExtendedProduct | null, save: boolean];
    "update:open": [value: boolean];
  }>();

  const isOpen = defineModel<boolean>("open", { required: true });
  const selectedProduct = ref<ExtendedProduct | null>(null);

  const openDialog = () => {
    isOpen.value = true;
  };

  const cancel = () => {
    emit("select", null, false);
    selectedProduct.value = null;
  };

  const confirm = () => {
    if (selectedProduct.value) {
      emit("select", selectedProduct.value, true);
    }
  };
</script>
