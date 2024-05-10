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
