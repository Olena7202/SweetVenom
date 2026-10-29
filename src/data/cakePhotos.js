// Cutout artwork for the original demonstration catalog; uploaded photos remain unchanged.
export const cakeCardPhotos = {
  "/images/raspberry-cake.jpg": "/images/cards/raspberry-cutout.png",
  "/images/strawberry-cake.jpg": "/images/cards/strawberry-cutout.png",
  "/images/honey-cake.jpg": "/images/cards/honey-cutout.png",
  "/images/honey-nuts-cake.jpg": "/images/cards/honey-nuts-cake-cutout.png",
  "/images/new-york-cheesecake.jpg": "/images/cards/new-york-cheesecake-cutout.png",
  "/images/strawberry-cheesecake.jpg": "/images/cards/strawberry-cheesecake-cutout.png",
  "/images/chocolate-mousse.jpg": "/images/cards/chocolate-mousse-cutout.png",
  "/images/pistachio-mousse.jpg": "/images/cards/pistachio-mousse-cutout.png",
  "/images/wedding-classic.jpg": "/images/cards/wedding-classic-cutout.png",
  "/images/wedding-flower-cake.jpg": "/images/cards/wedding-flower-cake-cutout.png",
  "/images/unicorn-cake.jpg": "/images/cards/unicorn-cake-cutout.png",
  "/images/kids-chocolate-cake.jpg": "/images/cards/kids-chocolate-cake-cutout.png",
  "/images/tiramisu-cake.jpg": "/images/cards/tiramisu-cake-cutout.png",
  "/images/no-bake-cheesecake.jpg": "/images/cards/no-bake-cheesecake-cutout.png",
  "/images/no-sugar-gluten-cake.png": "/images/cards/no-sugar-gluten-cake-cutout.png",
  "/images/protein-cake.jpg": "/images/cards/protein-cake-cutout.png",
  "/images/your-custom-cake.jpg": "/images/cards/weeknd-heart-cutout.png",
};
export function cardPhoto(photo) { return cakeCardPhotos[photo] || (photo?.startsWith("/images/cards/") ? photo : null); }
export function detailPhoto(photo) { return photo === "/images/your-custom-cake.jpg" ? cakeCardPhotos[photo] : photo; }

// Matched intact versions for the soft whole-to-cutaway reveal.
const wholeCakePhotos = {
  "/images/raspberry-cake.jpg": "/images/cards/raspberry-whole.png",
  "/images/strawberry-cake.jpg": "/images/cards/strawberry-whole.png",
  "/images/honey-cake.jpg": "/images/cards/honey-whole.png",
  "/images/new-york-cheesecake.jpg": "/images/cards/new-york-cheesecake-whole.png",
  "/images/chocolate-mousse.jpg": "/images/cards/chocolate-mousse-whole.png",
  "/images/pistachio-mousse.jpg": "/images/cards/pistachio-mousse-whole.png",
  "/images/honey-nuts-cake.jpg": cakeCardPhotos["/images/honey-nuts-cake.jpg"],
  "/images/strawberry-cheesecake.jpg": cakeCardPhotos["/images/strawberry-cheesecake.jpg"],
  "/images/wedding-classic.jpg": "/images/cards/wedding-classic-whole.png",
  "/images/wedding-flower-cake.jpg": cakeCardPhotos["/images/wedding-flower-cake.jpg"],
  "/images/unicorn-cake.jpg": cakeCardPhotos["/images/unicorn-cake.jpg"],
  "/images/kids-chocolate-cake.jpg": cakeCardPhotos["/images/kids-chocolate-cake.jpg"],
  "/images/tiramisu-cake.jpg": cakeCardPhotos["/images/tiramisu-cake.jpg"],
  "/images/no-bake-cheesecake.jpg": cakeCardPhotos["/images/no-bake-cheesecake.jpg"],
  "/images/no-sugar-gluten-cake.png": "/images/cards/no-sugar-gluten-cake-whole.png",
  "/images/protein-cake.jpg": "/images/cards/protein-cake-whole.png",
};
// API normalization can already have replaced a source URL with its catalog cutout.
function catalogPhoto(photo) {
  return Object.keys(cakeCardPhotos).find((source) => cakeCardPhotos[source] === photo) || photo;
}

const cutawayPhotos = {
  "/images/honey-nuts-cake.jpg": "/images/cards/honey-nuts-cake-reveal.png",
  "/images/strawberry-cheesecake.jpg": "/images/cards/strawberry-cheesecake-reveal.png",
  "/images/wedding-flower-cake.jpg": "/images/cards/wedding-flower-cake-reveal.png",
  "/images/unicorn-cake.jpg": "/images/cards/unicorn-cake-reveal.png",
  "/images/kids-chocolate-cake.jpg": "/images/cards/kids-chocolate-cake-reveal.png",
  "/images/tiramisu-cake.jpg": "/images/cards/tiramisu-cake-reveal.png",
  "/images/no-bake-cheesecake.jpg": "/images/cards/no-bake-cheesecake-reveal.png",
};
export function wholeCakePhoto(photo) { return wholeCakePhotos[catalogPhoto(photo)] || null; }
export function cutawayPhoto(photo) { return cutawayPhotos[catalogPhoto(photo)] || null; }
