export default defineEventHandler(async (event) => {
  const session = await auth.api.getSession({
    headers: event.headers
  });

  if (!session) {
    throw createError({
      statusCode: 401,
      message: "Вы не авторизованы"
    });
  }

  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");
  const body = await readBody<{ quantity?: number | string }>(event);
  const quantity = Number(body?.quantity);

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    throw createError({
      statusCode: 400,
      message: "Количество должно быть целым числом от 1 до 99"
    });
  }

  const cart = await prisma.cart.findUnique({
    where: {
      userId: session.user.id
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

  let cartItem;

  try {
    cartItem = await prisma.cartItem.update({
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
  } catch (error: any) {
    if (error.code === "P2025") {
      throw createError({
        statusCode: 404,
        message: "Товар не найден в корзине"
      });
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при обновлении товара в корзине"
    });
  }

  return {
    success: true,
    cartItem
  };
});
