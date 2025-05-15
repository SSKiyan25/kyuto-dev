<template>
  <UiAlertDialog :open="dialogOpen" @update:open="updateOpen">
    <UiAlertDialogContent class="bg-secondary">
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          This action cannot be undone. Please state your reason for cancelling your order.
          <UiInput
            v-model="cancelRemarks"
            type="text"
            placeholder="Enter reason"
            class="mt-4"
            :class="{ 'border-red-500': !isValidCancelRemarks }"
          />
          <p v-if="!isValidCancelRemarks" class="mt-2 text-sm text-red-500">
            Remarks must be under 150 characters and cannot contain invalid characters.
          </p>
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="closeDialog">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction
          @click="confirmCancelOrder"
          :disabled="!isValidCancelRemarks"
          variant="destructive"
        >
          Confirm
        </UiAlertDialogAction>
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>

<script lang="ts" setup>
  import { computed } from "vue";

  const props = defineProps<{
    isOpen: boolean;
    orderId: string | null;
  }>();

  const emit = defineEmits<{
    (e: "update:isOpen", value: boolean): void;
    (e: "cancelOrder", orderId: string, remarks: string): void;
  }>();

  const cancelRemarks = ref("");

  // Use computed property with getter and setter
  const dialogOpen = computed(() => props.isOpen);

  const updateOpen = (value: boolean) => {
    emit("update:isOpen", value);
    if (!value) {
      cancelRemarks.value = ""; // Reset remarks when closing
    }
  };

  // Close the dialog
  const closeDialog = () => {
    emit("update:isOpen", false);
    cancelRemarks.value = ""; // Reset remarks when closing
  };

  // Validation
  const disallowedCharactersRegex = /^[^<@#`'"%;\\\[\]{}|&$*^~:/+=\r\n]*$/;

  const isValidCancelRemarks = computed(() => {
    return cancelRemarks.value.length <= 150 && disallowedCharactersRegex.test(cancelRemarks.value);
  });

  // Confirm cancellation
  const confirmCancelOrder = async () => {
    if (!props.orderId || !isValidCancelRemarks.value) {
      return;
    }

    emit("cancelOrder", props.orderId, cancelRemarks.value);
    closeDialog();
  };
</script>
