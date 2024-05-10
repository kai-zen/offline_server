import * as fs from "fs";
import mongoose, { PipelineStage } from "mongoose";
import { Request } from "express";
import * as sanitizeHtml from "sanitize-html";

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

export const str2bool = (val: string) => {
  if (!val || isNaN(Number(val))) return "reject";
  return Number(val) !== 0;
};

export const toObjectId = (id: string) => new mongoose.Types.ObjectId(id);

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
