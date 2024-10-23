<script lang="ts" setup>
  import { useAddProduct } from "~/composables/organization/product/useAddProduct";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  console.log("Script setup running");
  definePageMeta({
    layout: "organization",
    middleware: ["auth"],
  });

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard" },
    { label: "All Products", link: "/organization/products" },
    { label: "Add Product", link: "/organization/products/add" },
  ];

  const categories = ["T-shirt", "Hoodie", "Lanyard", "Sticker", "Others"];
  const status = ["Draft", "Publish"];
  const variations = ref([{ value: "None", price: 1, stocks: 0, price_discount: 0 }]);

  const addVariation = () => {
    variations.value.push({ value: "", price: 1, stocks: 0, price_discount: 0 });
  };

  const removeVariation = (index: number) => {
    if (variations.value.length === 1) return;
    variations.value.splice(index, 1);
  };

  // Form Functions
  const { handleSubmit, isSubmitting } = useForm({
    validationSchema: toTypedSchema(AddProductSchema),
  });
  console.log("Script setup running");

  const submit = handleSubmit(async (values) => {
    console.log("Form successfully submitted with values: ", values);

    const mockProduct = {
      name: values.name,
      category: values.category,
      description: values.description,
      status: values.status,
      featuredImage: values.featured_image,
      images: values.images,
      variations: values.variations,
    };

    console.log("Mock Product:", mockProduct);
  });
  console.log("Form setup complete");
</script>

<template>
  <div class="mb-32 flex h-screen w-full flex-col items-start py-8 pl-8">
    <div><UiBreadcrumbs class="justify-center" :items="crumbs" /></div>
    <form @submit.prevent="submit">
      <!-- Product Details -->
      <div
        class="mx-auto mt-12 flex h-auto w-11/12 flex-col items-start rounded-sm bg-muted p-4 shadow"
      >
        <div class="flex flex-col items-start gap-1">
          <span class="text-2xl font-semibold">Product Details</span>
          <p class="text-sm opacity-60">
            Add a new product to your store. Fill in the details below.
          </p>
        </div>
        <UiGradientDivider class="mt-4" />
        <div class="flex w-full flex-col gap-4 pl-4 pt-4">
          <fieldset :disabled="isSubmitting">
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
            <div class="w-5/12 pt-4">
              <TransitionSlide>
                <UiVeeSelect label="Set Status" name="status" required class="">
                  <option disabled value="">Select a category</option>
                  <option v-for="stat in status" :key="stat" :value="stat">
                    {{ stat }}
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
          <fieldset :disabled="isSubmitting">
            <div
              v-for="(variation, index) in variations"
              :key="index"
              class="mb-4 flex flex-row flex-wrap gap-4 sm:grid sm:grid-cols-12"
            >
              <div class="flex sm:col-span-3">
                <UiVeeInput
                  :name="'variations[' + index + '].name'"
                  label="Variation Name"
                  placeholder="(Size, Color, etc.)"
                  required
                  class="w-11/12"
                  v-model="variation.value"
                />
              </div>
              <div class="flex w-11/12 sm:col-span-3">
                <UiVeeNumberField
                  :min="1"
                  label="Price"
                  :name="'variations[' + index + '].price'"
                  v-model="variation.price"
                  required
                >
                  <UiNumberFieldInput placeholder="x.xx" />
                </UiVeeNumberField>
              </div>
              <div class="flex w-11/12 sm:col-span-2">
                <UiVeeNumberField
                  :min="0"
                  label="Stocks"
                  :name="'variations[' + index + '].stocks'"
                  v-model="variation.stocks"
                >
                  <UiNumberFieldInput placeholder="0" />
                </UiVeeNumberField>
              </div>
              <div class="flex w-11/12 sm:col-span-2">
                <UiVeeNumberField
                  :min="0"
                  label="Discount Price"
                  :name="'variations[' + index + '].price_discount'"
                  v-model="variation.price_discount"
                >
                  <UiNumberFieldInput placeholder="0" />
                </UiVeeNumberField>
              </div>
              <div class="flex items-center pt-7">
                <UiButton
                  @click.prevent="removeVariation(index)"
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
          <fieldset :disabled="isSubmitting" class="space-y-4">
            <UiVeeFileInput
              label="Upload Featured Image"
              name="featured_image"
              accept="image/*"
              hint="Max file size: 25MB"
            />
            <UiVeeFileInput
              multiple
              label="Upload Other Images"
              name="images"
              accept="image/*"
              hint="Max file size: 25MB"
            />
            <span class="text-sm font-semibold"></span>
          </fieldset>
          <!-- <UiDropfile
            @dropped="images = $event"
            accept="images/*"
            subtext="Limited to 5 Images"
            :disabled="images.length > 6"
          /> -->
          <!-- <div class="" v-if="images && images.length">
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
                <UiButton @click.prevent="removeImage(i)" size="icon-sm" variant="outline">
                  <Icon name="lucide:x" class="h-3.5 w-3.5" />
                </UiButton>
              </div>
            </div>
          </div> -->
        </div>
      </div>
      <!-- Submit -->
      <div class="min-h-[12rem] w-11/12">
        <div class="flex flex-row justify-end gap-2">
          <UiButton variant="outline" to="/organization/products"> Cancel</UiButton>
          <UiButton type="submit">Add Product</UiButton>
        </div>
      </div>
    </form>
  </div>
</template>
