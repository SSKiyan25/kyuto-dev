import type { Product } from "~/types/models/Product";

export const useProduct = () => {
  const product: Partial<Product> = {
    organization: "Organization Name",
    name: "This is a product name with exactly seventy-two characters to test the name limit.",
    category: "t-shirt",
    description:
      "This is a detailed description for product 1. It is exactly 200 characters long to test the limit. This description should provide enough information about the product, including its features, benefits, and usage.",
    status: "active",
    dateCreated: new Date(),
    lastModified: new Date(),
    isApproved: true,
    totalSales: 50,
    views: 100,
    isDiscounted: true,
    isArchived: false,
    featuredPhoto: "/images/category/t-shirt.jpg",
    photos: [
      "/images/category/stickers.jpg",
      "/images/category/polo-shirt.jpg",
      "/images/category/lanyard.png",
      "/images/category/hoodie.png",
      "/images/category/fan.jpg",
    ],
    variations: [
      {
        productID: "1",
        value: "Size XS",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Size S",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Size M",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Size L",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Size XL",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Size XXL",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color Red",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color Blue",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color Green",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color Yellow",
        isAvailable: true,
        stocks: 10000,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color Black",
        isAvailable: false,
        stocks: 0,
        currentPrice: 10000,
      },
      {
        productID: "1",
        value: "Color White",
        isAvailable: false,
        stocks: 0,
        currentPrice: 10000,
      },
    ],
  };
  return { product };
};
