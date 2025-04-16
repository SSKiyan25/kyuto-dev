import type { EnhancedCommissionRate } from "~/composables/useCommissionRate";

export const usePriceCalculator = (commissionRate: Ref<EnhancedCommissionRate | null>) => {
  const calculatePriceWithCommission = (price: number): number => {
    if (commissionRate.value && commissionRate.value.rate) {
      const calculatedPrice = price * (1 + commissionRate.value.rate / 100);
      return parseFloat(calculatedPrice.toFixed(2));
    }
    return parseFloat(price.toFixed(2));
  };

  return { calculatePriceWithCommission };
};
