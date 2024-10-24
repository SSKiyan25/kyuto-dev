<template>
  <div class="h-screen">
    <UiContainer class="relative flex flex-col items-center py-10 text-center lg:py-20">
      <div>
        <UiBadge to="#" variant="outline" class="px-3 py-1.5 text-sm font-normal lg:py-2"
          >New Products! Check out our new products
          <Icon class="ml-3 h-4 w-4" name="lucide:arrow-right"
        /></UiBadge>
      </div>

      <h1
        class="mb-4 mt-7 text-4xl font-bold lg:mb-6 lg:mt-5 lg:text-center lg:text-5xl xl:text-6xl"
      >
        Official VSU Merchandise Collection.
        <!-- eslint-disable-next-line vue/html-self-closing -->
        <br />Proudly Represent Yourself.
      </h1>
      <p class="mx-auto max-w-[760px] text-lg text-muted-foreground lg:text-center lg:text-xl">
        Explore our range of high-quality VSU-branded apparel and accessories. From stylish T-shirts
        and hoodies to practical lanyards and stickers, we’ve got everything you need to showcase
        your school spirit.
      </p>

      <div
        class="mt-8 grid w-full grid-cols-1 items-center gap-3 sm:flex sm:justify-center lg:mt-10"
      >
        <UiButton size="lg" variant="outline"> <Icon name="lucide:mail" /> Contact Us </UiButton>
        <UiButton size="lg"> <Icon name="lucide:shopping-basket" />Shop now</UiButton>
      </div>
    </UiContainer>

    <ClientOnly>
      <UiGradientDivider class="my-5" />
    </ClientOnly>
    <!-- Categories -->
    <div
      class="mx-auto my-4 flex h-auto w-11/12 flex-col items-start justify-center rounded bg-muted p-4"
    >
      <span class="font-semibold uppercase text-muted-foreground">Categories</span>
      <div
        class="mt-0 flex w-full flex-row flex-wrap items-center justify-center gap-1 p-2 md:mt-3 md:gap-4"
      >
        <CategoryCard
          v-for="(item, index) in categories"
          :key="index"
          :icon="item.icon"
          :title="item.title"
        />
      </div>
    </div>

    <!-- Ad Space
    <div
      class="mx-auto my-4 flex h-48 w-11/12 flex-col items-center justify-center rounded bg-muted p-4 shadow"
    >
      <div class="flex">Ad-Space</div>
    </div> -->

    <!-- Top Products-->
    <div
      class="mx-auto my-4 flex h-96 w-11/12 flex-col items-start justify-center rounded bg-muted p-4"
    >
      <span class="font-semibold uppercase text-muted-foreground">Top Products</span>
    </div>

    <!-- Products -->
    <div class="mx-auto mb-24 flex min-h-lvh w-11/12 flex-col pt-8">
      <div
        class="flex w-full flex-row items-center justify-between rounded-md bg-primary/90 p-4 text-primary-foreground shadow"
      >
        <div class="flex flex-row items-start justify-start gap-2">
          <div class="" v-for="(show, index) in showAs" :key="index">
            <button
              @click="toggleActive(index)"
              :class="[
                'flex flex-row rounded-sm p-2 text-sm font-medium uppercase tracking-wider',
                show.isActive
                  ? 'bg-secondary text-secondary-foreground'
                  : 'border text-primary-foreground opacity-90',
              ]"
            >
              {{ show.value }}
            </button>
          </div>
        </div>

        <UiButton @click="toggleFilterCommands" variant="secondary" size="sm">
          Filter By
          <Icon name="lucide:list-filter" class="h-4 w-4" />
        </UiButton>
      </div>

      <!-- Filter Commands -->
      <transition name="slide-fade">
        <div
          v-if="showFilterCommands"
          class="flex flex-row justify-end space-x-2 rounded-sm p-2 shadow"
        >
          <!-- Filter Category -->
          <div class="">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton variant="outline">
                  Select Category
                  <Icon name="lucide:chevron-down" class="h-4 w-4" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-48">
                <UiDropdownMenuLabel label="Categories" />
                <UiDropdownMenuSeparator />
                <template v-for="c in filterCategories" :key="c.key">
                  <UiDropdownMenuCheckboxItem
                    :checked="selectedCategories.includes(c.key)"
                    @select="(e: any) => e.preventDefault()"
                    class="mb-1"
                    @update:checked="
                      selectedCategories.includes(c.key)
                        ? selectedCategories.splice(selectedCategories.indexOf(c.key), 1)
                        : selectedCategories.push(c.key)
                    "
                  >
                    <div class="flex items-center gap-4">
                      <span>{{ c.title }}</span>
                    </div>
                  </UiDropdownMenuCheckboxItem>
                </template>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
          <!-- Sort by Price -->
          <div class="flex flex-row items-center">
            <UiDropdownMenu>
              <UiDropdownMenuTrigger as-child>
                <UiButton variant="outline"
                  >Sort by price
                  <Icon name="lucide:chevron-down" class="h-4 w-4" />
                </UiButton>
              </UiDropdownMenuTrigger>
              <UiDropdownMenuContent class="w-32">
                <UiDropdownMenuLabel label="Order" />
                <UiDropdownMenuSeparator />
                <UiDropdownMenuRadioGroup v-model="sortPrice">
                  <UiDropdownMenuRadioItem value="none" title="None" text-value="none" />
                  <UiDropdownMenuRadioItem value="lowest" title="Lowest" text-value="lowest" />
                  <UiDropdownMenuRadioItem value="highest" title="Highest" text-value="highest" />
                </UiDropdownMenuRadioGroup>
              </UiDropdownMenuContent>
            </UiDropdownMenu>
          </div>
          <!-- Price Range -->
          <div class="flex w-auto flex-row items-center pl-4">
            <span class="pr-1 text-sm">Price Range:</span>
            <div class="">
              <UiNumberField :min="0" :max="10000" v-model="priceRangeMin">
                <UiNumberFieldInput placeholder="Min" class="w-16" />
              </UiNumberField>
            </div>
            <span class="px-1">-</span>
            <div class="">
              <UiNumberField :min="0" :max="10000" v-model="priceRangeMax">
                <UiNumberFieldInput placeholder="Max" class="w-16" />
              </UiNumberField>
            </div>
            <div>
              <UiButton variant="secondary" class="ml-1">Set</UiButton>
            </div>
          </div>
          <!-- Clear Filter-->
          <div>
            <UiButton variant="destructive">Clear Filters</UiButton>
          </div>
        </div>
      </transition>

      <!-- Products Container -->
      <div class="mt-6 flex flex-row flex-wrap gap-6 px-9">
        <div v-for="(product, i) in products" :key="i">
          <NuxtLink :to="`/product/${product.name}`">
            <div
              class="flex max-h-[40rem] max-w-[24rem] flex-col rounded-sm border p-2 hover:shadow-lg"
            >
              <div class="flex justify-center border-b p-2">
                <div class="h-52 w-52 overflow-hidden">
                  <img
                    :src="product.image"
                    :alt="product.name"
                    class="h-full w-full transform object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                  />
                </div>
              </div>
              <div class="flex w-full flex-col items-start pt-1">
                <span class="text-sm text-muted-foreground">₱{{ product.price }}</span>
                <p class="w-full truncate pt-2">
                  {{ product.name }}
                </p>
                <div class="flex w-full flex-row justify-between pt-4 text-[12px] opacity-50">
                  <span>{{ product.views }} views</span>
                  <span>{{ product.totalSales }} sales</span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>
      </div>
      <div class="min-h-lvh"></div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  const { products } = useProductValues();
  const { categories } = useCategoryValues();
  const showAs = ref<{ value: string; isActive: boolean; name: string }[]>([
    { value: "All", isActive: true, name: "all" },
    { value: "New", isActive: false, name: "new" },
    { value: "Popular", isActive: false, name: "popular" },
    { value: "Top-Sales", isActive: false, name: "top-sales" },
  ]);
  const filterCategories = [
    { key: "1", title: "T-Shirts" },
    { key: "2", title: "Hoodies" },
    { key: "3", title: "Lanyards" },
    { key: "4", title: "Stickers" },
    { key: "5", titile: "Polo-Shirt" },
    { key: "6", title: "Foldable Fan" },
    { key: "7", title: "Others" },
  ];

  const selectedCategories = ref<string[]>([]);
  const sortPrice = ref<string | undefined>(undefined);
  const toggleActive = (index: number) => {
    showAs.value.forEach((item, i) => {
      item.isActive = i === index;
    });
  };
  const showFilterCommands = ref(false);

  const toggleFilterCommands = () => {
    showFilterCommands.value = !showFilterCommands.value;
  };

  const priceRangeMin = ref(0);
  const priceRangeMax = ref(0);
</script>

<style scoped>
  .slide-fade-enter-active,
  .slide-fade-leave-active {
    transition: all 0.5s ease;
  }
  .slide-fade-enter,
  .slide-fade-leave-to {
    transform: translateY(-10px);
    opacity: 0;
  }
  .slide-fade-enter-to,
  .slide-fade-leave {
    transform: translateY(0);
    opacity: 1;
  }
</style>
