import { Prisma } from "@prisma/client";
import { addProductPriceSchema } from "~~/shared/schemas/admin/products/addProductPrice";

export default defineEventHandler(async (event) => {
  await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  const result = await readValidatedBody(event, (body) => addProductPriceSchema.safeParse(body));

  if (!result.success) {
    throw createError({
      statusCode: 400,
      message: "Ошибка валидации данных",
      data: result.error.flatten((issue) => issue.message).fieldErrors,
    });
  }

  const body = result.data;

  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { id: true, currentPrice: true }
  });

  if (!product) {
    throw createError({
      statusCode: 404,
      message: "Товар не найден"
    });
  }

  const [priceRecord, updatedProduct] = await prisma.$transaction([
    prisma.productPrice.create({
      data: {
        productId,
        value: body.value
      }
    }),
    prisma.product.update({
      where: { id: productId },
      data: {
        oldPrice: product.currentPrice,
        currentPrice: new Prisma.Decimal(body.value)
      }
    })
  ]);

  return {
    success: true,
    price: priceRecord,
    product: updatedProduct
  };
});
