import { addCartItemSchema } from "~~/shared/schemas/user/carts/addCartItem";

export default defineEventHandler(async (event) => {
  const { userId } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const { quantity } = await validateBody(event, addCartItemSchema);

  const cart = await prisma.cart.findUnique({
    where: {
      userId
    },
    select: {
      id: true
    }
  });

  if (!cart) {
    throw createError({
      statusCode: 404,
      message: "Корзина не найдена"
    });
  }

  try {
    const cartItem = await prisma.cartItem.update({
      where: {
        cartId_productId: {
          cartId: cart.id,
          productId
        }
      },
      data: {
        quantity
      },
      include: {
        product: true
      }
    });

    return {
      success: true,
      cartItem
    };
  } catch (error) {
    const prismaError = toPrismaHttpError(error, {
      P2025: "Товар не найден в корзине"
    });

    if (prismaError) {
      throw prismaError;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении товара в корзине"
    });
  }
});
