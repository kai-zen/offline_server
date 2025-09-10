import * as fs from "fs";
import mongoose, { PipelineStage, Types } from "mongoose";
import { Request } from "express";
import * as sanitizeHtml from "sanitize-html";
import { ProductDocument } from "src/features/product/product/product.schema";

export const extractTokenFromHeader = (
  request: Request
): string | undefined => {
  const [type, token] = request.headers.authorization?.split(" ") || [];
  return type === "Bearer" ? token : undefined;
};

export const filepathToUrl = (filePath: string) =>
  filePath ? filePath.replace("upload/", "https://api.sofre.app/") : "";

export const deleteFile = (filepath: string) => {
  return fs.unlink(filepath, (err) => {
    if (err) console.log(err);
    return;
  });
};

export const p2e = (s: string) =>
  String(s).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)));

export const str2bool = (val: string) => {
  if (!val || isNaN(Number(val))) return "reject";
  return Number(val) !== 0;
};

export const toObjectId = (id: string | Types.ObjectId) => {
  try {
    const result = new mongoose.Types.ObjectId(id);
    return result;
  } catch (err) {
    console.log("To object id error:", err);
    return null;
  }
};
const deg2rad = (deg: number) => (deg * Math.PI) / 180;

export const distanceCalculator = (
  coords1: [number, number],
  coords2: [number, number]
) => {
  const [lat1, lon1] = coords1;
  const [lat2, lon2] = coords2;
  if (lat1 == lat2 && lon1 == lon2) {
    return 0;
  } else {
    const earthRadius = 6371000;
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);

    const a =
      Math.pow(Math.sin(dLat / 2), 2) +
      Math.cos(deg2rad(lat1)) *
        Math.cos(deg2rad(lat2)) *
        Math.pow(Math.sin(dLon / 2), 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = earthRadius * c;
    return distance;
  }
};

export const facetMaker = (data: {
  page: string | number;
  limit: string | number;
}): Record<string, PipelineStage.FacetPipelineStage[]> => {
  const { limit, page } = data;
  return {
    results: [
      { $sort: { created_at: -1 } },
      { $skip: (Number(page) - 1) * Number(limit) },
      { $limit: Number(limit) },
    ],
    totalDocuments: [
      {
        $count: "count",
      },
    ],
  };
};

export const htmlEncoderText = (inputText: string) => {
  return inputText.replace(/[\u00A0-\u9999<>\&]/gim, function (i) {
    return "&#" + i.charCodeAt(0) + ";";
  });
};

export const generate5digitCode = () => {
  return String(Math.floor(Math.random() * 90_000) + 10_000);
};

export const htmlSanitizer = (userInput: string) => {
  const allowedTags = [
    "a",
    "p",
    "ul",
    "ol",
    "li",
    "strong",
    "em",
    "pre",
    "code",
    "blockquote",
    "cite",
    "b",
    "i",
    "a",
  ];

  return sanitizeHtml(userInput, {
    allowedTags,
    allowedAttributes: { a: ["href"] },
  });
};

export const findCommonElements = (arr1: any[], arr2: any[]) => {
  return arr1.filter(
    (item) => arr2.findIndex((item2) => item2._id === item._id) !== -1
  );
};

export const findItemByPriceId = (
  array: {
    product: ProductDocument;
    quantity: number;
    price: {
      amount: number;
      title: string;
      price_id: string;
    };
    desc?: string;
  }[],
  price_id: string
) =>
  array.find((item) => {
    const itemPrice = item.price?.price_id?.toString
      ? item.price.price_id.toString()
      : item.price?.price_id;
    const priceId = price_id?.toString ? price_id.toString() : price_id;
    return itemPrice === priceId;
  });

export const escapeRegex = (userInput: string) => {
  return userInput ? userInput.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") : ""; // $& means the whole matched string
};

export const roundNumberTo1000 = (num: number) => {
  return isNaN(Number(num)) ? null : Math.round(num / 1_000) * 1_000;
};

export const getStartAndEndOfTheDay = () => {
  const now = new Date();

  let start: Date, end: Date;
  if (now.getHours() < 5) {
    // If current time is before 5 AM, start from 5 AM of the previous day
    start = new Date(now);
    start.setDate(now.getDate() - 1);
    start.setHours(5, 0, 0, 0);

    // End at 4:59 AM of the current day
    end = new Date(now);
    end.setHours(4, 59, 59, 999);
  } else {
    // If current time is after 5 AM, start from 5 AM of the current day
    start = new Date(now);
    start.setHours(5, 0, 0, 0);

    // End at 4:59 AM of the next day
    end = new Date(now);
    end.setDate(now.getDate() + 1);
    end.setHours(4, 59, 59, 999);
  }

  return { start, end };
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const roundToNearest = (value: number, step: number): number => {
  return Math.round(value / step) * step;
};
