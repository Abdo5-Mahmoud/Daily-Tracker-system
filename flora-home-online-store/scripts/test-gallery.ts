import assert from "node:assert/strict";
import { getVariantGallery, nextGalleryIndex, previousGalleryIndex } from "../lib/gallery";
import type { CatalogVariant } from "../lib/types";

const variant: CatalogVariant = {
  id: "bubble",
  label: "Bubble",
  description: "Rounded silhouette",
  asin: "BUBBLE",
  image: "/products/bubble/hero.jpg",
  lifestyleImage: "/products/bubble/lifestyle.jpg",
  dimensionsImage: "/products/bubble/dimensions.png",
  directStock: 10,
  availableStock: 8,
  amazonInbound: 2,
};

const gallery = getVariantGallery(variant);
assert.deepEqual(gallery.map((item) => item.src), [
  variant.image,
  variant.lifestyleImage,
  variant.dimensionsImage,
]);
assert.equal(gallery[0].label, "الصورة الأساسية");
assert.equal(gallery[1].label, "في الديكور");
assert.equal(gallery[2].label, "المقاسات");
assert.equal(nextGalleryIndex(0, gallery.length), 1);
assert.equal(nextGalleryIndex(gallery.length - 1, gallery.length), 0);
assert.equal(previousGalleryIndex(0, gallery.length), gallery.length - 1);
assert.equal(previousGalleryIndex(1, gallery.length), 0);

console.log("Gallery interaction tests passed.");
