import z from "zod";
import { imagePathSchema } from "../../imagePath";

const productImageSchema = z.strictObject({
	url: imagePathSchema,
});

const productAttributeSchema = z.strictObject({
	attributeId: z
		.coerce
		.number("ID характеристики необходим")
		.int("ID характеристики должен быть целым числом")
		.positive("ID характеристики должен быть больше нуля"),

	value: z
		.string("Значение характеристики необходимо")
		.trim()
		.min(1, "Значение характеристики необходимо")
		.max(255, "Значение характеристики должно быть не более 255 символов")
});

export const createProductSchema = z.strictObject({
	name: z
		.string('Название продукта необходимо')
		.trim()
		.max(255, 'Название должно быть не более 255 символов')
		.min(1, "Название продукта необходимо"),

	description: z
		.string('Описание продукта необходимо')
		.trim()
		.max(1000, 'Описание должно быть не больше 1000 символов')
		.min(1, "Описание продукта необходимо"),

	currentPrice: z
		.coerce
		.number("Цена продукта необходима")
		.positive("Цена должна быть больше нуля"),

	oldPrice: z
		.coerce
		.number()
		.positive("Старая цена должна быть больше нуля")
		.optional(),

	article: z
		.string("Артикул продукта необходим")
		.trim()
		.min(1, "Артикул продукта необходим")
		.max(50, "Артикул должен быть не более 50 символов"),

	mainImage: imagePathSchema,

	ozonLink: z
		.url("Ссылка должна иметь корректный формат адреса")
		.max(500, "Ссылка не должна быть более 500 символов")
		.includes("ozon", { message: "Укажите ссылку с сайта OZON" })
		.optional(),

	categoryId: z
		.coerce
		.number("У товара должна быть категория")
		.int("ID категории должен быть целым числом")
		.positive("ID категории должен быть больше нуля"),

	isActive: z
		.boolean(),

	productAttributes: z
		.array(productAttributeSchema)
		.refine(
			(attributes) => new Set(attributes.map((attribute) => attribute.attributeId)).size === attributes.length,
			"Характеристики товара не должны повторяться"
		)
		.optional(),

	productImages: z
		.array(productImageSchema)
		.optional()
})

export type CreateProductInput = z.infer<typeof createProductSchema>
