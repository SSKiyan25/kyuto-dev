<template>
  <div>
    <div class="flex w-full items-start justify-start pb-8 pt-36">
      <UiBreadcrumbs class="items-start justify-center" :items="crumbs" />
    </div>
    <UiContainer class="">
      <UiCard class="">
        <UiStepper
          v-model="stepper"
          class="flex w-full items-start justify-between gap-2 border-b p-6"
        >
          <UiStepperItem
            v-for="step in steps"
            :key="step.step"
            v-slot="{ state }"
            class="group relative w-full"
            :step="step.step"
            :class="[isLastItem(step.step) && 'w-fit']"
          >
            <UiStepperTrigger
              as="div"
              class="flex items-center gap-3"
              :class="[isLastItem(step.step) && 'justify-end']"
            >
              <UiButton
                :variant="state == 'completed' || state == 'active' ? 'default' : 'outline'"
                size="icon-sm"
                class="z-10 size-8 shrink-0 rounded-full"
                :class="[
                  state == 'active' && 'ring-2 ring-ring ring-offset-2 ring-offset-background',
                ]"
              >
                <TransitionScale mode="out-in" :scale="0.8" :duration="100">
                  <Icon v-if="state == 'active'" name="lucide:pen" class="size-4" />
                  <Icon v-else-if="state == 'completed'" name="lucide:check" class="size-4" />
                  <span v-else>{{ step.step }}</span>
                </TransitionScale>
              </UiButton>
              <UiStepperTitle
                :class="[state == 'active' && 'text-primary']"
                class="sr-only font-medium transition md:not-sr-only"
                >{{ step.title }}</UiStepperTitle
              >
              <UiStepperSeparator
                v-if="step.step != steps[steps.length - 1].step"
                class="h-0.5 shrink-0 grow rounded-full bg-muted group-data-[state=completed]:bg-primary"
              />
              <!-- <VisuallyHidden as-child>
                <UiStepperDescription></UiStepperDescription>
              </VisuallyHidden> -->
            </UiStepperTrigger>
          </UiStepperItem>
        </UiStepper>
        <div class="overflow-hidden">
          <TransitionSlide
            mode="out-in"
            :duration="100"
            :offset="{ enter: ['10%', 0], leave: ['-10%', 0] }"
          >
            <UiCardContent v-if="stepper == 1">
              <UiCardTitle class="">Order</UiCardTitle>
            </UiCardContent>
            <UiCardContent v-else-if="stepper == 2">
              <UiCardTitle class="">Payment</UiCardTitle>
            </UiCardContent>
            <UiCardContent v-else-if="stepper == 3">
              <UiCardTitle class="">Checkout</UiCardTitle>
            </UiCardContent>
          </TransitionSlide>
        </div>
      </UiCard>
    </UiContainer>
  </div>
</template>

<script lang="ts" setup>
  import { get, set } from "@vueuse/core";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  definePageMeta({
    middleware: "auth",
    layout: "no-nav",
  });

  const crumbs: Crumbs[] = [
    { label: "Home", link: "/" },
    { label: "My Profile", link: "/" },
    { label: "Cart", link: "#" },
    { label: "Checkout", link: "#", disabled: true },
  ];

  const stepper = ref(1);
  const steps = [
    {
      step: 1,
      title: "Review Your Order",
      description: "Review your order",
    },
    {
      step: 2,
      title: "Payment",
      description: "Choose your payment method",
    },
    {
      step: 3,
      title: "Checkout",
      description: "Complete your order",
    },
  ];

  const isLastItem = (step: number) => step === steps.length;

  const canGoNext = computed(() => stepper.value < steps.length);
  const canGoBack = computed(() => stepper.value > 1);
  const goNext = () => {
    if (get(canGoNext)) {
      set(stepper, stepper.value + 1);
    }
  };
  const goBack = () => {
    if (get(canGoBack)) {
      set(stepper, stepper.value - 1);
    }
  };
</script>
