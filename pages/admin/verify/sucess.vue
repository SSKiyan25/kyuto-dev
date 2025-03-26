<template>
  <div class="flex min-h-screen flex-col items-center justify-center">
    <Icon name="lucide:mail-check" class="mb-4 h-16 w-16 text-green-500" />
    <h1 class="mb-2 text-2xl font-bold">Email Verified!</h1>
    <p class="mb-6 text-gray-600">Your organization account is now active.</p>
    <UiButton @click="navigateTo('/admin/dashboard')"> Go to Dashboard </UiButton>
  </div>
</template>

<script lang="ts" setup>
  import { doc, updateDoc } from "firebase/firestore";

  const route = useRoute();
  const toast = useToast();
  const db = useFirestore();

  onMounted(() => {
    toast.toast({
      title: "Verification Complete",
      description: "Your organization is now verified.",
      variant: "success",
    });

    // Optional: Update Firestore verification status
    if (route.query.uid) {
      updateDoc(doc(db, "organizations", route.query.uid as string), {
        isVerified: true,
      });
    }
  });
</script>
