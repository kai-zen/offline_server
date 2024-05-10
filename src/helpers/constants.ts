import { diskStorage } from "multer";
import { MaxFileSizeValidator, ParseFilePipe } from "@nestjs/common";

export const imageValidator = (isRequired?: boolean) =>
  new ParseFilePipe({
    validators: [new MaxFileSizeValidator({ maxSize: 2000 * 1000 })],
    fileIsRequired: isRequired,
  });

export const imageUploadConfig = {
  storage: diskStorage({
    destination: "./upload",
    filename: (_req, file, cb) => {
      const ext = file.mimetype.split("/")[1];
      cb(null, `${file.fieldname}-${Date.now()}.${ext}`);
    },
  }),
};

export const messages = {
  400: "درخواست ارسالی شما اشتباه است.",
  401: "برای دسترسی به این قسمت باید وارد شوید.",
  403: "شما دسترسی لازم را ندارید.",
  404: "پیدا نشد.",
  500: "مشکلی رخ داده است، بعدا مجدد تلاش کنید.",
};

export const zarinpalConfig = {
  normal: {
    PurchaseUrl: "https://api.zarinpal.com/pg/v4/payment/request.json",
    PaymentUrl: "https://www.zarinpal.com/pg/StartPay/",
    VerificationUrl: "https://api.zarinpal.com/pg/v4/payment/verify.json",
  },

  sandbox: {
    PurchaseUrl: "https://sandbox.zarinpal.com/pg/services/WebGate/wsdl",
    PaymentUrl: "https://sandbox.zarinpal.com/pg/StartPay/",
    VerificationUrl: "https://sandbox.zarinpal.com/pg/services/WebGate/wsdl",
  },

  // routes: {
  //   PaymentRequest: "PaymentRequest.json",
  //   PaymentVerification: "PaymentVerification.json",
  //   UnverifiedTransactions: "UnverifiedTransactions.json",
  // },
  // https: "https://www.zarinpal.com/pg/rest/WebGate/",
  // sandbox: "https://sandbox.zarinpal.com/pg/rest/WebGate/",
  // PG_sandbox: "https://sandbox.zarinpal.com/pg/StartPay",
  // PG_https: "https://www.zarinpal.com/pg/StartPay",
};

export type paymentRequestResponseType = {
  data: {
    data: {
      code: number;
      message: string;
      authority: string;
      fee_type: "Merchant";
      fee: number;
    };
    errors: string[];
  };
};

export type paymentVerificationResponseType = {
  data: {
    data: {
      code: number; // وضعیت پرداخت
      message: string;
      card_hash: string;
      card_pan: string; // شماره کارت
      ref_id: number; // در صورتی كه موفق باشد، شماره تراكنش پرداخت انجام شده
      fee_type: "Merchant"; // پرداخت کننده کارمزد
      fee: number; // کارمزد
    };
    errors: any;
  };
};

export const complexRoles = [
  {
    id: 1,
    title: "مدیر مجموعه",
  },
  {
    id: 2,
    title: "دستیار مدیریت",
  },
  {
    id: 3,
    title: "حسابدار",
  },
  {
    id: 4,
    title: "صندوق‌دار",
  },
  {
    id: 5,
    title: "سرآشپز",
  },
  {
    id: 6,
    title: "آشپز",
  },
  {
    id: 7,
    title: "سالن دار",
  },
  {
    id: 8,
    title: "گارسون",
  },
  {
    id: 9,
    title: "پیک",
  },
  {
    id: 10,
    title: "ادمین محتوا",
  },
];

export const schemaConfig = {
  versionKey: false,
  timestamps: {
    createdAt: "created_at",
  },
};
