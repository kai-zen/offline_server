import { DiscountDocument } from "../../discount/discount.schema";
import { ProductDocument } from "../product.schema";

export const addDiscountToProducts = (
  products: ProductDocument[],
  discounts: DiscountDocument[]
) => {
  if (discounts.length > 0) {
    const productsWithDiscount = products.map((result) => {
      const discountTypeThree = discounts.find(
        (item) =>
          item.type === 3 &&
          item.products.map(String).includes(result._id.toString())
      )?.percent;
      if (discountTypeThree)
        return {
          ...result,
          discount_percent: discountTypeThree,
        };
      else {
        const discountTypeTwo = discounts.find(
          (item) =>
            item.type === 2 &&
            item.folders.map(String).includes(result.folder._id.toString())
        )?.percent;
        if (discountTypeTwo)
          return {
            ...result,
            discount_percent: discountTypeTwo,
          };
        else {
          const discountTypeOne =
            discounts.find((item) => item.type === 1)?.percent || 0;
          return {
            ...result,
            discount_percent: discountTypeOne,
          };
        }
      }
    });
    return productsWithDiscount;
  } else
    return products.map((item) => ({
      ...item,
      discount_percent: 0,
    }));
};

export const discountCalculator = (
  product: ProductDocument,
  discounts: DiscountDocument[]
) => {
  if (discounts.length > 0) {
    const discountTypeThree = discounts.find(
      (item) =>
        item.type === 3 &&
        item.products.map(String).includes(product._id.toString())
    )?.percent;
    if (discountTypeThree) return discountTypeThree;
    else {
      const discountTypeTwo = discounts.find(
        (item) =>
          item.type === 2 &&
          item.folders.map(String).includes(product.folder._id.toString())
      )?.percent;
      if (discountTypeTwo) return discountTypeTwo;
      else {
        const discountTypeOne =
          discounts.find((item) => item.type === 1)?.percent || 0;
        return discountTypeOne;
      }
    }
  }
  return 0;
};
