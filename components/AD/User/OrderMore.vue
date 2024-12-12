<template>
  <div
    class="flex w-full flex-row justify-between rounded-md bg-primary/90 p-4 text-primary-foreground sm:p-8"
  >
    <div class="flex flex-col space-y-2">
      <p class="text-sm font-bold sm:text-2xl">Explore New Products and Stores</p>
      <p class="text-[8px] opacity-80 sm:text-[12px]">
        Discover a variety of new products and stores. Enhance your shopping experience with our
        latest offerings.
      </p>
      <div class="pt-4">
        <UiButton
          to="/"
          class="w-1/3 bg-secondary text-secondary-foreground sm:w-1/2"
          variant="ghost"
        >
          <span class="text-[12px] sm:text-sm">Go to store</span>
        </UiButton>
      </div>
    </div>
    <div>
      <img
        src="/logo-verch-2.png"
        alt="Company Logo"
        class="ml-4 h-12 min-h-[48px] w-12 min-w-[48px] sm:ml-0 sm:h-24 sm:w-24"
      />
    </div>
  </div>
</template>
