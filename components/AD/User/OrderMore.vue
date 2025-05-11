<template>
  <div
    v-if="!hasError"
    class="relative w-full overflow-hidden rounded-lg border border-border/40 bg-gradient-to-r from-primary/90 to-primary/70 shadow-md transition-all hover:shadow-lg"
  >
    <!-- Background pattern for visual interest -->
    <div class="absolute inset-0 opacity-10">
      <div class="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-secondary/30 blur-xl"></div>
      <div
        class="absolute -left-10 bottom-5 h-20 w-20 rounded-full bg-primary-foreground/20 blur-lg"
      ></div>
    </div>

    <div class="relative flex flex-row items-center justify-between p-4 sm:p-6 md:p-8">
      <div class="flex max-w-[75%] flex-col space-y-2 md:max-w-[70%]">
        <h3 class="text-sm font-bold leading-tight text-primary-foreground sm:text-xl md:text-2xl">
          Explore New Products and Stores
        </h3>

        <p class="text-[10px] leading-tight text-primary-foreground/80 sm:text-xs md:text-sm">
          Discover a variety of new products and stores. Enhance your shopping experience with our
          latest offerings.
        </p>

        <div class="flex flex-row gap-3 pt-3 sm:pt-4">
          <UiButton
            to="/products"
            size="sm"
            class="group bg-secondary/90 text-secondary-foreground hover:bg-secondary"
          >
            <span class="text-[10px] sm:text-xs md:text-sm">Explore Products</span>
            <Icon
              name="lucide:arrow-right"
              class="ml-1 h-3 w-3 transition-transform group-hover:translate-x-1 sm:h-4 sm:w-4"
            />
          </UiButton>

          <UiButton
            to="/stores"
            size="sm"
            variant="outline"
            class="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
          >
            <span class="text-[10px] sm:text-xs md:text-sm">Browse Stores</span>
          </UiButton>
        </div>
      </div>

      <div class="relative flex items-center justify-center">
        <!-- Decorative circle behind logo -->
        <div
          class="absolute h-10 w-10 rounded-full bg-secondary/20 blur-sm sm:h-16 sm:w-16 md:h-20 md:w-20"
        ></div>

        <img
          src="/logo-verch-2.png"
          alt="Verch Logo"
          class="relative h-10 w-10 object-contain sm:h-16 sm:w-16 md:h-20 md:w-20"
        />
      </div>
    </div>

    <!-- Badge -->
    <div
      class="absolute bottom-2 right-2 rounded-full bg-secondary/80 px-2 py-0.5 text-[8px] text-secondary-foreground sm:text-xs"
    >
      New arrivals
    </div>
  </div>
  <div v-else class="w-full rounded-lg border border-border/40 bg-muted p-4 text-center">
    Unable to load promotions.
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onErrorCaptured, ref } from "vue";

  const hasError = ref(false);

  // Use nextTick to ensure component is properly mounted
  nextTick(() => {
    try {
      // Any initialization logic can go here
      console.log("OrderMore component mounted successfully");
    } catch (err) {
      console.error("Error during OrderMore component initialization:", err);
      hasError.value = true;
    }
  });

  onErrorCaptured((err) => {
    console.error("Error in OrderMore component:", err);
    hasError.value = true;
    return false; // prevent error from propagating further
  });
</script>
