import type { H3Event } from "h3";
import { createError, readBody, readValidatedBody } from "h3";
import type { z } from "zod";
import { auth } from "./auth";

export async function requireUser(event: H3Event) {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы не авторизованы"
    });
  }

  return {
    session,
    user: session.user,
    userId: session.user.id
  };
}

export async function validateBody<TSchema extends z.ZodType>(
  event: H3Event,
  schema: TSchema
): Promise<z.infer<TSchema>> {
  const result = await readValidatedBody(event, (body) => schema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors
    });
  }

  return result.data;
}

export async function parseProductIdsBody(event: H3Event) {
  const data = await readBody<{ productIds?: unknown[] }>(event);

  const productIds = Array.isArray(data?.productIds)
    ? [...new Set(data.productIds)]
      .map(Number)
      .filter((id) => Number.isInteger(id) && id > 0)
    : [];

  if (!productIds.length) {
    throw createError({
      statusCode: 400,
      message: "Передайте массив productIds"
    });
  }

  return productIds;
}
