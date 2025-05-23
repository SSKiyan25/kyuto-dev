<template>
  <UiDialog :open="isOpen" @update:open="toggleOpen">
    <UiDialogContent class="sm:max-w-[425px]">
      <UiDialogHeader>
        <UiDialogTitle>Cancel Order</UiDialogTitle>
        <UiDialogDescription>
          This action cannot be undone. Please provide a reason for cancellation.
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="grid gap-4 py-4">
        <div class="grid gap-2">
          <UiLabel for="reason" class="text-left">Reason</UiLabel>
          <UiTextarea
            id="reason"
            v-model="reason"
            placeholder="Please explain why you're canceling this order..."
            :class="{ 'border-destructive': hasValidationError }"
          />
          <p v-if="hasValidationError" class="text-sm text-destructive">
            Please provide a valid reason (5-200 characters)
          </p>
        </div>
      </div>

      <UiDialogFooter>
        <UiButton variant="outline" @click="toggleOpen(false)"> Cancel </UiButton>
        <UiButton variant="destructive" @click="submitCancellation">
          Confirm Cancellation
        </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    isOpen: boolean;
    orderId: string | null;
  }>();

  const emit = defineEmits<{
    (e: "update:isOpen", value: boolean): void;
    (e: "cancelOrder", orderId: string, remarks: string): void;
  }>();

  const reason = ref("");
  const hasValidationError = ref(false);

  function toggleOpen(value: boolean) {
    emit("update:isOpen", value);
    if (!value) {
      // Reset form when closing
      reason.value = "";
      hasValidationError.value = false;
    }
  }

  function submitCancellation() {
    // Simple validation - just check if the reason is provided and not too short
    if (!reason.value.trim() || reason.value.trim().length < 5 || reason.value.length > 200) {
      hasValidationError.value = true;
      return;
    }

    hasValidationError.value = false;

    if (props.orderId) {
      emit("cancelOrder", props.orderId, reason.value.trim());
      toggleOpen(false);
    }
  }
</script>
