<template>
  <div class="w-full">
    <div class="pt-4">
      <span class="text-lg font-semibold">Commission Summary</span>
    </div>
    <div class="flex w-full flex-col gap-2 p-4">
      <!-- Paid and Total Commission -->
      <div class="flex justify-between text-xs sm:text-sm">
        <span>
          ₱{{ formatCurrency(paidCommission) }} / ₱{{ formatCurrency(totalCommission) }} ({{
            paidPercentage.toFixed(2)
          }}%)
        </span>
        <span class="font-medium text-green-600">Paid</span>
      </div>

      <!-- Progress Bar -->
      <div class="h-2 w-full overflow-hidden rounded-full bg-gray-200">
        <div class="h-full bg-green-500" :style="{ width: `${paidPercentage}%` }"></div>
      </div>

      <!-- Unpaid Commission -->
      <div class="flex justify-between text-xs text-gray-500 sm:text-sm">
        <span>Unpaid</span>
        <span>₱{{ formatCurrency(unpaidCommission) }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    paidCommission: number;
    unpaidCommission: number;
  }>();

  const totalCommission = computed(() => {
    return props.paidCommission + props.unpaidCommission;
  });

  const paidPercentage = computed(() =>
    totalCommission.value > 0 ? (props.paidCommission / totalCommission.value) * 100 : 0
  );

  // Format currency to always show 2 decimal places
  const formatCurrency = (value: number): string => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };
</script>
