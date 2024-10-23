export const useCategoryValues = () => {
  const categories: { icon: string; title: string }[] = [
    { icon: "/images/category/t-shirt.jpg", title: "T-Shirt" },
    { icon: "/images/category/polo-shirt.jpg", title: "Polo-Shirt" },
    { icon: "/images/category/lanyard.png", title: "Lanyard" },
    { icon: "/images/category/hoodie.png", title: "Hoodie" },
    { icon: "/images/category/fan.jpg", title: "Foldable Fan" },
    { icon: "/images/category/stickers.jpg", title: "Stickers" },
    { icon: "/logo-verch.webp", title: "Other" },
  ];
  return { categories };
};
