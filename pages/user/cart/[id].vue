<template>
  <div class="flex h-screen w-full flex-col items-start p-12">
    <div class="flex flex-row items-center gap-2 px-12 pt-8 text-4xl font-bold">
      <Icon name="lucide:shopping-cart" /> <span>Shopping Cart</span>
    </div>

    <div class="grid w-full grid-cols-10 justify-between gap-8 p-12">
      <div class="col-span-7 flex h-auto flex-col rounded p-4">
        <span>1 Item in Cart</span>
        <UiDivider class="my-2" />
        <div class="col-span-3 flex flex-row justify-between">
          <div>Product</div>
          <div>Price</div>
        </div>
      </div>
      <div class="col-span-3 flex w-full flex-col">
        <div class="pb-2">
          <span class="text-md font-extrabold text-muted-foreground">Total:</span>
        </div>
        <div><span class="text-2xl font-bold">₱ 50.00</span></div>
        <div class="flex flex-row items-center gap-2 pt-2">
          <span class="text-md text-muted-foreground line-through">₱ 150.00</span>
          <span class="text-[12px] text-muted-foreground">(Membership Discount)</span>
        </div>
        <UiDivider class="mt-2" />
        <div class="w-full pt-4">
          <UiButton @click="toCheckOut()" class="w-full rounded-none">Checkout</UiButton>
        </div>
      </div>
    </div>
    <div class="flex flex-col px-12 py-32">
      <span class="text-lg font-semibold">You Might Also Like</span>
      <UiDivider class="my-5" />
      <div class="flex h-auto w-full flex-col">
        <div class="mt-6 flex flex-row flex-wrap gap-6">
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
                  <span class="text-sm text-muted-foreground">P{{ product.price }}</span>
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
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  definePageMeta({
    middleware: "auth",
  });
  const user = useCurrentUser();
  const { products } = useProductValues();

  const toCheckOut = () => {
    navigateTo(`/user/checkout/${user.value?.uid}`, { replace: true });
  };
</script>
