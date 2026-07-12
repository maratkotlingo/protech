export default defineEventHandler(async (event) => {
  const { user } = await requireUser(event);
  const productId = getPositiveIntRouterParam(event, "productId", "Некорректный ID товара");

  try {
    const result = await prisma.$transaction(async (tx) => {
      const product = await tx.product.findFirst({
        where: {
          id: productId,
          isActive: true
        },
        select: {
          id: true
        }
      });

      if (!product) {
        throw createError({
          statusCode: 404,
          message: "Товар не найден"
        });
      }

      const cart = await tx.cart.upsert({
        where: {
          userId: user.id
        },
        create: {
          userId: user.id
        },
        update: {},
        select: {
          id: true
        }
      });

      const existingCartItem = await tx.cartItem.findUnique({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        select: {
          quantity: true
        }
      });

      if (existingCartItem && existingCartItem.quantity >= 99) {
        throw createError({
          statusCode: 400,
          message: "Количество товара должно быть целым числом от 1 до 99"
        });
      }

      return await tx.cartItem.upsert({
        where: {
          cartId_productId: {
            cartId: cart.id,
            productId
          }
        },
        create: {
          cartId: cart.id,
          productId,
          quantity: 1
        },
        update: {
          quantity: {
            increment: 1
          }
        },
        include: {
          product: true
        }
      });
    });

    return {
      success: true,
      cartItem: result
    };
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }

    throw createError({
      statusCode: 500,
      message: "Ошибка сервера при добавлении товара в корзину"
    });
  }
});
