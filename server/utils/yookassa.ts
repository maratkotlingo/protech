// server/utils/yookassa.ts
import { Buffer } from "node:buffer";
import { createError, type H3Event } from "h3";
import { type Prisma } from "@prisma/client";

type YooKassaPayment = {
  id: string;
  status: "pending" | "waiting_for_capture" | "succeeded" | "canceled";
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, string>;
};

function getYooKassaAuth(event: H3Event) {
  const config = useRuntimeConfig(event);

  const shopId = config.yookassaShopId;
  const secretKey = config.yookassaSecretKey;

  if (!shopId || !secretKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "Не настроены YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY"
    });
  }

  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

export async function createYooKassaPayment(
  event: H3Event,
  input: {
    orderId: number;
    amount: Prisma.Decimal;
    description: string;
  }
) {
  const config = useRuntimeConfig(event);

  if (!config.public.appUrl) {
    throw createError({
      statusCode: 500,
      statusMessage: "Не настроен NUXT_PUBLIC_APP_URL"
    });
  }

  const response = await fetch("https://api.yookassa.ru/v3/payments", {
    method: "POST",
    headers: {
      Authorization: getYooKassaAuth(event),
      "Content-Type": "application/json",

      "Idempotence-Key": `order-${input.orderId}`
    },
    body: JSON.stringify({
      amount: {
        value: input.amount.toFixed(2),
        currency: "RUB"
      },
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: `${config.public.appUrl}/orders/${input.orderId}`
      },
      description: input.description,
      metadata: {
        orderId: String(input.orderId)
      }
    })
  });

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: "ЮKassa не создала платеж",
      data: {
        status: response.status,
        body: await response.text()
      }
    });
  }

  return (await response.json()) as YooKassaPayment;
}

export async function getYooKassaPayment(event: H3Event, paymentId: string) {
  const response = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getYooKassaAuth(event)
    }
  });

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      statusMessage: "Не удалось проверить платеж в ЮKassa",
      data: {
        status: response.status,
        body: await response.text()
      }
    });
  }

  return (await response.json()) as YooKassaPayment;
}
