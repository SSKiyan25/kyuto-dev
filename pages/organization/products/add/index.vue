<script lang="ts" setup>
  import { useAddProduct } from "~/composables/organization/product/useAddProduct";
  import type { Crumbs } from "~/components/Ui/Breadcrumbs.vue";

  definePageMeta({
    layout: "no-nav",
    middleware: ["auth"],
  });

  const crumbs: Crumbs[] = [
    { label: "Dashboard", link: "/organization/dashboard", icon: "lucide:newspaper" },
    { label: "All Products", link: "/organization/products", icon: "lucide:package" },
    { label: "Add Product", link: "/organization/products/add", icon: "lucide:file-plus" },
  ];

  const categories = [
    "T-shirt",
    "Polo-Shirt",
    "Hoodie",
    "Lanyard",
    "Sticker",
    "Umbrella",
    "Totebag",
    "Fan",
    "Mug",
    "Others",
  ];
  const status = ["Draft", "Publish"];
  const variations = ref([{ value: "None", price: 1, stocks: 0 }]);
  const loading = ref(false);
  const canPreOrder = ref(false);
  const currentMessage = ref("");
  const router = useRouter();
  const toast = useToast();

  const addVariation = () => {
    if (variations.value.length < 10) {
      variations.value.push({ value: "", price: 1, stocks: 0 });
    } else {
      toast.toast({
        title: "Limit Reached",
        description: "You can only add up to 10 variations.",
        variant: "warning",
        icon: "lucide:alert-circle",
      });
    }
  };

  const removeVariation = (index: number) => {
    if (variations.value.length === 1) return;
    variations.value.splice(index, 1);
  };

  const messages = [
    "Uploading your product...",
    "Almost there...",
    "Just a moment...",
    "Hang tight, we're adding your product...",
    "It should be finished already...",
    "Just a few more seconds...",
    "Thank you for your patience...",
  ];

  let messageIndex = 0;
  const updateMessage = () => {
    currentMessage.value = messages[messageIndex];
    messageIndex = (messageIndex + 1) % messages.length;
  };

  // Form Functions
  const { handleSubmit, isSubmitting, resetForm } = useForm({
    validationSchema: toTypedSchema(AddProductSchema),
  });

  const submit = handleSubmit(async (values) => {
    console.log("Form successfully submitted with values: ", values);
    loading.value = true;
    const messageInterval = setInterval(updateMessage, 2000);
    await useAddProduct(values, canPreOrder.value);
    clearInterval(messageInterval);
    loading.value = false;
    resetForm();
    variations.value = [{ value: "None", price: 1, stocks: 0 }];
    // Clear file inputs
    document
      .querySelectorAll('input[type="file"]')
      .forEach((input) => ((input as HTMLInputElement).value = ""));
    // Show success toast
    toast.toast({
      title: "Product Added",
      description: "Your product has been added successfully.",
      variant: "success",
      icon: "lucide:badge-check",
    });
    // Navigate back to products page
    router.push("/organization/products/");
  });
</script>

<template>
  <div class="mb-32 flex h-screen w-full flex-col items-start py-20 pl-20">
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
              placeholder="Limited to 72 Characters"
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
            <div class="my-6 flex w-full flex-col justify-start">
              <span class="text-muted-foreground"
                >Click the checkbox to enable pre-order for your merchandise
              </span>
              <div class="flex flex-row items-center space-x-2 pl-4 pt-2">
                <input type="checkbox" id="canPreOrder" v-model="canPreOrder" />
                <span>Allow Pre-Order</span>
              </div>
            </div>
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
              <div class="flex sm:col-span-5">
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
                  :max="10000"
                  label="Price"
                  :name="'variations[' + index + '].price'"
                  v-model="variation.price"
                  required
                >
                  <UiNumberFieldInput placeholder="x.xx" step="0.01" />
                </UiVeeNumberField>
              </div>
              <div class="flex w-11/12 sm:col-span-2">
                <UiVeeNumberField
                  :min="0"
                  :max="10000"
                  label="Stocks"
                  :name="'variations[' + index + '].stocks'"
                  v-model="variation.stocks"
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
            <div class="flex flex-col items-center justify-center gap-2">
              <span class="text-[12px] text-muted-foreground"> Limited to 10 Variations</span>
              <UiButton variant="outline" @click.prevent="addVariation" class="w-1/4">
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
              hint="Max file size: 10MB"
            />
            <UiVeeFileInput
              multiple
              label="Upload Other Images"
              name="images"
              accept="image/*"
              hint="Max file size: 10MB"
            />
            <span class="text-sm font-semibold"></span>
          </fieldset>
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

  <div
    v-if="loading"
    class="fixed inset-0 z-50 flex min-h-screen w-full items-center justify-center bg-secondary/40 backdrop-blur"
  >
    <div class="flex flex-col items-center justify-center gap-4">
      <Icon name="lucide:loader-circle" class="size-16 animate-spin text-primary" />
      <span class="text-sm text-primary-foreground/70"> {{ currentMessage }}</span>
      <!-- Add a GIF here -->
    </div>
  </div>
</template>
