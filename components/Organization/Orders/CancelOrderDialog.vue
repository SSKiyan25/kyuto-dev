<template>
  <UiAlertDialog :open="open" @update:open="handleUpdateOpen">
    <UiAlertDialogContent class="bg-secondary">
      <UiAlertDialogHeader>
        <UiAlertDialogTitle>Are you absolutely sure?</UiAlertDialogTitle>
        <UiAlertDialogDescription>
          This action cannot be undone. This will permanently cancel the order.
          <UiInput v-model="remarks" type="text" placeholder="Enter reason" class="mt-4" />
        </UiAlertDialogDescription>
      </UiAlertDialogHeader>
      <UiAlertDialogFooter>
        <UiAlertDialogCancel @click="emitClose">Cancel</UiAlertDialogCancel>
        <UiAlertDialogAction @click="emitConfirm" :disabled="remarks === ''" variant="destructive"
          >Confirm</UiAlertDialogAction
        >
      </UiAlertDialogFooter>
    </UiAlertDialogContent>
  </UiAlertDialog>
</template>

<script lang="ts" setup>
  const props = defineProps<{
    open: boolean;
  }>();

  const emit = defineEmits<{
    close: [];
    confirm: [remarks: string];
    "update:open": [value: boolean];
  }>();

  const remarks = ref("");

  // Emit close event
  const emitClose = () => {
    emit("close");
    emit("update:open", false);
  };

  // Emit confirm event
  const emitConfirm = () => {
    emit("confirm", remarks.value);
    emit("update:open", false);
  };

  // Handle dialog open state changes
  const handleUpdateOpen = (value: boolean) => {
    emit("update:open", value);
    if (!value) {
      remarks.value = "";
    }
  };

  watch(
    () => props.open,
    (newValue) => {
      if (!newValue) {
        remarks.value = "";
      }
    }
  );
</script>
