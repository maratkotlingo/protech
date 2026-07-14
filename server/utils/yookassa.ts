import { Buffer } from "node:buffer";
import { createError, type H3Event } from "h3";
import type { Prisma } from "@prisma/client";

export type YooKassaPayment = {
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
      message: "Не настроены YOOKASSA_SHOP_ID / YOOKASSA_SECRET_KEY"
    });
  }

  return `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`;
}

function getYooKassaApiUrl(event: H3Event) {
  const config = useRuntimeConfig(event);
  const url = String(config.yookassaApiUrl || "https://api.yookassa.ru");

  return url.replace(/\/$/, "");
}

function getYooKassaReturnUrl(event: H3Event, orderId: number) {
  const config = useRuntimeConfig(event);
  const appUrl = String(config.public.appUrl || "").replace(/\/$/, "");

  if (!appUrl) {
    throw createError({
      statusCode: 500,
      message: "РќРµ РЅР°СЃС‚СЂРѕРµРЅ NUXT_PUBLIC_APP_URL"
    });
  }

  const configuredReturnUrl = String(config.yookassaReturnUrl || "").trim();

  if (!configuredReturnUrl) {
    return `${appUrl}/orders/${orderId}`;
  }

  if (configuredReturnUrl.includes("{orderId}")) {
    return configuredReturnUrl.replaceAll("{orderId}", String(orderId));
  }

  const returnUrl = new URL(configuredReturnUrl, `${appUrl}/`);

  if (returnUrl.pathname === "/" || returnUrl.pathname === "") {
    returnUrl.pathname = `/orders/${orderId}`;
    return returnUrl.toString();
  }

  if (!returnUrl.searchParams.has("orderId")) {
    returnUrl.searchParams.set("orderId", String(orderId));
  }

  return returnUrl.toString();
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
      message: "Не настроен NUXT_PUBLIC_APP_URL"
    });
  }

  const returnUrl = getYooKassaReturnUrl(event, input.orderId);

  const response = await fetch(`${getYooKassaApiUrl(event)}/v3/payments`, {
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
        return_url: returnUrl
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
      message: "ЮKassa не создала платеж",
      data: {
        status: response.status,
        body: await response.text()
      }
    });
  }

  return (await response.json()) as YooKassaPayment;
}

export async function getYooKassaPayment(event: H3Event, paymentId: string) {
  const response = await fetch(`${getYooKassaApiUrl(event)}/v3/payments/${paymentId}`, {
    method: "GET",
    headers: {
      Authorization: getYooKassaAuth(event)
    }
  });

  if (!response.ok) {
    throw createError({
      statusCode: 502,
      message: "Не удалось проверить платеж в ЮKassa",
      data: {
        status: response.status,
        body: await response.text()
      }
    });
  }

  return (await response.json()) as YooKassaPayment;
}
