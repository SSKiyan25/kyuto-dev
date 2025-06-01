<script setup lang="ts">
  defineProps({
    hasChanges: Boolean,
    orgId: [String, Object] as PropType<string | null | Ref<string | null>>,
  });

  defineEmits(["save"]);
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 z-10 border-t bg-background px-4 py-3 shadow-md">
    <div class="container mx-auto flex max-w-4xl items-center justify-between">
      <div class="flex items-center">
        <div v-if="hasChanges" class="flex items-center gap-2 text-xs sm:text-sm">
          <Icon name="lucide:info" class="h-4 w-4 text-primary" />
          <span>You have unsaved changes</span>
        </div>
      </div>

      <div class="flex flex-row gap-3">
        <UiButton variant="outline" class="w-auto" :to="`/organization/products/${orgId}`">
          <Icon name="lucide:x" class="mr-1 h-4 w-4 sm:mr-2" />
          <span>Cancel</span>
        </UiButton>

        <UiButton
          @click.prevent="$emit('save')"
          type="submit"
          class="w-auto"
          :disabled="!hasChanges"
          :variant="hasChanges ? 'default' : 'outline'"
        >
          <Icon name="lucide:save" class="mr-1 h-4 w-4 sm:mr-2" />
          <span>Save Changes</span>
        </UiButton>
      </div>
    </div>
  </div>

  <!-- Bottom spacer to prevent content from being hidden behind the fixed save bar -->
  <div class="h-20"></div>
</template>
