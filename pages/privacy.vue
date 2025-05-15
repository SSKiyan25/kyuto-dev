<template>
  <LegalContent title="Privacy Policy">
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
          <!-- Different display for points vs. paragraphs -->
          <template v-if="section.points">
            <p v-for="(point, pointIndex) in section.points" :key="pointIndex" class="flex gap-2">
              <Icon name="lucide:check" class="mt-0.5 h-4 w-4 flex-shrink-0 text-primary" />
              <span>{{ point }}</span>
            </p>
          </template>

          <!-- For numbered lists -->
          <template v-else-if="section.numberedPoints">
            <p
              v-for="(point, pointIndex) in section.numberedPoints"
              :key="pointIndex"
              class="flex gap-2"
            >
              <span
                class="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary"
              >
                {{ pointIndex + 1 }}
              </span>
              <span>{{ point }}</span>
            </p>
          </template>

          <!-- For paragraph content -->
          <template v-else-if="section.content">
            <p>{{ section.content }}</p>
          </template>
        </div>
      </section>
    </div>

    <!-- Last Updated -->
    <div class="mt-8 border-t pt-4 text-center text-xs text-muted-foreground md:text-sm">
      <p>Last updated: April 20, 2025</p>
    </div>
  </LegalContent>
</template>

<script setup>
  import { ref } from "vue";

  definePageMeta({
    layout: "default",
  });

  // Mobile table of contents toggle
  const tocOpen = ref(false);

  // Sections data
  const sections = [
    {
      title: "Controller",
      icon: "lucide:user",
      content:
        "Joshua A. Sosmeña\nComputer Science Thesis Project\nVisayas State University\nContact: 20-1-01709@vsu.edu.ph",
    },
    {
      title: "Data Collected",
      icon: "lucide:database",
      points: [
        "Name, Email, Phone Number",
        "Student ID (optional), Course (e.g., BSCS), Faculty (e.g., Faculty of Engineering)",
      ],
    },
    {
      title: "Purpose",
      icon: "lucide:target",
      points: ["Order fulfillment and delivery coordination", "Account authentication via Google"],
    },
    {
      title: "Third Parties",
      icon: "lucide:share-2",
      points: [
        "Google Authentication (only for sign-in)",
        "No payment processors used (manual GCash receipts only)",
      ],
    },
    {
      title: "Security",
      icon: "lucide:shield",
      points: [
        "HTTPS encryption",
        "Role-based access controls",
        "Regular security audits (ISO 25010 aligned)",
      ],
    },
    {
      title: "Your Rights",
      icon: "lucide:file-check",
      points: [
        "Request data access/correction via 20-1-01709@vsu.edu.ph (15-day response)",
        "Delete account permanently",
      ],
    },
    {
      title: "Breach Protocol",
      icon: "lucide:alert-triangle",
      points: ["Immediate notification via email if data is compromised"],
    },
    {
      title: "Incident Response",
      icon: "lucide:activity",
      numberedPoints: [
        "Immediately disable compromised accounts",
        "Notify affected users via email within 72 hours",
        "Document details for thesis defense reporting",
      ],
    },
  ];
</script>

<style scoped>
  /* Support for line breaks in content */
  .mt-4 p {
    white-space: pre-line;
  }

  /* Smooth scrolling for anchor links */
  html {
    scroll-behavior: smooth;
  }
</style>
