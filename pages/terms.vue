<template>
  <LegalContent title="Terms of Service">
    <!-- <div class="mb-6 flex justify-center">
      <UiButton @click="showModal = true" class="mb-4">
        <Icon name="lucide:file-text" class="mr-2 h-4 w-4" />
        Test Consent Modal
      </UiButton>
    </div> -->
    <!-- Table of Contents - Mobile Collapsible, Desktop Always Visible -->
    <div class="mb-8 rounded-lg border bg-card/30 p-4 md:p-6">
      <div
        class="flex cursor-pointer items-center justify-between md:cursor-default"
        @click="tocOpen = !tocOpen"
      >
        <h3 class="text-sm font-semibold md:text-base">Table of Contents</h3>
        <Icon
          name="lucide:chevron-down"
          class="h-4 w-4 transition-transform md:hidden"
          :class="{ 'rotate-180': tocOpen }"
        />
      </div>

      <div class="mt-3 space-y-2" :class="{ 'hidden md:block': !tocOpen }">
        <a
          v-for="(section, index) in sections"
          :key="index"
          :href="`#section-${index}`"
          class="flex items-center rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted md:text-sm"
        >
          <Icon :name="section.icon" class="mr-2 h-4 w-4 text-primary" />
          {{ section.title }}
        </a>
      </div>
    </div>

    <!-- Sections -->
    <div class="space-y-8 md:space-y-12">
      <section
        v-for="(section, index) in sections"
        :key="index"
        :id="`section-${index}`"
        class="scroll-mt-16 rounded-lg border bg-card/40 p-4 shadow-sm md:p-6"
      >
        <div class="flex items-center gap-3 border-b pb-3 md:gap-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
            <Icon :name="section.icon" class="h-5 w-5 text-primary" />
          </div>
          <h2 class="text-xl font-semibold md:text-2xl">{{ section.title }}</h2>
        </div>

        <div class="mt-4 space-y-3 text-sm md:text-base">
          <p v-for="(point, pointIndex) in section.points" :key="pointIndex" class="flex gap-2">
            <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
            <span>{{ point }}</span>
          </p>
        </div>
      </section>
    </div>

    <!-- Last Updated -->
    <div class="mt-8 border-t pt-4 text-center text-xs text-muted-foreground md:text-sm">
      <p>Last updated: May 1, 2025</p>
    </div>
    <!-- <LegalConsentModal v-if="showModal" @cancel="showModal = false" @accept="handleAccept" /> -->
  </LegalContent>
</template>

<script setup>
  import { ref } from "vue";

  definePageMeta({
    layout: "default",
  });

  // Mobile table of contents toggle
  const tocOpen = ref(false);

  // Control modal visibility
  const showModal = ref(false);

  // Handle modal acceptance
  const handleAccept = () => {
    showModal.value = false;
    // You can add any additional logic here
    console.log("Terms accepted");
  };

  // Sections data
  const sections = [
    {
      title: "Academic Purpose",
      icon: "lucide:school",
      points: [
        "This platform is a Computer Science thesis project at Visayas State University.",
        "Not for commercial use.",
      ],
    },
    {
      title: "User Obligations",
      icon: "lucide:user",
      points: ["Provide accurate academic information.", "No fraudulent orders."],
    },
    {
      title: "Liability",
      icon: "lucide:shield",
      points: [
        "No warranty for system downtime.",
        "Platform administrators are not liable for data loss or service interruptions.",
      ],
    },
    {
      title: "Governing Law",
      icon: "lucide:scale",
      points: [
        "Republic Act 10173 (Philippine Data Privacy Act).",
        "All interactions with this platform are governed by Philippine laws.",
      ],
    },
    {
      title: "Additional Information",
      icon: "lucide:info",
      points: [
        "We do not use tracking cookies. Session data is stored locally for login purposes only.",
        "User data will only be used for academic research and evaluation of the system.",
      ],
    },
  ];
</script>

<style scoped>
  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }
</style>
