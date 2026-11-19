import type { CatalogVariant } from "./types";

export type GalleryItem = {
  id: "hero" | "lifestyle" | "dimensions";
  src: string;
  alt: string;
  label: string;
};

export function getVariantGallery(variant: CatalogVariant): GalleryItem[] {
  return [
    {
      id: "hero",
      src: variant.image,
      alt: variant.label,
      label: "الصورة الأساسية",
    },
    {
      id: "lifestyle",
      src: variant.lifestyleImage,
      alt: `تنسيق ${variant.label} في الديكور`,
      label: "في الديكور",
    },
    {
      id: "dimensions",
      src: variant.dimensionsImage,
      alt: `مقاسات ${variant.label}`,
      label: "المقاسات",
    },
  ];
}

export function nextGalleryIndex(currentIndex: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return (currentIndex + 1) % itemCount;
}

export function previousGalleryIndex(currentIndex: number, itemCount: number): number {
  if (itemCount <= 0) return 0;
  return (currentIndex - 1 + itemCount) % itemCount;
}
