export const userOrderProject = {
  "products.quantity": 1,
  "products.price": 1,
  "products.product.name": "$product_details.name",
  "products.product.primary_image": {
    $arrayElemAt: [
      "$product_details.images",
      "$product_details.primary_image_index",
    ],
  },
  "products.product.folder": "$product_details.folder",
  complex: 1,
  order_type: 1,
  payments: 1,
  description: 1,
  complex_description: 1,
  user_address: 1,
  user_phone: 1,
  shipping_price: 1,
  packing_price: 1,
  total_price: 1,
  table_number: 1,
  user_discount: 1,
  complex_discount: 1,
  status: 1,
  created_at: 1,
  factor_number: 1,
  tax: 1,
  service: 1,
  on_hold: 1,
  sms_sent: 1,
  needs_call: 1,
  delivery_time: 1,
  area: 1,
  user_cashback: 1,
};

export const userOrderGroup = {
  _id: "$_id",
  products: { $addToSet: "$products" },
  complex: { $first: "$complex" },
  order_type: { $first: "$order_type" },
  payments: { $first: "$payments" },
  description: { $first: "$description" },
  complex_description: { $first: "$complex_description" },
  user_address: { $first: "$user_address" },
  user_phone: { $first: "$user_phone" },
  user_discount: { $first: "$user_discount" },
  status: { $first: "$status" },
  created_at: { $first: "$created_at" },
  total_price: { $first: "$total_price" },
  factor_number: { $first: "$factor_number" },
  tax: { $first: "$tax" },
  service: { $first: "$service" },
  packing_price: { $first: "$packing_price" },
  shipping_price: { $first: "$shipping_price" },
  complex_discount: { $first: "$complex_discount" },
  table_number: { $first: "$table_number" },
  on_hold: { $first: "$on_hold" },
  sms_sent: { $first: "$sms_sent" },
  needs_call: { $first: "$needs_call" },
  delivery_time: { $first: "$delivery_time" },
  area: { $first: "$area" },
  user_cashback: { $first: "$user_cashback" },
};

export const userOrderCommentsLookup = {
  from: "order-comments",
  as: "comment",
  let: { comment_id: "$_id" },
  pipeline: [
    { $match: { $expr: { $eq: ["$order", "$$comment_id"] } } },
    { $limit: 1 },
    {
      $project: {
        "comment.rate": 1,
        rate: 1,
        body: 1,
        reply: 1,
      },
    },
  ],
};

export const userOrderComplexLookup = {
  from: "complexes",
  as: "complex",
  let: { complex: "$complex" },
  pipeline: [
    { $match: { $expr: { $eq: ["$_id", "$$complex"] } } },
    {
      $project: {
        _id: 1,
        name: 1,
        image: 1,
        username: 1,
      },
    },
  ],
};

export const userOrderCashBankLookup = [
  {
    $lookup: {
      from: "cash-banks",
      as: "cash_bank",
      localField: "cash_bank",
      foreignField: "_id",
    },
  },
  {
    $unwind: { path: "$cash_bank", preserveNullAndEmptyArrays: true },
  },
];
