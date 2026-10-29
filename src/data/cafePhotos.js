export const cafePhotoCredits = [
  {file:"chocolate-slice.jpg",author:"Will Echols",url:"https://unsplash.com/photos/sliced-chocolate-cake-beside-fork-on-plate-P_l1bJQpQF0",license:"Unsplash"},
  {file:"chocolate-cafe.jpg",author:"Nano Erdozain",url:"https://www.pexels.com/photo/delicious-chocolate-cake-slice-on-plate-29538417/",license:"Pexels"},
  {file:"cafe-table.jpg",author:"Ebru DOĞAN",url:"https://www.pexels.com/photo/chocolate-cake-on-a-plate-25409664/",license:"Pexels"},
  {file:"strawberry-slice.jpg",author:"solod_sha",url:"https://www.pexels.com/photo/strawberry-cake-on-the-plate-7664400/",license:"Pexels"},
  {file:"berry-cheesecake.jpg",author:"Razane Adra",url:"https://www.pexels.com/photo/cheesecake-on-a-plate-13150095/",license:"Pexels"},
  {file:"pistachio-slice.jpg",author:"Razane Adra",url:"https://www.pexels.com/photo/close-up-photograph-of-a-pistachio-cake-13715795/",license:"Pexels"},
];
// Replace only the original demo assets. Uploaded photos from the confectioner are preserved.
const cafeReplacements = {
  "/images/strawberry-cake.jpg":"strawberry-slice.jpg",
  "/images/strawberry-cheesecake.jpg":"berry-cheesecake.jpg",
  "/images/kids-chocolate-cake.jpg":"chocolate-slice.jpg",
};
export function withCafePhoto(cake) {
  const replacement=cafeReplacements[cake.photoUrl || cake.image];
  return replacement ? {...cake,photoUrl:`/images/cafe/${replacement}`,image:`/images/cafe/${replacement}`} : cake;
}
