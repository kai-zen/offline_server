export const categoryLookup = {
  from: "product-categories",
  localField: "category",
  foreignField: "_id",
  as: "category",
};

export const listProject = {
  primary_image: { $arrayElemAt: ["$images", "$primary_image_index"] },
  name: 1,
  description: 1,
  prices: 1,
  is_active: 1,
  has_stock: 1,
  "category.name": 1,
  "category.image": 1,
  "category._id": 1,
  packing: 1,
};
