<template>
  <UiDialog :open="isOpen" @update:open="">
    <UiDialogContent
      class="max-h-[80vh] max-w-[85vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg dark:bg-gray-800"
    >
      <UiDialogHeader class="mb-2">
        <UiDialogTitle class="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Terms & Privacy Agreement
        </UiDialogTitle>
      </UiDialogHeader>

      <LegalContent>
        <!-- Terms Section -->
        <h2 class="mb-2 mt-2 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Terms of Service
        </h2>
        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Academic Purpose:</strong><br />
          - This platform is a Computer Science thesis project at Visayas State University<br />
          - Not for commercial use
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>User Obligations:</strong><br />
          - Provide accurate academic information<br />
          - No fraudulent orders
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Liability:</strong><br />
          - No warranty for system downtime<br />
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Governing Law:</strong><br />
          - Republic Act 10173 (Philippine Data Privacy Act)
        </p>

        <p class="mb-6 text-gray-700 dark:text-gray-300">
          We do not use tracking cookies. Session data is stored locally for login purposes only.
        </p>

        <!-- Privacy Section -->
        <h2 class="mb-2 mt-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Privacy Policy
        </h2>
        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Controller:</strong><br />
          Joshua A. Sosmeña<br />
          Computer Science Thesis Project<br />
          Visayas State University<br />
          Contact: 20-1-01709@vsu.edu.ph
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Data Collected:</strong><br />
          - Name, Email, Phone Number<br />
          - Student ID (optional), Course (e.g., BSCS), Faculty (e.g., Faculty of Engineering)
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Purpose:</strong><br />
          - Order fulfillment and delivery coordination<br />
          - Account authentication via Google
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Third Parties:</strong><br />
          - Google Authentication (only for sign-in)<br />
          - No payment processors used (manual GCash receipts only)
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Security:</strong><br />
          - HTTPS encryption<br />
          - Role-based access controls<br />
          - Regular security audits (ISO 25010 aligned)
        </p>

        <p class="mb-4 text-gray-700 dark:text-gray-300">
          <strong>Your Rights:</strong><br />
          - Request data access/correction via 20-1-01709@vsu.edu.ph (15-day response)<br />
          - Delete account permanently
        </p>

        <p class="mb-6 text-gray-700 dark:text-gray-300">
          <strong>Breach Protocol:</strong><br />
          - Immediate notification via email if data is compromised
        </p>

        <!-- Incident Response Section -->
        <h2 class="mb-2 mt-6 text-xl font-semibold text-gray-800 dark:text-gray-200">
          Incident Response
        </h2>
        <ol class="mb-6 list-inside list-decimal text-gray-700 dark:text-gray-300">
          <li>Immediately disable compromised accounts</li>
          <li>Notify affected users via email within 72 hours</li>
          <li>Document details for thesis defense reporting</li>
        </ol>

        <p class="italic text-gray-600 dark:text-gray-400">Last Updated: April 20, 2025</p>
      </LegalContent>

      <!-- Checkboxes -->
      <div class="mt-6 space-y-4">
        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="consentTerms"
            required
            class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-gray-700 dark:text-gray-300">I agree to the Terms of Service</span>
        </label>

        <label class="flex items-center space-x-2">
          <input
            type="checkbox"
            v-model="consentPrivacy"
            required
            class="h-5 w-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span class="text-gray-700 dark:text-gray-300">I accept the Privacy Policy</span>
        </label>
      </div>

      <!-- Footer Buttons -->
      <UiDialogFooter class="mt-6 flex justify-end space-x-4">
        <UiButton
          @click="$emit('accept')"
          :disabled="!isValid"
          class="rounded-md bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:opacity-50"
        >
          Continue
        </UiButton>
        <UiButton
          @click="$emit('cancel')"
          class="rounded-md bg-gray-300 px-4 py-2 text-gray-800 hover:bg-gray-400"
        >
          Cancel
        </UiButton>
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
