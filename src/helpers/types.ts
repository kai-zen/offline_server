import { ProductDocument } from "src/features/product/product/product.schema";

export interface OrderUserAddress {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  phone_number: string;
}

export interface OrderFullProductDataType {
  product: ProductDocument;
  quantity: number;
  price: {
    amount: number;
    title: string;
    price_id: string;
  };
}

export type DeliveryTimeDT = {
  start: number;
  end: number;
};
