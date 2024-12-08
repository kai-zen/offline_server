import { escapeRegex } from "src/helpers/functions";
import { Order } from "../order.schema";

export const productDataFormatter = (results: Order[]) => {
  const formattedResults = results.map((item) => {
    const { products, ...otherData } = item;
    const formattedProducts = products.map((item) => {
      const { product, ...otherProductData } = item;
      return {
        ...otherProductData,
        product: {
          _id: product._id,
          name: product.name,
          primary_image: product.images[product.primary_image_index],
          folder_id: product.folder,
        },
      };
    });
    return {
      ...otherData,
      products: formattedProducts,
    };
  });

  return formattedResults;
};

export const complexOrdersFiltersHandler = (params: {
  [props: string]: string;
}) => {
  const { status, search, payment, type, from, to, delivery_guy, orderType } =
    params;

  const filters: any[] = [];
  if (status && !isNaN(Number(status)))
    filters.push({ status: Number(status) });
  if (payment)
    filters.push({ payments: { $elemMatch: { type: Number(payment) } } });
  if (orderType)
    filters.push({ order_type: type === "1" ? 1 : type === "2" ? 2 : 3 });
  if (type)
    filters.push({
      order_type: type === "1" ? 1 : type === "2" ? 2 : 3,
    });
  if (from)
    filters.push({
      created_at: { $gt: new Date(from).setHours(0, 0, 0, 0) },
    });
  if (to)
    filters.push({
      created_at: { $lt: new Date(to).setHours(23, 59, 59, 999) },
    });
  if (search) {
    const cleanedSearch = escapeRegex(search);
    if (cleanedSearch)
      filters.push({
        $or: [
          { user_phone: { $regex: cleanedSearch } },
          { "complex_user.name": { $regex: cleanedSearch } },
          { "complex_user.subscription_number": { $regex: cleanedSearch } },
          { "user.mobile": { $regex: cleanedSearch } },
        ],
      });
  }
  if (delivery_guy) filters.push({ delivery_guy });

  return filters;
};
