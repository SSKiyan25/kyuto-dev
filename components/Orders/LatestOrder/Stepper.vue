<template>
  <UiStepper
    :orientation="isMobile ? 'vertical' : 'horizontal'"
    class="mx-auto flex w-full flex-col justify-start gap-10 sm:max-w-full sm:flex-row sm:items-start sm:justify-center sm:gap-2"
  >
    <UiStepperItem
      v-for="step in steps"
      :key="step.step"
      :state="getStepState(step.step)"
      class="group relative flex w-full items-start gap-4 text-[12px] text-secondary-foreground sm:flex-col sm:items-center sm:justify-center sm:gap-0 sm:text-sm"
      :step="step.step"
    >
      <UiStepperSeparator
        v-if="step.step != steps[steps.length - 1].step"
        :class="[
          isMobile
            ? 'absolute left-[18px] top-[38px] block h-[105%] w-0.5 shrink-0 rounded-full bg-muted group-data-[state=completed]:bg-primary'
            : 'absolute left-[calc(50%+20px)] right-[calc(-50%+10px)] top-5 block h-0.5 shrink-0 rounded-full bg-secondary-foreground/20 group-data-[state=completed]:bg-primary',
        ]"
      />
      <UiStepperTrigger as-child>
        <UiButton
          :variant="getStepButtonVariant(step.step)"
          size="icon"
          class="z-10 rounded-full"
          :class="[
            getStepState(step.step) == 'active' &&
              'ring-2 ring-ring ring-offset-2 ring-offset-background',
          ]"
        >
          <TransitionScale mode="out-in" :scale="0.8">
            <Icon
              v-if="getStepState(step.step) == 'completed'"
              name="lucide:check"
              class="size-5"
            />
            <Icon v-if="getStepState(step.step) == 'active'" name="lucide:circle" class="size-5" />
            <Icon v-if="getStepState(step.step) == 'cancelled'" name="lucide:x" class="size-5" />
            <Icon v-if="getStepState(step.step) == 'inactive'" name="lucide:dot" class="size-10" />
          </TransitionScale>
        </UiButton>
      </UiStepperTrigger>

      <div class="mt-0 flex flex-col sm:mt-5 sm:items-center sm:text-center">
        <UiStepperTitle
          :class="[
            getStepState(step.step) == 'active' && 'text-primary',
            orderStatus === 'cancelled' && 'text-destructive',
          ]"
          class="text-sm font-semibold transition sm:text-base"
          >{{ step.title }}
        </UiStepperTitle>
        <UiStepperDescription
          :class="[
            getStepState(step.step) == 'active' && 'text-primary',
            orderStatus === 'cancelled' && 'text-destructive',
          ]"
          class="text-xs text-muted-foreground transition sm:text-sm"
        >
          {{ step.description }}
        </UiStepperDescription>
      </div>
    </UiStepperItem>
  </UiStepper>
</template>

<script lang="ts" setup>
  import { computed } from "vue";

  const props = defineProps<{
    orderStatus: string;
    isMobile: boolean;
  }>();

  const steps = computed(() => {
    const status = props.orderStatus;
    if (status === "cancelled") {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        { step: 2, title: "Cancelled", description: "Your order has been cancelled" },
      ];
    } else {
      return [
        { step: 1, title: "Pending", description: "Order request received" },
        {
          step: 2,
          title: "Preparing",
          description: "Your order is being double-checked and prepared",
        },
        { step: 3, title: "Ready", description: "Your order is ready for pickup" },
        { step: 4, title: "Claimed", description: "Your order has been claimed" },
      ];
    }
  });

  const getStepState = (step: number) => {
    const status = props.orderStatus;
    if (status === "cancelled" && step === 2) return "cancelled";
    if (status === "pending" && step === 1) return "active";
    if (status === "preparing" && step === 2) return "active";
    if (status === "ready" && step === 3) return "active";
    if (status === "claimed" && step === 4) return "active";
    if (status === "completed" && step === 4) return "active";

    // Find current step index based on status
    const currentStepIndex = steps.value.findIndex(
      (s) => s.title.toLowerCase() === status.toLowerCase()
    );

    if (currentStepIndex !== -1 && step < steps.value[currentStepIndex].step) return "completed";

    return "inactive";
  };

  const getStepButtonVariant = (step: number) => {
    const state = getStepState(step);
    if (state === "completed" || state === "active") return "default";
    if (state === "cancelled") return "destructive";
    return "outline";
  };
</script>
