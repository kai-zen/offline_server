import { PipelineStage } from "mongoose";

export const singleResultProject = {
  $project: {
    "address.city": "$city_details",
    "address.description": 1,
    "address.location": 1,
    "address.name": 1,
    "address.phone": 1,
    "address._id": 1,
    gateway: 1,
    min_online_ordering_price: 1,
    packing: 1,
    category: 1,
    created_at: 1,
    description: 1,
    is_active: 1,
    has_reserve: 1,
    has_sale: 1,
    image: 1,
    name: 1,
    username: 1,
    socials: 1,
    reservation_settings: 1,
    promoted_products: 1,
    total_comments: 1,
    total_points: 1,
    tags: 1,
    color: 1,
    enamad: 1,
    domain: 1,
    worktime: { $ifNull: ["$work-time.today", []] },
    sms_budget: 1,
    auto_copy_addresses: 1,
    tax: 1,
    service: 1,
  },
};

export const listResultProject = {
  $project: {
    _id: 0,
    username: 1,
    name: 1,
    image: 1,
    category: 1,
    total_comments: 1,
    average_points: 1,
    promoted_products: 1,
    is_active: 1,
    has_reserve: 1,
    has_sale: 1,
    worktime: { $ifNull: ["$work-time.today", []] },
    discount: { $ifNull: ["$max_discount.percent", 0] },
  },
};

export const worktimesLookup = [
  {
    $lookup: {
      from: "work-times",
      as: "work-time",
      let: { complex_id: "$_id" },
      pipeline: [
        { $match: { $expr: { $eq: ["$complex", "$$complex_id"] } } },
        {
          $project: {
            today: {
              $arrayElemAt: ["$times", new Date().getDay()],
            },
          },
        },
      ],
    },
  },
  { $unwind: { path: "$work-time", preserveNullAndEmptyArrays: true } },
];

export const cityLookup = [
  {
    $lookup: {
      from: "cities",
      localField: "address.city",
      foreignField: "_id",
      as: "city_details",
    },
  },
  {
    $unwind: { path: "$city_details", preserveNullAndEmptyArrays: true },
  },
];

export const promotedProductsLookup = {
  $lookup: {
    from: "products",
    as: "promoted_products",
    let: { promoted_products: "$promoted_products" },
    pipeline: [
      { $match: { $expr: { $in: ["$_id", "$$promoted_products"] } } },
      { $limit: 3 },
      {
        $project: {
          name: 1,
          image: { $arrayElemAt: ["$images", "$primary_image_index"] },
        },
      },
    ],
  },
};

export const socialsLookup = {
  $lookup: {
    from: "socials",
    as: "socials",
    localField: "_id",
    foreignField: "complex",
  },
};

export const categoryLookup = [
  {
    $lookup: {
      from: "complex-categories",
      localField: "category",
      foreignField: "_id",
      as: "category",
    },
  },
  { $unwind: "$category" },
];

export const tagsLookup = {
  $lookup: {
    from: "tags",
    as: "tags",
    localField: "tags",
    foreignField: "_id",
  },
};

export const reserveSettingsLookup = [
  {
    $lookup: {
      from: "reservations",
      as: "reservation_settings",
      localField: "_id",
      foreignField: "complex",
    },
  },
  {
    $unwind: {
      path: "$reservation_settings",
      preserveNullAndEmptyArrays: true,
    },
  },
];

export const maxDiscountCalculator: PipelineStage[] = [
  {
    $lookup: {
      from: "discounts",
      as: "max_discount",
      let: { complex_id: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: {
              $and: [
                { $eq: ["$complex", "$$complex_id"] },
                { $eq: ["$is_active", true] },
              ],
            },
          },
        },
        { $sort: { percent: -1 } },
        { $limit: 1 },
      ],
    },
  },
  {
    $unwind: { path: "$max_discount", preserveNullAndEmptyArrays: true },
  },
];
