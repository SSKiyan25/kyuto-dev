<template>
  <div
    class="flex w-full flex-row justify-between rounded-md bg-primary/90 p-8 text-primary-foreground"
  >
    <div class="flex flex-col space-y-2">
      <p class="text-2xl font-bold">Explore New Products and Stores</p>
      <p class="text-[12px] opacity-80">
        Discover a variety of new products and stores. Enhance your shopping experience with our
        latest offerings.
      </p>
      <div class="pt-4">
        <UiButton to="/" class="w-1/2 bg-secondary text-secondary-foreground" variant="ghost">
          <span>Go to store</span>
        </UiButton>
      </div>
    </div>
    <div>
      <img src="/logo-verch-2.png" alt="Company Logo" class="h-24 w-24" />
    </div>
  </div>
</template>
