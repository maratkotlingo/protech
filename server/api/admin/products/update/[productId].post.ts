import { AuditAction, Prisma } from "@prisma/client";
import { updateProductSchema } from "~~/shared/schemas/admin/products/updateProduct";

export default defineEventHandler(async (event) => {
  const { userId } = await requireAdmin(event);

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await validateBody(event, updateProductSchema);

  if (body.categoryId !== undefined) {
    const category = await prisma.category.findUnique({
      where: { id: body.categoryId }
    });

    if (!category) {
      throw createError({
        statusCode: 400,
        message: "Категория не найдена"
      });
    }
  }

  const data: Prisma.ProductUpdateInput = {};
  const existingProduct =
    body.currentPrice !== undefined
      ? await prisma.product.findUnique({
        where: { id: productId },
        select: { currentPrice: true }
      })
      : null;
  const priceChanged =
    existingProduct !== null &&
    !new Prisma.Decimal(body.currentPrice!).equals(existingProduct.currentPrice);

  if (body.name !== undefined) data.name = body.name;
  if (body.description !== undefined) data.description = body.description;
  if (body.currentPrice !== undefined) data.currentPrice = body.currentPrice;
  if (body.costPrice !== undefined) data.costPrice = body.costPrice;
  if (body.oldPrice !== undefined) data.oldPrice = body.oldPrice;
  if (body.article !== undefined) data.article = body.article;
  if (body.mainImage !== undefined) data.mainImage = body.mainImage;
  if (body.ozonLink !== undefined) data.ozonLink = body.ozonLink;
  if (body.categoryId !== undefined) data.category = { connect: { id: body.categoryId } };
  if (body.isActive !== undefined) data.isActive = body.isActive;

  if (priceChanged && body.oldPrice === undefined) {
    data.oldPrice = existingProduct!.currentPrice;
  }

  if (body.productImages !== undefined) {
    data.productImages = {
      deleteMany: {},
      create: body.productImages.map((image) => ({ url: image.url }))
    };
  }

  if (body.productAttributes !== undefined) {
    data.productAttributes = {
      deleteMany: {},
      create: body.productAttributes.map((attr) => ({
        attributeId: attr.attributeId,
        value: attr.value
      }))
    };
  }

  try {
    const updateProduct = prisma.product.update({
      where: { id: productId },
      data,
      include: {
        category: true,
        productImages: true,
        productAttributes: {
          include: { attribute: true }
        },
        productStocks: true
      }
    });

    const product = priceChanged
      ? (await prisma.$transaction([
        updateProduct,
        prisma.productPrice.create({
          data: {
            productId,
            value: body.currentPrice!
          }
        })
      ]))[0]
      : await updateProduct;

    await recordAdminAudit({
      adminId: userId,
      action: AuditAction.UPDATE,
      entityType: "product",
      entityId: product.id,
      summary: `Updated product ${product.name}`,
      metadata: {
        fields: Object.keys(body),
        article: product.article,
        priceChanged
      }
    });

    return { success: true, product };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Товар не найден",
      P2002: "Товар с таким артикулом уже существует",
      P2003: "Указана несуществующая характеристика"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении товара"
    });
  }
});
