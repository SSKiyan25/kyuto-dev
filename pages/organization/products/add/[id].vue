<script lang="ts" setup>
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard" },
    { label: "All Products", link: "/organization/products" },
    { label: "Add Product", link: "/organization/products/add/[id]" },
  ];

  const categories = ["T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];
  const images = ref<File[]>([]);
  const variations = ref([{ value: "None", price: 1, stocks: 0 }]);

  function formatFileSize(fileSize: number) {
    console.log(fileSize);
    if (isNaN(fileSize) || fileSize < 0) {
      console.log("Invalid size");
      return "Invalid size";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = fileSize;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  const removeImage = (index: number) => {
    images.value.splice(index, 1);
  };

  const addVariation = () => {
    variations.value.push({ value: "", price: 1, stocks: 0 });
  };

  const removeVariation = (index: number) => {
    if (variations.value.length === 1) return;
    variations.value.splice(index, 1);
  };
</script>

<template>
  <div class="mb-32 flex h-screen w-full flex-col items-start py-8 pl-8">
    <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
    <!-- Product Details -->
    <div
      class="mx-auto mt-12 flex min-h-[26rem] w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
    >
      <div class="flex flex-col items-start gap-1">
        <span class="text-2xl font-semibold">Product Details</span>
        <p class="text-sm opacity-60">
          Add a new product to your store. Fill in the details below.
        </p>
      </div>
      <UiGradientDivider class="mt-4" />
      <div class="flex w-full flex-col gap-4 pl-4 pt-4">
        <form>
          <fieldset>
            <UiVeeInput
              name="name"
              label="Name"
              placeholder="Limited to 36 Characters"
              class="w-11/12"
              required
            />
            <div class="w-5/12 pt-4">
              <TransitionSlide>
                <UiVeeSelect label="Category" name="category" required class="">
                  <option disabled value="">Select a category</option>
                  <option v-for="category in categories" :key="category" :value="category">
                    {{ category }}
                  </option>
                </UiVeeSelect>
              </TransitionSlide>
            </div>
            <UiVeeTextarea
              label="Description"
              name="description"
              placeholder="Optional"
              class="w-11/12 pt-4"
            />
          </fieldset>
        </form>
      </div>
    </div>
    <!-- Variations -->
    <div
      class="mx-auto my-4 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
    >
      <div class="flex flex-col items-start gap-1">
        <span class="text-2xl font-semibold">Variations</span>
        <p class="text-sm opacity-60">
          Add variations (e.g. Small, Large, Color) to your product. Fill in the details below.
        </p>
      </div>
      <UiGradientDivider class="mt-4" />
      <div class="flex w-full flex-col gap-4 pl-4 pt-4">
        <form>
          <fieldset>
            <div
              v-for="(variation, index) in variations"
              :key="index"
              class="mb-4 grid grid-cols-10 gap-4"
            >
              <div class="col-span-3">
                <UiVeeInput
                  :name="'variation_value_' + index"
                  label="Variation Name"
                  placeholder="(Size, Color, etc.)"
                  required
                  class="w-11/12"
                  v-model="variation.value"
                />
              </div>
              <div class="col-span-3 w-11/12">
                <UiVeeNumberField
                  :min="1"
                  :label="'Price ' + '[' + index + ']'"
                  :name="'variation_price_' + index"
                  required
                >
                  <UiNumberFieldInput placeholder="x.xx" v-model="variation.price" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiVeeNumberField>
              </div>
              <div class="col-span-2 w-11/12">
                <UiVeeNumberField
                  :min="0"
                  :label="'Stocks ' + '[' + index + ']'"
                  :name="'variation_stocks_' + index"
                >
                  <UiNumberFieldInput placeholder="0" v-model="variation.stocks" />
                  <UiNumberFieldDecrement class="border-l" />
                  <UiNumberFieldIncrement class="border-l" />
                </UiVeeNumberField>
              </div>
              <div class="flex items-center pt-7">
                <UiButton
                  @click="removeVariation(index)"
                  :disabled="variations.length == 1"
                  variant="destructive"
                  size="sm"
                  >Remove</UiButton
                >
              </div>
            </div>
            <UiDivider class="mb-4 mt-6" />
            <div class="flex justify-center">
              <UiButton variant="outline" @click.prevent="addVariation">
                <Icon name="lucide:badge-plus" class="size-4" />
                Add Variation
              </UiButton>
            </div>
          </fieldset>
        </form>
      </div>
    </div>

    <!-- Images -->
    <div
      class="min-h-auto mx-auto my-4 mb-4 flex w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
    >
      <div class="flex flex-col items-start gap-1">
        <span class="text-2xl font-semibold">Images</span>
        <p class="text-sm opacity-60">
          Add images to your product. Drag and drop or click to upload.
        </p>
      </div>
      <UiGradientDivider class="mt-4" />
      <div class="flex w-full flex-col gap-4 pl-4 pt-4">
        <form>
          <fieldset class="gap-4">
            <UiVeeFileInput
              label="Upload Featured Image"
              name="featured_image"
              accept="image/*"
              hint="Max file size: 5MB"
            />
          </fieldset>
        </form>
        <span class="text-sm font-semibold">Upload Other Images</span>
        <UiDropfile
          @dropped="images = $event"
          accept="images/*"
          subtext="Limited to 5 Images"
          :disabled="images.length > 6"
        />
        <div class="" v-if="images && images.length">
          <div
            v-for="(image, i) in images"
            :key="image.name"
            class="group mb-2 flex h-12 items-center justify-between rounded border px-3 py-3"
          >
            <div class="flex grow items-center gap-3">
              <Icon name="lucide:image" class="mr-3 h-5 w-5 opacity-60" />
              <p class="w-[80%] truncate text-sm">{{ image.name }}</p>
              <p
                class="ml-auto whitespace-nowrap text-xs text-muted-foreground/60 transition group-hover:hidden"
              >
                {{ formatFileSize(image.size) }}
              </p>
            </div>
            <div class="hidden transition group-hover:block">
              <UiButton @click="removeImage(i)" size="icon-sm" variant="outline">
                <Icon name="lucide:x" class="h-3.5 w-3.5" />
              </UiButton>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- Submit -->
    <div class="min-h-[12rem] w-11/12">
      <div class="flex flex-row justify-end gap-2">
        <UiButton variant="outline" to="/organization/products"> Cancel</UiButton>
        <UiButton>Add Product</UiButton>
      </div>
    </div>
  </div>
</template>
