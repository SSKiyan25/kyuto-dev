<!-- components/PaymentModal.vue -->
<template>
  <UiDialog v-model:open="isOpen">
    <UiDialogContent class="sm:max-w-[425px]">
      <UiDialogHeader>
        <UiDialogTitle>Record Payment</UiDialogTitle>
        <UiDialogDescription>
          Record commission payment for {{ organizationName }}
        </UiDialogDescription>
      </UiDialogHeader>

      <form @submit="onSubmit">
        <fieldset :disabled="isSubmitting">
          <div class="grid gap-4 py-4">
            <!-- Unpaid Balance -->
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">Unpaid Balance:</span>
              <span class="font-medium">₱{{ unpaidAmount.toLocaleString() }}</span>
            </div>

            <!-- Payment Amount -->
            <UiVeeNumberField
              label="Payment Amount"
              name="amount"
              type="number"
              :placeholder="'Enter amount'"
              :max="unpaidAmount"
              :min="0"
              :decimal-places="2"
              :disabled="isSubmitting"
              required
            />

            <!-- Payment Date -->
            <UiVeeInput
              label="Payment Date"
              name="dateCreated"
              type="date"
              :placeholder="'Select payment date'"
              :disabled="isSubmitting"
              required
            />

            <!-- Payment Method -->
            <UiVeeSelect label="Payment Method" name="method" :disabled="isSubmitting" required>
              <option disabled value="">Select Method</option>
              <option v-for="method in paymentMethods" :key="method" :value="method">
                {{ method }}
              </option>
            </UiVeeSelect>

            <!-- Remarks -->
            <UiVeeInput
              label="Remarks"
              name="remarks"
              type="text"
              :placeholder="'Enter remarks (optional)'"
              :disabled="isSubmitting"
            />

            <!-- Reference Number -->
            <UiVeeInput
              label="Reference Number"
              name="reference"
              :placeholder="'Generated automatically'"
              disabled
            />
          </div>
        </fieldset>

        <UiDialogFooter>
          <UiButton variant="outline" @click="isOpen = false">Cancel</UiButton>
          <UiButton type="submit" :disabled="isSubmitting">Record Payment</UiButton>
        </UiDialogFooter>
      </form>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  import { useCommission } from "~/composables/admin/useCommission";
  import { disallowedCharactersRegex } from "~/utils/validation";
  import * as yup from "yup";
  import type { CommissionPayment } from "~/composables/admin/useCommission";

  const props = defineProps({
    organizationName: {
      type: String,
      required: true,
    },
    unpaidAmount: {
      type: Number,
      required: true,
    },
    organizationId: {
      type: String,
      required: true,
    },
  });

  const emit = defineEmits(["paymentSuccess"]);
  const isOpen = ref(false);
  const paymentMethods = ["Bank Transfer", "Cash", "Check", "Online Payment"];
  const { recordCommissionPayment } = useCommission();

  const generateReferenceNumber = (): string => {
    return Math.random().toString(16).substring(2, 10).toUpperCase();
  };

  console.log("Unpaid Amount:", props.unpaidAmount);
  console.log("Organization ID:", props.organizationId);

  const schema = computed(() =>
    yup.object({
      amount: yup
        .number()
        .required("Payment amount is required")
        .max(props.unpaidAmount, `Amount cannot exceed ₱${props.unpaidAmount}`),
      dateCreated: yup.date().required("Payment date is required"),
      method: yup.string().required("Payment method is required"),
      remarks: yup.string().nullable().matches(disallowedCharactersRegex, "Invalid characters"),
      reference: yup.string(),
    })
  );

  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: schema,
    initialValues: {
      amount: 0,
      dateCreated: new Date().toISOString().split("T")[0],
      method: "",
      remarks: "",
      reference: generateReferenceNumber(),
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    console.log("Form Values:", values);
    console.log("Organization ID:", props.organizationId);
    try {
      const completePaymentData: CommissionPayment = {
        ...values,
        organizationId: props.organizationId,
        id: "", // Firestore will generate this
        isArchived: false,
        dateCreated: new Date(values.dateCreated),
        lastModified: new Date(),
        status: "partial",
      };

      // Record the payment
      await recordCommissionPayment(props.organizationId, completePaymentData);

      // Emit success event
      emit("paymentSuccess");

      // Close the modal
      isOpen.value = false;
    } catch (error) {
      console.error("Error recording payment:", error);
    }
  });

  // Expose open/close methods
  defineExpose({
    open: () => (isOpen.value = true),
    close: () => (isOpen.value = false),
  });
</script>
