import z from "zod";

export const addProductPriceSchema = z.strictObject({
	value: z
		.coerce
		.number("Цена продукта необходима")
		.positive("Цена должна быть больше нуля")
})

export type AddProductPriceInput = z.infer<typeof addProductPriceSchema>;
