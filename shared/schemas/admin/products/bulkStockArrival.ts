import z from "zod";

export const bulkStockArrivalSchema = z.strictObject({
  productIds: z
    .array(z.coerce.number().int().positive())
    .min(1, "Выберите хотя бы один товар")
    .transform((ids) => [...new Set(ids)]),

  quantityDelta: z
    .coerce
    .number("Количество прихода необходимо")
    .int("Количество должно быть целым числом")
    .positive("Количество прихода должно быть больше нуля"),

  reason: z
    .string()
    .trim()
    .max(255, "Комментарий должен быть не более 255 символов")
    .optional()
});

export type BulkStockArrivalInput = z.infer<typeof bulkStockArrivalSchema>;
