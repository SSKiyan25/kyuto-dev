<template>
  <div class="flex flex-col justify-center space-y-12 p-16">
    <div>
      <div class="flex items-center justify-center">
        <UiVeeInput
          label="Search for stores"
          class="peer p-6 pe-9"
          placeholder="Search..."
          type="search"
          icon="lucide:search"
        >
          <template #trailingIcon>
            <button
              type="button"
              aria-label="Subscribe"
              class="absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-md border border-transparent text-muted-foreground/80 ring-offset-background transition-shadow hover:text-foreground focus-visible:border-ring focus-visible:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Icon name="lucide:arrow-right" class="size-4" />
            </button>
          </template>
        </UiVeeInput>
      </div>
    </div>
    <div class="flex flex-col space-y-4">
      <div class="border-b-2">
        <span class="text-lg font-semibold">Organization Stores</span>
      </div>
      <div class="flex flex-col space-y-4 pt-4">
        <div
          v-for="store in stores"
          :key="store.name"
          class="flex flex-row space-x-8 rounded-md border p-8"
        >
          <div class="flex-shrink-0">
            <img :src="store.image" :alt="store.name" class="h-24 w-24 rounded-md" />
          </div>
          <div class="flex w-full flex-col space-y-1">
            <span class="text-lg font-semibold">{{ store.name }}</span>
            <span class="text-sm">{{ store.description }}</span>
            <span class="text-sm">{{ store.address }}</span>
            <div
              class="flex items-center justify-end space-x-2 hover:text-blue-600 hover:underline"
            >
              <NuxtLink :to="`/stores/${store.name}`" class="flex items-center space-x-2">
                <span>Visit Store</span>
                <Icon name="lucide:square-arrow-out-up-right" class="size-4" />
              </NuxtLink>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const stores = ref([
    {
      id: 1,
      name: "Tech Haven",
      description: "Your one-stop shop for the latest in tech gadgets and accessories.",
      address: "123 Tech Street, Silicon Valley, CA",
      image: "/logo-verch.webp",
    },
    {
      id: 2,
      name: "Fashion Fiesta",
      description: "Trendy and affordable fashion for all seasons.",
      address: "456 Fashion Ave, New York, NY",
      image: "/logo-verch-2.png",
    },
    {
      id: 3,
      name: "Gourmet Delights",
      description: "Delicious gourmet foods and culinary delights.",
      address: "789 Gourmet Blvd, San Francisco, CA",
      image: "/logo-verch.webp",
    },
    {
      id: 4,
      name: "Book Nook",
      description: "A cozy place for book lovers to find their next great read.",
      address: "101 Book Lane, Portland, OR",
      image: "/logo-verch-2.png",
    },
    {
      id: 5,
      name: "Fitness Fanatics",
      description: "Everything you need for your fitness journey.",
      address: "202 Fitness Road, Austin, TX",
      image: "/logo-verch.webp",
    },
    {
      id: 6,
      name: "Home Essentials",
      description: "Quality home goods and essentials for everyday living.",
      address: "303 Home St, Seattle, WA",
      image: "/logo-verch-2.png",
    },
  ]);
</script>
