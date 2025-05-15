<template>
  <UiDialog :open="isOpen" @update:open="">
    <UiDialogContent class="max-h-[90vh] w-full max-w-md overflow-y-auto sm:max-w-lg md:max-w-xl">
      <UiDialogHeader class="space-y-1.5 text-center sm:text-left">
        <UiDialogTitle class="text-xl font-bold sm:text-2xl">
          Terms & Privacy Agreement
        </UiDialogTitle>
        <UiDialogDescription>
          Please review and accept our terms before continuing
        </UiDialogDescription>
      </UiDialogHeader>

      <div class="legal-container mt-4 max-h-[50vh] overflow-y-auto rounded-md border p-4">
        <!-- Terms Section -->
        <div class="mb-6 rounded-lg border bg-card/40 p-4">
          <div class="flex items-center gap-3 border-b pb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Icon name="lucide:file-text" class="h-4 w-4 text-primary" />
            </div>
            <h2 class="text-lg font-semibold">Terms of Service</h2>
          </div>

          <div class="mt-3 space-y-3 text-sm">
            <div class="space-y-1">
              <p class="font-medium">Academic Purpose:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span
                  >This platform is a Computer Science thesis project at Visayas State
                  University</span
                >
              </p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Not for commercial use</span>
              </p>
            </div>

            <div class="space-y-1">
              <p class="font-medium">User Obligations:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Provide accurate academic information</span>
              </p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>No fraudulent orders</span>
              </p>
            </div>

            <div class="space-y-1">
              <p class="font-medium">Liability:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>No warranty for system downtime</span>
              </p>
            </div>

            <div class="space-y-1">
              <p class="font-medium">Governing Law:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Republic Act 10173 (Philippine Data Privacy Act)</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Privacy Section -->
        <div class="mb-6 rounded-lg border bg-card/40 p-4">
          <div class="flex items-center gap-3 border-b pb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Icon name="lucide:shield" class="h-4 w-4 text-primary" />
            </div>
            <h2 class="text-lg font-semibold">Privacy Policy</h2>
          </div>

          <div class="mt-3 space-y-3 text-sm">
            <div class="space-y-1">
              <p class="font-medium">Controller:</p>
              <p>
                Joshua A. Sosmeña<br />Computer Science Thesis Project<br />
                Visayas State University<br />Contact: 20-1-01709@vsu.edu.ph
              </p>
            </div>

            <div class="space-y-1">
              <p class="font-medium">Data Collected:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Name, Email, Phone Number</span>
              </p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Student ID (optional), Course (e.g., BSCS), Faculty</span>
              </p>
            </div>

            <div class="space-y-1">
              <p class="font-medium">Security:</p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>HTTPS encryption, Role-based access controls</span>
              </p>
              <p class="flex gap-2">
                <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
                <span>Regular security audits (ISO 25010 aligned)</span>
              </p>
            </div>
          </div>
        </div>

        <!-- Incident Response Section -->
        <div class="rounded-lg border bg-card/40 p-4">
          <div class="flex items-center gap-3 border-b pb-3">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
              <Icon name="lucide:alert-triangle" class="h-4 w-4 text-primary" />
            </div>
            <h2 class="text-lg font-semibold">Incident Response</h2>
          </div>

          <div class="mt-3 space-y-2 text-sm">
            <p class="flex gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                >1</span
              >
              <span>Immediately disable compromised accounts</span>
            </p>
            <p class="flex gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                >2</span
              >
              <span>Notify affected users via email within 72 hours</span>
            </p>
            <p class="flex gap-2">
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
                >3</span
              >
              <span>Document details for thesis defense reporting</span>
            </p>
          </div>
        </div>

        <p class="mt-4 text-center text-xs text-muted-foreground">Last Updated: April 20, 2025</p>
      </div>

      <!-- Checkboxes -->
      <div class="mt-6 space-y-3">
        <label class="flex cursor-pointer items-start gap-2">
          <UiCheckbox v-model:checked="consentTerms" required />
          <span class="text-sm"
            >I have read and agree to the
            <span class="font-medium text-primary">Terms of Service</span></span
          >
        </label>

        <label class="flex cursor-pointer items-start gap-2">
          <UiCheckbox v-model:checked="consentPrivacy" required />
          <span class="text-sm"
            >I understand and accept the
            <span class="font-medium text-primary">Privacy Policy</span></span
          >
        </label>
      </div>

      <!-- Footer Buttons -->
      <UiDialogFooter class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <UiButton variant="outline" @click="$emit('cancel')"> Cancel </UiButton>
        <UiButton @click="$emit('accept')" :disabled="!isValid"> Continue </UiButton>
      </UiDialogFooter>
    </UiDialogContent>
  </UiDialog>
</template>

<script lang="ts" setup>
  const isOpen = ref(true);
  const consentTerms = ref(false);
  const consentPrivacy = ref(false);

  const isValid = computed(() => consentTerms.value && consentPrivacy.value);
</script>

<style scoped>
  .legal-container {
    scrollbar-width: thin;
    scrollbar-color: rgba(155, 155, 155, 0.5) transparent;
  }

  .legal-container::-webkit-scrollbar {
    width: 6px;
  }

  .legal-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .legal-container::-webkit-scrollbar-thumb {
    background-color: rgba(155, 155, 155, 0.5);
    border-radius: 20px;
  }
</style>
